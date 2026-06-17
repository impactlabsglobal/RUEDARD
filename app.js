const $ = (q) => document.querySelector(q);
const $$ = (q) => Array.from(document.querySelectorAll(q));

const DB_KEY = "ruedard_mvp_demo_v2";
const zones = ["Piantini, Santo Domingo", "Aeropuerto Las Americas (AILA)", "Punta Cana", "Santiago", "La Romana", "Gazcue", "Bella Vista"];
const brands = ["Toyota", "Honda", "Hyundai", "Kia", "Nissan", "Mitsubishi", "Chevrolet", "Ford", "Jeep", "BMW", "Mercedes-Benz", "Lexus", "Mazda", "Volkswagen", "Suzuki", "Subaru", "Tesla", "Audi"];
const demoUsers = {
  renter: { id: "u-renter", name: "Juan Perez", email: "juan@email.com", role: "renter", verified: true },
  owner: { id: "u-owner", name: "Evaristo Morales", email: "owner@ruedard.test", role: "owner", verified: true },
  fleet: { id: "u-fleet", name: "Impact Rent Car", email: "fleet@ruedard.test", role: "fleet", verified: true }
};

let db = loadDb();
let session = db.session || null;
let selectedCar = null;
let activeFilter = "all";
let portalRole = "renter";

function seedDb() {
  return {
    users: Object.values(demoUsers),
    cars: [
      carSeed("c1", "u-owner", "Evaristo Morales", "Honda", "CR-V", 2024, "suv2", "Piantini, Santo Domingo", 5, 40, "premium", 4.9),
      carSeed("c2", "u-fleet", "Impact Rent Car", "Toyota", "RAV4", 2024, "suv2", "Aeropuerto Las Americas (AILA)", 5, 45, "premium", 5.0),
      carSeed("c3", "u-fleet", "Impact Rent Car", "Kia", "Sorento 7P", 2023, "suv3", "Punta Cana", 7, 62, "boost", 4.8),
      carSeed("c4", "u-owner", "Evaristo Morales", "BMW", "3 Series", 2022, "luxury", "Bella Vista", 5, 150, "organic", 4.7)
    ],
    bookings: [],
    wallets: { "u-owner": wallet(), "u-fleet": wallet() },
    contracts: [],
    events: [],
    session: null
  };
}

function carSeed(id, ownerId, ownerName, brand, model, year, cat, zone, seats, price, ad, rating) {
  return { id, ownerId, ownerName, brand, model, year, cat, zone, seats, price, ad, rating, status: "approved", photos: [], docs: ["Seguro", "Matricula", "Dueno"] };
}

function wallet() {
  return { available: 0, pending: 0, withdrawn: 0 };
}

function loadDb() {
  try {
    const saved = localStorage.getItem(DB_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  const fresh = seedDb();
  localStorage.setItem(DB_KEY, JSON.stringify(fresh));
  return fresh;
}

function saveDb() {
  db.session = session;
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

function today(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

function user() {
  return session ? db.users.find((u) => u.id === session.userId) : null;
}

function roleLabel(role) {
  return role === "fleet" ? "Empresa rent car" : role === "owner" ? "Socio individual" : "Cliente";
}

function ownerWallet(id) {
  if (!db.wallets[id]) db.wallets[id] = wallet();
  return db.wallets[id];
}

function recordEvent(title, detail, userId = user()?.id || "system") {
  db.events.unshift({ id: `ev-${Date.now()}`, userId, title, detail, at: new Date().toISOString() });
  db.events = db.events.slice(0, 40);
  saveDb();
}

function toast(msg) {
  const t = $("#toast");
  if (!t) return;
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2400);
}

function go(page) {
  $$(".page").forEach((p) => p.classList.remove("active"));
  $(`#page-${page}`)?.classList.add("active");
  $("#drawer")?.classList.remove("open");
  if (page === "search") renderCars();
  if (page === "checkout") renderCheckout();
  if (page === "dashboard") renderDashboard();
  if (page === "wallet") renderWallet();
  if (page === "contracts") renderContracts();
  window.scrollTo(0, 0);
}

function setSession(u) {
  if (!db.users.find((x) => x.id === u.id)) db.users.push(u);
  session = { userId: u.id, at: new Date().toISOString() };
  saveDb();
  recordEvent("Login completado", `Entro como ${roleLabel(u.role)}`, u.id);
  renderChrome();
  toast(`Bienvenido, ${u.name}`);
  go(u.role === "renter" ? "search" : "dashboard");
}

function logout() {
  session = null;
  saveDb();
  renderChrome();
  toast("Sesion cerrada");
  go("home");
}

function renderChrome() {
  const u = user();
  if ($("#authBtn")) $("#authBtn").textContent = u ? "Salir" : "Login";
  if ($("#drawerName")) $("#drawerName").textContent = u ? u.name : "RuedaRD";
  if ($("#drawerRole")) $("#drawerRole").textContent = u ? roleLabel(u.role) : "MVP demo";
}

function bindNav() {
  $$("[data-go]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const page = btn.dataset.go;
      const privatePage = ["add-car", "dashboard", "wallet", "contracts"].includes(page);
      if (privatePage && !user()) {
        toast("Primero entra con una cuenta demo.");
        go("auth");
        return;
      }
      go(page);
    });
  });
  $("#menuBtn")?.addEventListener("click", () => $("#drawer")?.classList.toggle("open"));
  $("#authBtn")?.addEventListener("click", () => user() ? logout() : go("auth"));
  $("#drawerLogout")?.addEventListener("click", logout);
  $("#themeBtn")?.addEventListener("click", () => {
    document.documentElement.dataset.theme = document.documentElement.dataset.theme === "dark" ? "" : "dark";
  });
  $("#langBtn")?.addEventListener("click", () => toast("Traduccion completa se conecta en la proxima fase."));
}

function initForms() {
  ["rentStart"].forEach((id) => { if ($(`#${id}`)) $(`#${id}`).value = today(1); });
  ["rentEnd"].forEach((id) => { if ($(`#${id}`)) $(`#${id}`).value = today(4); });
  ["rentZone", "carZone"].forEach((id) => {
    if ($(`#${id}`)) $(`#${id}`).innerHTML = zones.map((z) => `<option>${z}</option>`).join("");
  });
  if ($("#carBrand")) $("#carBrand").innerHTML = brands.map((b) => `<option>${b}</option>`).join("");

  $$("[data-role-tab]").forEach((btn) => {
    btn.addEventListener("click", () => {
      portalRole = btn.dataset.roleTab;
      $$("[data-role-tab]").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });

  $("#quickSearch")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = $("#portalEmail")?.value.trim();
    const base = portalRole === "fleet" ? demoUsers.fleet : demoUsers.renter;
    setSession({ ...base, email: email || base.email });
  });

  $("#authForm")?.addEventListener("submit", (e) => {
    e.preventDefault();
    setSession({
      id: `u-${Date.now()}`,
      name: $("#authName").value.trim() || "Usuario demo",
      email: $("#authEmail").value.trim() || "demo@ruedard.test",
      role: $("#authRole").value,
      verified: false
    });
  });

  $$("[data-demo]").forEach((btn) => {
    btn.addEventListener("click", () => setSession(demoUsers[btn.dataset.demo] || demoUsers.renter));
  });
  $$(".filters button").forEach((btn) => {
    btn.addEventListener("click", () => {
      activeFilter = btn.dataset.filter;
      $$(".filters button").forEach((b) => b.classList.remove("on"));
      btn.classList.add("on");
      renderCars();
    });
  });
  $("#checkoutForm")?.addEventListener("submit", confirmBooking);
  $("#carForm")?.addEventListener("submit", addCar);
}

function feePrice(car) {
  return Number(car.price) + 10;
}

function daysBetween() {
  const s = new Date($("#rentStart")?.value || today(1));
  const e = new Date($("#rentEnd")?.value || today(4));
  return Math.max(Math.ceil((e - s) / 86400000), 1);
}

function catLabel(cat) {
  return { sedan: "Sedan", suv2: "SUV 2 filas", suv3: "SUV 3 filas", luxury: "Lujo" }[cat] || "Carro";
}

function renderCars() {
  const list = $("#carsList");
  if (!list) return;
  const cars = db.cars
    .filter((c) => c.status === "approved")
    .filter((c) => activeFilter === "all" || c.cat === activeFilter)
    .sort((a, b) => ({ premium: 0, boost: 1, organic: 2 }[a.ad] - { premium: 0, boost: 1, organic: 2 }[b.ad]));
  list.innerHTML = cars.map((car) => `
    <article class="car-card">
      <div class="car-media">
        ${car.ad === "premium" ? '<span class="tag">Premium top</span>' : car.ad === "boost" ? '<span class="tag">Boost</span>' : ""}
        ${car.photos?.[0] ? `<img src="${car.photos[0]}" alt="${car.brand} ${car.model}">` : `<div class="photo-empty"><strong>Foto pendiente</strong><small>Sube fotos reales del vehiculo</small></div>`}
      </div>
      <div class="car-body">
        <div class="car-title">
          <div>
            <h3>${car.brand} ${car.model} ${car.year}</h3>
            <p class="muted">${car.zone} · ${car.ownerName} · ${car.rating || "Nuevo"} estrellas</p>
          </div>
          <div class="price">$${feePrice(car)}</div>
        </div>
        <div class="chips"><span>${catLabel(car.cat)}</span><span>${car.seats} pasajeros</span><span>$${car.price} dueno + $10 fee</span><span>Seguro dueno: basico</span><span>Docs verificados</span></div>
        <div class="car-actions">
          <button class="ghost" type="button" onclick="viewCar('${car.id}')">Ver</button>
          <button class="primary" type="button" onclick="selectCar('${car.id}')">Reservar</button>
        </div>
      </div>
    </article>
  `).join("") || `<div class="card"><h3>No hay carros en este filtro.</h3><p class="muted">Prueba otra categoria.</p></div>`;
}

window.viewCar = (id) => {
  const car = db.cars.find((c) => c.id === id);
  if (car) toast(`${car.brand} ${car.model}: $${feePrice(car)}/dia.`);
};

window.selectCar = (id) => {
  if (!user()) {
    toast("Entra como cliente para reservar.");
    go("auth");
    return;
  }
  selectedCar = db.cars.find((c) => c.id === id);
  go("checkout");
};

function renderCheckout() {
  if (!selectedCar || !$("#checkoutSummary")) return;
  const days = daysBetween();
  const total = feePrice(selectedCar) * days;
  $("#checkoutSummary").innerHTML = `
    <h3>Resumen de renta</h3>
    <div class="line"><span>Vehiculo</span><strong>${selectedCar.brand} ${selectedCar.model}</strong></div>
    <div class="line"><span>Dias</span><strong>${days}</strong></div>
    <div class="line"><span>Precio por dia</span><strong>$${feePrice(selectedCar)}</strong></div>
    <div class="line"><span>Deposito hold</span><strong>$300</strong></div>
    <div class="line"><span>Seguro</span><strong>Elegir</strong></div>
    <div class="line total"><span>Total inicial</span><strong>$${total}</strong></div>
    <p class="mini">El dinero queda pendiente hasta confirmar entrega. RuedaRD toma $10/dia de fee.</p>
  `;
}

function protectionCost() {
  const v = $("#protection")?.value;
  return v === "plus" ? 8 : v === "premium" ? 15 : 0;
}

function confirmBooking(e) {
  e.preventDefault();
  const u = user();
  if (!u || !selectedCar) return toast("Selecciona un carro primero.");
  const days = daysBetween();
  const total = feePrice(selectedCar) * days + protectionCost() * days;
  const platformFee = 10 * days;
  const ownerAmount = selectedCar.price * days;
  const docTiming = document.querySelector('input[name="docTiming"]:checked')?.value || "now";
  const booking = {
    id: `b-${Date.now()}`,
    renterId: u.id,
    renterName: u.name,
    ownerId: selectedCar.ownerId,
    ownerName: selectedCar.ownerName,
    vehicle: `${selectedCar.brand} ${selectedCar.model} ${selectedCar.year}`,
    start: $("#rentStart")?.value || today(1),
    end: $("#rentEnd")?.value || today(4),
    zone: $("#rentZone")?.value || zones[0],
    airline: $("#airline")?.value || "Sin vuelo",
    flightNo: $("#flightNo")?.value.trim() || "",
    payment: $("#paymentMethod")?.value || "Azul demo",
    protection: $("#protection")?.value || "basic",
    clientDocs: docTiming === "delivery" ? "Pendiente para entrega asistida" : "Subidos en checkout demo",
    signature: $("#signature")?.value.trim() || u.name,
    days,
    total,
    platformFee,
    ownerAmount,
    depositHold: 300,
    status: "hold_pending_owner_confirmation",
    paymentStatus: "hold_300_authorized",
    contractStatus: "signed",
    createdAt: new Date().toISOString()
  };
  db.bookings.push(booking);
  ownerWallet(booking.ownerId).pending += ownerAmount;
  db.contracts.push(makeContract(booking));
  selectedCar = null;
  saveDb();
  recordEvent("Reserva creada", `${booking.vehicle} · hold autorizado · contrato firmado`, u.id);
  toast("Renta creada. Contrato listo.");
  go("contracts");
}

function makeContract(b) {
  return {
    id: `ct-${b.id}`,
    bookingId: b.id,
    title: `Contrato ${b.vehicle}`,
    createdAt: new Date().toISOString(),
    text: [
      "CONTRATO DE RENTA RUEDARD MVP",
      `Cliente: ${b.renterName}`,
      `Dueno / Flota: ${b.ownerName}`,
      `Vehiculo: ${b.vehicle}`,
      `Periodo: ${b.start} hasta ${b.end} (${b.days} dias)`,
      `Zona: ${b.zone}`,
      `Vuelo: ${b.airline} ${b.flightNo}`,
      `Pago: ${b.payment}`,
      `Estado pago: ${b.paymentStatus}`,
      `Documentos cliente: ${b.clientDocs}`,
      `Total: $${b.total}`,
      `Hold deposito: $${b.depositHold} no cobrado hasta cierre del trato`,
      `Monto dueno pendiente: $${b.ownerAmount}`,
      `Fee plataforma: $${b.platformFee}`,
      "Politica legal: precio, deposito, seguro, entrega, devolucion, danos y responsabilidad fueron visibles antes de firmar.",
      "Clausulas visibles: no se permiten cargos, restricciones o danos ocultos fuera de este contrato.",
      `Firma cliente: ${b.signature}`
    ].join("\n")
  };
}

function readPhotoFiles(input) {
  const files = Array.from(input?.files || []).slice(0, 4);
  return Promise.all(files.map((file) => new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => resolve("");
    reader.readAsDataURL(file);
  }))).then((items) => items.filter(Boolean));
}

async function addCar(e) {
  e.preventDefault();
  const u = user();
  if (!u) return go("auth");
  if (u.role === "renter") return toast("Cambia a socio o empresa para subir carros.");
  const photos = await readPhotoFiles($("#carPhotos"));
  const car = {
    id: `c-${Date.now()}`,
    ownerId: u.id,
    ownerName: u.name,
    brand: $("#carBrand")?.value || "Toyota",
    model: $("#carModel")?.value.trim() || "Demo",
    year: Number($("#carYear")?.value || 2024),
    cat: $("#carCat")?.value || "sedan",
    zone: $("#carZone")?.value || zones[0],
    seats: Number($("#carSeats")?.value || 5),
    price: Number($("#carPrice")?.value || 40),
    ad: $("#carAd")?.value || "organic",
    status: "approved",
    accountActive: true,
    photos,
    rating: "Nuevo",
    docs: ["Seguro subido", "Matricula/titulo subido", "Dueno/empresa subido"],
    createdAt: new Date().toISOString()
  };
  db.cars.push(car);
  ownerWallet(u.id);
  saveDb();
  recordEvent("Cuenta activada y carro publicado", `${car.brand} ${car.model}`, u.id);
  e.target.reset();
  toast("Carro guardado y visible en el MVP.");
  go("dashboard");
}

function renderDashboard() {
  const u = user();
  if (!u) return go("auth");
  $("#dashRole").textContent = roleLabel(u.role).toUpperCase();
  $("#dashTitle").textContent = u.role === "renter" ? "Panel del cliente" : u.role === "owner" ? "Panel socio individual" : "Panel empresa rent car";
  const myBookings = db.bookings.filter((b) => u.role === "renter" ? b.renterId === u.id : b.ownerId === u.id);
  const myCars = db.cars.filter((c) => c.ownerId === u.id);
  const w = ownerWallet(u.id);
  $("#stats").innerHTML = [["Reservas", myBookings.length], ["Carros", myCars.length], ["Disponible", `$${w.available}`], ["Pendiente", `$${w.pending}`]]
    .map(([k, v]) => `<div class="stat"><span class="muted">${k}</span><strong>${v}</strong></div>`).join("");
  $("#bookingList").innerHTML = myBookings.map(bookingItem).join("") || `<p class="muted">Todavia no hay reservas.</p>`;
  $("#ownerCars").innerHTML = myCars.map(carItem).join("") || `<p class="muted">Todavia no has subido carros.</p>`;
  renderEventLog(u);
}

function bookingItem(b) {
  return `<div class="item">
    <div class="item-head"><strong>${b.vehicle}</strong><span class="badge amber">${b.status === "completed" ? "Completada" : "Hold pendiente"}</span></div>
    <p class="muted">${b.start} → ${b.end} · ${b.zone}</p>
    <p><strong>$${b.total}</strong> total · hold $${b.depositHold}</p>
    <div class="timeline">
      <span class="timeline-step done">Login y seleccion completados</span>
      <span class="timeline-step done">Pago hold autorizado</span>
      <span class="timeline-step done">Documentos: ${b.clientDocs}</span>
      <span class="timeline-step done">Contrato firmado</span>
    </div>
    ${b.status !== "completed" ? `<button class="primary small" onclick="releaseBooking('${b.id}')">Confirmar entrega / liberar dueno</button>` : ""}
  </div>`;
}

function carItem(c) {
  return `<div class="item">
    <div class="item-head"><strong>${c.brand} ${c.model} ${c.year}</strong><span class="badge blue">${c.ad}</span></div>
    <p class="muted">${catLabel(c.cat)} · ${c.zone} · $${c.price} dueno + $10 fee</p>
    <div class="timeline">
      <span class="timeline-step done">Cuenta activa</span>
      <span class="timeline-step done">Documentos del vehiculo registrados</span>
      <span class="timeline-step done">Disponible para reservas</span>
    </div>
  </div>`;
}

function renderEventLog(u) {
  const rows = db.events.filter((ev) => ev.userId === u.id || ev.userId === "system").slice(0, 8);
  $("#eventLog").innerHTML = rows.map((ev) => `<div class="item"><div class="item-head"><strong>${ev.title}</strong><span class="badge green">${new Date(ev.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span></div><p class="muted">${ev.detail}</p></div>`).join("") || `<p class="muted">Cuando uses el MVP, cada paso aparecera aqui.</p>`;
}

window.releaseBooking = (id) => {
  const b = db.bookings.find((x) => x.id === id);
  if (!b || b.status === "completed") return;
  b.status = "completed";
  const w = ownerWallet(b.ownerId);
  w.pending = Math.max(0, w.pending - b.ownerAmount);
  w.available += b.ownerAmount;
  saveDb();
  toast("Dinero liberado al balance del dueno.");
  renderDashboard();
};

function renderWallet() {
  const u = user();
  if (!u) return go("auth");
  const w = ownerWallet(u.id);
  $("#walletPanel").innerHTML = `
    <h3>Wallet demo</h3>
    <div class="wallet-line"><span>Disponible para retirar</span><strong>$${w.available}</strong></div>
    <div class="wallet-line"><span>Pendiente por confirmar</span><strong>$${w.pending}</strong></div>
    <div class="wallet-line"><span>Retirado</span><strong>$${w.withdrawn}</strong></div>
    <button class="primary" onclick="withdrawMoney()">Solicitar retiro demo</button>
    <p class="mini">En produccion esto seria ACH/LBTR a BHD, Popular o Banreservas.</p>
  `;
}

window.withdrawMoney = () => {
  const u = user();
  const w = ownerWallet(u.id);
  if (w.available <= 0) return toast("No hay dinero disponible para retirar.");
  w.withdrawn += w.available;
  w.available = 0;
  saveDb();
  toast("Retiro demo solicitado.");
  renderWallet();
};

function renderContracts() {
  const u = user();
  if (!u) return go("auth");
  const ids = db.bookings.filter((b) => b.renterId === u.id || b.ownerId === u.id).map((b) => b.id);
  const contracts = db.contracts.filter((c) => ids.includes(c.bookingId));
  $("#contractList").innerHTML = contracts.map((c) => `
    <div class="item">
      <div class="item-head"><strong>${c.title}</strong><span class="badge green">PDF demo</span></div>
      <pre style="white-space:pre-wrap;color:var(--muted);font-family:inherit">${c.text}</pre>
      <button class="primary small" onclick="downloadContract('${c.id}')">Descargar contrato .txt</button>
    </div>
  `).join("") || `<p class="muted">No hay contratos todavia. Haz una reserva para generar uno.</p>`;
}

window.downloadContract = (id) => {
  const c = db.contracts.find((x) => x.id === id);
  if (!c) return;
  const blob = new Blob([c.text], { type: "text/plain;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${c.id}.txt`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(a.href);
};

function boot() {
  bindNav();
  initForms();
  renderChrome();
  renderCars();
  if (session && user()) renderDashboard();
}

boot();
