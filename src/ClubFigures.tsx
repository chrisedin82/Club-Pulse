import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  ArrowDownRight, ArrowUpRight, CalendarDays, ChevronDown, CircleDollarSign,
  Download, LayoutGrid, LogOut, PencilLine, Sparkles, Target, TrendingUp, Users,
} from "lucide-react";
import "./ClubFigures.css";
import { supabase } from "./lib/supabase";
import type { ClubFigure } from "./types";

type Area = {
  name: string; shortName: string; value: number; target: number; previous: number;
  colour: string; softColour: string; icon: string; detail: string;
};

const areaConfig = [
  { name: "Main Stage Bingo", shortName: "Main Stage", colour: "#f054a3", softColour: "#ffe4f2", icon: "B" },
  { name: "Go Go Bingo", shortName: "Go Go", colour: "#8b5cf6", softColour: "#ede9fe", icon: "G" },
  { name: "Bar", shortName: "Bar", colour: "#f59e0b", softColour: "#fef3c7", icon: "B" },
  { name: "Diner", shortName: "Diner", colour: "#22c55e", softColour: "#dcfce7", icon: "D" },
  { name: "Slots", shortName: "Slots", colour: "#0ea5e9", softColour: "#e0f2fe", icon: "S" },
];

function money(value: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(value);
}

function ClubFigures({ session }: { session: Session }) {
  const [selectedArea, setSelectedArea] = useState("All areas");
  const [figures, setFigures] = useState<ClubFigure[]>([]);
  const [message, setMessage] = useState("Loading figures…");
  const [authorised, setAuthorised] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: access } = await supabase.from("manager_access").select("user_id").eq("user_id", session.user.id).maybeSingle();
      if (!access) {
        setMessage("Your account is waiting for manager approval.");
        return;
      }
      setAuthorised(true);
      const { data, error } = await supabase.from("club_figures").select("*").order("entry_date", { ascending: false });
      if (error) setMessage(error.message);
      else { setFigures((data ?? []) as ClubFigure[]); setMessage(""); }
    }
    void load();
  }, [session.user.id]);

  const dates = [...new Set(figures.map((figure) => figure.entry_date))];
  const latest = figures.filter((figure) => figure.entry_date === dates[0]);
  const previous = figures.filter((figure) => figure.entry_date === dates[1]);
  const areaData: Area[] = areaConfig.map((config) => {
    const current = latest.find((figure) => figure.area === config.name);
    const prior = previous.find((figure) => figure.area === config.name);
    const label = config.name.includes("Bingo") ? "books sold" : config.name === "Diner" ? "meals served" : "activity count";
    return { ...config, value: Number(current?.revenue ?? 0), target: Number(current?.target ?? 0), previous: Number(prior?.revenue ?? current?.revenue ?? 0), detail: `${Number(current?.activity_count ?? 0).toLocaleString("en-GB")} ${label}` };
  });
  const visibleAreas = selectedArea === "All areas" ? areaData : areaData.filter((area) => area.name === selectedArea);
  const totals = areaData.reduce((sum, area) => sum + area.value, 0);
  const totalTarget = areaData.reduce((sum, area) => sum + area.target, 0);
  const previousTotal = areaData.reduce((sum, area) => sum + area.previous, 0);
  const variance = previousTotal ? ((totals - previousTotal) / previousTotal) * 100 : 0;
  const activity = latest.reduce((sum, figure) => sum + Number(figure.activity_count), 0);

  return <main className="club-pulse">
    <header className="club-pulse__header">
      <a className="club-pulse__brand" href="/" aria-label="Club Pulse home"><span className="club-pulse__brand-mark"><Sparkles size={22} /></span><span><strong>Club</strong> Pulse</span></a>
      <div className="club-pulse__header-actions">
        {authorised && <a className="club-pulse__admin-link" href="/admin"><PencilLine size={16} /> Update figures</a>}
        <button className="club-pulse__profile" aria-label="Signed-in manager"><span>CM</span><div><strong>Club Manager</strong><small>{session.user.email}</small></div></button>
        <button className="club-pulse__icon-button" aria-label="Sign out" onClick={() => void supabase.auth.signOut()}><LogOut size={19} /></button>
      </div>
    </header>

    <section className="club-pulse__content">
      {message && <div className="club-pulse__notice" role="status">{message}</div>}
      <div className="club-pulse__intro">
        <div><p className="club-pulse__eyebrow"><span /> SECURE PERFORMANCE DASHBOARD</p><h1>Your club at a glance</h1><p>{dates[0] ? `Latest figures: ${new Date(`${dates[0]}T12:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}` : "Enter your first figures to get started."}</p></div>
        <div className="club-pulse__filters">
          <label><LayoutGrid size={17} /><select value={selectedArea} onChange={(event) => setSelectedArea(event.target.value)}><option>All areas</option>{areaData.map((area) => <option key={area.name}>{area.name}</option>)}</select><ChevronDown size={15} /></label>
          <label><CalendarDays size={17} /><select aria-label="Reporting period"><option>Latest entry</option></select><ChevronDown size={15} /></label>
          <button className="club-pulse__export" onClick={() => window.print()}><Download size={17} /> Export</button>
        </div>
      </div>

      <div className="club-pulse__summary">
        <article className="summary-card summary-card--hero"><div className="summary-card__label"><span><CircleDollarSign size={18} /></span>Total club revenue</div><div className="summary-card__value">{money(totals)}</div><div className="summary-card__foot"><strong><ArrowUpRight size={16} /> {variance.toFixed(1)}%</strong><span>vs previous entry</span></div><div className="summary-card__glow" /></article>
        <article className="summary-card"><div className="summary-card__label"><span className="mint"><Target size={18} /></span>Total target</div><div className="summary-card__value dark">{money(totalTarget)}</div><div className="summary-card__progress"><span style={{ width: `${totalTarget ? Math.min((totals / totalTarget) * 100, 100) : 0}%` }} /></div><div className="summary-card__foot neutral"><strong>{totalTarget ? Math.round((totals / totalTarget) * 100) : 0}% achieved</strong><span>{money(totals - totalTarget)} variance</span></div></article>
        <article className="summary-card"><div className="summary-card__label"><span className="blue"><Users size={18} /></span>Total activity</div><div className="summary-card__value dark">{activity.toLocaleString("en-GB")}</div><div className="summary-card__foot"><strong><ArrowUpRight size={16} /> Live</strong><span>latest entry</span></div></article>
        <article className="summary-card"><div className="summary-card__label"><span className="amber"><TrendingUp size={18} /></span>Revenue per activity</div><div className="summary-card__value dark">{activity ? money(totals / activity) : money(0)}</div><div className="summary-card__foot"><strong><ArrowUpRight size={16} /> Live</strong><span>latest entry</span></div></article>
      </div>

      <section className="club-pulse__areas">
        <div className="club-pulse__section-title"><div><p>AREA PERFORMANCE</p><h2>How each area is doing</h2></div><div className="performance-key"><span className="great" /> On target <span className="watch" /> Needs attention</div></div>
        <div className="area-grid">{visibleAreas.map((area) => {
          const achieved = area.target ? (area.value / area.target) * 100 : 0;
          const change = area.previous ? ((area.value - area.previous) / area.previous) * 100 : 0;
          const onTarget = achieved >= 100;
          return <article className="area-card" key={area.name} style={{ "--area-colour": area.colour, "--area-soft": area.softColour } as React.CSSProperties}>
            <div className="area-card__top"><div className="area-card__icon">{area.icon}</div><span className={onTarget ? "status status--good" : "status status--watch"}>{onTarget ? "On target" : "Needs attention"}</span></div>
            <h3>{area.name}</h3><p className="area-card__detail">{area.detail}</p>
            <div className="area-card__metric"><strong>{money(area.value)}</strong><span className={change >= 0 ? "positive" : "negative"}>{change >= 0 ? <ArrowUpRight size={15} /> : <ArrowDownRight size={15} />}{Math.abs(change).toFixed(1)}%</span></div>
            <div className="area-card__target"><div><span>Target</span><strong>{money(area.target)}</strong></div><div><span>{Math.round(achieved)}%</span></div></div>
            <div className="area-card__bar"><span style={{ width: `${Math.min(achieved, 100)}%` }} /></div>
          </article>;
        })}</div>
      </section>
    </section>
  </main>;
}

export default ClubFigures;
