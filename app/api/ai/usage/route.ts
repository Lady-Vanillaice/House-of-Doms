import { NextResponse } from "next/server";
import { getAiUsageStatus } from "../../../../lib/ai/usage";

export async function GET(){
 try{
  const status=await getAiUsageStatus();
  return NextResponse.json(status);
 }catch(error){
  return NextResponse.json({error:error instanceof Error?error.message:"KI-Nutzung konnte nicht geladen werden."},{status:503});
 }
}
