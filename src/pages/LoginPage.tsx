import { useState, type FormEvent } from "react";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Radio, ShieldCheck, Waves } from "lucide-react";
import BrandMark from "../components/BrandMark";
import { useAuth } from "../auth/AuthContext";
import { navigate } from "../platform/router";

export default function LoginPage({ recovery = false }: { recovery?: boolean }) {
  const { enterDemo, signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [recoverySent, setRecoverySent] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    if (!email.includes("@")) {
      setError("Enter a valid work email address.");
      return;
    }
    if (recovery) {
      setRecoverySent(true);
      return;
    }
    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      await signIn(email, password);
      navigate("/hazards");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  };

  const openDemo = () => {
    enterDemo();
    navigate("/hazards");
  };

  return (
    <main className="login-page min-h-screen bg-[#0A1018] text-white lg:grid lg:grid-cols-[1.12fr_0.88fr]">
      <section className="login-scene relative hidden min-h-screen overflow-hidden border-r border-white/8 p-10 lg:flex lg:flex-col">
        <img src="/avert-login.png" alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover object-left" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0A1018] via-[#0A1018]/55 to-transparent" />
        <div className="relative z-10"><BrandMark /></div>
        <div className="relative z-10 mt-auto max-w-xl pb-12">
          <div className="mb-5 flex w-fit items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5 text-[11px] font-medium text-blue-200">
            <Radio size={13} /> Flood intelligence is active
          </div>
          <h1 className="text-5xl font-semibold leading-[1.05] tracking-[-0.045em] text-[#F5F7FA]">See the risk.<br />Prepare earlier.</h1>
          <p className="mt-5 max-w-md text-[15px] leading-7 text-slate-400">A shared operational picture for flood monitoring, historical evidence and community-level risk across supported African regions.</p>
          <div className="mt-8 grid max-w-lg grid-cols-3 gap-3">
            <SceneStat icon={Waves} label="Flood module" value="Active" />
            <SceneStat icon={ShieldCheck} label="Coverage" value="Ghana · Cameroon" />
            <SceneStat icon={LockKeyhole} label="Workspace" value="Controlled access" />
          </div>
        </div>
      </section>

      <section className="flex min-h-screen items-center justify-center bg-[#F5F6F8] px-5 py-8 text-[#15191D] sm:px-10">
        <div className="w-full max-w-[430px]">
          <div className="mb-10 lg:hidden"><BrandMark tone="dark" /></div>
          <div className="mb-8">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">Avert operator workspace</p>
            <h2 className="text-3xl font-semibold tracking-[-0.035em]">{recovery ? "Recover access" : "Welcome back"}</h2>
            <p className="mt-2 text-sm leading-6 text-[#64716e]">{recovery ? "Enter your account email to begin recovery." : "Sign in to monitor supported areas and explore flood evidence."}</p>
          </div>

          {recoverySent ? (
            <div className="rounded-2xl border border-[#198b7d]/20 bg-white p-6 shadow-sm">
              <ShieldCheck className="text-primary" size={24} />
              <h3 className="mt-4 font-semibold">Request noted</h3>
              <p className="mt-2 text-sm leading-6 text-[#64716e]">Recovery email delivery will be enabled with the production identity provider. No message was sent from this demo build.</p>
              <button onClick={() => navigate("/login")} className="mt-5 text-sm font-semibold text-primary">Return to sign in</button>
            </div>
          ) : (
            <form onSubmit={submit} noValidate>
              <label className="mb-2 block text-sm font-medium" htmlFor="email">Work email</label>
              <input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" placeholder="you@organisation.org" className="avert-input" />

              {!recovery && (
                <>
                  <div className="mb-2 mt-5 flex items-center justify-between">
                    <label className="text-sm font-medium" htmlFor="password">Password</label>
                    <button type="button" onClick={() => navigate("/login/recover")} className="text-xs font-semibold text-primary hover:text-blue-800">Forgot password?</button>
                  </div>
                  <div className="relative">
                    <input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" placeholder="At least 8 characters" className="avert-input pr-12" />
                    <button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7a8683] hover:text-[#12201e]">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                  </div>
                </>
              )}

              {error && <div role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs leading-5 text-red-700">{error}</div>}

              <button disabled={loading} className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#4FA8ED] px-4 text-sm font-semibold text-white transition hover:bg-[#3D96DC] disabled:opacity-60">
                {loading ? "Checking access…" : recovery ? "Continue recovery" : "Sign in"}<ArrowRight size={16} />
              </button>
            </form>
          )}

          {!recovery && (
            <>
              <div className="my-6 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9aa4a1]"><span className="h-px flex-1 bg-black/10" />Hackathon preview<span className="h-px flex-1 bg-black/10" /></div>
              <button onClick={openDemo} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-[#15191D]/15 bg-white text-sm font-semibold text-[#15191D] shadow-sm transition hover:border-primary/40 hover:bg-[#FAFBFD]">Explore demo workspace <ArrowRight size={16} /></button>
              <p className="mt-3 text-center text-[11px] leading-5 text-[#7b8784]">Uses an isolated, time-limited sample session. Production organization authentication is not connected in this repository.</p>
            </>
          )}
        </div>
      </section>
    </main>
  );
}

function SceneStat({ icon: Icon, label, value }: { icon: typeof Waves; label: string; value: string }) {
  return <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-3.5 backdrop-blur-sm"><Icon size={16} className="text-blue-300" /><span className="mt-5 block text-[10px] uppercase tracking-[0.13em] text-slate-500">{label}</span><span className="mt-1 block text-xs font-medium text-slate-200">{value}</span></div>;
}

