import React, { useMemo, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableCell } from '@tiptap/extension-table-cell';
import UnderlineExtension from '@tiptap/extension-underline';
import LinkExtension from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Bold,
  Italic,
  Underline,
  Heading1,
  Heading2,
  List,
  Quote,
  Link as LinkIcon,
  Table2,
} from 'lucide-react';

function cleanPastedHtml(html: string): string {
  if (typeof window === 'undefined') return html;

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  doc.querySelectorAll<HTMLElement>('[class],[id],[lang],[dir]').forEach((el) => {
    el.removeAttribute('class');
    el.removeAttribute('id');
    el.removeAttribute('lang');
    el.removeAttribute('dir');
  });

  doc.querySelectorAll<HTMLElement>('[style]').forEach((el) => {
    const style = el.style;
    const cleanStyle: string[] = [];

    if (el.tagName === 'TD' || el.tagName === 'TH' || el.tagName === 'TABLE') {
      if (style.textAlign) cleanStyle.push(`text-align: ${style.textAlign}`);
      if (style.verticalAlign) cleanStyle.push(`vertical-align: ${style.verticalAlign}`);
    }

    if (cleanStyle.length > 0) {
      el.setAttribute('style', cleanStyle.join('; '));
      return;
    }

    el.removeAttribute('style');
  });

  doc.querySelectorAll('meta,link,style,script,xml,o\\:p').forEach((el) => el.remove());
  doc.querySelectorAll<HTMLElement>('*').forEach((el) => {
    Array.from(el.attributes).forEach((attr) => {
      if (attr.name.startsWith('data-')) el.removeAttribute(attr.name);
    });
  });

  return doc.body.innerHTML;
}

const buttonBase =
  'inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-700 transition hover:border-[#0a1d37] hover:text-[#0a1d37] disabled:cursor-not-allowed disabled:opacity-40';

export default function ArticleEditorDashboard() {
  const [isFocused, setIsFocused] = useState(false);
  const [articleTitle, setArticleTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Jovem Aprendiz');
  const [isPublishing, setIsPublishing] = useState(false);

  const slugify = (value: string) =>
    value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2] },
      }),
      UnderlineExtension,
      LinkExtension.configure({
        openOnClick: false,
        autolink: true,
        protocols: ['http', 'https', 'mailto'],
      }),
      Placeholder.configure({
        placeholder: 'Comece a escrever ou cole seu conteúdo do Docs...',
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: '<p></p>',
    editorProps: {
      attributes: {
        class:
          'prose prose-slate max-w-none min-h-[560px] px-8 py-6 font-sans outline-none prose-headings:font-extrabold prose-headings:text-[#0a1d37] prose-p:text-slate-700 prose-table:my-5 prose-table:w-full prose-table:border-collapse prose-th:border prose-th:border-slate-300 prose-th:bg-slate-50 prose-th:px-3 prose-th:py-2 prose-td:border prose-td:border-slate-300 prose-td:px-3 prose-td:py-2',
      },
      transformPastedHTML: (html) => cleanPastedHtml(html),
    },
    onFocus: () => setIsFocused(true),
    onBlur: () => setIsFocused(false),
  });

  const categories = useMemo(
    () => ['Jovem Aprendiz', 'Estágio', 'PCD'],
    []
  );

  const getButtonClass = (isActive: boolean) =>
    `${buttonBase} ${isActive ? 'border-[#0a1d37] bg-[#0a1d37]/10 text-[#0a1d37]' : ''}`;

  const handleSetLink = () => {
    const previousUrl = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('Digite a URL do link', previousUrl ?? '');
    if (url === null) return;
    if (url.trim() === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor
      .chain()
      .focus()
      .extendMarkRange('link')
      .setLink({ href: url.trim() })
      .run();
  };

  const handlePublish = async () => {
    if (!articleTitle.trim()) {
      window.alert('Preencha o título do artigo antes de publicar.');
      return;
    }

    setIsPublishing(true);
    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: articleTitle,
          category: selectedCategory,
          contentHtml: editor.getHTML(),
        }),
      });

      const result = (await response.json()) as { error?: string; filePath?: string };
      if (!response.ok) {
        throw new Error(result.error || 'Falha ao publicar artigo.');
      }

      window.alert(`Artigo publicado com sucesso em ${result.filePath ?? 'src/content/blog/'}.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido ao publicar.';
      window.alert(message);
    } finally {
      setIsPublishing(false);
    }
  };

  if (!editor) return null;

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 pb-10 pt-6 sm:px-6 lg:px-8">
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="min-w-0">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <input
              type="text"
              value={articleTitle}
              onChange={(event) => {
                const value = event.target.value;
                setArticleTitle(value);
                setSlug(slugify(value));
              }}
              placeholder="Título do Artigo"
              aria-label="Título do Artigo"
              className="w-full border-none bg-transparent px-0 text-4xl font-black tracking-tight text-[#0a1d37] placeholder:text-slate-300 focus:outline-none"
            />

            <label className="mt-4 block text-sm font-medium text-slate-700">
              Slug
              <input
                type="text"
                value={slug}
                onChange={(event) => setSlug(event.target.value)}
                placeholder="url-amigavel-do-artigo"
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-2 focus:border-[#0a1d37] focus:outline-none"
              />
            </label>
            <div className="sticky top-4 z-20 mt-5 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  className={getButtonClass(editor.isActive('bold'))}
                  onClick={() => editor.chain().focus().toggleBold().run()}
                  type="button"
                  aria-label="Negrito"
                >
                  <Bold size={18} />
                </button>
                <button
                  className={getButtonClass(editor.isActive('italic'))}
                  onClick={() => editor.chain().focus().toggleItalic().run()}
                  type="button"
                  aria-label="Itálico"
                >
                  <Italic size={18} />
                </button>
                <button
                  className={getButtonClass(editor.isActive('underline'))}
                  onClick={() => editor.chain().focus().toggleUnderline().run()}
                  type="button"
                  aria-label="Sublinhado"
                >
                  <Underline size={18} />
                </button>
                <button
                  className={getButtonClass(editor.isActive('heading', { level: 1 }))}
                  onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                  type="button"
                  aria-label="Título H1"
                >
                  <Heading1 size={18} />
                </button>
                <button
                  className={getButtonClass(editor.isActive('heading', { level: 2 }))}
                  onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                  type="button"
                  aria-label="Título H2"
                >
                  <Heading2 size={18} />
                </button>
                <button
                  className={getButtonClass(editor.isActive('bulletList'))}
                  onClick={() => editor.chain().focus().toggleBulletList().run()}
                  type="button"
                  aria-label="Lista com marcadores"
                >
                  <List size={18} />
                </button>
                <button
                  className={getButtonClass(editor.isActive('blockquote'))}
                  onClick={() => editor.chain().focus().toggleBlockquote().run()}
                  type="button"
                  aria-label="Citação"
                >
                  <Quote size={18} />
                </button>
                <button
                  className={getButtonClass(editor.isActive('link'))}
                  onClick={handleSetLink}
                  type="button"
                  aria-label="Inserir link"
                >
                  <LinkIcon size={18} />
                </button>
                <button
                  className={buttonBase}
                  onClick={() =>
                    editor
                      .chain()
                      .focus()
                      .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                      .run()
                  }
                  type="button"
                  aria-label="Inserir tabela"
                >
                  <Table2 size={18} />
                </button>
              </div>
            </div>

            <div
              className={`mt-4 rounded-2xl border bg-white shadow-sm transition ${
                isFocused ? 'border-[#0a1d37]' : 'border-slate-300'
              }`}
            >
              <EditorContent editor={editor} />
            </div>
          </div>
        </section>

        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-[#0a1d37]">Configurações do Artigo</h2>

          <label className="mt-4 block text-sm font-medium text-slate-700">
            Categoria
            <select
              value={selectedCategory}
              onChange={(event) => setSelectedCategory(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-[#0a1d37] focus:outline-none"
            >
              {categories.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={handlePublish}
            disabled={isPublishing}
            className="mt-6 inline-flex w-full justify-center rounded-full bg-[#0a1d37] px-5 py-3 text-sm font-extrabold uppercase tracking-wide text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPublishing ? 'Publicando...' : 'Publicar Artigo'}
          </button>
        </aside>
      </div>
    </div>
  );
}
