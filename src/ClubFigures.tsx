import { useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  CalendarDays,
  ChevronDown,
  CircleDollarSign,
  Download,
  LayoutGrid,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import "./ClubFigures.css";

type Area = {
  name: string;
  shortName: string;
  value: number;
  target: number;
  previous: number;
  unit: "currency" | "number";
  colour: string;
  softColour: string;
  icon: string;
  detail: string;
};

const areaData: Area[] = [
  { name: "Main Stage Bingo", shortName: "Main Stage", value: 18420, target: 17500, previous: 16980, unit: "currency", colour: "#f054a3", softColour: "#ffe4f2", icon: "B", detail: "1,284 books sold" },
  { name: "Go Go Bingo", shortName: "Go Go", value: 12680, target: 14000, previous: 13210, unit: "currency", colour: "#8b5cf6", softColour: "#ede9fe", icon: "G", detail: "842 books sold" },
  { name: "Bar", shortName: "Bar", value: 9750, target: 9000, previous: 8910, unit: "currency", colour: "#f59e0b", softColour: "#fef3c7", icon: "B", detail: "£7.42 spend per head" },
  { name: "Diner", shortName: "Diner", value: 6240, target: 7000, previous: 5890, unit: "currency", colour: "#22c55e", softColour: "#dcfce7", icon: "D", detail: "416 meals served" },
  { name: "Slots", shortName: "Slots", value: 15320, target: 15000, previous: 14740, unit: "currency", colour: "#0ea5e9", softColour: "#e0f2fe", icon: "S", detail: "£11.66 spend per head" },
];

const dailyTrend = [
  { day: "Mon", values: [61, 54, 58, 48, 67] },
  { day: "Tue", values: [68, 59, 63, 55, 72] },
  { day: "Wed", values: [72, 63, 69, 61, 75] },
  { day: "Thu", values: [78, 68, 73, 65, 81] },
  { day: "Fri", values: [84, 74, 82, 70, 87] },
  { day: "Sat", values: [96, 89, 94, 84, 98] },
  { day: "Sun", values: [88, 81, 86, 78, 91] },
];

function money(value: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(value);
}

function ClubFigures() {
  const [selectedArea, setSelectedArea] = useState("All areas");
  const [period, setPeriod] = useState("This week");
  const visibleAreas = selectedArea === "All areas" ? areaData : areaData.filter((area) => area.name === selectedArea);
  const totals = useMemo(() => areaData.reduce((sum, area) => sum + area.value, 0), []);
  const totalTarget = useMemo(() => areaData.reduce((sum, area) => sum + area.target, 0), []);
  const previousTotal = useMemo(() => areaData.reduce((sum, area) => sum + area.previous, 0), []);
  const variance = ((totals - previousTotal) / previousTotal) * 100;

  return (
    <main className="club-pulse">
      <header className="club-pulse__header">
        <a className="club-pulse__brand" href="/club-figures" aria-label="Club Pulse home">
          <span className="club-pulse__brand-mark"><Sparkles size={22} /></span>
          <span><strong>Club</strong> Pulse</span>
        </a>
        <div className="club-pulse__header-actions">
          <button className="club-pulse__icon-button" aria-label="Notifications"><Bell size={20} /><span /></button>
          <button className="club-pulse__profile" aria-label="Open profile menu"><span>CM</span><div><strong>Club Manager</strong><small>Nottingham</small></div><ChevronDown size={16} /></button>
        </div>
      </header>

      <section className="club-pulse__content">
        <div className="club-pulse__intro">
          <div>
            <p className="club-pulse__eyebrow"><span /> Live performance dashboard</p>
            <h1>Your club at a glance</h1>
            <p>See what’s shining, spot what needs attention and keep every area moving forward.</p>
          </div>
          <div className="club-pulse__filters">
            <label><LayoutGrid size={17} /><select value={selectedArea} onChange={(event) => setSelectedArea(event.target.value)}><option>All areas</option>{areaData.map((area) => <option key={area.name}>{area.name}</option>)}</select><ChevronDown size={15} /></label>
            <label><CalendarDays size={17} /><select value={period} onChange={(event) => setPeriod(event.target.value)}><option>This week</option><option>Last week</option><option>This month</option></select><ChevronDown size={15} /></label>
            <button className="club-pulse__export" onClick={() => window.print()}><Download size={17} /> Export</button>
          </div>
        </div>

        <div className="club-pulse__summary">
          <article className="summary-card summary-card--hero">
            <div className="summary-card__label"><span><CircleDollarSign size={18} /></span>Total club revenue</div>
            <div className="summary-card__value">{money(totals)}</div>
            <div className="summary-card__foot"><strong><ArrowUpRight size={16} /> {variance.toFixed(1)}%</strong><span>vs last week</span></div>
            <div className="summary-card__glow" />
          </article>
          <article className="summary-card">
            <div className="summary-card__label"><span className="mint"><Target size={18} /></span>Weekly target</div>
            <div className="summary-card__value dark">{money(totalTarget)}</div>
            <div className="summary-card__progress"><span style={{ width: `${Math.min((totals / totalTarget) * 100, 100)}%` }} /></div>
            <div className="summary-card__foot neutral"><strong>{Math.round((totals / totalTarget) * 100)}% achieved</strong><span>{money(totals - totalTarget)} ahead</span></div>
          </article>
          <article className="summary-card">
            <div className="summary-card__label"><span className="blue"><Users size={18} /></span>Club attendance</div>
            <div className="summary-card__value dark">1,314</div>
            <div className="summary-card__foot"><strong><ArrowUpRight size={16} /> 6.4%</strong><span>vs last week</span></div>
          </article>
          <article className="summary-card">
            <div className="summary-card__label"><span className="amber"><TrendingUp size={18} /></span>Spend per head</div>
            <div className="summary-card__value dark">£47.50</div>
            <div className="summary-card__foot"><strong><ArrowUpRight size={16} /> 3.8%</strong><span>vs last week</span></div>
          </article>
        </div>

        <section className="club-pulse__areas">
          <div className="club-pulse__section-title"><div><p>AREA PERFORMANCE</p><h2>How each area is doing</h2></div><div className="performance-key"><span className="great" /> On target <span className="watch" /> Needs attention</div></div>
          <div className="area-grid">
            {visibleAreas.map((area) => {
              const achieved = (area.value / area.target) * 100;
              const change = ((area.value - area.previous) / area.previous) * 100;
              const onTarget = achieved >= 100;
              return <article className="area-card" key={area.name} style={{ "--area-colour": area.colour, "--area-soft": area.softColour } as React.CSSProperties}>
                <div className="area-card__top"><div className="area-card__icon">{area.icon}</div><span className={onTarget ? "status status--good" : "status status--watch"}>{onTarget ? "On target" : "Needs attention"}</span></div>
                <h3>{area.name}</h3><p className="area-card__detail">{area.detail}</p>
                <div className="area-card__metric"><strong>{money(area.value)}</strong><span className={change >= 0 ? "positive" : "negative"}>{change >= 0 ? <ArrowUpRight size={15} /> : <ArrowDownRight size={15} />}{Math.abs(change).toFixed(1)}%</span></div>
                <div className="area-card__target"><div><span>Target</span><strong>{money(area.target)}</strong></div><div><span>{Math.round(achieved)}%</span></div></div>
                <div className="area-card__bar"><span style={{ width: `${Math.min(achieved, 100)}%` }} /></div>
              </article>;
            })}
          </div>
        </section>

        <section className="club-pulse__trend">
          <div className="club-pulse__section-title"><div><p>WEEKLY RHYTHM</p><h2>Performance through the week</h2></div><span className="trend-note">Relative daily performance</span></div>
          <div className="trend-chart" role="img" aria-label="Bar chart comparing daily performance across all five club areas">
            {dailyTrend.map((day) => <div className="trend-chart__day" key={day.day}><div className="trend-chart__bars">{day.values.map((value, index) => <span key={index} title={`${areaData[index].name}: ${value}%`} style={{ height: `${value}%`, background: areaData[index].colour }} />)}</div><strong>{day.day}</strong></div>)}
          </div>
          <div className="trend-legend">{areaData.map((area) => <span key={area.name}><i style={{ background: area.colour }} />{area.shortName}</span>)}</div>
        </section>
      </section>
    </main>
  );
}

export default ClubFigures;
