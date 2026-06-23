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
let activeHouseFilter = "all";
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
    properties: [
      propertySeed("h1", "u-owner", "Evaristo Morales", "Piantini furnished apartment", "apartment", "Piantini, Santo Domingo", 2, 2, 1450, "Furnished apartment with parking, elevator, security, and maintenance included.", "premium"),
      propertySeed("h2", "u-fleet", "Impact Rent Car", "Punta Cana villa near the beach", "villa", "Punta Cana", 3, 3, 2800, "Private villa with pool, terrace, backup power, and gated access.", "premium"),
      propertySeed("h3", "u-owner", "Evaristo Morales", "Gazcue family house", "house", "Gazcue, Santo Domingo", 4, 3, 2100, "Large house with patio, parking, and easy access to main avenues.", "standard")
    ],
    bookings: [],
    wallets: { "u-owner": wallet(), "u-fleet": wallet() },
    contracts: [],
    events: [],
    session: null
  };
}

function carSeed(id, ownerId, ownerName, brand, model, year, cat, zone, seats, price, ad, rating) {
  return { id, ownerId, ownerName, brand, model, year, cat, zone, seats, price, ad, rating, status: "approved", photos: [], docs: ["Coverage", "Registration", "Owner"] };
}

function propertySeed(id, ownerId, ownerName, title, type, location, beds, baths, rent, description, tier) {
  return { id, ownerId, ownerName, title, type, location, beds, baths, rent, description, tier, photos: [], status: "approved", docs: ["Ownership", "Lease", "Owner ID"] };
}

function wallet() {
  return { available: 0, pending: 0, withdrawn: 0 };
}

function loadDb() {
  try {
    const saved = localStorage.getItem(DB_KEY);
    if (saved) return normalizeDb(JSON.parse(saved));
  } catch (e) {}
  const fresh = seedDb();
  localStorage.setItem(DB_KEY, JSON.stringify(fresh));
  return fresh;
}

function normalizeDb(data) {
  const fresh = seedDb();
  data.users ||= fresh.users;
  data.cars ||= fresh.cars;
  data.properties ||= fresh.properties;
  data.bookings ||= [];
  data.wallets ||= fresh.wallets;
  data.contracts ||= [];
  data.events ||= [];
  data.session ||= null;
  return data;
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
  return role === "fleet" ? "Rental company" : role === "owner" ? "Individual partner" : "Renter";
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
  if (page === "houses") renderHouses();
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
  recordEvent("Login completed", `Signed in as ${roleLabel(u.role)}`, u.id);
  renderChrome();
  toast(`Welcome, ${u.name}`);
  go(u.role === "renter" ? "search" : "dashboard");
}

function logout() {
  session = null;
  saveDb();
  renderChrome();
  toast("Signed out");
  go("home");
}

function renderChrome() {
  const u = user();
  if ($("#authBtn")) $("#authBtn").textContent = u ? "Sign out" : "Login";
  if ($("#drawerName")) $("#drawerName").textContent = u ? u.name : "RuedaRD";
  if ($("#drawerRole")) $("#drawerRole").textContent = u ? roleLabel(u.role) : "MVP demo";
}

function bindNav() {
  $$("[data-go]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const page = btn.dataset.go;
      const privatePage = ["add-car", "dashboard", "wallet", "contracts"].includes(page);
      if (privatePage && !user()) {
        toast("Sign in with a demo account first.");
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
      name: $("#authName").value.trim() || "Demo user",
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
  $("#houseForm")?.addEventListener("submit", addHouse);
  $("#showHouseForm")?.addEventListener("click", () => {
    if (!user()) {
      toast("Sign in as an owner or company to list a home.");
      go("auth");
      return;
    }
    if (user().role === "renter") return toast("Switch to partner or company to list homes.");
    $("#houseForm")?.classList.add("open");
    $("#houseForm")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  $("#hideHouseForm")?.addEventListener("click", () => $("#houseForm")?.classList.remove("open"));
  $("#houseQuery")?.addEventListener("input", renderHouses);
  $("#houseFilterBtn")?.addEventListener("click", () => toast("Demo filters: use the category chips below."));
  $("#houseMapBtn")?.addEventListener("click", () => toast("Map view will connect in the backend phase."));
  $$("[data-house-filter]").forEach((btn) => {
    btn.addEventListener("click", () => {
      activeHouseFilter = btn.dataset.houseFilter;
      $$("[data-house-filter]").forEach((b) => b.classList.remove("on"));
      btn.classList.add("on");
      renderHouses();
    });
  });
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
  return { sedan: "Sedan", suv2: "SUV 2 rows", suv3: "SUV 3 rows", luxury: "Luxury" }[cat] || "Car";
}

function typeLabel(type) {
  return { apartment: "Apartment", house: "House", villa: "Villa" }[type] || "Home";
}

function renderHouses() {
  const list = $("#housesList");
  if (!list) return;
  const q = ($("#houseQuery")?.value || "").toLowerCase().trim();
  const properties = (db.properties || [])
    .filter((p) => p.status === "approved")
    .filter((p) => {
      if (activeHouseFilter === "all") return true;
      if (activeHouseFilter === "premium") return p.tier === "premium";
      return p.type === activeHouseFilter;
    })
    .filter((p) => !q || [p.title, p.location, p.description, p.type, `${p.beds} bed`, `${p.baths} bath`].join(" ").toLowerCase().includes(q))
    .sort((a, b) => (b.tier === "premium") - (a.tier === "premium") || b.rent - a.rent);

  list.innerHTML = properties.map((p) => {
    const platformFee = Math.round(p.rent * 0.15);
    const ownerPayout = p.rent - platformFee;
    const deposit = p.rent;
    return `
      <article class="house-card">
        <div class="house-media">
          ${p.photos?.[0] ? `<img src="${p.photos[0]}" alt="${p.title}">` : `<div class="photo-empty"><strong>${typeLabel(p.type)}</strong><small>Owner photos pending</small></div>`}
          <span class="house-chip">${p.tier === "premium" ? "Premium" : "Verified"} · No cash</span>
          <span class="house-heart">♡</span>
        </div>
        <div class="house-body">
          <div class="house-price">$${p.rent.toLocaleString()}/mo</div>
          <div class="house-facts"><span>${p.beds} bed</span><span>${p.baths} bath</span><span>${typeLabel(p.type)}</span></div>
          <h3>${p.title}</h3>
          <p class="muted">${p.location} · Owner: ${p.ownerName}</p>
          <p class="muted">${p.description}</p>
          <div class="chips"><span>Deposit hold $${deposit.toLocaleString()}</span><span>15% platform/legal fee $${platformFee.toLocaleString()}</span><span>Owner payout $${ownerPayout.toLocaleString()}</span></div>
          <div class="house-legal">Tenant pays in portal. Owner receives payout to account. Contract, deposit, documents, and legal terms are recorded.</div>
          <div class="house-actions">
            <button class="ghost" type="button" onclick="viewHouse('${p.id}')">View details</button>
            <button class="primary" type="button" onclick="bookHouse('${p.id}')">Apply / pay in portal</button>
          </div>
        </div>
      </article>
    `;
  }).join("") || `<div class="card wide"><h3>No homes found.</h3><p class="muted">Try another location or category.</p></div>`;
}

window.viewHouse = (id) => {
  const p = db.properties.find((x) => x.id === id);
  if (!p) return;
  toast(`${p.title}: $${p.rent.toLocaleString()}/month · no cash payments.`);
};

window.bookHouse = (id) => {
  const u = user();
  if (!u) {
    toast("Sign in as a tenant to apply.");
    go("auth");
    return;
  }
  const p = db.properties.find((x) => x.id === id);
  if (!p) return;
  const platformFee = Math.round(p.rent * 0.15);
  const ownerAmount = p.rent - platformFee;
  const deposit = p.rent;
  const booking = {
    id: `home-${Date.now()}`,
    renterId: u.id,
    renterName: u.name,
    ownerId: p.ownerId,
    ownerName: p.ownerName,
    vehicle: `Rueda Casa · ${p.title}`,
    start: today(7),
    end: "monthly lease",
    zone: p.location,
    airline: "N/A",
    flightNo: "",
    payment: "Stripe Connect demo",
    protection: "legal_support_15_percent",
    clientDocs: "Tenant ID and proof of income pending in portal",
    signature: u.name,
    days: 30,
    total: p.rent + deposit,
    platformFee,
    ownerAmount,
    depositHold: deposit,
    status: "tenant_paid_pending_owner_approval",
    paymentStatus: "rent_and_deposit_authorized",
    contractStatus: "lease_contract_pending_final_signature",
    createdAt: new Date().toISOString()
  };
  db.bookings.push(booking);
  ownerWallet(p.ownerId).pending += ownerAmount;
  db.contracts.push(makeHouseContract(booking, p));
  saveDb();
  recordEvent("Rueda Casa application created", `${p.title} · rent/deposit authorized · 15% platform fee`, u.id);
  toast("Home application created. Contract and payment are recorded.");
  go("contracts");
};

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
        ${car.photos?.[0] ? `<img src="${car.photos[0]}" alt="${car.brand} ${car.model}">` : `<div class="photo-empty"><strong>Photo pending</strong><small>Upload real vehicle photos</small></div>`}
      </div>
      <div class="car-body">
        <div class="car-title">
          <div>
            <h3>${car.brand} ${car.model} ${car.year}</h3>
            <p class="muted">${car.zone} · ${car.ownerName} · ${car.rating || "New"} stars</p>
          </div>
          <div class="price">$${feePrice(car)}</div>
        </div>
        <div class="chips"><span>${catLabel(car.cat)}</span><span>${car.seats} seats</span><span>$${car.price} owner + $10 fee</span><span>Owner coverage: basic</span><span>Docs verified</span></div>
        <div class="car-actions">
          <button class="ghost" type="button" onclick="viewCar('${car.id}')">View</button>
          <button class="primary" type="button" onclick="selectCar('${car.id}')">Book</button>
        </div>
      </div>
    </article>
  `).join("") || `<div class="card"><h3>No cars in this filter.</h3><p class="muted">Try another category.</p></div>`;
}

async function addHouse(e) {
  e.preventDefault();
  const u = user();
  if (!u) return go("auth");
  if (u.role === "renter") return toast("Switch to partner or company to list homes.");
  const photos = await readPhotoFiles($("#housePhotos"));
  const property = {
    id: `h-${Date.now()}`,
    ownerId: u.id,
    ownerName: u.name,
    title: $("#houseTitle")?.value.trim() || "Rueda Casa property",
    type: $("#houseType")?.value || "apartment",
    location: $("#houseLocation")?.value.trim() || "Santo Domingo",
    beds: Number($("#houseBeds")?.value || 2),
    baths: Number($("#houseBaths")?.value || 1),
    rent: Number($("#houseRent")?.value || 1200),
    description: $("#houseDescription")?.value.trim() || "Verified property listed in Rueda Casa.",
    tier: "standard",
    photos,
    status: "approved",
    docs: ["Ownership uploaded", "Lease template uploaded", "Owner/company uploaded"],
    createdAt: new Date().toISOString()
  };
  db.properties.push(property);
  ownerWallet(u.id);
  saveDb();
  recordEvent("Rueda Casa property listed", property.title, u.id);
  e.target.reset();
  $("#houseForm")?.classList.remove("open");
  toast("Home published in Rueda Casa.");
  renderHouses();
}

window.viewCar = (id) => {
  const car = db.cars.find((c) => c.id === id);
  if (car) toast(`${car.brand} ${car.model}: $${feePrice(car)}/day.`);
};

window.selectCar = (id) => {
  if (!user()) {
    toast("Sign in as a renter to book.");
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
    <h3>Rental summary</h3>
    <div class="line"><span>Vehicle</span><strong>${selectedCar.brand} ${selectedCar.model}</strong></div>
    <div class="line"><span>Days</span><strong>${days}</strong></div>
    <div class="line"><span>Price per day</span><strong>$${feePrice(selectedCar)}</strong></div>
    <div class="line"><span>Deposit hold</span><strong>$300</strong></div>
    <div class="line"><span>Coverage</span><strong>Select</strong></div>
    <div class="line total"><span>Initial total</span><strong>$${total}</strong></div>
    <p class="mini">Funds stay pending until delivery is confirmed. RuedaRD takes a $10/day platform fee.</p>
  `;
}

function protectionCost() {
  const v = $("#protection")?.value;
  return v === "plus" ? 8 : v === "premium" ? 15 : 0;
}

function confirmBooking(e) {
  e.preventDefault();
  const u = user();
  if (!u || !selectedCar) return toast("Select a car first.");
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
    airline: $("#airline")?.value || "No flight",
    flightNo: $("#flightNo")?.value.trim() || "",
    payment: $("#paymentMethod")?.value || "Azul demo",
    protection: $("#protection")?.value || "basic",
    clientDocs: docTiming === "delivery" ? "Pending for assisted delivery" : "Uploaded in demo checkout",
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
  recordEvent("Booking created", `${booking.vehicle} · hold authorized · contract signed`, u.id);
  toast("Rental created. Contract ready.");
  go("contracts");
}

function makeContract(b) {
  return {
    id: `ct-${b.id}`,
    bookingId: b.id,
    title: `Contract ${b.vehicle}`,
    createdAt: new Date().toISOString(),
    text: [
      "RUEDARD MVP RENTAL CONTRACT",
      `Renter: ${b.renterName}`,
      `Owner / Fleet: ${b.ownerName}`,
      `Vehicle: ${b.vehicle}`,
      `Period: ${b.start} to ${b.end} (${b.days} days)`,
      `Zone: ${b.zone}`,
      `Flight: ${b.airline} ${b.flightNo}`,
      `Payment: ${b.payment}`,
      `Payment status: ${b.paymentStatus}`,
      `Customer documents: ${b.clientDocs}`,
      `Total: $${b.total}`,
      `Deposit hold: $${b.depositHold} not captured until the deal is closed`,
      `Pending owner amount: $${b.ownerAmount}`,
      `Platform fee: $${b.platformFee}`,
      "Legal policy: price, deposit, coverage, delivery, return, damage, and responsibility were visible before signing.",
      "Visible clauses: no hidden charges, restrictions, or damage terms are allowed outside this contract.",
      `Customer signature: ${b.signature}`
    ].join("\n")
  };
}

function makeHouseContract(b, p) {
  return {
    id: `ct-${b.id}`,
    bookingId: b.id,
    title: `Rueda Casa lease ${p.title}`,
    createdAt: new Date().toISOString(),
    text: [
      "RUEDA CASA LEASE CONTRACT MVP",
      `Tenant: ${b.renterName}`,
      `Owner / Property manager: ${b.ownerName}`,
      `Property: ${p.title}`,
      `Location: ${p.location}`,
      `Type: ${typeLabel(p.type)} · ${p.beds} bed · ${p.baths} bath`,
      `Monthly rent: $${p.rent}`,
      `Deposit hold: $${b.depositHold}`,
      `Platform/legal fee: $${b.platformFee} (15%)`,
      `Owner payout pending: $${b.ownerAmount}`,
      `Payment rail: ${b.payment}`,
      `Payment status: ${b.paymentStatus}`,
      "Tenant payments must be made inside the portal. No cash or side payments are allowed.",
      "Rueda Casa records photos, ownership documents, lease terms, payments, deposits, and signatures.",
      "Platform fee supports operations, legal coordination, contract workflow, and dispute documentation.",
      `Tenant signature: ${b.signature}`
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
  if (u.role === "renter") return toast("Switch to partner or company to list cars.");
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
    rating: "New",
    docs: ["Coverage uploaded", "Registration/title uploaded", "Owner/company uploaded"],
    createdAt: new Date().toISOString()
  };
  db.cars.push(car);
  ownerWallet(u.id);
  saveDb();
  recordEvent("Account activated and car listed", `${car.brand} ${car.model}`, u.id);
  e.target.reset();
  toast("Car saved and visible in the MVP.");
  go("dashboard");
}

function renderDashboard() {
  const u = user();
  if (!u) return go("auth");
  $("#dashRole").textContent = roleLabel(u.role).toUpperCase();
  $("#dashTitle").textContent = u.role === "renter" ? "Renter panel" : u.role === "owner" ? "Individual partner panel" : "Rental company panel";
  const myBookings = db.bookings.filter((b) => u.role === "renter" ? b.renterId === u.id : b.ownerId === u.id);
  const myCars = db.cars.filter((c) => c.ownerId === u.id);
  const myProperties = (db.properties || []).filter((p) => p.ownerId === u.id);
  const w = ownerWallet(u.id);
  $("#stats").innerHTML = [["Bookings", myBookings.length], ["Listings", myCars.length + myProperties.length], ["Available", `$${w.available}`], ["Pending", `$${w.pending}`]]
    .map(([k, v]) => `<div class="stat"><span class="muted">${k}</span><strong>${v}</strong></div>`).join("");
  $("#bookingList").innerHTML = myBookings.map(bookingItem).join("") || `<p class="muted">No bookings yet.</p>`;
  $("#ownerCars").innerHTML = [myCars.map(carItem).join(""), myProperties.map(houseItem).join("")].join("") || `<p class="muted">No vehicles or homes listed yet.</p>`;
  renderEventLog(u);
}

function bookingItem(b) {
  return `<div class="item">
    <div class="item-head"><strong>${b.vehicle}</strong><span class="badge amber">${b.status === "completed" ? "Completed" : "Hold pending"}</span></div>
    <p class="muted">${b.start} → ${b.end} · ${b.zone}</p>
    <p><strong>$${b.total}</strong> total · hold $${b.depositHold}</p>
    <div class="timeline">
      <span class="timeline-step done">Login and selection completed</span>
      <span class="timeline-step done">Payment hold authorized</span>
      <span class="timeline-step done">Documents: ${b.clientDocs}</span>
      <span class="timeline-step done">Contract signed</span>
    </div>
    ${b.status !== "completed" ? `<button class="primary small" onclick="releaseBooking('${b.id}')">Confirm delivery / release owner funds</button>` : ""}
  </div>`;
}

function carItem(c) {
  return `<div class="item">
    <div class="item-head"><strong>${c.brand} ${c.model} ${c.year}</strong><span class="badge blue">${c.ad}</span></div>
    <p class="muted">${catLabel(c.cat)} · ${c.zone} · $${c.price} owner + $10 fee</p>
    <div class="timeline">
      <span class="timeline-step done">Account active</span>
      <span class="timeline-step done">Vehicle documents recorded</span>
      <span class="timeline-step done">Available for bookings</span>
    </div>
  </div>`;
}

function houseItem(p) {
  return `<div class="item">
    <div class="item-head"><strong>${p.title}</strong><span class="badge blue">Rueda Casa</span></div>
    <p class="muted">${typeLabel(p.type)} · ${p.location} · $${p.rent}/month</p>
    <div class="timeline">
      <span class="timeline-step done">Owner account active</span>
      <span class="timeline-step done">Property documents recorded</span>
      <span class="timeline-step done">Tenant payments must run through portal</span>
    </div>
  </div>`;
}

function renderEventLog(u) {
  const rows = db.events.filter((ev) => ev.userId === u.id || ev.userId === "system").slice(0, 8);
  $("#eventLog").innerHTML = rows.map((ev) => `<div class="item"><div class="item-head"><strong>${ev.title}</strong><span class="badge green">${new Date(ev.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span></div><p class="muted">${ev.detail}</p></div>`).join("") || `<p class="muted">When you use the MVP, every step will appear here.</p>`;
}

window.releaseBooking = (id) => {
  const b = db.bookings.find((x) => x.id === id);
  if (!b || b.status === "completed") return;
  b.status = "completed";
  const w = ownerWallet(b.ownerId);
  w.pending = Math.max(0, w.pending - b.ownerAmount);
  w.available += b.ownerAmount;
  saveDb();
  toast("Funds released to the owner balance.");
  renderDashboard();
};

function renderWallet() {
  const u = user();
  if (!u) return go("auth");
  const w = ownerWallet(u.id);
  $("#walletPanel").innerHTML = `
    <h3>Wallet demo</h3>
    <div class="wallet-line"><span>Available for payout</span><strong>$${w.available}</strong></div>
    <div class="wallet-line"><span>Pending confirmation</span><strong>$${w.pending}</strong></div>
    <div class="wallet-line"><span>Withdrawn</span><strong>$${w.withdrawn}</strong></div>
    <button class="primary" onclick="withdrawMoney()">Request demo payout</button>
    <p class="mini">In production this would be ACH/LBTR to BHD, Popular, or Banreservas.</p>
  `;
}

window.withdrawMoney = () => {
  const u = user();
  const w = ownerWallet(u.id);
  if (w.available <= 0) return toast("No funds available for payout.");
  w.withdrawn += w.available;
  w.available = 0;
  saveDb();
  toast("Demo payout requested.");
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
      <button class="primary small" onclick="downloadContract('${c.id}')">Download contract .txt</button>
    </div>
  `).join("") || `<p class="muted">No contracts yet. Make a booking to generate one.</p>`;
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

function ensureFooter() {
  $$(".market-pills").forEach((el) => el.remove());
  if ($(".site-footer")) return;
  const footer = document.createElement("footer");
  footer.className = "site-footer";
  footer.setAttribute("aria-label", "RuedaRD footer");
  footer.innerHTML = `
    <div class="footer-socials" aria-label="Social links">
      <a class="fb" href="#" aria-label="Facebook">f</a>
      <a class="yt" href="#" aria-label="YouTube">▶</a>
      <a class="ig" href="#" aria-label="Instagram">◎</a>
      <a class="in" href="#" aria-label="LinkedIn">in</a>
    </div>
    <nav class="footer-links" aria-label="Legal links">
      <a href="#">Terms of Use</a>
      <a href="#">Privacy Policy ↗</a>
      <a href="#">Cookie Policy ↗</a>
      <a href="#">Consumer Data Privacy Statement ↗</a>
      <a href="#">Privacy Choices</a>
      <a href="#">AdChoices</a>
    </nav>
    <p class="footer-copy">© 2026 RuedaRD. All Rights Reserved.</p>
  `;
  $("main")?.after(footer);
}

function boot() {
  bindNav();
  initForms();
  ensureFooter();
  renderChrome();
  renderCars();
  if (session && user()) renderDashboard();
  setTimeout(ensureFooter, 250);
}

boot();
