# Webhook SEC — Integração n8n

## Endpoint

POST /api/sec/webhook/n8n

## Autenticação

Header obrigatório:
  Authorization: Bearer {N8N_WEBHOOK_SECRET}

O valor de N8N_WEBHOOK_SECRET deve ser configurado:
- Na Vercel: Settings → Environment Variables → N8N_WEBHOOK_SECRET
- No n8n: armazenar como credential do tipo "Header Auth" e referenciar no nó HTTP Request

## Eventos suportados

### offboarding_iniciado
Disparar quando um offboarding é criado no SAC.
Efeito no SEC: alocações ativas do funcionário mudam para status "pendente".

Payload:
```json
{
  "evento": "offboarding_iniciado",
  "funcionario_id": "string (obrigatório)",
  "funcionario_nome": "string (obrigatório)",
  "funcionario_email": "string (obrigatório)",
  "data_desligamento": "YYYY-MM-DD (opcional)",
  "offboarding_id": "string (opcional, para rastreabilidade)",
  "origem": "string (opcional, ex: n8n-flow-offboarding-v1)"
}
```

### offboarding_concluido
Disparar quando um offboarding é marcado como concluído no SAC.
Efeito no SEC: registra auditoria; devolução física deve ser confirmada manualmente pela TI.

Payload:
```json
{
  "evento": "offboarding_concluido",
  "funcionario_id": "string (obrigatório)",
  "funcionario_nome": "string (opcional)",
  "funcionario_email": "string (opcional)",
  "offboarding_id": "string (opcional)"
}
```

## Resposta de sucesso (200)

```json
{ "processado": true, "alocacoes_afetadas": 2, "funcionario_id": "u123" }
```

## Códigos de erro

| Código | Motivo |
|--------|--------|
| 401    | Authorization header ausente ou secret inválido |
| 400    | Campos obrigatórios ausentes no payload |
| 500    | Erro interno — verificar logs da Vercel |

## Configuração no n8n (passo a passo resumido)

1. Criar credential: HTTP Header Auth
   - Name: SEC Webhook Secret
   - Name (header): Authorization
   - Value: Bearer {N8N_WEBHOOK_SECRET}

2. Nó trigger: Webhook (no n8n) — escuta evento do SAC
   OU nó de polling na aba offboardings do Google Sheets SAC

3. Nó HTTP Request:
   - Method: POST
   - URL: https://sac-steel-six.vercel.app/api/sec/webhook/n8n
   - Authentication: Header Auth → SEC Webhook Secret
   - Body: JSON com payload conforme evento

4. Nó IF: verificar campo "processado" === true na resposta
