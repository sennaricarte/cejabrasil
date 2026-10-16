/**
 * POST /api/lead — recebe os leads dos formulários e entrega aos destinos configurados.
 * Vercel Function (Node.js, Web Standard fetch handler). Veja docs/leads.md.
 *
 * Princípios:
 * - Sem destino configurado, responde 503 (o front segue abrindo o WhatsApp como antes).
 * - Nunca registra dados pessoais nos logs.
 * - Sucesso se pelo menos um destino aceitar o lead.
 */

import { configuredSinks } from '../lib/leads/sinks';
import { parseLead } from '../lib/leads/validate';

const PROD_ORIGINS = ['https://cejabrasil.org.br', 'https://www.cejabrasil.org.br'];
const MAX_BODY_CHARS = 10_000;

function allowedOrigins(): string[] {
	const extra = (process.env.LEADS_ALLOWED_ORIGINS ?? '')
		.split(',')
		.map((origin) => origin.trim())
		.filter(Boolean);
	return [...PROD_ORIGINS, ...extra];
}

function json(body: Record<string, unknown>, status: number, headers: Record<string, string> = {}): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers },
	});
}

export default {
	async fetch(request: Request): Promise<Response> {
		if (request.method !== 'POST') {
			return json({ ok: false, error: 'method_not_allowed' }, 405, { Allow: 'POST' });
		}

		const origin = request.headers.get('origin');
		if (!origin || !allowedOrigins().includes(origin)) {
			return json({ ok: false, error: 'forbidden_origin' }, 403);
		}

		if (!(request.headers.get('content-type') ?? '').includes('application/json')) {
			return json({ ok: false, error: 'unsupported_media_type' }, 415);
		}

		const raw = await request.text();
		if (raw.length > MAX_BODY_CHARS) return json({ ok: false, error: 'payload_too_large' }, 413);

		let payload: unknown;
		try {
			payload = JSON.parse(raw);
		} catch {
			return json({ ok: false, error: 'invalid_json' }, 400);
		}

		const parsed = parseLead(payload);
		if (!parsed.ok) {
			// Robôs recebem sucesso para não saberem que foram barrados.
			if (parsed.reason === 'spam') return json({ ok: true }, 200);
			return json({ ok: false, error: 'invalid', fields: parsed.errors }, 422);
		}

		const sinks = configuredSinks(process.env);
		if (sinks.length === 0) {
			console.error('[leads] nenhum destino configurado');
			return json({ ok: false, error: 'not_configured' }, 503);
		}

		const results = await Promise.allSettled(sinks.map((sink) => sink.send(parsed.lead)));
		results.forEach((result, index) => {
			if (result.status === 'rejected') {
				// Só o nome do destino e o tipo do erro: nada do conteúdo do lead.
				const kind = result.reason instanceof Error ? result.reason.name : 'erro';
				console.error(`[leads] falha no destino ${sinks[index]?.name}: ${kind}`);
			}
		});

		if (results.some((result) => result.status === 'fulfilled')) return json({ ok: true }, 200);
		return json({ ok: false, error: 'delivery_failed' }, 502);
	},
};
