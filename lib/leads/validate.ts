/**
 * Validação e normalização dos leads vindos dos formulários do site.
 * Sem dependências: roda no runtime Node da Vercel e nos testes.
 */

export type LeadType = 'contato' | 'parceria_estagio';

export interface Lead {
	tipo: LeadType;
	nome: string;
	email: string;
	telefone: string;
	empresa: string;
	cargo: string;
	assunto: string;
	mensagem: string;
	/** Caminho da página de origem (sem domínio, sem query). */
	pagina: string;
	/** Parâmetros de campanha presentes na URL, se houver. */
	utm: Record<string, string>;
	/** ISO 8601, gerado no servidor. */
	recebidoEm: string;
}

export type ParseResult =
	| { ok: true; lead: Lead }
	| { ok: false; reason: 'invalid'; errors: string[] }
	| { ok: false; reason: 'spam' };

export const LEAD_TYPES: readonly LeadType[] = ['contato', 'parceria_estagio'];

/** Mesmas opções do <select name="assunto"> em src/pages/contato.astro. */
export const ASSUNTOS_CONTATO: readonly string[] = [
	'Contratar Aprendiz',
	'Contratar Estagiário',
	'Inclusão PCD',
	'Outros',
];

export const ASSUNTO_ESTAGIO = 'Estágio ou convênio escolar';

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'] as const;

const MAX = {
	nome: 120,
	email: 254,
	telefone: 30,
	empresa: 150,
	cargo: 100,
	mensagem: 2000,
	pagina: 100,
	utm: 100,
} as const;

// Caracteres de controle (exceto \n e \t) não têm lugar em dados de formulário.
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

function text(value: unknown, max: number, multiline = false): string {
	if (typeof value !== 'string') return '';
	let out = value.replace(CONTROL_CHARS, '').replace(/\r\n?/g, '\n');
	if (!multiline) out = out.replace(/\s+/g, ' ');
	return out.trim().slice(0, max);
}

function phone(value: unknown): string {
	if (typeof value !== 'string') return '';
	return value.replace(/[^\d+()\-\s]/g, '').replace(/\s+/g, ' ').trim().slice(0, MAX.telefone);
}

function digitCount(value: string): number {
	return value.replace(/\D/g, '').length;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function pagePath(value: unknown): string {
	const path = text(value, MAX.pagina);
	return /^\/[a-zA-Z0-9\-_/]*$/.test(path) ? path : '';
}

export function parseLead(input: unknown, now: Date = new Date()): ParseResult {
	if (typeof input !== 'object' || input === null || Array.isArray(input)) {
		return { ok: false, reason: 'invalid', errors: ['corpo'] };
	}
	const data = input as Record<string, unknown>;

	// Campo-armadilha: invisível para pessoas, preenchido por robôs.
	if (typeof data.confirmacao === 'string' && data.confirmacao.trim() !== '') {
		return { ok: false, reason: 'spam' };
	}

	const errors: string[] = [];

	const tipo = LEAD_TYPES.find((t) => t === data.tipo);
	if (!tipo) errors.push('tipo');

	const nome = text(data.nome, MAX.nome);
	if (!nome) errors.push('nome');

	const email = text(data.email, MAX.email);
	if (!EMAIL.test(email)) errors.push('email');

	const telefone = phone(data.telefone);
	const digitos = digitCount(telefone);
	if (digitos < 8 || digitos > 15) errors.push('telefone');

	let assunto = '';
	if (tipo === 'contato') {
		assunto = text(data.assunto, 60);
		if (!ASSUNTOS_CONTATO.includes(assunto)) errors.push('assunto');
	} else if (tipo === 'parceria_estagio') {
		assunto = ASSUNTO_ESTAGIO;
	}

	if (errors.length > 0 || !tipo) return { ok: false, reason: 'invalid', errors };

	const utm: Record<string, string> = {};
	const rawUtm = typeof data.utm === 'object' && data.utm !== null ? (data.utm as Record<string, unknown>) : {};
	for (const key of UTM_KEYS) {
		const value = text(rawUtm[key], MAX.utm);
		if (value) utm[key] = value;
	}

	return {
		ok: true,
		lead: {
			tipo,
			nome,
			email,
			telefone,
			empresa: text(data.empresa, MAX.empresa),
			cargo: text(data.cargo, MAX.cargo),
			assunto,
			mensagem: text(data.mensagem, MAX.mensagem, true),
			pagina: pagePath(data.pagina),
			utm,
			recebidoEm: now.toISOString(),
		},
	};
}
