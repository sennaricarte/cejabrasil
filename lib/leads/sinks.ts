/**
 * Destinos dos leads. Cada destino só fica ativo se as suas variáveis de ambiente
 * estiverem definidas. Vários podem estar ativos ao mesmo tempo.
 *
 * - E-mail (Resend):  RESEND_API_KEY, LEADS_EMAIL_TO, LEADS_EMAIL_FROM
 * - Webhook:          LEADS_WEBHOOK_URL (+ LEADS_WEBHOOK_SECRET, opcional)
 *   Serve para Google Sheets (Apps Script), Zapier, Make, n8n etc.
 *
 * Veja docs/leads.md.
 */

import type { Lead } from './validate';

export interface SinkEnv {
	RESEND_API_KEY?: string;
	LEADS_EMAIL_TO?: string;
	LEADS_EMAIL_FROM?: string;
	LEADS_WEBHOOK_URL?: string;
	LEADS_WEBHOOK_SECRET?: string;
}

export interface Sink {
	name: string;
	send: (lead: Lead) => Promise<void>;
}

const TIMEOUT_MS = 8000;

const TIPO_LABEL: Record<Lead['tipo'], string> = {
	contato: 'Contato',
	parceria_estagio: 'Parceria de estágio',
};

function emailText(lead: Lead): string {
	const linhas = [
		`Tipo: ${TIPO_LABEL[lead.tipo]}`,
		`Assunto: ${lead.assunto}`,
		`Nome: ${lead.nome}`,
		`E-mail: ${lead.email}`,
		`Telefone: ${lead.telefone}`,
		`Empresa/Instituição: ${lead.empresa || '-'}`,
		`Cargo: ${lead.cargo || '-'}`,
		`Página de origem: ${lead.pagina || '-'}`,
		`Recebido em: ${lead.recebidoEm}`,
	];
	if (Object.keys(lead.utm).length > 0) {
		linhas.push(`Campanha: ${JSON.stringify(lead.utm)}`);
	}
	linhas.push('', 'Mensagem:', lead.mensagem || '-');
	return linhas.join('\n');
}

function resendSink(env: SinkEnv, fetchImpl: typeof fetch): Sink | null {
	const { RESEND_API_KEY: apiKey, LEADS_EMAIL_TO: to, LEADS_EMAIL_FROM: from } = env;
	if (!apiKey || !to || !from) return null;
	const recipients = to
		.split(',')
		.map((address) => address.trim())
		.filter(Boolean);
	if (recipients.length === 0) return null;

	return {
		name: 'email',
		async send(lead) {
			const response = await fetchImpl('https://api.resend.com/emails', {
				method: 'POST',
				headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
				body: JSON.stringify({
					from,
					to: recipients,
					reply_to: lead.email,
					// O nome já vem em linha única (sem quebras), o que evita injeção de cabeçalho.
					subject: `Novo lead (${TIPO_LABEL[lead.tipo]}): ${lead.nome}`,
					text: emailText(lead),
				}),
				signal: AbortSignal.timeout(TIMEOUT_MS),
			});
			if (!response.ok) throw new Error(`resend respondeu ${response.status}`);
		},
	};
}

function webhookSink(env: SinkEnv, fetchImpl: typeof fetch): Sink | null {
	const { LEADS_WEBHOOK_URL: url, LEADS_WEBHOOK_SECRET: secret } = env;
	if (!url) return null;

	return {
		name: 'webhook',
		async send(lead) {
			const headers: Record<string, string> = { 'Content-Type': 'application/json' };
			if (secret) headers['X-Webhook-Secret'] = secret;
			const response = await fetchImpl(url, {
				method: 'POST',
				headers,
				body: JSON.stringify(lead),
				signal: AbortSignal.timeout(TIMEOUT_MS),
			});
			if (!response.ok) throw new Error(`webhook respondeu ${response.status}`);
		},
	};
}

export function configuredSinks(env: SinkEnv, fetchImpl: typeof fetch = fetch): Sink[] {
	return [resendSink(env, fetchImpl), webhookSink(env, fetchImpl)].filter((s): s is Sink => s !== null);
}
