import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-url";

// Public storefront pages are indexable; accounts, checkout, admin and internal endpoints are not.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/account",
        "/api",
        "/cart",
        "/checkout",
        "/login",
        "/my-yacht",
        "/equipment",
        "/filters",
        "/sample-registration",
        "/search",
      ],
    },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
