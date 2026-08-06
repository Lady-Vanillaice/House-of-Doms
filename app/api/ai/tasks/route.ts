import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_TASK_MODEL || "gpt-5-mini";
  if (!apiKey) {
    return NextResponse.json({ error: "OPENAI_API_KEY fehlt." }, { status: 503 });
  }

  const body = await request.json().catch(() => null) as { prompt?: string } | null;
  const prompt = body?.prompt?.trim();
  if (!prompt) return NextResponse.json({ error: "Bitte beschreibe die gewünschte Aufgabe." }, { status: 400 });

  const instructions = `Du unterstützt eine erwachsene, einvernehmliche D/s-Plattform beim Formulieren freiwilliger Aufgaben. Erstelle ausschließlich sichere, legale und widerrufbare Vorschläge. Keine Drohungen, Erpressung, Schuldenaufnahme, gefährlichen Handlungen, nicht-einvernehmlichen Inhalte oder Veröffentlichung privater Medien. Finanzbezogene Dynamiken dürfen höchstens freiwillige, vorher festgelegte Budgets erwähnen. Antworte ausschließlich als JSON mit title, description, proof (Array aus text, image, video), releaseDelayHours (Zahl) und dueDelayHours (Zahl).`;

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ model, instructions, input: prompt })
  });

  if (!response.ok) {
    const detail = await response.text();
    return NextResponse.json({ error: "KI-Anfrage fehlgeschlagen.", detail: detail.slice(0, 500) }, { status: 502 });
  }

  const data = await response.json() as { output?: Array<{ content?: Array<{ type?: string; text?: string }> }> };
  const text = data.output?.flatMap(item => item.content || []).find(item => item.type === "output_text")?.text;
  if (!text) return NextResponse.json({ error: "Die KI hat keinen Entwurf geliefert." }, { status: 502 });

  try {
    const cleaned = text.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
    const parsed = JSON.parse(cleaned) as { title?: string; description?: string; proof?: string[]; releaseDelayHours?: number; dueDelayHours?: number };
    const proof = (parsed.proof || []).filter((value): value is "text" | "image" | "video" => ["text", "image", "video"].includes(value));
    return NextResponse.json({
      title: String(parsed.title || "").slice(0, 120),
      description: String(parsed.description || "").slice(0, 2000),
      proof: proof.length ? proof : ["text"],
      releaseDelayHours: Math.max(0, Number(parsed.releaseDelayHours) || 0),
      dueDelayHours: Math.max(1, Number(parsed.dueDelayHours) || 24)
    });
  } catch {
    return NextResponse.json({ error: "KI-Antwort konnte nicht gelesen werden." }, { status: 502 });
  }
}
