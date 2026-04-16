import { defineCollection, z } from "astro:content";

function normalizeBlogMediaPath(value: unknown) {
  const text = String(value ?? "").trim();
  if (!text) return undefined;

  if (/^(https?:)?\/\//i.test(text) || text.startsWith("data:")) {
    return text;
  }

  const normalized = text.replace(/\\/g, "/").replace(/^\.\//, "");

  if (normalized.startsWith("/blog/")) {
    return normalized;
  }

  if (normalized.startsWith("blog/")) {
    return `/${normalized}`;
  }

  if (normalized.startsWith("/src/content/blog/")) {
    return `/blog/${normalized.slice("/src/content/blog/".length)}`;
  }

  if (normalized.startsWith("src/content/blog/")) {
    return `/blog/${normalized.slice("src/content/blog/".length)}`;
  }

  if (normalized.startsWith("/")) {
    return normalized;
  }

  return `/blog/${normalized}`;
}

function pickFirstText(...values: unknown[]) {
  for (const value of values) {
    const text = String(value ?? "").trim();
    if (text) return text;
  }

  return "";
}

const blog = defineCollection({
  type: "content",
  schema: z
    .object({
      title: z.string().min(1),
      description: z.string().optional(),
      summary: z.string().optional(),
      excerpt: z.string().optional(),
      pubDate: z.coerce.date().optional(),
      publishDate: z.coerce.date().optional(),
      date: z.coerce.date().optional(),
      updatedDate: z.coerce.date().optional(),
      coverImage: z.string().optional(),
      cover: z.string().optional(),
      image: z.string().optional(),
      audio: z.string().optional(),
      audioUrl: z.string().optional(),
      music: z.string().optional(),
      tags: z.array(z.string()).default([]),
      draft: z.boolean().default(false)
    })
    .superRefine((data, ctx) => {
      if (!data.pubDate && !data.publishDate && !data.date) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Missing date field. Use pubDate, publishDate, or date."
        });
      }
    })
    .transform((data) => ({
      title: data.title.trim(),
      description: pickFirstText(data.description, data.summary, data.excerpt, data.title),
      pubDate: data.pubDate ?? data.publishDate ?? data.date,
      updatedDate: data.updatedDate,
      coverImage: normalizeBlogMediaPath(data.coverImage ?? data.cover ?? data.image),
      audio: normalizeBlogMediaPath(data.audio ?? data.audioUrl ?? data.music),
      tags: data.tags.map((tag) => tag.trim()).filter(Boolean),
      draft: data.draft
    }))
});

export const collections = {
  blog
};
