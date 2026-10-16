/**
 * Consentimento de cookies de análise (GA4).
 *
 * - A escolha fica em localStorage ('ceja-cookie-consent' = 'granted' | 'denied').
 * - Sem escolha registrada, o aviso aparece e nada é enviado ao Google.
 * - O carregador do GA4 (window.cejaAnalytics) é definido no <head> do Layout.
 * - Qualquer elemento com [data-cookie-preferences] reabre o aviso.
 */

const KEY = 'ceja-cookie-consent';

type Choice = 'granted' | 'denied';

type CejaAnalytics = { enable: () => void; disable: () => void };

function analytics(): CejaAnalytics | undefined {
	return (window as unknown as { cejaAnalytics?: CejaAnalytics }).cejaAnalytics;
}

function readChoice(): Choice | null {
	try {
		const value = window.localStorage.getItem(KEY);
		return value === 'granted' || value === 'denied' ? value : null;
	} catch {
		return null;
	}
}

function saveChoice(choice: Choice): void {
	try {
		window.localStorage.setItem(KEY, choice);
	} catch {
		// Sem armazenamento (ex.: janela privada): a escolha vale só nesta página.
	}
}

const banner = document.getElementById('cookie-banner');

function show(): void {
	if (banner) banner.hidden = false;
}

function hide(): void {
	if (banner) banner.hidden = true;
}

function choose(choice: Choice): void {
	saveChoice(choice);
	if (choice === 'granted') analytics()?.enable();
	else analytics()?.disable();
	hide();
}

document.addEventListener('click', (event) => {
	const target = event.target;
	if (!(target instanceof Element)) return;

	if (target.closest('[data-cookie-accept]')) choose('granted');
	else if (target.closest('[data-cookie-decline]')) choose('denied');
	else if (target.closest('[data-cookie-preferences]')) show();
});

if (readChoice() === null) show();
