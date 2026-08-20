import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  ArrowDownRight, ArrowUpRight, CalendarDays, ChevronDown, CircleDollarSign,
  Download, Home, LogOut, PiggyBank, Settings, Target, TrendingUp, Users, CalendarRange,
} from "lucide-react";
import "./ClubFigures.css";
import { supabase } from "./lib/supabase";
import type { ClubFigure } from "./types";
import { useClubs } from "./useClubs";
import { FinancialYearSelector, useFinancialYear } from "./FinancialYearSelector";

type Area = {
  name: string; shortName: string; value: number; target: number; previous: number;
  colour: string; softColour: string; icon: string; detail: string;
};
type Metric = { id: string; name: string; display_order: number };
type PeriodValue = { metric_id: string; period: number; amount: number };
type FullYearBudget = { metric_id: string; financial_year: number; amount: number };
type ReportingPeriod = "latest" | "ytd" | `p${number}`;

const areaConfig = [
  { name: "Main Stage Bingo", shortName: "Main Stage", colour: "#f054a3", softColour: "#ffe4f2", icon: "B" },
  { name: "Go Go Bingo", shortName: "Go Go", colour: "#8b5cf6", softColour: "#ede9fe", icon: "G" },
  { name: "Bar", shortName: "Bar", colour: "#f59e0b", softColour: "#fef3c7", icon: "B" },
  { name: "Diner", shortName: "Diner", colour: "#22c55e", softColour: "#dcfce7", icon: "D" },
  { name: "Slots", shortName: "Slots", colour: "#0ea5e9", softColour: "#e0f2fe", icon: "S" },
  { name: "Admissions", shortName: "Admissions", colour: "#14b8a6", softColour: "#ccfbf1", icon: "A" },
  { name: "Payroll", shortName: "Payroll", colour: "#64748b", softColour: "#e2e8f0", icon: "P" },
  { name: "Repairs", shortName: "Repairs", colour: "#ef4444", softColour: "#fee2e2", icon: "R" },
];
const periods = Array.from({ length: 12 }, (_, index) => index + 1);
function money(value: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(value);
}

function moneyPerHead(value: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}

function ClubFigures({ session }: { session: Session }) {
  const { clubs, selectedClubId, setSelectedClubId } = useClubs();
  const [selectedFinancialYear] = useFinancialYear();
  const [profileOpen, setProfileOpen] = useState(false);
  const [reportingPeriod, setReportingPeriod] = useState<ReportingPeriod>("ytd");
  const [figures, setFigures] = useState<ClubFigure[]>([]);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [periodValues, setPeriodValues] = useState<PeriodValue[]>([]);
  const [periodTargets, setPeriodTargets] = useState<PeriodValue[]>([]);
  const [fullYearBudgets, setFullYearBudgets] = useState<FullYearBudget[]>([]);
  const [message, setMessage] = useState("Loading figures…");
  const [authorised, setAuthorised] = useState(false);
  const selectedClub = clubs.find((club) => club.id === selectedClubId);

  useEffect(() => {
    async function load() {
      if (!selectedClubId) return;
      const { data: access } = await supabase.from("manager_access").select("user_id").eq("user_id", session.user.id).maybeSingle();
      if (!access) {
        setMessage("Your account is waiting for manager approval.");
        return;
      }
      setAuthorised(true);
      const [dailyResult, metricResult, actualResult, targetResult, fullYearResult] = await Promise.all([
        supabase.from("club_figures").select("*").eq("club_id",selectedClubId).order("entry_date", { ascending: false }),
        supabase.from("pnl_metrics").select("id,name,display_order").order("display_order"),
        supabase.from("pnl_period_values").select("metric_id,period,amount").eq("club_id",selectedClubId).eq("financial_year",selectedFinancialYear),
        supabase.from("pnl_period_targets").select("metric_id,period,amount").eq("club_id",selectedClubId).eq("financial_year",selectedFinancialYear),
        supabase.from("pnl_full_year_budgets").select("metric_id,financial_year,amount").eq("club_id",selectedClubId),
      ]);
      const error = dailyResult.error ?? metricResult.error ?? actualResult.error ?? targetResult.error ?? fullYearResult.error;
      if (error) setMessage(error.message);
      else {
        setFigures((dailyResult.data ?? []) as ClubFigure[]);
        setMetrics((metricResult.data ?? []) as Metric[]);
        setPeriodValues((actualResult.data ?? []) as PeriodValue[]);
        setPeriodTargets((targetResult.data ?? []) as PeriodValue[]);
        setFullYearBudgets((fullYearResult.data ?? []) as FullYearBudget[]);
        setMessage("");
      }
    }
    void load();
    const refresh = () => void load();
    const refreshWhenVisible = () => { if (document.visibilityState === "visible") refresh(); };
    const interval = window.setInterval(refresh, 10000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [selectedClubId, selectedFinancialYear, session.user.id]);

  const dates = [...new Set(figures.map((figure) => figure.entry_date))];
  const latest = figures.filter((figure) => figure.entry_date === dates[0]);
  const previous = figures.filter((figure) => figure.entry_date === dates[1]);
  const selectedPeriodNumber = reportingPeriod.startsWith("p") ? Number(reportingPeriod.slice(1)) : null;
  const includedPeriods = reportingPeriod === "ytd" ? periods : selectedPeriodNumber ? [selectedPeriodNumber] : [];
  const reportLabel = reportingPeriod === "latest" ? "Latest entry" : reportingPeriod === "ytd" ? `Year to Date · FY${selectedFinancialYear}` : `Period ${selectedPeriodNumber}`;
  const areaData: Area[] = areaConfig.map((config) => {
    if (reportingPeriod === "latest") {
      const current = latest.find((figure) => figure.area === config.name);
      const prior = previous.find((figure) => figure.area === config.name);
      const label = config.name.includes("Bingo") ? "books sold" : config.name === "Diner" ? "meals served" : "activity count";
      return { ...config, value: Number(current?.revenue ?? 0), target: Number(current?.target ?? 0), previous: Number(prior?.revenue ?? current?.revenue ?? 0), detail: `${Number(current?.activity_count ?? 0).toLocaleString("en-GB")} ${label}` };
    }
    const metric = metrics.find((row) => row.name === config.name);
    const actual = periodValues.filter((row) => row.metric_id === metric?.id && includedPeriods.includes(row.period)).reduce((sum, row) => sum + Number(row.amount), 0);
    const target = reportingPeriod === "ytd"
      ? Number(fullYearBudgets.find((row) => row.metric_id === metric?.id && row.financial_year === selectedFinancialYear)?.amount ?? 0)
      : periodTargets.filter((row) => row.metric_id === metric?.id && includedPeriods.includes(row.period)).reduce((sum, row) => sum + Number(row.amount), 0);
    const priorPeriod = selectedPeriodNumber && selectedPeriodNumber > 1 ? selectedPeriodNumber - 1 : null;
    const prior = priorPeriod ? periodValues.filter((row) => row.metric_id === metric?.id && row.period === priorPeriod).reduce((sum, row) => sum + Number(row.amount), 0) : actual;
    return { ...config, value: actual, target, previous: prior, detail: `${reportLabel} actual figure` };
  });
  const visibleAreas = areaData;
  const revenueAreas = areaData.filter((area) => !["Admissions", "Payroll", "Repairs"].includes(area.name));
  const payroll = areaData.find((area) => area.name === "Payroll");
  const totalSales = revenueAreas.reduce((sum, area) => sum + area.value, 0);
  const totals = totalSales - Number(payroll?.value ?? 0);
  const totalTarget = revenueAreas.reduce((sum, area) => sum + area.target, 0) - Number(payroll?.target ?? 0);
  const previousTotal = revenueAreas.reduce((sum, area) => sum + area.previous, 0) - Number(payroll?.previous ?? 0);
  const variance = previousTotal ? ((totals - previousTotal) / previousTotal) * 100 : 0;
  const activity = latest.reduce((sum, figure) => sum + Number(figure.activity_count), 0);
  const targetVariance = totals - totalTarget;
  const admissions = areaData.find((area) => area.name === "Admissions")?.value ?? 0;
  const targetAdmissions = areaData.find((area) => area.name === "Admissions")?.target ?? 0;
  const totalSpendPerHead = admissions > 0 ? totalSales / admissions : null;
  const targetSales = revenueAreas.reduce((sum, area) => sum + area.target, 0);
  const budgetSpendPerHead = targetAdmissions > 0 ? targetSales / targetAdmissions : null;
  const spendPerHeadVariance = totalSpendPerHead !== null && budgetSpendPerHead !== null ? totalSpendPerHead - budgetSpendPerHead : null;
  const introText = reportingPeriod === "latest"
    ? (dates[0] ? `Latest figures: ${new Date(`${dates[0]}T12:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}` : "Enter your first figures to get started.")
    : `${reportLabel} actual figures compared with targets.`;
  const selectedClubName = selectedClub?.name ?? "Your club";
  const headlineAreas = visibleAreas.filter((area) => ["Admissions", "Payroll", "Repairs"].includes(area.name));
  const salesAreas = visibleAreas.filter((area) => !["Admissions", "Payroll", "Repairs"].includes(area.name));

  function renderAreaCard(area: Area) {
    const achieved = area.target ? (area.value / area.target) * 100 : 0;
    const change = area.previous ? ((area.value - area.previous) / area.previous) * 100 : 0;
    const isCost = area.name === "Payroll" || area.name === "Repairs";
    const favourableChange = isCost ? -change : change;
    const performanceVariance = isCost ? area.target - area.value : area.value - area.target;
    const onTarget = area.target > 0 && (isCost ? area.value <= area.target : achieved >= 100);
    return <article className="area-card" key={area.name} style={{ "--area-colour": area.colour, "--area-soft": area.softColour } as React.CSSProperties}>
      <div className="area-card__top"><div className="area-card__icon area-card__title-badge">{area.name}</div><span className={onTarget ? "status status--good" : "status status--watch"}>{onTarget ? "On target" : "Needs attention"}</span></div>
      <p className="area-card__detail area-card__detail--badged">{area.detail}</p>
      {!['Admissions', 'Payroll', 'Repairs'].includes(area.name) && <div className="area-card__spend"><span>Spend per head</span><strong>{admissions > 0 ? moneyPerHead(area.value / admissions) : "—"}</strong></div>}
      <div className="area-card__metric"><strong>{area.name === "Admissions" ? area.value.toLocaleString("en-GB", { maximumFractionDigits: 0 }) : money(area.value)}</strong>{reportingPeriod === "latest" ? <span className={favourableChange >= 0 ? "positive" : "negative"}>{favourableChange >= 0 ? <ArrowUpRight size={15} /> : <ArrowDownRight size={15} />}{Math.abs(favourableChange).toFixed(1)}%</span> : <span className={performanceVariance >= 0 ? "positive" : "negative"}>{area.name === "Admissions" ? performanceVariance.toLocaleString("en-GB", { maximumFractionDigits: 0 }) : isCost ? `${money(Math.abs(performanceVariance))} ${performanceVariance >= 0 ? "underspend" : "overspend"}` : money(performanceVariance)}</span>}</div>
      <div className="area-card__target"><div><span>Target</span><strong>{area.name === "Admissions" ? area.target.toLocaleString("en-GB", { maximumFractionDigits: 0 }) : money(area.target)}</strong></div><div><span>{Math.round(achieved)}%</span></div></div>
      <div className="area-card__bar"><span style={{ width: `${Math.min(achieved, 100)}%` }} /></div>
    </article>;
  }

  return <main className="club-pulse">
    <header className="club-pulse__header">
      <div className="header-brand-group"><a className="header-home" href="/" aria-label="Dashboard"><Home size={18}/><span>Home</span></a><a className="club-pulse__brand" href="/" aria-label="Club Metrics home"><img className="club-pulse__brand-logo" src="https://www.buzzbingo.com/library/logo.png" alt="Buzz Bingo" /><span><strong>Club</strong> Metrics</span></a></div>
      <FinancialYearSelector />
      <div className="club-pulse__header-actions">
        {authorised && <a className="club-pulse__admin-link club-pulse__period-link" href="/admin/periods"><CalendarRange size={16} /> Period Figures</a>}
        {authorised && <a className="club-pulse__admin-link club-pulse__full-year-link" href="/admin/full-year"><PiggyBank size={16} /> Full Year</a>}
        <div className="profile-menu">
          <button className="club-pulse__profile" aria-label="Open manager menu" aria-expanded={profileOpen} onClick={() => setProfileOpen((open) => !open)}><span>CM</span><div><strong>Club Manager</strong><small>{session.user.email}</small></div></button>
          {profileOpen && <div className="profile-menu__dropdown">
            <p>MANAGER MENU</p>
            <label>Selected club<select value={selectedClubId} onChange={(event) => setSelectedClubId(event.target.value)}>{clubs.map((club) => <option value={club.id} key={club.id}>{club.name}</option>)}</select></label>
            <a href="/admin/clubs"><Settings size={16} /><span><strong>Manage Clubs</strong><small>Add or rename clubs</small></span></a>
          </div>}
        </div>
        <button className="club-pulse__icon-button" aria-label="Sign out" onClick={() => void supabase.auth.signOut()}><LogOut size={19} /></button>
      </div>
    </header>

    <section className="club-pulse__content">
      {message && <div className="club-pulse__notice" role="status">{message}</div>}
      <div className="dashboard-layout">
        <aside className="dashboard-module-rail" aria-label="Dashboard modules">
          {Array.from({ length: 7 }, (_, index) => <div className="dashboard-module-placeholder" key={index} aria-label={`Blank left module ${index + 1}`} />)}
        </aside>
        <div className="dashboard-layout__main">
      <div className="club-pulse__intro">
        <div><p className="club-pulse__eyebrow"><span /> SECURE PERFORMANCE DASHBOARD</p><h1>{selectedClubName} at a glance</h1><p>{introText}</p></div>
        <div className="club-pulse__filters">
          <label><CalendarDays size={17} /><select aria-label="Reporting period" value={reportingPeriod} onChange={(event) => setReportingPeriod(event.target.value as ReportingPeriod)}><option value="latest">Latest entry</option>{periods.map((period) => <option value={`p${period}`} key={period}>Period {period}</option>)}<option value="ytd">Year to Date</option></select><ChevronDown size={15} /></label>
          <button className="club-pulse__export" onClick={() => window.print()}><Download size={17} /> Export</button>
        </div>
      </div>

      <div className="club-pulse__summary">
        <article className="summary-card summary-card--hero"><div className="summary-card__label"><span><CircleDollarSign size={18} /></span>Total actual</div><div className="summary-card__value">{money(totals)}</div><div className="summary-card__foot"><strong><ArrowUpRight size={16} /> {reportingPeriod === "latest" ? `${variance.toFixed(1)}%` : reportLabel}</strong><span>{reportingPeriod === "latest" ? "vs previous entry" : "selected report"}</span></div><div className="summary-card__glow" /></article>
        <article className="summary-card"><div className="summary-card__label"><span className="mint"><Target size={18} /></span>Total target</div><div className="summary-card__value dark">{money(totalTarget)}</div><div className="summary-card__progress"><span style={{ width: `${totalTarget ? Math.min((totals / totalTarget) * 100, 100) : 0}%` }} /></div><div className="summary-card__foot neutral"><strong>{totalTarget ? Math.round((totals / totalTarget) * 100) : 0}% achieved</strong><span>{money(totals - totalTarget)} variance</span></div></article>
        {reportingPeriod === "latest" ? <>
          <article className="summary-card"><div className="summary-card__label"><span className="blue"><Users size={18} /></span>Total activity</div><div className="summary-card__value dark">{activity.toLocaleString("en-GB")}</div><div className="summary-card__foot"><strong><ArrowUpRight size={16} /> Live</strong><span>latest entry</span></div></article>
          <article className="summary-card"><div className="summary-card__label"><span className="amber"><TrendingUp size={18} /></span>Spend per head</div><div className="summary-card__value dark">{totalSpendPerHead === null ? "—" : moneyPerHead(totalSpendPerHead)}</div><div className="summary-card__foot neutral"><strong>Budget {budgetSpendPerHead === null ? "—" : moneyPerHead(budgetSpendPerHead)}</strong><span>{spendPerHeadVariance === null ? "No budget comparison" : `${spendPerHeadVariance >= 0 ? "+" : "−"}${moneyPerHead(Math.abs(spendPerHeadVariance))} vs budget`}</span></div></article>
        </> : <>
          <article className="summary-card"><div className="summary-card__label"><span className="blue"><TrendingUp size={18} /></span>Variance to target</div><div className="summary-card__value dark">{money(targetVariance)}</div><div className="summary-card__foot neutral"><strong>{targetVariance >= 0 ? "Ahead" : "Behind"}</strong><span>{reportLabel}</span></div></article>
          <article className="summary-card"><div className="summary-card__label"><span className="amber"><TrendingUp size={18} /></span>Spend per head</div><div className="summary-card__value dark">{totalSpendPerHead === null ? "—" : moneyPerHead(totalSpendPerHead)}</div><div className="summary-card__foot neutral"><strong>Budget {budgetSpendPerHead === null ? "—" : moneyPerHead(budgetSpendPerHead)}</strong><span>{spendPerHeadVariance === null ? "No budget comparison" : `${spendPerHeadVariance >= 0 ? "+" : "−"}${moneyPerHead(Math.abs(spendPerHeadVariance))} vs budget`}</span></div></article>
        </>}
      </div>

      <section className="club-pulse__areas">
        <div className="club-pulse__section-title"><div><p>AREA PERFORMANCE</p><h2>How each area is doing</h2></div><div className="performance-key"><span className="great" /> On target <span className="watch" /> Needs attention</div></div>
        {headlineAreas.length > 0 && <div className="area-grid area-grid--headline">
          {headlineAreas.map(renderAreaCard)}
        </div>}
        {salesAreas.length > 0 && <div className="area-grid area-grid--sales">{salesAreas.map(renderAreaCard)}</div>}
      </section>
        </div>
        <aside className="dashboard-module-rail dashboard-module-rail--right" aria-label="Right dashboard modules">
          {Array.from({ length: 7 }, (_, index) => <div className="dashboard-module-placeholder" key={index} aria-label={`Blank right module ${index + 1}`} />)}
        </aside>
      </div>
    </section>
  </main>;
}

export default ClubFigures;
