import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { LockKeyhole, Sparkles } from "lucide-react";
import ClubFigures from "./ClubFigures";
import AdminPage from "./AdminPage";
import { supabase } from "./lib/supabase";

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    return () => data.subscription.unsubscribe();
  }, []);

  async function signIn(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setMessage(error ? error.message : "Signed in.");
    setSubmitting(false);
  }

  async function requestAccess() {
    setSubmitting(true);
    setMessage("");
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    setMessage(error ? error.message : "Check your email to confirm your account, then ask an administrator to approve access.");
    setSubmitting(false);
  }

  if (loading) return <main className="auth-screen"><div className="auth-card">Loading Club Pulse…</div></main>;

  if (!session) {
    return <main className="auth-screen">
      <section className="auth-card">
        <div className="auth-brand"><span><Sparkles size={22} /></span><strong>Club Pulse</strong></div>
        <div className="auth-lock"><LockKeyhole size={24} /></div>
        <p className="auth-eyebrow">MANAGER ACCESS</p>
        <h1>Sign in to your club dashboard</h1>
        <p className="auth-copy">Your commercial figures are protected and only available to approved managers.</p>
        <form onSubmit={signIn}>
          <label>Email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" /></label>
          <label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} autoComplete="current-password" /></label>
          <button type="submit" disabled={submitting}>{submitting ? "Please wait…" : "Sign in"}</button>
          <button type="button" className="auth-secondary" onClick={requestAccess} disabled={submitting || !email || password.length < 8}>Request manager access</button>
        </form>
        {message && <p className="auth-message" role="status">{message}</p>}
      </section>
    </main>;
  }

  return window.location.pathname.startsWith("/admin")
    ? <AdminPage session={session} />
    : <ClubFigures session={session} />;
}

export default App;
