import { createClient } from "../supabase/server";

export type AiFeature="messages"|"tasks";

type Reservation={
 reservation_id:string|null;
 allowed:boolean;
 reason:string|null;
 monthly_used:number;
 monthly_limit:number;
 global_spend:number;
 global_budget:number;
};

export type AiUsageStatus={
 monthlyUsed:number;
 monthlyLimit:number;
 monthlyRemaining:number;
 globalSpend:number;
 globalBudget:number;
 perMinuteLimit:number;
 resetsAt:string;
};

function estimateCostUsd(model:string,inputTokens:number,outputTokens:number){
 const normalized=model.toLowerCase();
 if(normalized.includes("gpt-5-mini")){
  return (inputTokens/1_000_000)*0.25+(outputTokens/1_000_000)*2;
 }
 return (inputTokens/1_000_000)*0.25+(outputTokens/1_000_000)*2;
}

export async function reserveAiRequest(feature:AiFeature){
 const supabase=await createClient();
 const {data,error}=await supabase.rpc("reserve_ai_request",{p_feature:feature});
 if(error)throw new Error("KI-Limits sind noch nicht aktiviert. Bitte die Supabase-Migration anwenden.");
 const row=(Array.isArray(data)?data[0]:data) as Reservation|undefined;
 if(!row)throw new Error("KI-Limit konnte nicht geprüft werden.");
 if(!row.allowed){
  const message=row.reason==="monthly_limit"
   ?`Monatliches KI-Kontingent erreicht (${row.monthly_used}/${row.monthly_limit}).`
   :row.reason==="global_budget"
    ?`Das monatliche Plattformbudget für KI Assist ist erreicht ($${Number(row.global_spend).toFixed(2)} / $${Number(row.global_budget).toFixed(2)}).`
    :row.reason==="rate_limit"
     ?"Zu viele KI-Anfragen in kurzer Zeit. Bitte warte eine Minute."
     :"KI Assist ist momentan nicht verfügbar.";
  const err=new Error(message) as Error&{status?:number};
  err.status=429;
  throw err;
 }
 return {id:String(row.reservation_id),monthlyUsed:Number(row.monthly_used),monthlyLimit:Number(row.monthly_limit),globalSpend:Number(row.global_spend),globalBudget:Number(row.global_budget)};
}

export async function finishAiRequest(id:string,model:string,inputTokens:number,outputTokens:number,success:boolean){
 const supabase=await createClient();
 const cost=success?estimateCostUsd(model,inputTokens,outputTokens):0;
 await supabase.rpc("finish_ai_request",{
  p_reservation_id:id,
  p_model:model,
  p_input_tokens:Math.max(0,inputTokens||0),
  p_output_tokens:Math.max(0,outputTokens||0),
  p_estimated_cost_usd:cost,
  p_success:success
 });
 return cost;
}

export async function getAiUsageStatus():Promise<AiUsageStatus>{
 const supabase=await createClient();
 const {data,error}=await supabase.rpc("get_ai_usage_status");
 if(error)throw new Error("KI-Limits sind noch nicht aktiviert. Bitte die Supabase-Migration anwenden.");
 const row=(Array.isArray(data)?data[0]:data) as {
  monthly_used:number;monthly_limit:number;monthly_remaining:number;global_spend:number;global_budget:number;per_minute_limit:number;resets_at:string;
 }|undefined;
 if(!row)throw new Error("KI-Nutzung konnte nicht geladen werden.");
 return {
  monthlyUsed:Number(row.monthly_used),
  monthlyLimit:Number(row.monthly_limit),
  monthlyRemaining:Number(row.monthly_remaining),
  globalSpend:Number(row.global_spend),
  globalBudget:Number(row.global_budget),
  perMinuteLimit:Number(row.per_minute_limit),
  resetsAt:String(row.resets_at)
 };
}
