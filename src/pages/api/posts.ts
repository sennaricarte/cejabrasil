import type { APIRoute } from 'astro';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

type CreatePostPayload = {
  title?: string;
  category?: string;
  content?: string;
  contentHtml?: string;
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function escapeQuotes(value: string): string {
  return value.replaceAll('"', '\\"');
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const payload = (await request.json()) as CreatePostPayload;

    const title = payload.title?.trim();
    const category = payload.category?.trim() || 'Geral';
    const content = payload.content?.trim() || payload.contentHtml?.trim();

    if (!title || !content) {
      return new Response(
        JSON.stringify({
          error: 'Campos obrigatórios: title e content.',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const slug = slugify(title);
    const blogDir = path.join(process.cwd(), 'src', 'content', 'blog');
    const filePath = path.join(blogDir, `${slug}.md`);
    const createdAt = new Date().toISOString();

    await mkdir(blogDir, { recursive: true });

    const markdown = `---
title: "${escapeQuotes(title)}"
pubDate: "${createdAt}"
category: "${escapeQuotes(category)}"
---

${content}
`;

    await writeFile(filePath, markdown, 'utf-8');

    return new Response(
      JSON.stringify({
        success: true,
        slug,
        filePath: `src/content/blog/${slug}.md`,
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno ao salvar post.';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
