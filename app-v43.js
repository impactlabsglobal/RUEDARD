const $ = (q) => document.querySelector(q);
const $$ = (q) => Array.from(document.querySelectorAll(q));

const DB_KEY = "ruedard_mvp_demo_v1";
const zones = [
  "Piantini, Santo Domingo",
  "Aeropuerto Las Américas (AILA)",
  "Punta Cana",
  "Santiago",
  "La Romana",
  "Gazcue",
  "Bella Vista"
];
const brands = [
  "Toyota","Honda","Hyundai","Kia","Nissan","Mitsubishi","Chevrolet","Ford","Jeep","BMW","Mercedes-Benz","Lexus","Mazda","Volkswagen","Suzuki","Subaru","Tesla","Audi"
];
const demoUsers = {
  renter: { id:"u-renter", name:"Juan Pérez", email:"juan@email.com", role:"renter", verified:true },
  owner: { id:"u-owner", name:"Evaristo Morales", email:"owner@ruedard.test", role:"owner", verified:true },
  fleet: { id:"u-fleet", name:"Impact Rent Car", email:"fleet@ruedard.test", role:"fleet", verified:true }
};

let db = loadDb();
let session = db.session || null;
let selectedCar = null;
let activeFilter = "all";

function today(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

function seedDb() {
  return {
    users: Object.values(demoUsers),
    cars: [
      { id:"c1", ownerId:"u-owner", ownerName:"Evaristo Morales", brand:"Honda", model:"CR-V", year:2024, cat:"suv2", zone:"Piantini, Santo Domingo", seats:5, price:40, ad:"premium", status:"approved", docs:["Seguro","Matrícula","Dueño"], photos:[], rating:4.9 },
      { id:"c2", ownerId:"u-fleet", ownerName:"Impact Rent Car", brand:"Toyota", model:"RAV4", year:2024, cat:"suv2", zone:"Aeropuerto Las Américas (AILA)", seats:5, price:45, ad:"premium", status:"approved", docs:["Seguro","Matrícula","Empresa"], photos:[], rating:5.0 },
      { id:"c3", ownerId:"u-fleet", ownerName:"Impact Rent Car", brand:"Kia", model:"Sorento 7P", year:2023, cat:"suv3", zone:"Punta Cana", seats:7, price:62, ad:"boost", status:"approved", docs:["Seguro","Matrícula","Empresa"], photos:[], rating:4.8 },
      { id:"c4", ownerId:"u-owner", ownerName:"Evaristo Morales", brand:"BMW", model:"3 Series", year:2022, cat:"luxury", zone:"Bella Vista", seats:5, price:150, ad:"organic", status:"approved", docs:["Seguro","Matrícula","Dueño"], photos:[], rating:4.7 }
    ],
    bookings: [],
    wallets: {
      "u-owner": { available: 0, pending: 0, withdrawn: 0 },
      "u-fleet": { available: 0, pending: 0, withdrawn: 0 }
    },
    contracts: [],
    session: null
  };
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

function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2400);
}

function user() {
  return session ? db.users.find((u) => u.id === session.userId) : null;
}

function ownerWallet(id) {
  if (!db.wallets[id]) db.wallets[id] = { available: 0, pending: 0, withdrawn: 0 };
  return db.wallets[id];
}

function roleLabel(role) {
  return role === "fleet" ? "Empresa rent car" : role === "owner" ? "Socio individual" : "Cliente";
}

function go(page) {
  $$(".page").forEach((p) => p.classList.remove("active"));
  const target = $(`#page-${page}`);
  if (target) target.classList.add("active");
  $("#drawer").classList.remove("open");
  if (page === "search") renderCars();
  if (page === "dashboard") renderDashboard();
  if (page === "wallet") renderWallet();
  if (page === "contracts") renderContracts();
  window.scrollTo(0, 0);
}

function bindNav() {
  $$("[data-go]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const page = btn.dataset.go;
      if ((page === "add-car" || page === "dashboard" || page === "wallet" || page === "contracts") && !user()) {
        toast("Primero entra con una cuenta demo.");
        go("auth");
        return;
      }
      go(page);
    });
  });
  $("#menuBtn").addEventListener("click", () => $("#drawer").classList.toggle("open"));
  $("#authBtn").addEventListener("click", () => user() ? logout() : go("auth"));
  $("#drawerLogout").addEventListener("click", logout);
  $("#themeBtn").addEventListener("click", () => {
    document.documentElement.dataset.theme = document.documentElement.dataset.theme === "dark" ? "" : "dark";
  });
  $("#langBtn").addEventListener("click", () => toast("Traducción completa se conecta en la próxima fase."));
}

function setSession(u) {
  if (!db.users.find((x) => x.id === u.id)) db.users.push(u);
  session = { userId: u.id, at: new Date().toISOString() };
  saveDb();
  renderChrome();
  toast(`Bienvenido, ${u.name}`);
  go("dashboard");
}

function logout() {
  session = null;
  saveDb();
  renderChrome();
  toast("Sesión cerrada");
  go("home");
}

function renderChrome() {
  const u = user();
  $("#authBtn").textContent = u ? "Salir" : "Login";
  $("#drawerName").textContent = u ? u.name : "RuedaRD";
  $("#drawerRole").textContent = u ? roleLabel(u.role) : "MVP demo";
}

function initForms() {
  const dateInputs = ["quickStart", "rentStart"];
  const endInputs = ["quickEnd", "rentEnd"];
  dateInputs.forEach((id) => { const el = $(`#${id}`); if (el) el.value = today(1); });
  endInputs.forEach((id) => { const el = $(`#${id}`); if (el) el.value = today(4); });
  ["rentZone", "carZone"].forEach((id) => {
    const el = $(`#${id}`);
    if (el) el.innerHTML = zones.map((z) => `<option>${z}</option>`).join("");
  });
  $("#carBrand").innerHTML = brands.map((b) => `<option>${b}</option>`).join("");

  $("#quickSearch").addEventListener("submit", (e) => {
    e.preventDefault();
    $("#rentZone").value = $("#quickZone").value;
    $("#rentStart").value = $("#quickStart").value;
    $("#rentEnd").value = $("#quickEnd").value;
    go("search");
  });

  $("#authForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const id = `u-${Date.now()}`;
    setSession({
      id,
      name: $("#authName").value.trim(),
      email: $("#authEmail").value.trim(),
      role: $("#authRole").value,
      verified: false
    });
  });

  $$("[data-demo]").forEach((btn) => btn.addEventListener("click", () => setSession(demoUsers[btn.dataset.demo])));

  $("#carForm").addEventListener("submit", addCar);
  $("#checkoutForm").addEventListener("submit", confirmBooking);
  $$(".filters button").forEach((btn) => {
    btn.addEventListener("click", () => {
      activeFilter = btn.dataset.filter;
      $$(".filters button").forEach((b) => b.classList.remove("on"));
      btn.classList.add("on");
      renderCars();
    });
  });
}

function feePrice(car) {
  return Number(car.price) + 10;
}

function daysBetween() {
  const s = new Date($("#rentStart").value || today(1));
  const e = new Date($("#rentEnd").value || today(4));
  const days = Math.ceil((e - s) / 86400000);
  return Math.max(days, 1);
}

function renderCars() {
  const list = $("#carsList");
  const cars = db.cars
    .filter((c) => c.status === "approved")
    .filter((c) => activeFilter === "all" || c.cat === activeFilter)
    .sort((a, b) => ({ premium:0, boost:1, organic:2 }[a.ad] - { premium:0, boost:1, organic:2 }[b.ad]));
  list.innerHTML = cars.map((car) => `
    <article class="car-card">
      <div class="car-media">
        ${car.ad === "premium" ? '<span class="tag">Premium top</span>' : car.ad === "boost" ? '<span class="tag">Boost</span>' : ""}
        ${car.photos && car.photos[0] ? `<img src="${car.photos[0]}" alt="${car.brand} ${car.model}">` : `<div class="photo-empty"><strong>Foto pendiente</strong><small>Sube fotos reales del vehículo</small></div>`}
      </div>
      <div class="car-body">
        <div class="car-title">
          <div>
            <h3>${car.brand} ${car.model} ${car.year}</h3>
            <p class="muted">📍 ${car.zone} · ${car.ownerName} · ⭐ ${car.rating || "Nuevo"}</p>
          </div>
          <div class="price">$${feePrice(car)}</div>
        </div>
        <div class="chips"><span>${catLabel(car.cat)}</span><span>${car.seats} pasajeros</span><span>$${car.price} dueño + $10 fee</span><span>Docs verificados</span></div>
        <div class="car-actions">
          <button class="ghost" type="button" onclick="viewCar('${car.id}')">Ver</button>
          <button class="primary" type="button" onclick="selectCar('${car.id}')">Reservar</button>
        </div>
      </div>
    </article>
  `).join("") || `<div class="card"><h3>No hay carros en este filtro.</h3><p class="muted">Prueba otra categoría o sube un carro nuevo.</p></div>`;
}

function catLabel(cat) {
  return { sedan:"Sedan", suv2:"SUV 2 filas", suv3:"SUV 3 filas", luxury:"Lujo" }[cat] || "Carro";
}

window.viewCar = (id) => {
  const car = db.cars.find((c) => c.id === id);
  toast(`${car.brand} ${car.model}: $${feePrice(car)}/día, seguro se elige después.`);
};

window.selectCar = (id) => {
  if (!user()) {
    toast("Entra como cliente para reservar.");
    go("auth");
    return;
  }
  selectedCar = db.cars.find((c) => c.id === id);
  renderCheckout();
  go("checkout");
};

function renderCheckout() {
  const car = selectedCar;
  if (!car) return;
  const days = daysBetween();
  const subtotal = feePrice(car) * days;
  $("#checkoutSummary").innerHTML = `
    <h3>Resumen de renta</h3>
    <div class="line"><span>Vehículo</span><strong>${car.brand} ${car.model}</strong></div>
    <div class="line"><span>Días</span><strong>${days}</strong></div>
    <div class="line"><span>Precio por día</span><strong>$${feePrice(car)}</strong></div>
    <div class="line"><span>Depósito hold</span><strong>$300</strong></div>
    <div class="line"><span>Seguro</span><strong>Elegir</strong></div>
    <div class="line total"><span>Total inicial</span><strong>$${subtotal}</strong></div>
    <p class="mini">El dinero queda pendiente hasta confirmar entrega. RuedaRD toma $10/día de fee.</p>
  `;
}

function protectionCost() {
  const v = $("#protection").value;
  return v === "plus" ? 8 : v === "premium" ? 15 : 0;
}

function confirmBooking(e) {
  e.preventDefault();
  const u = user();
  if (!u || !selectedCar) return;
  const days = daysBetween();
  const daily = feePrice(selectedCar);
  const insurance = protectionCost() * days;
  const total = daily * days + insurance;
  const platformFee = 10 * days;
  const ownerAmount = selectedCar.price * days;
  const booking = {
    id:`b-${Date.now()}`,
    renterId:u.id,
    renterName:u.name,
    ownerId:selectedCar.ownerId,
    ownerName:selectedCar.ownerName,
    carId:selectedCar.id,
    vehicle:`${selectedCar.brand} ${selectedCar.model} ${selectedCar.year}`,
    start:$("#rentStart").value,
    end:$("#rentEnd").value,
    zone:$("#rentZone").value,
    airline:$("#airline").value,
    flightNo:$("#flightNo").value.trim(),
    payment:$("#paymentMethod").value,
    protection:$("#protection").value,
    signature:$("#signature").value.trim(),
    days,total,platformFee,ownerAmount,
    depositHold:300,
    status:"hold_pending_owner_confirmation",
    createdAt:new Date().toISOString()
  };
  db.bookings.push(booking);
  ownerWallet(selectedCar.ownerId).pending += ownerAmount;
  db.contracts.push(makeContract(booking));
  saveDb();
  selectedCar = null;
  toast("Renta creada. Contrato listo.");
  go("contracts");
}

function makeContract(b) {
  return {
    id:`ct-${b.id}`,
    bookingId:b.id,
    title:`Contrato ${b.vehicle}`,
    createdAt:new Date().toISOString(),
    text:[
      "CONTRATO DE RENTA RUEDARD MVP",
      `Cliente: ${b.renterName}`,
      `Dueño / Flota: ${b.ownerName}`,
      `Vehículo: ${b.vehicle}`,
      `Periodo: ${b.start} hasta ${b.end} (${b.days} días)`,
      `Zona: ${b.zone}`,
      `Vuelo: ${b.airline} ${b.flightNo || ""}`,
      `Pago: ${b.payment}`,
      `Total: $${b.total}`,
      `Hold depósito: $${b.depositHold} no cobrado hasta cierre del trato`,
      `Monto dueño pendiente: $${b.ownerAmount}`,
      `Fee plataforma: $${b.platformFee}`,
      "Cláusulas visibles: no se permiten cargos, restricciones o daños ocultos fuera de este contrato.",
      `Firma cliente: ${b.signature}`
    ].join("\n")
  };
}

function readPhotoFiles(input) {
  const files = Array.from(input.files || []).slice(0, 4);
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
  if (u.role === "renter") {
    toast("Cambia a socio o empresa para subir carros.");
    return;
  }
  const photos = await readPhotoFiles($("#carPhotos"));
  const car = {
    id:`c-${Date.now()}`,
    ownerId:u.id,
    ownerName:u.name,
    brand:$("#carBrand").value,
    model:$("#carModel").value.trim(),
    year:Number($("#carYear").value),
    cat:$("#carCat").value,
    zone:$("#carZone").value,
    seats:Number($("#carSeats").value),
    price:Number($("#carPrice").value),
    ad:$("#carAd").value,
    status:"approved",
    docs:[
      fileName("docInsurance") || "Seguro subido",
      fileName("docTitle") || "Matrícula/título subido",
      fileName("docOwner") || "Dueño/empresa subido"
    ],
    photos,
    rating:"Nuevo",
    createdAt:new Date().toISOString()
  };
  db.cars.push(car);
  ownerWallet(u.id);
  saveDb();
  e.target.reset();
  $("#carYear").value = "2024";
  $("#carPrice").value = "40";
  $("#carSeats").value = "5";
  toast("Carro guardado y visible en el MVP.");
  go("dashboard");
}

function fileName(id) {
  const f = $(`#${id}`)?.files?.[0];
  return f ? f.name : "";
}

function renderDashboard() {
  const u = user();
  if (!u) return go("auth");
  $("#dashRole").textContent = roleLabel(u.role).toUpperCase();
  $("#dashTitle").textContent = u.role === "renter" ? "Panel del cliente" : u.role === "owner" ? "Panel socio individual" : "Panel empresa rent car";
  const myBookings = db.bookings.filter((b) => u.role === "renter" ? b.renterId === u.id : b.ownerId === u.id);
  const myCars = db.cars.filter((c) => c.ownerId === u.id);
  const wallet = ownerWallet(u.id);
  $("#stats").innerHTML = [
    ["Reservas", myBookings.length],
    ["Carros", myCars.length],
    ["Disponible", `$${wallet.available}`],
    ["Pendiente", `$${wallet.pending}`]
  ].map(([k,v]) => `<div class="stat"><span class="muted">${k}</span><strong>${v}</strong></div>`).join("");
  $("#bookingList").innerHTML = myBookings.map(bookingItem).join("") || `<p class="muted">Todavía no hay reservas.</p>`;
  $("#ownerCars").innerHTML = myCars.map(carItem).join("") || `<p class="muted">Todavía no has subido carros.</p>`;
}

function bookingItem(b) {
  return `<div class="item">
    <div class="item-head"><strong>${b.vehicle}</strong><span class="badge amber">${statusLabel(b.status)}</span></div>
    <p class="muted">${b.start} → ${b.end} · ${b.zone}</p>
    <p><strong>$${b.total}</strong> total · hold $${b.depositHold}</p>
    ${b.status === "hold_pending_owner_confirmation" ? `<button class="primary small" onclick="releaseBooking('${b.id}')">Confirmar entrega / liberar dueño</button>` : ""}
  </div>`;
}

function carItem(c) {
  return `<div class="item">
    <div class="item-head"><strong>${c.brand} ${c.model} ${c.year}</strong><span class="badge blue">${c.ad}</span></div>
    <p class="muted">${catLabel(c.cat)} · ${c.zone} · $${c.price} dueño + $10 fee</p>
  </div>`;
}

function statusLabel(s) {
  return s === "completed" ? "Completada" : "Hold pendiente";
}

window.releaseBooking = (id) => {
  const b = db.bookings.find((x) => x.id === id);
  if (!b || b.status === "completed") return;
  b.status = "completed";
  const w = ownerWallet(b.ownerId);
  w.pending = Math.max(0, w.pending - b.ownerAmount);
  w.available += b.ownerAmount;
  saveDb();
  toast("Dinero liberado al balance del dueño.");
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
    <p class="mini">En producción esto sería ACH/LBTR a BHD, Popular, Banreservas u otra cuenta verificada.</p>
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
  `).join("") || `<p class="muted">No hay contratos todavía. Haz una reserva para generar uno.</p>`;
}

window.downloadContract = (id) => {
  const c = db.contracts.find((x) => x.id === id);
  if (!c) return;
  const blob = new Blob([c.text], { type:"text/plain;charset=utf-8" });
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
