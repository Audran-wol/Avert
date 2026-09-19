import type { AskAvertResponseBody, AssessmentContext } from "./askAvertTypes";

export class AskAvertUnavailableError extends Error {}

export async function askAvert(message: string, context: AssessmentContext, signal: AbortSignal): Promise<AskAvertResponseBody> {
  let resp: Response;
  try {
    resp = await fetch("/api/ask-avert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, context }),
      signal,
    });
  } catch (cause) {
    if (signal.aborted) throw cause;
    throw new Error("Could not reach the AI service.");
  }
  if (resp.status === 503) throw new AskAvertUnavailableError("Ask Avert is not configured in this build.");
  if (!resp.ok) throw new Error(`Ask Avert request failed (${resp.status}).`);
  return (await resp.json()) as AskAvertResponseBody;
}
