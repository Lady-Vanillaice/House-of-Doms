import { NextResponse } from "next/server";
import { finishAiRequest, reserveAiRequest } from "../../../../lib/ai/usage";

type OpenAiResponse={
 output?:Array<{content?:Array<{type?:string;text?:string}>}>;
 usage?:{input_tokens?:number;output_tokens?:number};
};

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_TASK_MODEL || "gpt-5-mini";
  if (!apiKey) {
    return NextResponse.json({ error: "OPENAI_API_KEY fehlt." }, { status: 503 });
  }

  const body = await request.json().catch(() => null) as { prompt?: string } | null;
  const prompt = body?.prompt?.trim();
  if (!prompt) return NextResponse.json({ error: "Bitte beschreibe die gewünschte Aufgabe." }, { status: 400 });

  let reservation:Awaited<ReturnType<typeof reserveAiRequest>>;
  try{
    reservation=await reserveAiRequest("tasks");
  }catch(error){
    const err=error as Error&{status?:number};
    return NextResponse.json({error:err.message},{status:err.status||503});
  }

  const instructions = `Du unterstützt eine erwachsene, einvernehmliche D/s-Plattform beim Formulieren freiwilliger Aufgaben. Erstelle ausschließlich sichere, legale und widerrufbare Vorschläge. Keine Drohungen, Erpressung, Schuldenaufnahme, gefährlichen Handlungen, nicht-einvernehmlichen Inhalte oder Veröffentlichung privater Medien. Finanzbezogene Dynamiken dürfen höchstens freiwillige, vorher festgelegte Budgets erwähnen. Antworte ausschließlich als JSON mit title, description, proof (Array aus text, image, video), releaseDelayHours (Zahl) und dueDelayHours (Zahl).`;

  let response:Response;
  try{
    response=await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ model, instructions, input: prompt })
    });
  }catch{
    await finishAiRequest(reservation.id,model,0,0,false);
    return NextResponse.json({error:"OpenAI ist momentan nicht erreichbar."},{status:502});
  }

  if (!response.ok) {
    await finishAiRequest(reservation.id,model,0,0,false);
    const raw = await response.text();
    let detail="OpenAI hat die Anfrage abgelehnt.";
    try{
      const parsed=JSON.parse(raw) as {error?:{message?:string;code?:string;type?:string}};
      const e=parsed.error;
      detail=[e?.message,e?.code?`Code: ${e.code}`:"",e?.type?`Typ: ${e.type}`:""].filter(Boolean).join(" · ")||detail;
    }catch{
      detail=raw.slice(0,500)||detail;
    }
    return NextResponse.json({ error: "KI-Anfrage fehlgeschlagen.", detail: detail.slice(0,700) }, { status: 502 });
  }

  const data = await response.json() as OpenAiResponse;
  const inputTokens=Number(data.usage?.input_tokens||0);
  const outputTokens=Number(data.usage?.output_tokens||0);
  const estimatedCostUsd=await finishAiRequest(reservation.id,model,inputTokens,outputTokens,true);
  const text = data.output?.flatMap(item => item.content || []).find(item => item.type === "output_text")?.text;
  if (!text) return NextResponse.json({ error: "Die KI hat keinen Entwurf geliefert." }, { status: 502 });

  try {
    const cleaned = text.replace(/^\`\`\`json\s*/i, "").replace(/\`\`\`$/i, "").trim();
    const parsed = JSON.parse(cleaned) as { title?: string; description?: string; proof?: string[]; releaseDelayHours?: number; dueDelayHours?: number };
    const proof = (parsed.proof || []).filter((value): value is "text" | "image" | "video" => ["text", "image", "video"].includes(value));
    return NextResponse.json({
      title: String(parsed.title || "").slice(0, 120),
      description: String(parsed.description || "").slice(0, 2000),
      proof: proof.length ? proof : ["text"],
      releaseDelayHours: Math.max(0, Number(parsed.releaseDelayHours) || 0),
      dueDelayHours: Math.max(1, Number(parsed.dueDelayHours) || 24),
      usage:{monthlyUsed:reservation.monthlyUsed,monthlyLimit:reservation.monthlyLimit,estimatedCostUsd}
    });
  } catch {
    return NextResponse.json({ error: "KI-Antwort konnte nicht gelesen werden." }, { status: 502 });
  }
}
