// Minimal .env.local loader for standalone (non-Next.js) test runs — no dotenv dependency
// needed for a handful of KEY=VALUE lines, and this avoids depending on a package that's
// currently only a transitive dependency of Next.js, not a declared one of this project.
import fs from "node:fs";
import path from "node:path";

const envPath = path.resolve(__dirname, "../../.env.local");

if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key]) continue;
    process.env[key] = rawValue.replace(/^["']|["']$/g, "");
  }
}
