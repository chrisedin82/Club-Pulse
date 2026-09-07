import { useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { CalendarRange, CheckCircle2, Home, LogOut, PiggyBank, Save, Sparkles } from "lucide-react";
import { supabase } from "./lib/supabase";
import { useClubs } from "./useClubs";
import { FinancialYearSelector, useFinancialYear } from "./FinancialYearSelector";

type Metric = { id: string; name: string; display_order: number };
type AnnualBudget = { metric_id: string; financial_year: number; amount: number };
type BudgetValues = Record<string, string>;

const money = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 2 });
const wholeNumber = new Intl.NumberFormat("en-GB", { maximumFractionDigits: 0 });

function FullYearPage({ session }: { session: Session }) {
  const { clubs, selectedClubId, setSelectedClubId } = useClubs();
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [budgets, setBudgets] = useState<BudgetValues>({});
  const [selectedYear] = useFinancialYear();
  const [authorised, setAuthorised] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function initialise() {
      const { data: access } = await supabase.from("manager_access").select("user_id").eq("user_id", session.user.id).maybeSingle();
      setAuthorised(Boolean(access));
      if (!access || !selectedClubId) return;

      const [{ data: metricRows, error: metricError }, { data: budgetRows, error: budgetError }] = await Promise.all([
        supabase.from("pnl_metrics").select("id,name,display_order").order("display_order"),
        supabase.from("pnl_full_year_budgets").select("metric_id,financial_year,amount").eq("club_id",selectedClubId).eq("financial_year", selectedYear),
      ]);
      if (metricError || budgetError) {
        setMessage(metricError?.message ?? budgetError?.message ?? "The full-year budgets could not be loaded.");
        return;
      }

      const loadedMetrics = (metricRows ?? []) as Metric[];
      const nextBudgets = Object.fromEntries(loadedMetrics.map((metric) => [metric.id, ""]));
      ((budgetRows ?? []) as AnnualBudget[]).forEach((row) => { nextBudgets[row.metric_id] = String(row.amount); });
      setMetrics(loadedMetrics);
      setBudgets(nextBudgets);
    }
    void initialise();
  }, [selectedClubId, selectedYear, session.user.id]);

  const totalBudget = useMemo(() => metrics.filter((metric) => !["Admissions", "Repairs"].includes(metric.name)).reduce((sum, metric) => sum + Number(budgets[metric.id] || 0), 0), [budgets, metrics]);

  async function saveBudgets(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    const rows = metrics.map((metric) => ({
      metric_id: metric.id,
      club_id: selectedClubId,
      financial_year: selectedYear,
      amount: Number(budgets[metric.id] || 0),
      updated_by: session.user.id,
      updated_at: new Date().toISOString(),
    }));
    const { error } = await supabase.from("pnl_full_year_budgets").upsert(rows, { onConflict: "club_id,metric_id,financial_year" });
    setMessage(error ? error.message : `FY${selectedYear} budgets saved successfully.`);
    setSaving(false);
  }

  if (authorised === null) return <main className="admin-shell"><div className="admin-message">Checking manager access…</div></main>;
  if (!authorised) return <main className="admin-shell"><section className="admin-access-card"><Sparkles size={28} /><h1>Approval required</h1><p>Your account does not have permission to update budgets.</p><a href="/">Return to dashboard</a></section></main>;

  return <main className="admin-shell">
    <header className="admin-header"><div className="header-brand-group"><a className="header-home" href="/"><Home size={18}/><span>Home</span></a><a className="club-pulse__brand" href="/"><img className="club-pulse__brand-logo" src="https://www.buzzbingo.com/library/logo.png" alt="Buzz Bingo" /><span><strong>Club</strong> Metrics</span></a></div><FinancialYearSelector /><div><a href="/admin/periods"><CalendarRange size={16} /> Period Figures</a><a href="/admin/full-year"><PiggyBank size={16}/> Full Year</a><button onClick={() => void supabase.auth.signOut()}><LogOut size={16} /> Sign out</button></div></header>
    <section className="admin-content full-year-content">
      <div className="admin-title"><div><p>ANNUAL BUDGET</p><h1>Full Year budget</h1><span>Enter the complete yearly budget for each club category.</span></div><div className="admin-title__filters"><label>Club<select value={selectedClubId} onChange={event=>setSelectedClubId(event.target.value)}>{clubs.map(club=><option value={club.id} key={club.id}>{club.name}</option>)}</select></label></div></div>
      {message && <p className={message.includes("successfully") ? "period-message save-success" : "period-message save-error"} role="status">{message.includes("successfully") && <CheckCircle2 size={17} />}{message}</p>}
      <form onSubmit={saveBudgets}>
        <div className="full-year-grid">
          {metrics.map((metric) => <label className="full-year-card" key={metric.id}>
            <span>{metric.name}</span>
            <small>{metric.name === "Admissions" ? "Annual admissions target" : "Annual budget figure"}</small>
            {metric.name === "Admissions" ? <input aria-label="Full-year admissions target" type="number" min="0" step="1" inputMode="numeric" value={budgets[metric.id] ?? ""} onChange={(event) => setBudgets((current) => ({ ...current, [metric.id]: event.target.value }))} /> : <span className="full-year-currency"><b aria-hidden="true">£</b><input aria-label={`${metric.name} full-year budget in pounds`} type="number" min="0" step="0.01" inputMode="decimal" value={budgets[metric.id] ?? ""} onChange={(event) => setBudgets((current) => ({ ...current, [metric.id]: event.target.value }))} /></span>}
            <strong>{metric.name === "Admissions" ? wholeNumber.format(Number(budgets[metric.id] || 0)) : money.format(Number(budgets[metric.id] || 0))}</strong>
          </label>)}
        </div>
        <div className="full-year-total"><span>FY{selectedYear} combined annual budget <small>Excluding Admissions and standalone Repairs</small></span><strong>{money.format(totalBudget)}</strong></div>
        <div className="admin-save period-save"><span>FY{selectedYear} is stored separately from other financial years.</span><button type="submit" disabled={saving || metrics.length === 0}><Save size={17} />{saving ? "Saving…" : `Save FY${selectedYear} budget`}</button></div>
      </form>
    </section>
  </main>;
}

export default FullYearPage;
