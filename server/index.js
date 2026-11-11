"use strict";

const path = require("path");
const net = require("net");
const os = require("os");
const express = require("express");
const cors = require("cors");
const { buildTicket } = require("./escpos");

const PORT = Number(process.env.PORT) || 8787;
const DEFAULT_KITCHEN = process.env.PRINTER_KITCHEN_IP || "192.168.1.26";
const DEFAULT_BAR = process.env.PRINTER_BAR_IP || process.env.PRINTER_KITCHEN_IP || "192.168.1.26";
const PRINTER_PORT = Number(process.env.PRINTER_PORT) || 9100;

const app = express();
app.use(cors());
app.use(express.json({ limit: "256kb" }));
app.use(express.static(path.join(__dirname, "..", "public")));

function lanIPv4() {
  const nets = os.networkInterfaces();
  for (const list of Object.values(nets)) {
    for (const netInfo of list || []) {
      if (netInfo.family === "IPv4" && !netInfo.internal) return netInfo.address;
    }
  }
  return "127.0.0.1";
}

function sendRaw(host, port, buffer) {
  return new Promise((resolve, reject) => {
    const socket = net.connect({ host, port }, () => {
      socket.write(buffer, (err) => {
        if (err) {
          socket.destroy();
          reject(err);
          return;
        }
        socket.end();
        resolve({ bytes: buffer.length, host, port });
      });
    });
    socket.setTimeout(5000);
    socket.on("timeout", () => {
      socket.destroy();
      reject(new Error(`Timeout ao conectar em ${host}:${port}`));
    });
    socket.on("error", reject);
  });
}

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    lan: lanIPv4(),
    defaults: {
      kitchen: DEFAULT_KITCHEN,
      bar: DEFAULT_BAR,
      port: PRINTER_PORT,
    },
  });
});

/**
 * Body:
 * {
 *   mesa, comanda, note,
 *   kitchenIp?, barIp?,
 *   tickets: [{ station: 'COZINHA'|'BAR', items: [{qty,name,note}] }]
 * }
 */
app.post("/api/print", async (req, res) => {
  try {
    const {
      mesa = "12",
      comanda = "T",
      note = "",
      kitchenIp = DEFAULT_KITCHEN,
      barIp = DEFAULT_BAR,
      tickets = [],
    } = req.body || {};

    if (!Array.isArray(tickets) || tickets.length === 0) {
      res.status(400).json({ ok: false, error: "Nenhum ticket para imprimir" });
      return;
    }

    const results = [];
    for (const ticket of tickets) {
      const station = String(ticket.station || "COZINHA").toUpperCase();
      const host = station === "BAR" ? barIp : kitchenIp;
      const payload = buildTicket({
        station,
        mesa,
        comanda,
        note,
        items: ticket.items || [],
      });
      const out = await sendRaw(host, PRINTER_PORT, payload);
      results.push({ station, ...out });
    }

    res.json({ ok: true, results });
  } catch (err) {
    res.status(500).json({
      ok: false,
      error: err.message || String(err),
    });
  }
});

app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  const ip = lanIPv4();
  console.log(`PedDigital Print PWA`);
  console.log(`  Local:  http://127.0.0.1:${PORT}`);
  console.log(`  Rede:   http://${ip}:${PORT}  ← abra no celular (mesma Wi‑Fi)`);
  console.log(`  Cozinha default: ${DEFAULT_KITCHEN}:${PRINTER_PORT}`);
  console.log(`  Bar default:     ${DEFAULT_BAR}:${PRINTER_PORT}`);
});
