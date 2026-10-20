/** Public origin of the storefront, without a trailing slash (set per environment). */
export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/+$/, "");
}
