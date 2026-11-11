# PedDigital Print PWA

Piloto: montar pedido no celular (PWA) e imprimir na **Bematech MP-4200 TH** (ESC/POS), com roteamento **comida → cozinha** e **bebida → bar**.

## Por que tem um agente local?

Navegador/PWA **não abre TCP raw** na porta `9100`.  
Fluxo real:

```
Celular (PWA)  →  HTTP no Mac/agente (mesma Wi‑Fi)  →  ESC/POS 192.168.1.26:9100
```

O repositório no GitHub guarda o código. Para imprimir de verdade, rode o agente na rede do salão.

## Subir

```bash
npm install
npm start
```

No terminal aparece algo como:

- Local: `http://127.0.0.1:8787`
- Rede: `http://SEU_IP_LAN:8787` ← abra no celular (mesma Wi‑Fi)

No PWA: escolha itens → **Enviar e imprimir**.  
Configurações (⚙): IPs da cozinha e do bar (no teste as duas podem ser a mesma Bematech).

## Variáveis

| Env | Default |
|---|---|
| `PORT` | `8787` |
| `PRINTER_KITCHEN_IP` | `192.168.1.26` |
| `PRINTER_BAR_IP` | mesmo da cozinha |
| `PRINTER_PORT` | `9100` |

## Limite honesto

- GitHub Pages / HTTPS sozinho **não** imprime na LAN sem o agente.
- Com 2 impressoras: coloque IPs diferentes em Cozinha e Bar.

## Stack

Node + Express (agente) · HTML/CSS/JS PWA · ESC/POS raw
