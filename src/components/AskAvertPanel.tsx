import { useEffect, useRef, useState } from "react";
import { Sparkles, X, Send, Square, RotateCcw, ExternalLink, MapPin, GitCompare, Radio } from "lucide-react";
import { useStore } from "../store";
import { buildAssessmentContext } from "../services/assessmentContext";
import { askAvert, AskAvertUnavailableError } from "../services/askAvert";
import type { AllowlistedAction, AskAvertResponseBody } from "../services/askAvertTypes";
import { navigate } from "../platform/router";
import { usePreferencesStore } from "../stores/preferencesStore";

interface Message {
  id: string; role: "user" | "assistant" | "error";
  text: string; contextId: string;
  sourceIds?: string[]; missingNotes?: string[]; actions?: AllowlistedAction[];
}

export default function AskAvertPanel() {
  const setAskAvertOpen = useStore((s) => s.setAskAvertOpen);
  const selectedId = useStore((s) => s.selectedId);
  const setSourcesOpen = useStore((s) => s.setSourcesOpen);
  const setHistoryOpen = useStore((s) => s.setHistoryOpen);
  const mode = useStore((s) => s.mode);
  const context = buildAssessmentContext();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const lastContextId = messages.length ? messages[messages.length - 1].contextId : context.contextId;
  const stale = lastContextId !== context.contextId && messages.length > 0;

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || loading) return;
    setInput("");
    const userMsg: Message = { id: crypto.randomUUID(), role: "user", text: q, contextId: context.contextId };
    setMessages((m) => [...m, userMsg]);
    setLoading(true);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const res: AskAvertResponseBody = await askAvert(q, context, controller.signal);
      setMessages((m) => [...m, { id: crypto.randomUUID(), role: "assistant", text: res.answer, contextId: context.contextId, sourceIds: res.sourceIds, missingNotes: res.missingNotes, actions: res.actions }]);
    } catch (err) {
      if (controller.signal.aborted) {
        setMessages((m) => [...m, { id: crypto.randomUUID(), role: "error", text: "Cancelled.", contextId: context.contextId }]);
      } else if (err instanceof AskAvertUnavailableError) {
        setUnavailable(true);
      } else {
        setMessages((m) => [...m, { id: crypto.randomUUID(), role: "error", text: err instanceof Error ? err.message : "Something went wrong.", contextId: context.contextId }]);
      }
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  };

  const cancel = () => abortRef.current?.abort();
  const retry = () => { const lastUser = [...messages].reverse().find((m) => m.role === "user"); if (lastUser) void send(lastUser.text); };

  // Preferences > AI assistance > "Generate explanations automatically": fires the same
  // "why this priority" question a click would, once per new community context, never on load.
  const autoExplain = usePreferencesStore((s) => s.preferences.aiAutoExplain);
  const autoFiredFor = useRef<string | null>(null);
  useEffect(() => {
    if (!autoExplain || !selectedId) return;
    if (autoFiredFor.current === context.contextId) return;
    autoFiredFor.current = context.contextId;
    void send("Why does this community have its current priority or risk level?");
  }, [autoExplain, selectedId, context.contextId]); // eslint-disable-line react-hooks/exhaustive-deps

  const runAction = (a: AllowlistedAction) => {
    if (a.type === "open_source") setSourcesOpen(true);
    else if (a.type === "highlight_feature") { /* already selected — reuse existing selection */ }
    else if (a.type === "compare_available_dates") setHistoryOpen(true);
    else if (a.type === "prepare_alert_draft") navigate("/app/alerts/new");
  };

  const suggested = [
    context.compareAvailable ? { label: "Compare dates", icon: GitCompare, q: "How does this compare across the available dates?" } : null,
    { label: "Summarize evidence", icon: Radio, q: "Summarize the evidence behind this assessment." },
    selectedId ? { label: "Why this priority?", icon: Sparkles, q: "Why does this community have its current priority or risk level?" } : null,
  ].filter((x): x is { label: string; icon: typeof Sparkles; q: string } => !!x);

  return (
    <aside className="z-20 flex h-full w-[380px] shrink-0 flex-col overflow-hidden border-l border-[var(--color-border)] bg-surface max-[1439px]:w-[340px] max-[1099px]:fixed max-[1099px]:inset-y-0 max-[1099px]:right-0 max-[1099px]:z-40 max-[1099px]:w-[360px] max-[767px]:w-full">
      <div className="shrink-0 border-b border-[var(--color-border)] px-4 pb-3.5 pt-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-action/15 text-action"><Sparkles size={15} /></span>
            <div>
              <div className="text-[14px] font-semibold leading-tight text-ink">Ask Avert</div>
              <div className="text-[11px] text-faint">Grounded in the current assessment</div>
            </div>
          </div>
          <button onClick={() => setAskAvertOpen(false)} className="text-faint transition-colors hover:text-ink"><X size={18} /></button>
        </div>
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-field px-2.5 py-2 text-[11px] text-muted">
          <MapPin size={12} className="shrink-0 text-action" />
          <span className="truncate">{context.communityName ?? context.regionName} · {context.eventName} · {mode === "observed" ? "History" : "Forecast"}</span>
        </div>
      </div>

      {unavailable ? (
        <div className="flex flex-1 items-center justify-center p-6 text-center">
          <div className="max-w-[260px]">
            <span className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-raised text-faint"><Sparkles size={18} /></span>
            <div className="text-[13px] font-medium text-ink">Ask Avert is unavailable</div>
            <p className="mt-1.5 text-[11.5px] leading-relaxed text-faint">No AI provider is configured for this build. Set <code className="rounded bg-field px-1 py-0.5 text-[10px] text-muted">OPENAI_API_KEY</code> server-side to enable it. Everything else keeps working.</p>
          </div>
        </div>
      ) : (
        <>
          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
            {messages.length === 0 && (
              <p className="text-[11.5px] leading-relaxed text-faint">
                Ask a grounded question about the current selection. Avert answers only from the data in
                this workspace and cites the sources it used.
              </p>
            )}
            {messages.map((m) => (
              <div key={m.id} className={m.role === "user" ? "flex justify-end" : ""}>
                {m.role === "user" ? (
                  <div className="max-w-[85%] rounded-2xl rounded-br-md bg-action px-3.5 py-2 text-[13px] leading-relaxed text-white">{m.text}</div>
                ) : m.role === "error" ? (
                  <div className="flex items-center gap-2 rounded-xl border border-danger/25 bg-danger/10 px-3 py-2 text-[11.5px] text-danger">
                    <span className="flex-1">{m.text}</span>
                    <button onClick={retry} className="flex shrink-0 items-center gap-1 font-medium text-action hover:underline"><RotateCcw size={11} /> Retry</button>
                  </div>
                ) : (
                  <div className={m.contextId !== context.contextId ? "opacity-45" : ""}>
                    <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-action"><Sparkles size={10} /> Avert</div>
                    <div className="panel-surface px-3.5 py-3">
                      <p className="text-[13px] leading-relaxed text-ink">{m.text}</p>
                      {!!m.missingNotes?.length && (
                        <ul className="mt-2.5 space-y-1 border-t border-[var(--color-border)] pt-2.5">
                          {m.missingNotes.map((n, i) => <li key={i} className="text-[10.5px] leading-relaxed text-faint">· {n}</li>)}
                        </ul>
                      )}
                      {!!m.sourceIds?.length && (
                        <div className="mt-2.5 flex flex-wrap gap-1.5 border-t border-[var(--color-border)] pt-2.5">
                          {m.sourceIds.map((id) => (
                            <button key={id} onClick={() => setSourcesOpen(true)} className="mono rounded-md border border-[var(--color-border)] bg-field px-1.5 py-0.5 text-[10px] text-muted transition-colors hover:border-action/30 hover:text-ink">{id}</button>
                          ))}
                        </div>
                      )}
                    </div>
                    {!!m.actions?.length && (
                      <div className="mt-2 flex flex-col gap-1.5">
                        {m.actions.map((a, i) => (
                          <button key={i} disabled={m.contextId !== context.contextId} onClick={() => runAction(a)} className="flex h-9 items-center justify-between gap-2 rounded-xl border border-[var(--color-border)] bg-field px-3 text-[12px] text-ink transition-colors hover:border-action/35 hover:bg-hover disabled:cursor-not-allowed disabled:opacity-40">
                            {actionLabel(a)} <ExternalLink size={12} className="text-faint" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-[11.5px] text-faint">
                <span className="flex gap-1">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-action" />
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-action [animation-delay:150ms]" />
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-action [animation-delay:300ms]" />
                </span>
                Thinking… <button onClick={cancel} className="font-medium text-action hover:underline">Cancel</button>
              </div>
            )}
          </div>

          {stale && (
            <div className="mx-4 mb-2 flex items-center justify-between gap-2 rounded-xl border border-priority/25 bg-priority/10 px-3 py-2 text-[11px] text-priority">
              <span className="min-w-0">Selection changed — earlier answers used different context.</span>
              <button onClick={() => setMessages([])} className="shrink-0 font-semibold hover:underline">New chat</button>
            </div>
          )}

          {suggested.length > 0 && messages.length === 0 && (
            <div className="flex shrink-0 flex-wrap gap-1.5 px-4 pb-2.5">
              {suggested.map((s) => (
                <button key={s.label} onClick={() => send(s.q)} className="flex h-8 items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-field px-3 text-[11px] text-muted transition-colors hover:border-action/35 hover:text-ink">
                  <s.icon size={11} /> {s.label}
                </button>
              ))}
            </div>
          )}

          <div className="shrink-0 border-t border-[var(--color-border)] p-3">
            <div className="flex h-11 items-center gap-2 rounded-xl border border-[var(--color-border)] bg-field px-3 transition-colors focus-within:border-action/50">
              <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send(input)} disabled={loading} placeholder="Ask about this community…" className="flex-1 bg-transparent text-[13px] text-ink outline-none placeholder:text-faint disabled:opacity-50" />
              {loading ? (
                <button onClick={cancel} aria-label="Stop" className="text-faint transition-colors hover:text-ink"><Square size={15} /></button>
              ) : (
                <button onClick={() => send(input)} disabled={!input.trim()} aria-label="Send" className="flex h-7 w-7 items-center justify-center rounded-lg bg-action text-white transition-opacity disabled:bg-raised disabled:text-faint"><Send size={14} /></button>
              )}
            </div>
            <p className="mt-2 text-[9.5px] leading-relaxed text-faint">AI explanations use the selected evidence. Verify before acting.</p>
          </div>
        </>
      )}
    </aside>
  );
}

function actionLabel(a: AllowlistedAction) {
  if (a.type === "open_source") return `Open source ${a.sourceId}`;
  if (a.type === "highlight_feature") return "Highlight on map";
  if (a.type === "compare_available_dates") return "Compare dates";
  return "Open alert composer";
}

