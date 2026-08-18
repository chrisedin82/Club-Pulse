import { useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { ArrowLeft, CheckCircle2, LogOut, Save, Sparkles } from "lucide-react";
import { supabase } from "./lib/supabase";

type Metric = { id: string; name: string; display_order: number };
type PeriodValue = { metric_id: string; period: number; amount: number };
type Values = Record<string, Record<number, string>>;

const periods = Array.from({ length: 12 }, (_, index) => index + 1);
const money = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 2 });
const wholeNumber = new Intl.NumberFormat("en-GB", { maximumFractionDigits: 0 });

function PeriodsPage({ session }: { session: Session }) {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [values, setValues] = useState<Values>({});
  const [targets, setTargets] = useState<Values>({});
  const [authorised, setAuthorised] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function initialise() {
      const { data: access } = await supabase.from("manager_access").select("user_id").eq("user_id", session.user.id).maybeSingle();
      setAuthorised(Boolean(access));
      if (!access) return;

      const [{ data: metricRows, error: metricError }, { data: periodRows, error: periodError }, { data: targetRows, error: targetError }] = await Promise.all([
        supabase.from("pnl_metrics").select("id,name,display_order").order("display_order"),
        supabase.from("pnl_period_values").select("metric_id,period,amount"),
        supabase.from("pnl_period_targets").select("metric_id,period,amount"),
      ]);
      if (metricError || periodError || targetError) {
        setMessage(metricError?.message ?? periodError?.message ?? targetError?.message ?? "The figures could not be loaded.");
        return;
      }

      const loadedMetrics = (metricRows ?? []) as Metric[];
      const next: Values = Object.fromEntries(loadedMetrics.map((metric) => [metric.id, Object.fromEntries(periods.map((period) => [period, ""]))]));
      const nextTargets: Values = Object.fromEntries(loadedMetrics.map((metric) => [metric.id, Object.fromEntries(periods.map((period) => [period, ""]))]));
      ((periodRows ?? []) as PeriodValue[]).forEach((row) => { next[row.metric_id][row.period] = String(row.amount); });
      ((targetRows ?? []) as PeriodValue[]).forEach((row) => { nextTargets[row.metric_id][row.period] = String(row.amount); });
      setMetrics(loadedMetrics);
      setValues(next);
      setTargets(nextTargets);
    }
    void initialise();
  }, [session.user.id]);

  const periodTotals = useMemo(() => periods.map((period) => metrics.filter((metric) => metric.name !== "Admissions").reduce((sum, metric) => sum + Number(values[metric.id]?.[period] || 0), 0)), [metrics, values]);
  const targetTotals = useMemo(() => periods.map((period) => metrics.filter((metric) => metric.name !== "Admissions").reduce((sum, metric) => sum + Number(targets[metric.id]?.[period] || 0), 0)), [metrics, targets]);

  function updateValue(metricId: string, period: number, value: string) {
    setValues((current) => ({ ...current, [metricId]: { ...current[metricId], [period]: value } }));
  }

  function updateTarget(metricId: string, period: number, value: string) {
    setTargets((current) => ({ ...current, [metricId]: { ...current[metricId], [period]: value } }));
  }

  async function saveFigures(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    const now = new Date().toISOString();
    const rows = metrics.flatMap((metric) => periods.map((period) => ({
      metric_id: metric.id,
      period,
      amount: Number(values[metric.id]?.[period] || 0),
      updated_by: session.user.id,
      updated_at: now,
    })));
    const { error } = await supabase.from("pnl_period_values").upsert(rows, { onConflict: "metric_id,period" });
    setMessage(error ? error.message : "All P1–P12 figures saved successfully.");
    setSaving(false);
  }

  async function saveTargets(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    const now = new Date().toISOString();
    const rows = metrics.flatMap((metric) => periods.map((period) => ({
      metric_id: metric.id,
      period,
      amount: Number(targets[metric.id]?.[period] || 0),
      updated_by: session.user.id,
      updated_at: now,
    })));
    const { error } = await supabase.from("pnl_period_targets").upsert(rows, { onConflict: "metric_id,period" });
    setMessage(error ? error.message : "All P1–P12 target figures saved successfully.");
    setSaving(false);
  }

  if (authorised === null) return <main className="admin-shell"><div className="admin-message">Checking manager access…</div></main>;
  if (!authorised) return <main className="admin-shell"><section className="admin-access-card"><Sparkles size={28} /><h1>Approval required</h1><p>Your account does not have permission to update period figures.</p><a href="/">Return to dashboard</a></section></main>;

  return <main className="admin-shell">
    <header className="admin-header"><a className="club-pulse__brand" href="/"><span className="club-pulse__brand-mark"><Sparkles size={22} /></span><span><strong>Club</strong> Pulse</span></a><div><a href="/admin"><ArrowLeft size={16} /> Daily entry</a><a href="/">Dashboard</a><button onClick={() => void supabase.auth.signOut()}><LogOut size={16} /> Sign out</button></div></header>
    <section className="admin-content period-content">
      <div className="admin-title"><div><p>12-PERIOD ENTRY</p><h1>Enter P1–P12 figures</h1><span>Add the period figure for each of the five club areas. You can return and update them at any time.</span></div></div>
      {message && <p className={message.includes("successfully") ? "period-message save-success" : "period-message save-error"} role="status">{message.includes("successfully") && <CheckCircle2 size={17} />}{message}</p>}
      <form onSubmit={saveFigures}>
        <div className="period-table-wrap">
          <table className="period-table">
            <thead><tr><th scope="col">Club area</th>{periods.map((period) => <th scope="col" key={period}>P{period}</th>)}<th scope="col">Total</th></tr></thead>
              <tbody>{metrics.map((metric) => <tr key={metric.id}><th scope="row">{metric.name}</th>{periods.map((period) => <td key={period}><label><span className="sr-only">{metric.name} P{period}</span>{metric.name === "Admissions" ? <input className="plain-number-input" aria-label={`Admissions P${period}`} type="number" min="0" step="1" inputMode="numeric" value={values[metric.id]?.[period] ?? ""} onChange={(event) => updateValue(metric.id, period, event.target.value)} /> : <span className="currency-input"><span aria-hidden="true">£</span><input aria-label={`${metric.name} P${period} in pounds`} type="number" min="0" step="0.01" inputMode="decimal" value={values[metric.id]?.[period] ?? ""} onChange={(event) => updateValue(metric.id, period, event.target.value)} /></span>}</label></td>)}<td className="period-total">{metric.name === "Admissions" ? wholeNumber.format(periods.reduce((sum, period) => sum + Number(values[metric.id]?.[period] || 0), 0)) : money.format(periods.reduce((sum, period) => sum + Number(values[metric.id]?.[period] || 0), 0))}</td></tr>)}</tbody>
            <tfoot><tr><th scope="row">Period total</th>{periodTotals.map((total, index) => <td key={periods[index]}>{money.format(total)}</td>)}<td>{money.format(periodTotals.reduce((sum, total) => sum + total, 0))}</td></tr></tfoot>
          </table>
        </div>
        <div className="admin-save period-save"><span>Figures are stored in the separate Club Pulse database.</span><button type="submit" disabled={saving || metrics.length === 0}><Save size={17} />{saving ? "Saving…" : "Save P1–P12 figures"}</button></div>
      </form>
      <section className="period-target-section">
        <div className="period-section-title"><p>PERIOD TARGETS</p><h2>Editable P1–P12 target figures</h2><span>Set the target for each club area and period.</span></div>
        <form onSubmit={saveTargets}>
          <div className="period-table-wrap period-table-wrap--targets">
            <table className="period-table period-table--targets">
              <thead><tr><th scope="col">Club area</th>{periods.map((period) => <th scope="col" key={period}>P{period}</th>)}<th scope="col">Total</th></tr></thead>
              <tbody>{metrics.map((metric) => <tr key={metric.id}><th scope="row">{metric.name}</th>{periods.map((period) => <td key={period}><label><span className="sr-only">{metric.name} P{period} target</span>{metric.name === "Admissions" ? <input className="plain-number-input" aria-label={`Admissions P${period} target`} type="number" min="0" step="1" inputMode="numeric" value={targets[metric.id]?.[period] ?? ""} onChange={(event) => updateTarget(metric.id, period, event.target.value)} /> : <span className="currency-input"><span aria-hidden="true">£</span><input aria-label={`${metric.name} P${period} target in pounds`} type="number" min="0" step="0.01" inputMode="decimal" value={targets[metric.id]?.[period] ?? ""} onChange={(event) => updateTarget(metric.id, period, event.target.value)} /></span>}</label></td>)}<td className="period-total">{metric.name === "Admissions" ? wholeNumber.format(periods.reduce((sum, period) => sum + Number(targets[metric.id]?.[period] || 0), 0)) : money.format(periods.reduce((sum, period) => sum + Number(targets[metric.id]?.[period] || 0), 0))}</td></tr>)}</tbody>
              <tfoot><tr><th scope="row">Target total</th>{targetTotals.map((total, index) => <td key={periods[index]}>{money.format(total)}</td>)}<td>{money.format(targetTotals.reduce((sum, total) => sum + total, 0))}</td></tr></tfoot>
            </table>
          </div>
          <div className="admin-save period-save"><span>Targets are saved separately from actual figures.</span><button type="submit" disabled={saving || metrics.length === 0}><Save size={17} />{saving ? "Saving…" : "Save target figures"}</button></div>
        </form>
      </section>
    </section>
  </main>;
}

export default PeriodsPage;
