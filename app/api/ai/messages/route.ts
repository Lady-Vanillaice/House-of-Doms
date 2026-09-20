import { NextResponse } from "next/server";
import { finishAiRequest, reserveAiRequest } from "../../../../lib/ai/usage";

type Input={messages?:Array<{direction:"incoming"|"outgoing";text:string}>,replyTo?:string|null,tone?:string};
type OpenAiResponse={
 output?:Array<{content?:Array<{type?:string;text?:string}>}>;
 usage?:{input_tokens?:number;output_tokens?:number};
};

export async function POST(request:Request){
 const apiKey=process.env.OPENAI_API_KEY;
 const model=process.env.OPENAI_MESSAGE_MODEL||process.env.OPENAI_TASK_MODEL||"gpt-5-mini";
 if(!apiKey)return NextResponse.json({error:"OPENAI_API_KEY fehlt."},{status:503});

 const body=await request.json().catch(()=>null) as Input|null;
 const messages=(body?.messages||[]).filter(x=>x?.text).slice(-12);
 if(!messages.length)return NextResponse.json({error:"Noch kein Text im Chat, auf den die KI antworten kann."},{status:400});

 let reservation:Awaited<ReturnType<typeof reserveAiRequest>>;
 try{
  reservation=await reserveAiRequest("messages");
 }catch(error){
  const err=error as Error&{status?:number};
  return NextResponse.json({error:err.message},{status:err.status||503});
 }

 const transcript=messages.map(x=>`${x.direction==="incoming"?"Andere Person":"Ich"}: ${x.text}`).join("\n");
 const instructions=`Du bist ein Schreibassistent für private Nachrichten auf einer Plattform für volljährige Erwachsene. Formuliere nur einen Antwortentwurf, nie so, als wäre er bereits gesendet. Bewahre Einvernehmlichkeit, Grenzen und Privatsphäre. Keine Manipulation, Drohungen, Erpressung oder Druck. Erfinde keine Zusagen, Preise, Termine oder persönlichen Fakten. Bei Unklarheit formuliere vorsichtig und stelle gegebenenfalls eine kurze Rückfrage. Gib ausschließlich den Nachrichtentext zurück, ohne Anführungszeichen oder Erklärung.`;
 const input=`Ton: ${body?.tone||"freundlich, klar, professionell"}\n${body?.replyTo?`Direkte Nachricht, auf die geantwortet wird: ${body.replyTo}\n`:""}Chat:\n${transcript}\n\nSchreibe einen passenden Antwortentwurf.`;

 let response:Response;
 try{
  response=await fetch("https://api.openai.com/v1/responses",{
   method:"POST",
   headers:{Authorization:`Bearer ${apiKey}`,"Content-Type":"application/json"},
   body:JSON.stringify({model,instructions,input})
  });
 }catch{
  await finishAiRequest(reservation.id,model,0,0,false);
  return NextResponse.json({error:"OpenAI ist momentan nicht erreichbar."},{status:502});
 }

 if(!response.ok){
  await finishAiRequest(reservation.id,model,0,0,false);
  const raw=await response.text();
  let detail="OpenAI hat die Anfrage abgelehnt.";
  try{
   const parsed=JSON.parse(raw) as {error?:{message?:string;code?:string;type?:string}};
   const e=parsed.error;
   detail=[e?.message,e?.code?`Code: ${e.code}`:"",e?.type?`Typ: ${e.type}`:""].filter(Boolean).join(" · ")||detail;
  }catch{
   detail=raw.slice(0,500)||detail;
  }
  return NextResponse.json({error:"KI-Anfrage fehlgeschlagen.",detail:detail.slice(0,700)},{status:502});
 }

 const data=await response.json() as OpenAiResponse;
 const inputTokens=Number(data.usage?.input_tokens||0);
 const outputTokens=Number(data.usage?.output_tokens||0);
 const estimatedCostUsd=await finishAiRequest(reservation.id,model,inputTokens,outputTokens,true);
 const text=data.output?.flatMap(x=>x.content||[]).find(x=>x.type==="output_text")?.text?.trim();
 if(!text)return NextResponse.json({error:"Die KI hat keinen Antwortentwurf geliefert."},{status:502});

 return NextResponse.json({
  draft:text.slice(0,3000),
  usage:{monthlyUsed:reservation.monthlyUsed,monthlyLimit:reservation.monthlyLimit,estimatedCostUsd}
 });
}
