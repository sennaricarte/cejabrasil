import type { APIRoute } from 'astro';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

type SavePostPayload = {
  title: string;
  slug?: string;
  category?: string;
  contentHtml: string;
  status?: 'draft' | 'published';
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

export const POST: APIRoute = async ({ request }) => {
  try {
    const payload = (await request.json()) as SavePostPayload;

    if (!payload?.title || !payload?.contentHtml) {
      return new Response(
        JSON.stringify({ error: 'Campos obrigatorios: title e contentHtml.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const safeSlug = slugify(payload.slug?.trim() || payload.title);
    const blogDir = path.join(process.cwd(), 'src', 'content', 'blog');
    const filePath = path.join(blogDir, `${safeSlug}.md`);

    await mkdir(blogDir, { recursive: true });

    const markdownContent = `---
title: "${payload.title.replaceAll('"', '\\"')}"
slug: "${safeSlug}"
category: "${payload.category || 'Geral'}"
status: "${payload.status || 'draft'}"
createdAt: "${new Date().toISOString()}"
---

${payload.contentHtml}
`;

    await writeFile(filePath, markdownContent, 'utf-8');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Post salvo com sucesso.',
        filePath: `src/content/blog/${safeSlug}.md`,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido.';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
