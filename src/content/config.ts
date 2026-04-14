import { defineCollection, z } from "astro:content";

function normalizeBlogMediaPath(value) {
  const text = String(value || "").trim();
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

const blog = defineCollection({
  type: "content",
  schema: z
    .object({
      title: z.string(),
      description: z.string(),
      pubDate: z.coerce.date().optional(),
      publishDate: z.coerce.date().optional(),
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
      if (!data.pubDate && !data.publishDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "缺少日期字段：请填写 pubDate 或 publishDate。"
        });
      }
    })
    .transform((data) => ({
      title: data.title,
      description: data.description,
      pubDate: (data.pubDate ?? data.publishDate),
      updatedDate: data.updatedDate,
      coverImage: normalizeBlogMediaPath(data.coverImage ?? data.cover ?? data.image),
      audio: normalizeBlogMediaPath(data.audio ?? data.audioUrl ?? data.music),
      tags: data.tags,
      draft: data.draft
    }))
});

export const collections = {
  blog
};