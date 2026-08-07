"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "../../lib/supabase/client";
import TaskAiAssistant from "./task-ai-assistant";
import "./tasks.css";

type Proof = "text" | "image" | "video";
type Member = { user_id: string; display_name: string; role: string };
type Task = {
  id: string; house_id: string; created_by: string; assigned_to: string; title: string; description: string;
  status: string; release_at: string; due_at: string | null; required_proof_types: Proof[]; is_released: boolean; calendar_teaser: string;
};
type SubmissionFile = { id: string; storage_path: string; media_type: "image"|"video"; original_name: string | null };
type Submission = { id: string; task_id: string; submitted_by: string; text_content: string | null; status: string; reviewer_feedback: string | null; created_at: string; task_submission_files?: SubmissionFile[] };

const formatDate = (value?: string | null) => value ? new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "—";
const proofLabel = (p: Proof) => p === "text" ? "Text" : p === "image" ? "Bild" : "Video";

export default function TasksPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [role, setRole] = useState("");
  const [userId, setUserId] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [items, setItems] = useState<Task[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [assignedTo, setAssignedTo] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [releaseAt, setReleaseAt] = useState(() => new Date(Date.now() + 3600000).toISOString().slice(0,16));
  const [dueAt, setDueAt] = useState(() => new Date(Date.now() + 86400000).toISOString().slice(0,16));
  const [proof, setProof] = useState<Proof[]>(["text"]);
  const [teaser, setTeaser] = useState("1 Aufgabe geplant");
  const [evidenceText, setEvidenceText] = useState<Record<string,string>>({});
  const [evidenceFiles, setEvidenceFiles] = useState<Record<string,File[]>>({});
  const [reviewFeedback, setReviewFeedback] = useState<Record<string,string>>({});

  const isDom = role === "dom" || role === "domina";

  const load = useCallback(async () => {
    setLoading(true); setMessage("");
    try {
      const supabase = createClient();
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) { window.location.href = "/anmelden"; return; }
      setUserId(auth.user.id);

      const { data: context, error: contextError } = await supabase.rpc("get_task_context");
      if (contextError) throw contextError;
      const ctx = Array.isArray(context) ? context[0] : context;
      const nextRole = String(ctx?.role || auth.user.user_metadata?.role || "sub").toLowerCase();
      setRole(nextRole);

      const { data: feed, error: feedError } = await supabase.rpc("get_my_task_feed");
      if (feedError) throw feedError;
      setItems((feed || []) as Task[]);

      if (nextRole === "dom" || nextRole === "domina") {
        const { data: candidates, error: memberError } = await supabase.rpc("get_house_task_candidates");
        if (memberError) throw memberError;
        const list = (candidates || []) as Member[];
        setMembers(list);
        setAssignedTo(current => current || list[0]?.user_id || "");
      }

      const { data: submissionRows, error: submissionError } = await supabase
        .from("task_submissions")
        .select("id,task_id,submitted_by,text_content,status,reviewer_feedback,created_at,task_submission_files(id,storage_path,media_type,original_name)")
        .order("created_at", { ascending: false });
      if (submissionError) throw submissionError;
      setSubmissions((submissionRows || []) as Submission[]);
    } catch (error: any) {
      setMessage(`Supabase: ${error?.message || "Unbekannter Fehler"}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const plannedCount = useMemo(() => items.filter(t => !t.is_released && t.assigned_to === userId).length, [items,userId]);
  const toggleProof = (p: Proof) => setProof(v => v.includes(p) ? v.filter(x => x !== p) : [...v,p]);
  const applyAiDraft = (draft:{title:string;description:string;proof:Proof[];releaseAt:string;dueAt:string}) => {
    setTitle(draft.title); setDescription(draft.description); setProof(draft.proof); setReleaseAt(draft.releaseAt); setDueAt(draft.dueAt);
  };

  async function addTask(e: FormEvent) {
    e.preventDefault();
    if (!assignedTo || !title.trim()) { setMessage("Bitte Sub/Sklave und Titel auswählen."); return; }
    setSaving(true); setMessage("");
    const supabase = createClient();
    const { error } = await supabase.rpc("create_house_task", {
      p_assigned_to: assignedTo,
      p_title: title.trim(),
      p_description: description.trim(),
      p_release_at: new Date(releaseAt).toISOString(),
      p_due_at: dueAt ? new Date(dueAt).toISOString() : null,
      p_required_proof_types: proof,
      p_calendar_teaser: teaser.trim() || "1 Aufgabe geplant"
    });
    setSaving(false);
    if (error) { setMessage(`Supabase: ${error.message}`); return; }
    setTitle(""); setDescription(""); setProof(["text"]); setMessage("Aufgabe gespeichert und zeitgesteuert eingeplant.");
    await load();
  }

  function chooseFiles(taskId: string, e: ChangeEvent<HTMLInputElement>) {
    setEvidenceFiles(v => ({ ...v, [taskId]: Array.from(e.target.files || []) }));
  }

  async function submitEvidence(task: Task) {
    const required = task.required_proof_types || [];
    const text = evidenceText[task.id] || "";
    const files = evidenceFiles[task.id] || [];
    if (required.includes("text") && !text.trim()) { setMessage("Für diese Aufgabe ist ein Text-Nachweis erforderlich."); return; }
    if (required.includes("image") && !files.some(f => f.type.startsWith("image/"))) { setMessage("Für diese Aufgabe ist ein Bild-Nachweis erforderlich."); return; }
    if (required.includes("video") && !files.some(f => f.type.startsWith("video/"))) { setMessage("Für diese Aufgabe ist ein Video-Nachweis erforderlich."); return; }

    setSaving(true); setMessage("");
    const supabase = createClient();
    const paths:string[] = []; const types:string[] = []; const names:string[] = [];
    try {
      for (const file of files) {
        const kind = file.type.startsWith("video/") ? "video" : "image";
        const safe = file.name.replace(/[^a-zA-Z0-9._-]/g,"-");
        const path = `${userId}/${task.id}/${crypto.randomUUID()}-${safe}`;
        const { error: uploadError } = await supabase.storage.from("task-evidence").upload(path,file,{upsert:false,contentType:file.type});
        if (uploadError) throw uploadError;
        paths.push(path); types.push(kind); names.push(file.name);
      }
      const { error } = await supabase.rpc("submit_task_evidence", {
        p_task_id: task.id,
        p_text_content: text.trim() || null,
        p_storage_paths: paths,
        p_media_types: types,
        p_original_names: names
      });
      if (error) throw error;
      setEvidenceText(v => ({...v,[task.id]:""})); setEvidenceFiles(v => ({...v,[task.id]:[]}));
      setMessage("Nachweis eingereicht. Dom/Domina kann ihn jetzt prüfen.");
      await load();
    } catch (error:any) {
      setMessage(`Supabase: ${error?.message || "Einreichung fehlgeschlagen"}`);
    } finally { setSaving(false); }
  }

  async function review(submission: Submission, decision: "approved"|"changes_requested") {
    setSaving(true); setMessage("");
    const supabase = createClient();
    const { error } = await supabase.rpc("review_task_submission", {
      p_submission_id: submission.id,
      p_decision: decision,
      p_feedback: reviewFeedback[submission.id]?.trim() || null
    });
    setSaving(false);
    if (error) { setMessage(`Supabase: ${error.message}`); return; }
    setMessage(decision === "approved" ? "Einreichung angenommen." : "Überarbeitung angefordert.");
    await load();
  }

  async function openEvidence(file: SubmissionFile) {
    const supabase = createClient();
    const { data, error } = await supabase.storage.from("task-evidence").createSignedUrl(file.storage_path, 300);
    if (error) { setMessage(`Supabase: ${error.message}`); return; }
    window.open(data.signedUrl,"_blank","noopener,noreferrer");
  }

  return <main className="tasksPage">
    <header><div><Link href="/">← Zurück ins House</Link><span>HOUSE OF DOMS</span><h1>Aufgaben</h1><p>{isDom ? "Aufgaben vorbereiten, einem House-Mitglied zuweisen und zeitgesteuert freigeben." : "Deine Aufgaben werden erst zum festgelegten Zeitpunkt vollständig sichtbar."}</p></div><div className="roleBadge">{isDom ? "Dom / Domina" : "Sub / Sklave"}</div></header>
    {message && <div className="taskMessage">{message}</div>}
    {loading ? <section className="panel">Aufgaben werden geladen …</section> : <>
      {!isDom && plannedCount > 0 && <section className="teaser"><strong>{plannedCount} Aufgabe{plannedCount>1?"n":""} geplant</strong><span>Bis zur Freigabe bleiben Titel und Inhalt verborgen.</span></section>}
      {isDom ? <section className="taskGrid">
        <form className="panel" onSubmit={addTask}><span className="eyebrow">DOM / DOMINA</span><h2>Aufgabe vorbereiten</h2><TaskAiAssistant onApply={applyAiDraft}/>
          <label>Für Sub / Sklave<select value={assignedTo} onChange={e=>setAssignedTo(e.target.value)}><option value="">House-Mitglied wählen</option>{members.map(m=><option key={m.user_id} value={m.user_id}>{m.display_name} · {m.role}</option>)}</select></label>
          {members.length===0 && <p className="emptyHint">Noch kein aktiver Sub/Sklave im House. Nach einer angenommenen Bewerbung erscheint die Person hier.</p>}
          <label>Titel<input value={title} onChange={e=>setTitle(e.target.value)} /></label>
          <label>Beschreibung<textarea rows={5} value={description} onChange={e=>setDescription(e.target.value)} /></label>
          <label>Kalender-Hinweis vor Freigabe<input value={teaser} onChange={e=>setTeaser(e.target.value)} /></label>
          <label>Sichtbar ab<input type="datetime-local" value={releaseAt} onChange={e=>setReleaseAt(e.target.value)} /></label>
          <label>Fällig bis<input type="datetime-local" value={dueAt} onChange={e=>setDueAt(e.target.value)} /></label>
          <div className="proofs"><strong>Nachweis</strong>{(["text","image","video"] as Proof[]).map(p=><button type="button" className={proof.includes(p)?"selected":""} onClick={()=>toggleProof(p)} key={p}>{proofLabel(p)}</button>)}</div>
          <button className="primary" disabled={saving||!members.length}>{saving?"Speichert …":"Aufgabe speichern"}</button>
        </form>
        <TaskList items={items} submissions={submissions} dom onReview={review} onOpenEvidence={openEvidence} reviewFeedback={reviewFeedback} setReviewFeedback={setReviewFeedback}/>
      </section> : <TaskList items={items} submissions={submissions} onSubmit={submitEvidence} onOpenEvidence={openEvidence} evidenceText={evidenceText} setEvidenceText={setEvidenceText} evidenceFiles={evidenceFiles} chooseFiles={chooseFiles} saving={saving}/>} 
    </>}
  </main>;
}

function TaskList(props:{items:Task[];submissions:Submission[];dom?:boolean;saving?:boolean;onSubmit?:(task:Task)=>void;onReview?:(s:Submission,d:"approved"|"changes_requested")=>void;onOpenEvidence:(f:SubmissionFile)=>void;evidenceText?:Record<string,string>;setEvidenceText?:React.Dispatch<React.SetStateAction<Record<string,string>>>;evidenceFiles?:Record<string,File[]>;chooseFiles?:(id:string,e:ChangeEvent<HTMLInputElement>)=>void;reviewFeedback?:Record<string,string>;setReviewFeedback?:React.Dispatch<React.SetStateAction<Record<string,string>>>}) {
  const {items,submissions,dom=false}=props;
  return <section className={`panel list ${dom?"":"singleList"}`}><span className="eyebrow">{dom?"GEPLANTE UND AKTIVE AUFGABEN":"MEINE AUFGABEN"}</span><h2>Übersicht</h2>{items.length===0&&<p className="emptyHint">Noch keine Aufgaben vorhanden.</p>}{items.map(task=>{
    const taskSubs=submissions.filter(s=>s.task_id===task.id); const latest=taskSubs[0]; const openForSubmit=!dom&&task.is_released&&task.status!=="approved";
    return <article className={`task ${!task.is_released?"lockedTask":""}`} key={task.id}><div><strong>{task.title}</strong><span>{!task.is_released?"Geplant":task.status==="open"?"Offen":task.status==="submitted"?"Eingereicht":task.status==="approved"?"Angenommen":task.status}</span></div>
      {task.description&&<p>{task.description}</p>}<small>Sichtbar ab: {formatDate(task.release_at)}</small><small>Fällig: {formatDate(task.due_at)}</small>{task.is_released&&<em>Nachweis: {(task.required_proof_types||[]).map(proofLabel).join(" + ")||"Kein Pflichtformat"}</em>}
      {!task.is_released&&!dom&&<div className="lockedCopy">🔒 Inhalt wird automatisch zum Freigabezeitpunkt sichtbar.</div>}
      {openForSubmit&&<div className="evidenceBox"><h3>Nachweis einreichen</h3>{task.required_proof_types.includes("text")&&<textarea rows={4} placeholder="Text-Nachweis …" value={props.evidenceText?.[task.id]||""} onChange={e=>props.setEvidenceText?.(v=>({...v,[task.id]:e.target.value}))}/>} {(task.required_proof_types.includes("image")||task.required_proof_types.includes("video"))&&<label className="filePicker">Bild / Video auswählen<input type="file" multiple accept="image/*,video/*" onChange={e=>props.chooseFiles?.(task.id,e)}/></label>} {(props.evidenceFiles?.[task.id]?.length||0)>0&&<small>{props.evidenceFiles?.[task.id].map(f=>f.name).join(", ")}</small>}<button className="primary" disabled={props.saving} onClick={()=>props.onSubmit?.(task)}>Nachweis senden</button></div>}
      {latest&&<SubmissionView submission={latest} dom={dom} onOpenEvidence={props.onOpenEvidence} onReview={props.onReview} feedback={props.reviewFeedback?.[latest.id]||""} setFeedback={value=>props.setReviewFeedback?.(v=>({...v,[latest.id]:value}))}/>} 
    </article>})}</section>;
}

function SubmissionView({submission,dom,onOpenEvidence,onReview,feedback,setFeedback}:{submission:Submission;dom:boolean;onOpenEvidence:(f:SubmissionFile)=>void;onReview?:(s:Submission,d:"approved"|"changes_requested")=>void;feedback:string;setFeedback:(v:string)=>void}) {
  return <div className="submissionBox"><div className="submissionHead"><strong>Einreichung</strong><span>{submission.status==="approved"?"Angenommen":submission.status==="changes_requested"?"Überarbeitung": "Zur Prüfung"}</span></div>{submission.text_content&&<p>{submission.text_content}</p>}{(submission.task_submission_files||[]).map(file=><button className="evidenceLink" key={file.id} onClick={()=>onOpenEvidence(file)}>{file.media_type==="image"?"🖼":"🎥"} {file.original_name||file.media_type} öffnen</button>)}{submission.reviewer_feedback&&<div className="feedback">Feedback: {submission.reviewer_feedback}</div>}{dom&&submission.status==="submitted"&&<div className="reviewBox"><textarea rows={2} placeholder="Feedback (optional)" value={feedback} onChange={e=>setFeedback(e.target.value)}/><div><button onClick={()=>onReview?.(submission,"approved")}>✓ Annehmen</button><button onClick={()=>onReview?.(submission,"changes_requested")}>↺ Überarbeitung</button></div></div>}</div>;
}
