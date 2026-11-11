"use strict";

const ESC = Buffer.from([0x1b]);
const GS = Buffer.from([0x1d]);

function enc(str) {
  return Buffer.from(String(str), "latin1");
}

function center(on = true) {
  return Buffer.concat([ESC, Buffer.from([0x61, on ? 0x01 : 0x00])]);
}

function bold(on = true) {
  return Buffer.concat([ESC, Buffer.from([0x45, on ? 0x01 : 0x00])]);
}

function size(doubleW = false, doubleH = false) {
  const n = (doubleW ? 0x20 : 0) | (doubleH ? 0x10 : 0);
  return Buffer.concat([ESC, Buffer.from([0x21, n])]);
}

function line(text = "") {
  return enc(`${text}\n`);
}

function hr() {
  return line("--------------------------------");
}

function feed(n = 3) {
  return Buffer.concat([ESC, Buffer.from([0x64, n])]);
}

function cut() {
  return Buffer.concat([GS, Buffer.from([0x56, 0x00])]);
}

/**
 * @param {{ station: string, mesa?: string, comanda?: string, items: {qty:number,name:string,note?:string}[], note?: string }} ticket
 */
function buildTicket(ticket) {
  const when = new Date().toLocaleString("pt-BR", { hour12: false });
  const parts = [
    Buffer.concat([ESC, Buffer.from([0x40])]), // init
    center(true),
    size(true, true),
    bold(true),
    line("PedDigital"),
    size(false, false),
    bold(false),
    line(String(ticket.station || "COZINHA").toUpperCase()),
    hr(),
    center(false),
    line(`Data: ${when}`),
  ];

  if (ticket.mesa) parts.push(line(`Mesa: ${ticket.mesa}`));
  if (ticket.comanda) parts.push(line(`Comanda: ${ticket.comanda}`));
  parts.push(hr());

  for (const item of ticket.items || []) {
    const qty = Number(item.qty) || 1;
    parts.push(bold(true), line(`${qty}x  ${item.name}`), bold(false));
    if (item.note) parts.push(line(`   Obs: ${item.note}`));
  }

  if (ticket.note) {
    parts.push(hr(), line(`Obs geral: ${ticket.note}`));
  }

  parts.push(
    hr(),
    center(true),
    line("Pedido via PWA"),
    feed(4),
    cut()
  );

  return Buffer.concat(parts);
}

module.exports = { buildTicket };
