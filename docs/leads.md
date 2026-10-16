# Backend de leads

Os formulários de **Contato** e de **Parceria de estágio** enviam o lead para `POST /api/lead`, em paralelo ao WhatsApp. O WhatsApp continua abrindo como sempre. Se o backend falhar, a pessoa não percebe e nenhum lead que já chegava hoje se perde.

## Como funciona

1. `src/scripts/lead.ts` monta o JSON e chama `/api/lead` (sem bloquear o WhatsApp).
2. `api/lead.ts` valida origem, tipo de conteúdo e tamanho. Em seguida chama `lib/leads/validate.ts`.
3. `lib/leads/sinks.ts` entrega o lead a **todos os destinos configurados**. Basta um aceitar para o envio contar como sucesso.

Sem nenhum destino configurado, o endpoint responde `503 not_configured`. É o estado atual até o cliente escolher.

## Escolher o destino (só configuração, sem mudar código)

| Destino | Variáveis | Quando usar |
|---|---|---|
| E-mail (Resend) | `RESEND_API_KEY`, `LEADS_EMAIL_TO`, `LEADS_EMAIL_FROM` | Equipe quer receber cada lead na caixa de entrada. |
| Webhook | `LEADS_WEBHOOK_URL` (+ `LEADS_WEBHOOK_SECRET`) | Planilha Google, Zapier, Make, n8n. |

Pode ativar os dois ao mesmo tempo. Depois de definir as variáveis, faça um novo deploy.

### E-mail (Resend)
1. Criar conta em resend.com e verificar o domínio `cejabrasil.org.br` (registros DNS).
2. Criar uma API key e definir as três variáveis na Vercel.
3. O e-mail chega em texto puro, com `Reply-To` apontando para o e-mail do lead.

### Planilha Google (Apps Script)
1. Crie uma planilha com uma aba chamada `Leads`.
2. Extensões > Apps Script e cole o código abaixo, trocando o segredo.
3. Implantar > Nova implantação > App da Web (executar como você; acesso: qualquer pessoa).
4. Defina `LEADS_WEBHOOK_URL` como a URL gerada **mais** `?secret=SEU_SEGREDO`.

```js
const SEGREDO = 'troque-por-um-valor-longo-e-aleatorio';

// Evita que textos iniciados por = + - @ virem fórmulas na planilha.
const seguro = (v) => (/^[=+\-@]/.test(String(v)) ? "'" + v : v);

function doPost(e) {
  if (e.parameter.secret !== SEGREDO) {
    return ContentService.createTextOutput('forbidden');
  }
  const lead = JSON.parse(e.postData.contents);
  SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Leads').appendRow([
    lead.recebidoEm, lead.tipo, lead.nome, lead.email, lead.telefone,
    lead.empresa, lead.cargo, lead.assunto, lead.mensagem, lead.pagina,
    JSON.stringify(lead.utm),
  ].map(seguro));
  return ContentService.createTextOutput('ok');
}
```

## Campos enviados

`tipo` (`contato` ou `parceria_estagio`), `nome`, `email`, `telefone`, `empresa`, `cargo`, `assunto`, `mensagem`, `pagina` (caminho de origem), `utm` (parâmetros de campanha da URL) e `recebidoEm` (gerado no servidor, ISO 8601).

## Proteções

- Só aceita `POST` com JSON, de `cejabrasil.org.br` e `www` (mais as origens de `LEADS_ALLOWED_ORIGINS`).
- Campo-armadilha `confirmacao`: se vier preenchido, responde sucesso e **não entrega**.
- Limites de tamanho por campo, remoção de caracteres de controle e nome em linha única (evita injeção de cabeçalho no e-mail).
- Os logs nunca incluem dados pessoais nem segredos: só o nome do destino que falhou.
- O IP não é guardado.

## Limitações conhecidas

- Não há limite de requisições por IP (função sem estado). Se houver abuso, ativar o Vercel Firewall (rate limit).
- Não há fila nem nova tentativa: se todos os destinos falharem, o lead fica só no WhatsApp.
- Testar em produção ou em um preview exige o preview na lista `LEADS_ALLOWED_ORIGINS`.

## LGPD

Gravar leads trata dados pessoais. A [Política de Privacidade](/politica-de-privacidade) descreve esse registro de forma genérica. Quando o destino for escolhido, revisar o texto e definir por quanto tempo os leads serão guardados.
