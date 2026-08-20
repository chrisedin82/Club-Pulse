import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export type Club = { id: string; name: string; location: string };

export function useClubs() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [selectedClubId, setSelectedClubIdState] = useState(localStorage.getItem("club-metrics-club") ?? "");
  async function refreshClubs() {
    const { data } = await supabase.from("clubs").select("id,name,location").order("name");
    const rows = (data ?? []) as Club[];
    setClubs(rows);
    setSelectedClubIdState((current) => current && rows.some((club) => club.id === current) ? current : rows[0]?.id ?? "");
  }
  useEffect(() => { void refreshClubs(); }, []);
  function setSelectedClubId(id: string) { localStorage.setItem("club-metrics-club", id); setSelectedClubIdState(id); }
  return { clubs, selectedClubId, setSelectedClubId, refreshClubs };
}
