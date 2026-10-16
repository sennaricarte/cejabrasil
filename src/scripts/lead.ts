/**
 * Envia o lead do formulário para POST /api/lead, em paralelo ao WhatsApp.
 *
 * - "Disparar e esquecer": falha de rede ou 503 (sem destino configurado) não afetam a pessoa.
 *   O WhatsApp continua sendo o caminho principal, aberto pelo próprio formulário.
 * - keepalive garante o envio mesmo se a página mudar logo depois.
 */

type LeadType = 'contato' | 'parceria_estagio';

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];

export function sendLead(tipo: LeadType, form: HTMLFormElement): void {
	try {
		const data = new FormData(form);
		const field = (...names: string[]): string => {
			for (const name of names) {
				const value = data.get(name);
				if (typeof value === 'string' && value) return value;
			}
			return '';
		};

		const utm: Record<string, string> = {};
		const params = new URLSearchParams(window.location.search);
		for (const key of UTM_KEYS) {
			const value = params.get(key);
			if (value) utm[key] = value.slice(0, 100);
		}

		const payload = {
			tipo,
			nome: field('nome-completo', 'nome'),
			email: field('email-corporativo', 'email'),
			telefone: field('telefone'),
			empresa: field('empresa'),
			cargo: field('cargo'),
			assunto: field('assunto'),
			mensagem: field('mensagem'),
			confirmacao: field('confirmacao'),
			pagina: window.location.pathname,
			utm,
		};

		void fetch('/api/lead', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload),
			keepalive: true,
		}).catch(() => {});
	} catch {
		// Nunca deixar o registro do lead atrapalhar o envio ao WhatsApp.
	}
}
