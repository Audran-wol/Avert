// Vercel serverless function (Node runtime) — auto-detected from this file's path under /api.
// Thin adapter only: all real logic lives in server/askAvert.ts so the dev (Vite middleware)
// and production (Vercel) paths share one implementation. Reads OPENAI_API_KEY etc. from
// Vercel's Project Settings → Environment Variables at request time — never from source.
import { handleAskAvert } from "../server/askAvert";

interface NodeLikeRequest {
  method?: string;
  body?: unknown;
  on: (event: string, listener: (chunk: unknown) => void) => void;
  once: (event: string, listener: () => void) => void;
}
interface NodeLikeResponse {
  statusCode: number;
  setHeader: (name: string, value: string) => void;
  end: (body?: string) => void;
}

async function readJsonBody(req: NodeLikeRequest): Promise<unknown> {
  if (req.body && typeof req.body === "object") return req.body; // Vercel pre-parses JSON bodies by default
  const chunks: Buffer[] = [];
  await new Promise<void>((resolve, reject) => {
    req.on("data", (c) => chunks.push(c as Buffer));
    req.once("end", () => resolve());
    req.once("error", reject);
  });
  const raw = Buffer.concat(chunks).toString("utf-8");
  return raw ? JSON.parse(raw) : {};
}

export default async function handler(req: NodeLikeRequest, res: NodeLikeResponse) {
  if (req.method !== "POST") { res.statusCode = 405; res.end(); return; }
  try {
    const body = await readJsonBody(req);
    const result = await handleAskAvert(body as Parameters<typeof handleAskAvert>[0]);
    if (result.status >= 500) console.error("[ask-avert]", result.status, result.body);
    res.statusCode = result.status;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(result.body));
  } catch (err) {
    console.error("[ask-avert] handler error", err);
    res.statusCode = 400;
    res.end(JSON.stringify({ error: "bad_request" }));
  }
}
