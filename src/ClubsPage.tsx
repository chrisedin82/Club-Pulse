import { useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { CalendarRange, CheckCircle2, Home, LogOut, PiggyBank, Plus, Save } from "lucide-react";
import { supabase } from "./lib/supabase";
import { useClubs } from "./useClubs";
import { FinancialYearSelector } from "./FinancialYearSelector";

function ClubsPage({ session }: { session: Session }) {
  const { clubs, refreshClubs } = useClubs();
  const [names, setNames] = useState<Record<string, string>>({});
  const [locations, setLocations] = useState<Record<string, string>>({});
  const [newName, setNewName] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [message, setMessage] = useState("");
  async function addClub(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase
      .from("clubs")
      .insert({ name: newName.trim(), location: newLocation.trim() });
    setMessage(error ? error.message : "Club added successfully.");
    if (!error) {
      setNewName("");
      setNewLocation("");
      await refreshClubs();
    }
  }
  async function updateClub(
    id: string,
    currentName: string,
    currentLocation: string,
  ) {
    const name = (names[id] ?? currentName).trim();
    const location = (locations[id] ?? currentLocation).trim();
    const { error } = await supabase
      .from("clubs")
      .update({ name, location, updated_at: new Date().toISOString() })
      .eq("id", id);
    setMessage(error ? error.message : "Club updated successfully.");
    if (!error) await refreshClubs();
  }
  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div className="header-brand-group">
          <a className="header-home" href="/"><Home size={18}/><span>Home</span></a>
          <a className="club-pulse__brand" href="/"><img className="club-pulse__brand-logo" src="https://www.buzzbingo.com/library/logo.png" alt="Buzz Bingo"/><span><strong>Club</strong> Metrics</span></a>
        </div>
        <FinancialYearSelector />
        <div>
          <a href="/admin/periods"><CalendarRange size={16}/> Period Figures</a>
          <a href="/admin/full-year"><PiggyBank size={16}/> Full Year</a>
          <button onClick={() => void supabase.auth.signOut()}>
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </header>
      <section className="admin-content clubs-content">
        <div className="admin-title">
          <div>
            <p>CLUB SETTINGS</p>
            <h1>Manage Clubs</h1>
            <span>Add a club or change its name and UK location.</span>
          </div>
        </div>
        {message && (
          <p
            className={
              message.includes("successfully")
                ? "period-message save-success"
                : "period-message save-error"
            }
          >
            {message.includes("successfully") && <CheckCircle2 size={17} />}{" "}
            {message}
          </p>
        )}
        <form className="club-add-form" onSubmit={addClub}>
          <label>
            New club name
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              required
              maxLength={80}
            />
          </label>
          <label>
            UK location
            <input
              value={newLocation}
              onChange={(e) => setNewLocation(e.target.value)}
              required
              maxLength={80}
              placeholder="Town or city"
            />
          </label>
          <button type="submit">
            <Plus size={17} /> Add Club
          </button>
        </form>
        <div className="clubs-list">
          {clubs.map((club) => (
            <div className="club-edit-row" key={club.id}>
              <label>
                Club name
                <input
                  value={names[club.id] ?? club.name}
                  onChange={(e) =>
                    setNames((current) => ({
                      ...current,
                      [club.id]: e.target.value,
                    }))
                  }
                />
              </label>
              <label>
                UK location
                <input
                  value={locations[club.id] ?? club.location}
                  onChange={(e) =>
                    setLocations((current) => ({
                      ...current,
                      [club.id]: e.target.value,
                    }))
                  }
                  placeholder="Town or city"
                />
              </label>
              <button
                onClick={() =>
                  void updateClub(club.id, club.name, club.location)
                }
              >
                <Save size={16} /> Save
              </button>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
export default ClubsPage;
