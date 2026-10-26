// Prints the active sampling kits (with their technical_specs) as JSON, read with the service key.
// Usage: node tools/kit-documents/fetch-kits.mjs > kits.json
import fs from "fs";
const env = Object.fromEntries(
  fs.readFileSync(".env.local", "utf8").split("\n").filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => [l.split("=")[0], l.slice(l.indexOf("=") + 1).trim()]),
);
const headers = { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` };
const api = `${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1`;
const [category] = await (await fetch(`${api}/categories?select=id&slug=eq.sampling-kits`, { headers })).json();
const kits = await (
  await fetch(`${api}/products?select=id,sku,name,slug,short_description,description,technical_specs&is_active=eq.true&category_id=eq.${category.id}&order=sku`, { headers })
).json();
console.log(JSON.stringify(kits));
