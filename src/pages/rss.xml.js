import { getCollection } from "astro:content";
import { siteConfig } from "../site.config";

function escapeXml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export async function GET() {
  const posts = (await getCollection("blog", ({ data }) => !data.draft)).sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf()
  );

  const items = posts
    .map((post) => {
      const link = new URL(`/blog/${post.slug}/`, siteConfig.siteUrl).toString();
      return `
      <item>
        <title>${escapeXml(post.data.title)}</title>
        <description>${escapeXml(post.data.description)}</description>
        <link>${link}</link>
        <guid>${link}</guid>
        <pubDate>${post.data.pubDate.toUTCString()}</pubDate>
      </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
  <rss version="2.0">
    <channel>
      <title>${escapeXml(siteConfig.title)}</title>
      <description>${escapeXml(siteConfig.description)}</description>
      <link>${siteConfig.siteUrl}</link>
      ${items}
    </channel>
  </rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8"
    }
  });
}
