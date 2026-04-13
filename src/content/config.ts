import { defineCollection, z } from "astro:content";

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
      audio: z.string().optional(),
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
      pubDate: (data.pubDate ?? data.publishDate) as Date,
      updatedDate: data.updatedDate,
      coverImage: data.coverImage,
      audio: data.audio,
      tags: data.tags,
      draft: data.draft
    }))
});

export const collections = {
  blog
};