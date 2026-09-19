// Framework-agnostic handler — mounted as Vite dev middleware today (vite.config.ts) and
// portable to whatever serverless/host is chosen later without rewriting this logic.
// Never imported from client code: this is the only place OPENAI_API_KEY is read.
import type { AskAvertRequestBody, AskAvertResponseBody, AllowlistedAction } from "../src/services/askAvertTypes";

const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
// Default to plain OpenAI; overridable so the same handler also works against an
// Azure OpenAI resource's OpenAI-compatible v1 surface (…/openai/v1) without any code changes —
// only OPENAI_BASE_URL/OPENAI_MODEL in .env.local differ between the two.
const BASE_URL = (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/+$/, "");
const IS_AZURE = BASE_URL.includes(".azure.com");

const SYSTEM_PROMPT = `You are Ask Avert, a disaster-intelligence assistant embedded in Avert, a flood monitoring workspace for Ghana and Cameroon.
Rules:
- Only use the JSON context provided. Never invent numbers, dates, place names, or facts not present in it.
- Never invent evacuation orders, shelter locations, emergency phone numbers, or claim authority endorsement.
- If the context lacks an input needed to answer, say so plainly instead of guessing.
- Cite only source IDs that appear in "sources". Never cite an ID you were not given.
- If historical mode, treat data as a past reconstruction, not a live warning.
- If forecast mode, make clear the index is ordinal, not a calibrated probability.
- Respond ONLY as JSON: {"answer": string, "sourceIds": string[], "missingNotes": string[], "actions": Action[]}
  where Action is one of:
  {"type":"open_source","sourceId":string}
  {"type":"highlight_feature","communityId":string}
  {"type":"compare_available_dates"}
  {"type":"prepare_alert_draft"}
  Only propose compare_available_dates if context.compareAvailable is true.
  Only propose highlight_feature/prepare_alert_draft if context.communityId is set.
  Keep "answer" concise (2-5 sentences or a short list).`;

export async function handleAskAvert(body: AskAvertRequestBody): Promise<{ status: number; body: AskAvertResponseBody | { error: string } }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return { status: 503, body: { error: "unavailable" } };
  if (!body?.message || !body?.context) return { status: 400, body: { error: "bad_request" } };

  const context = body.context;
  const userPrompt = `Context:\n${JSON.stringify(context)}\n\nOperator question: ${body.message}`;

  let resp: Response;
  try {
    resp = await fetch(`${BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Azure OpenAI key auth uses `api-key`; the plain OpenAI API uses a bearer token.
        ...(IS_AZURE ? { "api-key": apiKey } : { Authorization: `Bearer ${apiKey}` }),
      },
      body: JSON.stringify({
        model: MODEL,
        response_format: { type: "json_object" },
        // no `temperature`: reasoning-tier models (incl. this deployment) reject any value
        // other than the default. `max_completion_tokens` is the current param name on both
        // OpenAI and Azure; reasoning models spend part of this budget on hidden reasoning
        // tokens, so it's sized generously rather than tight.
        max_completion_tokens: 900,
        messages: [{ role: "system", content: SYSTEM_PROMPT }, { role: "user", content: userPrompt }],
      }),
      signal: AbortSignal.timeout(20_000),
    });
  } catch (cause) {
    console.error("[ask-avert] fetch to provider failed:", cause);
    return { status: 502, body: { error: "upstream_unreachable" } };
  }
  if (!resp.ok) {
    // Logged, not returned to the client — the body can contain provider-specific detail
    // (e.g. "temperature not supported") that's useful server-side but not for the browser.
    console.error("[ask-avert] provider returned", resp.status, await resp.text().catch(() => "<no body>"));
    return { status: 502, body: { error: `upstream_${resp.status}` } };
  }

  let raw: unknown;
  try {
    const json = await resp.json();
    raw = JSON.parse(json.choices?.[0]?.message?.content ?? "{}");
  } catch {
    return { status: 502, body: { error: "upstream_malformed" } };
  }

  return { status: 200, body: validate(raw, context) };
}

function validate(raw: unknown, context: AskAvertRequestBody["context"]): AskAvertResponseBody {
  const r = (raw ?? {}) as Partial<AskAvertResponseBody>;
  const allowedSourceIds = new Set(context.sources.map((s) => s.id));
  const sourceIds = Array.isArray(r.sourceIds) ? r.sourceIds.filter((id) => allowedSourceIds.has(id)) : [];

  const actions: AllowlistedAction[] = [];
  for (const a of Array.isArray(r.actions) ? r.actions : []) {
    if (!a || typeof a !== "object" || !("type" in a)) continue;
    const action = a as { type: string; sourceId?: string; communityId?: string };
    if (action.type === "open_source" && action.sourceId && allowedSourceIds.has(action.sourceId)) {
      actions.push({ type: "open_source", sourceId: action.sourceId });
    } else if (action.type === "highlight_feature" && context.communityId) {
      actions.push({ type: "highlight_feature", communityId: context.communityId });
    } else if (action.type === "compare_available_dates" && context.compareAvailable) {
      actions.push({ type: "compare_available_dates" });
    } else if (action.type === "prepare_alert_draft" && context.communityId) {
      actions.push({ type: "prepare_alert_draft" });
    }
  }

  return {
    answer: typeof r.answer === "string" && r.answer.trim() ? r.answer.trim() : "I couldn't produce a grounded answer from the current context.",
    sourceIds,
    missingNotes: Array.isArray(r.missingNotes) ? r.missingNotes.filter((n): n is string => typeof n === "string") : [],
    actions,
  };
}
