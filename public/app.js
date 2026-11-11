const MENU = [
  { id: "linguica", name: "Linguiça na chapa com pão", price: 31.99, station: "COZINHA", cat: "comida" },
  { id: "carne", name: "Carne de sol com queijo", price: 43.99, station: "COZINHA", cat: "comida" },
  { id: "pastel", name: "Cestinha com 8 pastéis", price: 27.98, station: "COZINHA", cat: "comida" },
  { id: "calabresa", name: "Calabresa acebolada", price: 13.99, station: "COZINHA", cat: "comida" },
  { id: "chopp", name: "Chopp geladinho", price: 5.99, station: "BAR", cat: "bebida" },
  { id: "drinks", name: "Drinks", price: 21.99, station: "BAR", cat: "bebida" },
];

const state = {
  filter: "all",
  cart: [],
  settings: loadSettings(),
};

const el = {
  menu: document.getElementById("menu"),
  cartList: document.getElementById("cart-list"),
  cartCount: document.getElementById("cart-count"),
  btnSend: document.getElementById("btn-send"),
  status: document.getElementById("status"),
  settings: document.getElementById("settings"),
  kitchenIp: document.getElementById("kitchen-ip"),
  barIp: document.getElementById("bar-ip"),
  agentInfo: document.getElementById("agent-info"),
};

function loadSettings() {
  try {
    return JSON.parse(localStorage.getItem("pd_print_settings") || "{}");
  } catch {
    return {};
  }
}

function saveSettings(next) {
  state.settings = next;
  localStorage.setItem("pd_print_settings", JSON.stringify(next));
}

function money(n) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function setStatus(msg, kind = "") {
  el.status.textContent = msg || "";
  el.status.className = `status ${kind}`.trim();
}

function renderMenu() {
  const items = MENU.filter((i) => state.filter === "all" || i.cat === state.filter);
  el.menu.innerHTML = items
    .map(
      (item) => `
      <article class="card">
        <span class="badge ${item.station === "BAR" ? "bar" : ""}">${item.station === "BAR" ? "Bar" : "Cozinha"}</span>
        <h3>${item.name}</h3>
        <div class="price">${money(item.price)}</div>
        <button type="button" data-add="${item.id}">Adicionar</button>
      </article>`
    )
    .join("");
}

function renderCart() {
  el.cartCount.textContent = String(state.cart.reduce((n, i) => n + i.qty, 0));
  el.btnSend.disabled = state.cart.length === 0;

  if (!state.cart.length) {
    el.cartList.innerHTML = `<li style="color:var(--muted)">Nenhum item ainda.</li>`;
    return;
  }

  el.cartList.innerHTML = state.cart
    .map(
      (item) => `
      <li>
        <span>${item.qty}x ${item.name} <small>(${item.station})</small></span>
        <button type="button" class="rm" data-rm="${item.id}">remover</button>
      </li>`
    )
    .join("");
}

function addItem(id) {
  const product = MENU.find((p) => p.id === id);
  if (!product) return;
  const existing = state.cart.find((c) => c.id === id);
  if (existing) existing.qty += 1;
  else state.cart.push({ ...product, qty: 1 });
  renderCart();
}

function removeItem(id) {
  state.cart = state.cart.filter((c) => c.id !== id);
  renderCart();
}

function splitTickets() {
  const groups = { COZINHA: [], BAR: [] };
  for (const item of state.cart) {
    groups[item.station].push({
      qty: item.qty,
      name: item.name,
    });
  }
  return Object.entries(groups)
    .filter(([, items]) => items.length)
    .map(([station, items]) => ({ station, items }));
}

async function sendOrder() {
  const tickets = splitTickets();
  if (!tickets.length) return;

  setStatus("Imprimindo...");
  el.btnSend.disabled = true;

  const body = {
    mesa: document.getElementById("mesa").value.trim() || "12",
    comanda: document.getElementById("comanda").value.trim() || "T",
    note: document.getElementById("note").value.trim(),
    kitchenIp: state.settings.kitchenIp || el.kitchenIp.value,
    barIp: state.settings.barIp || el.barIp.value,
    tickets,
  };

  try {
    const res = await fetch("/api/print", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error(data.error || "Falha na impressão");

    const stations = data.results.map((r) => r.station).join(" + ");
    setStatus(`Pronto! Impresso: ${stations}`, "ok");
    state.cart = [];
    document.getElementById("note").value = "";
    renderCart();
  } catch (err) {
    setStatus(err.message || String(err), "err");
    el.btnSend.disabled = state.cart.length === 0;
  }
}

async function refreshAgentInfo() {
  try {
    const res = await fetch("/api/health");
    const data = await res.json();
    el.agentInfo.textContent = `Agente OK · LAN ${data.lan} · defaults ${data.defaults.kitchen} / ${data.defaults.bar}`;
    if (!state.settings.kitchenIp) el.kitchenIp.value = data.defaults.kitchen;
    if (!state.settings.barIp) el.barIp.value = data.defaults.bar;
  } catch {
    el.agentInfo.textContent = "Agente offline. Rode npm start no Mac da mesma Wi‑Fi.";
  }
}

document.querySelectorAll(".tab").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    state.filter = btn.dataset.cat;
    renderMenu();
  });
});

el.menu.addEventListener("click", (e) => {
  const id = e.target.closest("[data-add]")?.dataset.add;
  if (id) addItem(id);
});

el.cartList.addEventListener("click", (e) => {
  const id = e.target.closest("[data-rm]")?.dataset.rm;
  if (id) removeItem(id);
});

document.getElementById("btn-send").addEventListener("click", sendOrder);

document.getElementById("btn-settings").addEventListener("click", () => {
  el.kitchenIp.value = state.settings.kitchenIp || "192.168.1.26";
  el.barIp.value = state.settings.barIp || "192.168.1.26";
  refreshAgentInfo();
  el.settings.showModal();
});

document.getElementById("btn-save-settings").addEventListener("click", () => {
  saveSettings({
    kitchenIp: el.kitchenIp.value.trim(),
    barIp: el.barIp.value.trim(),
  });
});

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js").catch(() => {});
}

renderMenu();
renderCart();
refreshAgentInfo();
