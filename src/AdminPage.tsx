import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { ArrowLeft, CheckCircle2, History, LogOut, Save, Sparkles } from "lucide-react";
import { supabase } from "./lib/supabase";
import { CLUB_AREAS, type ClubArea, type ClubFigure } from "./types";

type Draft = { revenue: string; target: string; activity_count: string; notes: string };

const emptyDrafts = () => Object.fromEntries(CLUB_AREAS.map((area) => [area, { revenue: "", target: "", activity_count: "", notes: "" }])) as Record<ClubArea, Draft>;

function AdminPage({ session }: { session: Session }) {
  const [entryDate, setEntryDate] = useState(new Date().toISOString().slice(0, 10));
  const [drafts, setDrafts] = useState(emptyDrafts);
  const [history, setHistory] = useState<ClubFigure[]>([]);
  const [authorised, setAuthorised] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function initialise() {
      const { data: access } = await supabase.from("manager_access").select("user_id").eq("user_id", session.user.id).maybeSingle();
      setAuthorised(Boolean(access));
      if (access) await loadHistory();
    }
    void initialise();
  }, [session.user.id]);

  async function loadHistory() {
    const { data } = await supabase.from("club_figures").select("*").order("entry_date", { ascending: false }).limit(50);
    setHistory((data ?? []) as ClubFigure[]);
  }

  async function loadDate(date: string) {
    setEntryDate(date);
    const existing = history.filter((row) => row.entry_date === date);
    const next = emptyDrafts();
    existing.forEach((row) => { next[row.area] = { revenue: String(row.revenue), target: String(row.target), activity_count: String(row.activity_count), notes: row.notes }; });
    setDrafts(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function update(area: ClubArea, field: keyof Draft, value: string) {
    setDrafts((current) => ({ ...current, [area]: { ...current[area], [field]: value } }));
  }

  async function saveFigures(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    const rows = CLUB_AREAS.map((area) => ({
      entry_date: entryDate,
      area,
      revenue: Number(drafts[area].revenue || 0),
      target: Number(drafts[area].target || 0),
      activity_count: Number(drafts[area].activity_count || 0),
      notes: drafts[area].notes.trim(),
      created_by: session.user.id,
      updated_at: new Date().toISOString(),
    }));
    const { error } = await supabase.from("club_figures").upsert(rows, { onConflict: "entry_date,area" });
    setMessage(error ? error.message : "Figures saved successfully.");
    if (!error) await loadHistory();
    setSaving(false);
  }

  if (authorised === null) return <main className="admin-shell"><div className="admin-message">Checking manager access…</div></main>;
  if (!authorised) return <main className="admin-shell"><section className="admin-access-card"><Sparkles size={28} /><h1>Approval required</h1><p>Your account <strong>{session.user.email}</strong> has been created, but it still needs manager approval before figures can be changed.</p><a href="/">Return to dashboard</a></section></main>;

  const dates = [...new Set(history.map((row) => row.entry_date))];
  return <main className="admin-shell">
    <header className="admin-header"><a className="club-pulse__brand" href="/"><span className="club-pulse__brand-mark"><Sparkles size={22} /></span><span><strong>Club</strong> Pulse</span></a><div><a href="/"><ArrowLeft size={16} /> Dashboard</a><button onClick={() => void supabase.auth.signOut()}><LogOut size={16} /> Sign out</button></div></header>
    <section className="admin-content">
      <div className="admin-title"><div><p>MANAGER ENTRY</p><h1>Update club figures</h1><span>Enter one complete set of figures for each trading date.</span></div><label>Trading date<input type="date" value={entryDate} onChange={(event) => void loadDate(event.target.value)} /></label></div>
      <form onSubmit={saveFigures}>
        <div className="entry-grid">{CLUB_AREAS.map((area, index) => <fieldset className="entry-card" key={area}><legend><span>{index + 1}</span>{area}</legend><div className="entry-fields"><label>Revenue (£)<input type="number" min="0" step="0.01" value={drafts[area].revenue} onChange={(event) => update(area, "revenue", event.target.value)} required /></label><label>Target (£)<input type="number" min="0" step="0.01" value={drafts[area].target} onChange={(event) => update(area, "target", event.target.value)} required /></label><label>Activity count<input type="number" min="0" step="1" value={drafts[area].activity_count} onChange={(event) => update(area, "activity_count", event.target.value)} required /></label><label>Note<input type="text" maxLength={120} placeholder="e.g. books sold" value={drafts[area].notes} onChange={(event) => update(area, "notes", event.target.value)} /></label></div></fieldset>)}</div>
        <div className="admin-save"><div>{message && <span className={message.includes("successfully") ? "save-success" : "save-error"}>{message.includes("successfully") && <CheckCircle2 size={17} />}{message}</span>}</div><button type="submit" disabled={saving}><Save size={17} />{saving ? "Saving…" : "Save all figures"}</button></div>
      </form>
      <section className="history-panel"><div className="history-title"><History size={19} /><div><h2>Entry history</h2><p>Select a date to review or correct its figures.</p></div></div>{dates.length ? <div className="history-list">{dates.map((date) => { const rows = history.filter((row) => row.entry_date === date); const total = rows.reduce((sum, row) => sum + Number(row.revenue), 0); return <button key={date} onClick={() => void loadDate(date)}><span><strong>{new Date(`${date}T12:00:00`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}</strong><small>{rows.length} areas recorded</small></span><b>{new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(total)}</b></button>; })}</div> : <p>No saved entries yet.</p>}</section>
    </section>
  </main>;
}

export default AdminPage;
