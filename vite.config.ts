import { readFileSync, existsSync } from "node:fs";
import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// vite's loadEnv() gives pre-existing OS/shell environment variables precedence over .env
// files — useful for real deployments, but it means a stray machine-level OPENAI_API_KEY
// (e.g. from some unrelated past setup) would silently shadow the one in .env.local and no
// one would know why requests fail. Parse .env.local ourselves and let it always win when
// the file sets a value, falling back to loadEnv (which still covers real deployment envs
// where no .env.local exists).
function readDotEnvLocal(): Record<string, string> {
  const path = ".env.local";
  if (!existsSync(path)) return {};
  const out: Record<string, string> = {};
  for (const line of readFileSync(path, "utf-8").split(/\r?\n/)) {
    const m = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
    if (m) out[m[1]] = m[2];
  }
  return out;
}

// Dev-only local stand-in for wherever Ask Avert's server handler ends up hosted later.
// Reads OPENAI_API_KEY from .env.local (server-side only — never a VITE_* var, never sent
// to the browser) and exposes the same handler used by the eventual production endpoint.
function askAvertDevApi(): Plugin {
  return {
    name: "ask-avert-dev-api",
    configureServer(server) {
      server.middlewares.use("/api/ask-avert", async (req, res) => {
        if (req.method !== "POST") { res.statusCode = 405; res.end(); return; }
        try {
          const chunks: Buffer[] = [];
          for await (const chunk of req) chunks.push(chunk as Buffer);
          const body = JSON.parse(Buffer.concat(chunks).toString("utf-8") || "{}");
          // Vite's SSR module loader, not a plain Node import() — it participates in Vite's
          // module graph, so edits to server/askAvert.ts take effect on the next request
          // instead of being cached for the life of the dev process.
          const { handleAskAvert } = await server.ssrLoadModule("/server/askAvert.ts");
          const result = await handleAskAvert(body);
          if (result.status >= 500) console.error("[ask-avert]", result.status, result.body);
          res.statusCode = result.status;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(result.body));
        } catch (err) {
          console.error("[ask-avert] middleware error", err);
          res.statusCode = 400;
          res.end(JSON.stringify({ error: "bad_request" }));
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const local = readDotEnvLocal();
  for (const key of ["OPENAI_API_KEY", "OPENAI_MODEL", "OPENAI_BASE_URL"]) {
    const value = local[key] || env[key];
    if (value) process.env[key] = value;
  }
  return {
    plugins: [react(), tailwindcss(), askAvertDevApi()],
  };
});
