import { useEffect, useState } from "react";
import { CalendarRange } from "lucide-react";

const STORAGE_KEY = "club-metrics-financial-year";
const CHANGE_EVENT = "club-metrics-financial-year-change";
const currentYear = new Date().getFullYear();
export const financialYears = Array.from({ length: 7 }, (_, index) => currentYear - 2 + index);

function storedFinancialYear() {
  const stored = Number(localStorage.getItem(STORAGE_KEY));
  return financialYears.includes(stored) ? stored : 2026;
}

export function useFinancialYear() {
  const [financialYear, setFinancialYearState] = useState(storedFinancialYear);

  useEffect(() => {
    const sync = () => setFinancialYearState(storedFinancialYear());
    window.addEventListener(CHANGE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CHANGE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  function setFinancialYear(year: number) {
    localStorage.setItem(STORAGE_KEY, String(year));
    setFinancialYearState(year);
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }

  return [financialYear, setFinancialYear] as const;
}

export function FinancialYearSelector() {
  const [financialYear, setFinancialYear] = useFinancialYear();
  return <label className="global-year-selector">
    <CalendarRange size={16} />
    <span>Select year</span>
    <select aria-label="Select financial year for all pages" value={financialYear} onChange={(event) => setFinancialYear(Number(event.target.value))}>
      {financialYears.map((year) => <option value={year} key={year}>FY{year}</option>)}
    </select>
  </label>;
}
