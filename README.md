# PedDigital Print PWA

PWA no celular (mesma Wi‑Fi da impressora) → imprime na **Bematech MP-4200 TH** (ESC/POS), com roteamento **comida → cozinha** e **bebida → bar**.

## Tem como? Sim

O celular **não** fala ESC/POS direto na porta `9100` (limitação do navegador).  
Por isso o Mac (ou um mini-PC/Raspberry no salão) roda este app, que:

1. Serve o **PWA** (ícone na tela inicial)
2. Recebe o pedido do celular
3. Manda ESC/POS para a Bematech na LAN

```
Celular PWA ──HTTPS──► Mac/agente (mesma Wi‑Fi) ──TCP 9100──► Bematech
```

Vercel/nuvem **não** alcança a impressora da casa. Para imprimir de verdade: celular + impressora + agente na **mesma Wi‑Fi**.

## Subir no Mac

```bash
npm install
npm start
```

No terminal:

- `https://SEU_IP:8787` ← abra **no celular**
- Aceite o aviso de certificado (é local, self-signed)
- iPhone: Compartilhar → **Adicionar à Tela de Início**
- Android: menu → **Instalar app** / Adicionar à tela inicial

## Variáveis

| Env | Default |
|---|---|
| `PORT` | `8787` |
| `PRINTER_KITCHEN_IP` | `192.168.1.26` |
| `PRINTER_BAR_IP` | mesmo da cozinha |
| `PRINTER_PORT` | `9100` |

## Repo

https://github.com/ViniciusAutomotikLabs/peddigital-print-pwa
