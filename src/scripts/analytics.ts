/**
 * Eventos de conversão do GA4 (propriedade G-090YEKCVN2).
 *
 * Regras:
 * - Nunca enviar dados pessoais (nome, e-mail, telefone, mensagem).
 * - URLs de link são enviadas sem query string e sem hash.
 * - Fora do domínio de produção o gtag não é configurado (ver Layout.astro),
 *   então estes eventos não geram hits em dev nem em previews da Vercel.
 *
 * Eventos:
 * - click_whatsapp      → clique em qualquer link wa.me
 * - generate_lead       → envio dos formulários de contato e de parceria de estágio
 * - click_doacao        → clique no checkout de doação (Cielo)
 * - click_nfp           → clique no portal da Nota Fiscal Paulista
 * - click_moodle        → clique no acesso ao Moodle (EAD)
 *
 * No GA4 (Admin > Eventos), marque como evento-chave: generate_lead,
 * click_whatsapp, click_doacao.
 */

type EventParams = Record<string, string | number>;

const FORM_LABELS: Record<string, string> = {
	'form-contato-principal': 'contato',
	'form-parceria-estagio': 'parceria_estagio',
};

function track(name: string, params: EventParams = {}): void {
	const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag;
	if (typeof gtag !== 'function') return;
	gtag('event', name, { page_path: window.location.pathname, ...params });
}

function cleanUrl(href: string): string {
	try {
		const url = new URL(href, window.location.origin);
		return `${url.origin}${url.pathname}`;
	} catch {
		return '';
	}
}

function linkParams(link: HTMLAnchorElement): EventParams {
	return {
		link_url: cleanUrl(link.href),
		link_text: (link.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 60),
	};
}

document.addEventListener('click', (event) => {
	const target = event.target;
	if (!(target instanceof Element)) return;
	const link = target.closest('a[href]');
	if (!(link instanceof HTMLAnchorElement)) return;

	const href = link.href;
	if (href.includes('wa.me/')) {
		track('click_whatsapp', linkParams(link));
	} else if (href.includes('cieloecommerce.cielo.com.br')) {
		track('click_doacao', linkParams(link));
	} else if (href.includes('nfp.fazenda.sp.gov.br')) {
		track('click_nfp', linkParams(link));
	} else if (href.includes('ead.cejabrasil.org.br')) {
		track('click_moodle', linkParams(link));
	}
});

document.addEventListener('submit', (event) => {
	const form = event.target;
	if (!(form instanceof HTMLFormElement)) return;
	const formName = FORM_LABELS[form.id];
	if (!formName) return;

	const params: EventParams = { form_name: formName };
	// O "assunto" é uma categoria fixa (select), não um dado pessoal.
	const assunto = form.elements.namedItem('assunto');
	if (assunto instanceof HTMLSelectElement) params.lead_type = assunto.value;

	track('generate_lead', params);
});
