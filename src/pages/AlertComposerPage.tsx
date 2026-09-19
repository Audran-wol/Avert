import { useEffect, useState } from "react";
import { Check, Sparkles, Bookmark, Play, ChevronLeft } from "lucide-react";
import { useStore } from "../store";
import { getEvent } from "../data/flood";
import { communityById } from "../services/exposure";
import { buildAssessmentContext } from "../services/assessmentContext";
import { askAvert, AskAvertUnavailableError } from "../services/askAvert";
import { estimateSms } from "../domain/sms";
import { RECIPIENT_COUNT } from "../domain/simEngine";
import { useAlertsStore } from "../stores/alertsStore";
import type { AlertDraft } from "../domain/alertTypes";
import { navigate, usePathname } from "../platform/router";

const TEMPLATE: Record<"en" | "fr", (name: string) => string> = {
  en: (name) => `AVERT DEMO: Flood-risk exercise for ${name}. Follow local authority updates and avoid flooded roads. This is a simulation, not a real warning.`,
  fr: (name) => `AVERT DÉMO : exercice d'alerte inondation pour ${name}. Suivez les consignes des autorités locales et évitez les routes inondées. Ceci est une simulation, pas une alerte réelle.`,
};
const DEMO_MARKER: Record<"en" | "fr", string> = { en: "AVERT DEMO", fr: "AVERT DÉMO" };

function newDraft(): AlertDraft | null {
  const s = useStore.getState();
  const community = s.selectedId ? communityById(s.selectedId) : undefined;
  if (!community) return null;
  const context = buildAssessmentContext();
  const event = getEvent(s.eventId);
  const scenarioLabel = s.mode === "observed" ? `Historical scenario · ${event.steps[s.stepIndex]?.day ?? event.meta.startTime}` : "Forecast scenario";
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(), contextId: context.contextId,
    communityId: community.id, communityName: community.name, regionName: context.regionName,
    scenarioLabel, audienceCount: RECIPIENT_COUNT, channel: "sms", language: "en",
    message: TEMPLATE.en(community.name), reviewed: false, createdAt: now, updatedAt: now,
  };
}

export default function AlertComposerPage() {
  const path = usePathname();
  const draftId = path === "/app/alerts/new" ? undefined : path.split("/").pop();
  const { drafts, saveDraft, startRun } = useAlertsStore();
  const [draft, setDraft] = useState<AlertDraft | null>(() => (draftId ? drafts.find((d) => d.id === draftId) ?? null : newDraft()));
  const [step, setStep] = useState(0);
  const [drafting, setDrafting] = useState(false);
  const [aiUnavailable, setAiUnavailable] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { if (draft) saveDraft(draft); }, [draft]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!draft) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="text-sm font-medium text-ink">Select a community first</div>
          <p className="text-xs text-faint mt-1.5">Choose a community on Monitor or Communities, then start a new simulation.</p>
          <button onClick={() => navigate("/app/communities")} className="mt-3 text-xs text-action hover:underline">Go to Communities →</button>
        </div>
      </div>
    );
  }

  const update = (patch: Partial<AlertDraft>, clearsReview = false) => {
    setDraft((d) => (d ? { ...d, ...patch, reviewed: clearsReview ? false : d.reviewed, updatedAt: new Date().toISOString() } : d));
  };

  const draftWithAI = async () => {
    setDrafting(true); setAiUnavailable(false);
    try {
      const context = buildAssessmentContext();
      const controller = new AbortController();
      const res = await askAvert(
        `Draft a concise DEMO flood-warning SMS in ${draft.language === "fr" ? "French" : "English"} for ${draft.communityName}, under 300 characters. It must be clearly a simulation exercise, not a real warning, and must not invent shelters, evacuation orders, or emergency numbers.`,
        context, controller.signal,
      );
      let text = res.answer.trim();
      if (!text.toUpperCase().includes(DEMO_MARKER[draft.language])) text = `${DEMO_MARKER[draft.language]}: ${text}`;
      update({ message: text }, true);
    } catch (err) {
      if (err instanceof AskAvertUnavailableError) setAiUnavailable(true);
    } finally {
      setDrafting(false);
    }
  };

  const sms = estimateSms(draft.message);

  return (
    <div className="flex-1 overflow-y-auto p-5">
      <div className="max-w-5xl mx-auto">
        <button onClick={() => navigate("/app/alerts")} className="flex items-center gap-1 text-xs text-faint hover:text-ink mb-2"><ChevronLeft size={12} /> Alerts</button>
        <h1 className="text-2xl font-semibold text-ink">Prepare a community alert</h1>
        <p className="text-sm text-muted mt-0.5">Turn the selected assessment into a clear message.</p>

        <div className="mt-4 px-3 py-2 rounded-lg bg-priority/10 border border-priority/25 text-xs text-priority font-medium">Simulation mode — no messages will be sent.</div>

        <div className="flex items-center gap-3 mt-5">
          <Step n={1} label="Audience" state={step > 0 ? "done" : "active"} />
          <div className="flex-1 h-px bg-border" />
          <Step n={2} label="Message" state={step === 1 ? "active" : step > 1 ? "done" : "todo"} />
          <div className="flex-1 h-px bg-border" />
          <Step n={3} label="Review" state={step === 2 ? "active" : "todo"} />
        </div>

        <div className="grid grid-cols-[1fr_360px] gap-5 mt-5 max-[1099px]:grid-cols-1">
          <div className="rounded-2xl border border-border bg-surface p-5">
            {step === 0 && <AudienceStep draft={draft} onNext={() => setStep(1)} />}
            {step === 1 && (
              <MessageStep
                draft={draft} update={update} drafting={drafting} aiUnavailable={aiUnavailable}
                onDraftAI={draftWithAI} sms={sms}
                onBack={() => setStep(0)} onNext={() => setStep(2)}
              />
            )}
            {step === 2 && (
              <ReviewStep
                draft={draft} submitting={submitting}
                onBack={() => setStep(1)}
                onReviewChange={(v) => setDraft((d) => (d ? { ...d, reviewed: v, updatedAt: new Date().toISOString() } : d))}
                onSaveDraft={() => saveDraft(draft)}
                onRun={() => {
                  if (submitting) return; setSubmitting(true);
                  const run = startRun(draft);
                  navigate(`/app/alerts/run/${run.id}`);
                }}
              />
            )}
          </div>

          <div className="rounded-2xl border border-border bg-surface p-4">
            <div className="text-sm font-semibold text-ink mb-1">Resident preview</div>
            <div className="text-[11px] text-faint mb-3">SMS · {draft.language === "fr" ? "Français" : "English"}</div>
            <PhonePreview message={draft.message} />
            <div className="mt-3 text-[10px] text-faint">Illustrative phone preview · fictional recipients</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Step({ n, label, state }: { n: number; label: string; state: "active" | "done" | "todo" }) {
  return (
    <div className="flex items-center gap-2 shrink-0">
      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-semibold ${state === "done" ? "bg-action text-white" : state === "active" ? "border-2 border-action text-action" : "border border-border text-faint"}`}>
        {state === "done" ? <Check size={12} /> : n}
      </span>
      <span className={`text-sm ${state === "todo" ? "text-faint" : "text-ink font-medium"}`}>{label}</span>
    </div>
  );
}

function AudienceStep({ draft, onNext }: { draft: AlertDraft; onNext: () => void }) {
  return (
    <div>
      <div className="rounded-xl border border-border bg-field p-3.5">
        <div className="text-sm font-semibold text-ink">{draft.communityName} · {draft.regionName}</div>
        <div className="text-[11px] text-faint mt-0.5">{draft.scenarioLabel}</div>
      </div>
      <div className="mt-4">
        <div className="text-xs font-semibold text-ink">Audience</div>
        <div className="text-sm text-ink mt-1">Sample subscriber list — {draft.audienceCount} demo recipients</div>
        <p className="text-[11px] text-faint mt-1">These are synthetic recipients — do not equate this count with population exposure.</p>
      </div>
      <div className="grid grid-cols-2 gap-4 mt-4">
        <div>
          <div className="text-xs font-semibold text-ink mb-1">Channel</div>
          <div className="text-sm text-muted">SMS</div>
        </div>
        <div>
          <div className="text-xs font-semibold text-ink mb-1">Preview channel</div>
          <div className="text-sm text-muted">Supported</div>
        </div>
      </div>
      <button onClick={onNext} className="mt-6 h-10 px-4 rounded-lg bg-action text-white text-sm font-medium hover:bg-action/90">Continue to message</button>
    </div>
  );
}

function MessageStep({ draft, update, drafting, aiUnavailable, onDraftAI, sms, onBack, onNext }: {
  draft: AlertDraft; update: (p: Partial<AlertDraft>, clears?: boolean) => void; drafting: boolean; aiUnavailable: boolean;
  onDraftAI: () => void; sms: ReturnType<typeof estimateSms>; onBack: () => void; onNext: () => void;
}) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <label className="text-xs font-semibold text-ink">Language</label>
        <select
          value={draft.language}
          onChange={(e) => { const lang = e.target.value as "en" | "fr"; const wasTemplate = draft.message === TEMPLATE[draft.language](draft.communityName); update({ language: lang, message: wasTemplate ? TEMPLATE[lang](draft.communityName) : draft.message }, true); }}
          className="h-8 px-2 rounded-lg bg-field border border-border text-xs text-ink"
        >
          <option value="en">English</option>
          <option value="fr">Français</option>
        </select>
        <button onClick={onDraftAI} disabled={drafting} className="ml-auto flex items-center gap-1.5 h-8 px-3 rounded-lg bg-action/15 hover:bg-action/25 border border-action/25 text-xs font-medium text-action disabled:opacity-50">
          <Sparkles size={13} /> {drafting ? "Drafting…" : "Draft with AI"}
        </button>
      </div>
      {aiUnavailable && <div className="text-[11px] text-priority mb-2">AI drafting is unavailable in this build — using the suggested template instead is fine.</div>}
      <textarea
        value={draft.message}
        onChange={(e) => update({ message: e.target.value }, true)}
        rows={6}
        className="w-full rounded-xl bg-field border border-border p-3 text-sm text-ink outline-none focus:border-action/50 resize-none"
      />
      <div className="flex items-center justify-between mt-2">
        <button onClick={() => update({ message: TEMPLATE[draft.language](draft.communityName) }, true)} className="text-[11px] text-action hover:underline">Use suggested template</button>
        <span className="text-[11px] text-faint mono">{sms.encoding} · {sms.length} chars · {sms.segments} segment{sms.segments > 1 ? "s" : ""}</span>
      </div>
      <p className="text-[11px] text-faint mt-2">Review the message before running the exercise.</p>
      <div className="flex items-center gap-2 mt-6">
        <button onClick={onBack} className="h-10 px-4 rounded-lg bg-field border border-border text-sm text-ink hover:bg-hover">Back</button>
        <button onClick={onNext} disabled={!draft.message.trim()} className="h-10 px-4 rounded-lg bg-action text-white text-sm font-medium hover:bg-action/90 disabled:opacity-50">Review simulation</button>
      </div>
    </div>
  );
}

function ReviewStep({ draft, submitting, onBack, onReviewChange, onSaveDraft, onRun }: {
  draft: AlertDraft; submitting: boolean; onBack: () => void; onReviewChange: (v: boolean) => void; onSaveDraft: () => void; onRun: () => void;
}) {
  return (
    <div>
      <dl className="space-y-2 text-sm">
        <div className="flex justify-between"><dt className="text-faint">Audience</dt><dd className="text-ink">{draft.audienceCount} fictional recipients</dd></div>
        <div className="flex justify-between"><dt className="text-faint">Community</dt><dd className="text-ink">{draft.communityName}, {draft.regionName}</dd></div>
        <div className="flex justify-between"><dt className="text-faint">Scenario</dt><dd className="text-ink">{draft.scenarioLabel}</dd></div>
        <div className="flex justify-between"><dt className="text-faint">Channel / language</dt><dd className="text-ink">SMS · {draft.language.toUpperCase()}</dd></div>
        <div className="flex justify-between"><dt className="text-faint">Gateway</dt><dd className="text-ink">Demo SMS gateway (operator integration planned)</dd></div>
      </dl>
      <div className="mt-3 rounded-xl border border-border bg-field p-3 text-sm text-ink whitespace-pre-wrap">{draft.message}</div>

      <label className="flex items-center gap-2 mt-4 text-sm text-ink cursor-pointer">
        <input type="checkbox" checked={draft.reviewed} onChange={(e) => onReviewChange(e.target.checked)} className="h-4 w-4 accent-action" />
        I have reviewed this sample message
      </label>

      <div className="flex items-center gap-2 mt-6">
        <button onClick={onBack} className="h-10 px-4 rounded-lg bg-field border border-border text-sm text-ink hover:bg-hover">Back</button>
        <button onClick={onSaveDraft} className="flex items-center gap-1.5 h-10 px-4 rounded-lg bg-field border border-border text-sm text-ink hover:bg-hover"><Bookmark size={14} /> Save draft</button>
        <button onClick={onRun} disabled={!draft.reviewed || submitting} className="ml-auto flex items-center gap-1.5 h-10 px-4 rounded-lg bg-action text-white text-sm font-medium hover:bg-action/90 disabled:opacity-50">
          <Play size={14} /> {submitting ? "Starting…" : "Run simulation"}
        </button>
      </div>
    </div>
  );
}

function PhonePreview({ message }: { message: string }) {
  return (
    <div className="mx-auto w-[220px] rounded-[28px] border-4 border-neutral-800 bg-black p-2">
      <div className="rounded-[20px] bg-[#0b0f14] overflow-hidden">
        <div className="px-3 py-2 text-center text-[10px] font-semibold text-white border-b border-white/10">AVERT DEMO</div>
        <div className="p-2.5 min-h-[140px]">
          <div className="bg-[#1c2733] text-white text-[11px] leading-relaxed rounded-xl rounded-bl-sm px-2.5 py-2 whitespace-pre-wrap">{message || "…"}</div>
        </div>
      </div>
    </div>
  );
}
