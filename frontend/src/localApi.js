const STORE_KEY = "novawear_static_store_v1";

const firstNames = ["Laura", "Sofia", "Marta", "Carmen", "Lucia", "Paula", "Elena", "Irene", "Nuria", "Clara", "Diego", "Javier", "Pablo", "Sergio", "Alvaro", "Marcos", "Hugo", "Adrian", "Daniel", "Ivan"];
const lastNames = ["Martinez", "Garcia", "Lopez", "Sanchez", "Fernandez", "Gomez", "Ruiz", "Diaz", "Moreno", "Alvarez", "Romero", "Navarro", "Torres", "Vazquez", "Ortega"];
const streets = ["Calle Alcala", "Avenida Diagonal", "Calle Mayor", "Paseo Castellana", "Calle Valencia", "Ronda Norte", "Calle Arenal", "Gran Via", "Calle Serrano", "Avenida Andalucia"];
const cities = [["Madrid", "28009"], ["Barcelona", "08013"], ["Valencia", "46002"], ["Sevilla", "41001"], ["Zaragoza", "50004"], ["Malaga", "29008"], ["Bilbao", "48001"], ["Alicante", "03001"]];
const products = [["Vestido Linen Summer", "Vestidos"], ["Zapatillas Urban White", "Calzado"], ["Camisa Oxford Essential", "Camisas"], ["Pantalon Wide Fit", "Pantalones"], ["Chaqueta Denim Nova", "Chaquetas"], ["Jersey Soft Knit", "Punto"], ["Bolso Mini City", "Accesorios"], ["Falda Satin Midi", "Faldas"], ["Top Rib Basic", "Tops"], ["Abrigo Wool Blend", "Abrigos"]];
const carriers = [
  { id: 1, name: "RapidGo Logistics", email: "incidencias@rapidgo.test", phone: "910 482 301" },
  { id: 2, name: "IberExpress Cargo", email: "soporte@iberexpress.test", phone: "911 235 984" },
  { id: 3, name: "NovaParcel", email: "operaciones@novaparcel.test", phone: "912 882 504" },
  { id: 4, name: "FlashRoute", email: "incidencias@flashroute.test", phone: "913 447 118" },
  { id: 5, name: "BlueBox Transport", email: "atencion@blueboxtransport.test", phone: "914 201 769" }
];
const statuses = ["EN TIEMPO", "RETRASADO", "CANCELADO"];
const cancelReasons = ["Rotura de stock", "Incidencia logistica", "Error en almacen", "Pedido danado", "Problema de preparacion"];
const sizes = ["XS", "S", "M", "L", "XL", "39", "40", "41", "42"];

function rng(seed) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

function hasDpaEmailMismatch(customerId) {
  return Number(customerId) % 100 >= 1 && Number(customerId) % 100 <= 23;
}

function callEmailFor(customer) {
  if (!hasDpaEmailMismatch(customer.id)) return customer.email;
  const [local, domain = "example.com"] = String(customer.email).split("@");
  return `${local}.consulta@${domain}`;
}

function makeStore() {
  const random = rng(284739);
  const pick = (list) => list[Math.floor(random() * list.length)];
  const date = (offset) => {
    const d = new Date("2026-08-08T10:00:00.000Z");
    d.setUTCDate(d.getUTCDate() + offset);
    return d.toISOString().slice(0, 10);
  };
  const customers = Array.from({ length: 100 }, (_, i) => {
    const id = i + 1;
    const first = pick(firstNames);
    const last = `${pick(lastNames)} ${pick(lastNames)}`;
    const city = pick(cities);
    return {
      id,
      customer_number: `CL-${String(10000 + id).padStart(5, "0")}`,
      first_name: first,
      last_name: last,
      dni: `${Math.floor(10000000 + random() * 80000000)}${pick("TRWAGMYFPDXBNJZSQVHLCKE")}`,
      email: `${first.toLowerCase()}.${last.split(" ")[0].toLowerCase()}${id}@example.com`,
      phone: `6${Math.floor(10000000 + random() * 89999999)}`,
      address: `${pick(streets)} ${Math.floor(8 + random() * 190)}, ${Math.ceil(random() * 6)} ${pick(["A", "B", "C", "D"])}`,
      postal_code: city[1],
      city: city[0],
      country: "Espana",
      created_at: date(-Math.floor(random() * 500))
    };
  });
  const orders = [];
  const orderItems = [];
  for (let i = 1; i <= 250; i++) {
    const forced = i <= 45 ? statuses[Math.floor((i - 1) / 15)] : pick(statuses);
    const customer_id = 1 + Math.floor(random() * 100);
    const carrier_id = 1 + Math.floor(random() * 5);
    const order_number = i === 1 ? "NV-284739" : `NV-${String(284739 + i).padStart(6, "0")}`;
    const order = {
      id: i,
      order_number,
      customer_id,
      order_date: date(-Math.floor(random() * 20)),
      total_amount: 0,
      payment_method: "Visa",
      payment_last_four: String(1000 + Math.floor(random() * 8999)),
      order_status: forced,
      payment_status: "COBRADO",
      carrier_id,
      tracking_number: `${["RG", "IE", "NP", "FR", "BB"][carrier_id - 1]}-${Math.floor(10000000 + random() * 89999999)}`,
      estimated_delivery: forced === "RETRASADO" ? date(-3 - Math.floor(random() * 5)) : date(1 + Math.floor(random() * 8)),
      cancellation_reason: forced === "CANCELADO" ? pick(cancelReasons) : null
    };
    const itemCount = 1 + Math.floor(random() * 3);
    for (let j = 0; j < itemCount; j++) {
      const p = pick(products);
      const quantity = 1 + Math.floor(random() * 2);
      const unit_price = Number((19.95 + random() * 85).toFixed(2));
      order.total_amount += quantity * unit_price;
      orderItems.push({ id: orderItems.length + 1, order_id: order.id, product_name: p[0], category: p[1], size: pick(sizes), quantity, unit_price });
    }
    order.total_amount = Number(order.total_amount.toFixed(2));
    orders.push(order);
  }
  Object.assign(orders[0], { customer_id: 1, total_amount: 89.95, payment_last_four: "4587", order_status: "RETRASADO", carrier_id: 1, tracking_number: "RG-83749203", estimated_delivery: "2026-08-05" });
  const firstItems = orderItems.filter((item) => item.order_id !== 1);
  firstItems.push({ id: firstItems.length + 1, order_id: 1, product_name: "Vestido Linen Summer", category: "Vestidos", size: "M", quantity: 1, unit_price: 39.95 });
  firstItems.push({ id: firstItems.length + 1, order_id: 1, product_name: "Zapatillas Urban White", category: "Calzado", size: "40", quantity: 1, unit_price: 50 });
  return {
    user: { id: 1, username: "agente", name: "Mari Luz Sanabria", role: "training_agent" },
    customers,
    orders,
    orderItems: firstItems,
    interactions: [],
    carrierEmails: [],
    customerEmails: [],
    refunds: [],
    trainingCalls: []
  };
}

function load() {
  const raw = localStorage.getItem(STORE_KEY);
  if (raw) return JSON.parse(raw);
  const store = makeStore();
  save(store);
  return store;
}

function save(store) {
  localStorage.setItem(STORE_KEY, JSON.stringify(store));
}

function nowIso() {
  return new Date().toISOString();
}

function joinOrder(store, order) {
  const customer = store.customers.find((c) => c.id === order.customer_id);
  const carrier = store.carriers?.find((c) => c.id === order.carrier_id) || carriers.find((c) => c.id === order.carrier_id);
  return {
    ...order,
    ...customer,
    id: order.id,
    customer_id: customer.id,
    carrier_id: carrier.id,
    customer_number: customer.customer_number,
    carrier_name: carrier.name,
    carrier_email: carrier.email,
    carrier_phone: carrier.phone,
    items: store.orderItems.filter((item) => item.order_id === order.id),
    interactions: store.interactions.filter((item) => item.order_id === order.id),
    carrierEmails: store.carrierEmails.filter((item) => item.order_id === order.id),
    refunds: store.refunds.filter((item) => item.order_id === order.id)
  };
}

export async function localLogin(username, password) {
  if (username !== "agente" || password !== "novawear123") throw new Error("Credenciales incorrectas");
  return { token: "static-token", user: load().user };
}

export async function localMe() {
  return load().user;
}

export async function localApi(path, options = {}) {
  const store = load();
  const method = options.method || "GET";
  const body = options.body ? JSON.parse(options.body) : {};
  const withSave = (value) => {
    save(store);
    return value;
  };

  if (path === "/me") return store.user;
  if (path === "/dashboard") return {
    customers: store.customers.length,
    orders: store.orders.length,
    delayed: store.orders.filter((o) => o.order_status === "RETRASADO").length,
    cancelled: store.orders.filter((o) => o.order_status === "CANCELADO").length,
    dpaFailed: store.customers.filter((c) => hasDpaEmailMismatch(c.id)).length,
    calls: store.trainingCalls.slice(-8).reverse()
  };
  if (path.startsWith("/customers/search")) {
    const q = decodeURIComponent(path.split("q=")[1] || "").toLowerCase();
    return store.customers.filter((c) => {
      const customerOrders = store.orders.filter((o) => o.customer_id === c.id);
      return [c.customer_number, `${c.first_name} ${c.last_name}`, c.email, c.phone, c.dni, ...customerOrders.map((o) => o.order_number)].some((v) => String(v).toLowerCase().includes(q));
    }).slice(0, 20).map((c) => ({ ...c, order_count: store.orders.filter((o) => o.customer_id === c.id).length }));
  }
  if (path.startsWith("/customers/")) {
    const id = Number(path.split("/")[2]);
    const c = store.customers.find((item) => item.id === id);
    return { ...c, order_count: store.orders.filter((o) => o.customer_id === id).length, orders: store.orders.filter((o) => o.customer_id === id), interactions: store.interactions.filter((i) => i.customer_id === id) };
  }
  if (path.startsWith("/orders/search")) {
    const q = decodeURIComponent(path.split("q=")[1] || "").toLowerCase();
    return store.orders.map((o) => joinOrder(store, o)).filter((o) => [o.order_number, o.tracking_number, o.email, o.phone].some((v) => String(v).toLowerCase().includes(q))).slice(0, 30);
  }
  if (method === "GET" && path.startsWith("/orders/")) {
    const orderNumber = path.split("/")[2];
    return joinOrder(store, store.orders.find((o) => o.order_number === orderNumber));
  }
  if (path === "/carriers") return carriers;
  if (path === "/emails") return [...store.carrierEmails.map((e) => ({ ...e, email_type: "Transportista", destination_name: e.carrier_name })), ...store.customerEmails.map((e) => ({ ...e, email_type: "Cliente", destination_name: e.customer_name }))].sort((a, b) => String(b.sent_at).localeCompare(String(a.sent_at)));
  if (path === "/refunds") return store.refunds.map((r) => ({ ...r, order_number: store.orders.find((o) => o.id === r.order_id)?.order_number, ...store.customers.find((c) => c.id === r.customer_id) })).reverse();
  if (path === "/history") return store.trainingCalls.map((t) => ({ ...t, order_number: store.orders.find((o) => o.id === t.order_id)?.order_number, ...store.customers.find((c) => c.id === t.customer_id) })).reverse();
  if (path === "/training/active") {
    const call = store.trainingCalls.find((c) => c.active);
    if (!call) return null;
    const order = store.orders.find((o) => o.id === call.order_id);
    const customer = store.customers.find((c) => c.id === call.customer_id);
    return { ...call, order_number: order.order_number, first_name: customer.first_name, last_name: customer.last_name, phone: customer.phone, email: callEmailFor(customer), address: customer.address, postal_code: customer.postal_code };
  }
  if (path === "/training/new-call" && method === "POST") {
    store.trainingCalls.forEach((c) => { c.active = 0; });
    const order = store.orders[Math.floor(Math.random() * store.orders.length)];
    const customer = store.customers.find((c) => c.id === order.customer_id);
    const call = { id: store.trainingCalls.length + 1, customer_id: customer.id, order_id: order.id, scenario_type: order.order_status, started_at: null, finished_at: null, result: null, score: null, actions_json: "{}", verification_json: "{}", active: 1 };
    store.trainingCalls.push(call);
    return withSave({ callId: call.id, customerName: `${customer.first_name} ${customer.last_name}`, orderNumber: order.order_number, phone: customer.phone, email: callEmailFor(customer), address: customer.address, postalCode: customer.postal_code, reason: "Consulta sobre pedido", status: "incoming" });
  }
  const trainingMatch = path.match(/^\/training\/(\d+)\/(start|verify|actions|finish)$/);
  if (trainingMatch) {
    const call = store.trainingCalls.find((c) => c.id === Number(trainingMatch[1]));
    const action = trainingMatch[2];
    if (action === "start") call.started_at = nowIso();
    if (action === "verify") call.verification_json = JSON.stringify(body);
    if (action === "actions") call.actions_json = JSON.stringify({ ...JSON.parse(call.actions_json || "{}"), ...body });
    if (action === "finish") {
      const order = store.orders.find((o) => o.id === call.order_id);
      const verification = { ...JSON.parse(call.verification_json || "{}"), ...(body.verification || {}) };
      const actions = { ...JSON.parse(call.actions_json || "{}"), ...(body.actions || {}) };
      const verifiedCount = ["name", "email", "address", "postal"].filter((k) => verification[k]).length;
      let score = 25 + verifiedCount * 8 + (actions.customerFound ? 10 : 0) + (actions.orderFound ? 10 : 0) + (actions.noteSaved ? 8 : 0);
      if (order.order_status === "RETRASADO") score += actions.emailSent ? 15 : -10;
      if (order.order_status === "CANCELADO") score += (actions.customerEmailSent ? 8 : -6) + (actions.refundProcessed ? 12 : -10);
      if (order.order_status === "EN TIEMPO") score += actions.customerEmailSent ? 15 : -10;
      score = Math.max(0, Math.min(100, score));
      call.finished_at = nowIso();
      call.active = 0;
      call.score = score;
      call.result = JSON.stringify({ customerIdentification: actions.customerFound ? "Correcta" : "Incorrecta", verified: `${verifiedCount}/4`, dpa: actions.dpaFailed ? `No superada: ${actions.dpaComment || "Sin detalle"}` : "No marcada", orderLocated: actions.orderFound ? "Correcto" : "Incorrecto", actionApplied: actions.correctAction ? "Correcta" : "Revisar", customerEmail: order.order_status === "RETRASADO" ? "No necesario" : (actions.customerEmailSent ? "Correcto" : "Incorrecto"), carrierEmail: order.order_status === "RETRASADO" ? (actions.emailSent ? "Correcto" : "Incorrecto") : "No necesario", refund: order.order_status === "CANCELADO" ? (actions.refundProcessed ? "Correcto" : "Incorrecto") : "No necesario", crmNote: actions.noteSaved ? "Realizada" : "No realizada" });
      return withSave({ result: JSON.parse(call.result), score, orderStatus: order.order_status });
    }
    return withSave(call);
  }
  const orderAction = path.match(/^\/orders\/([^/]+)\/(carrier-email|customer-email|refund|note)$/);
  if (orderAction) {
    const order = store.orders.find((o) => o.order_number === orderAction[1]);
    const detail = joinOrder(store, order);
    const action = orderAction[2];
    if (action === "carrier-email") {
      const email = { id: store.carrierEmails.length + 1, order_id: order.id, order_number: order.order_number, carrier_id: detail.carrier_id, carrier_name: detail.carrier_name, recipient: body.recipient, subject: body.subject, message: body.message, sent_at: nowIso(), agent: store.user.name };
      store.carrierEmails.push(email);
      return withSave({ ...email, carrier: detail.carrier_name });
    }
    if (action === "customer-email") {
      const email = { id: store.customerEmails.length + 1, order_id: order.id, order_number: order.order_number, customer_id: detail.customer_id, customer_name: `${detail.first_name} ${detail.last_name}`, recipient: body.recipient, subject: body.subject, message: body.message, sent_at: nowIso(), agent: store.user.name };
      store.customerEmails.push(email);
      store.interactions.push({ id: store.interactions.length + 1, customer_id: detail.customer_id, order_id: order.id, interaction_type: "Email cliente", notes: `Email simulado enviado al cliente sobre el pedido ${order.order_number}: ${body.subject}`, created_at: email.sent_at });
      return withSave({ ...email, customer: email.customer_name });
    }
    if (action === "refund") {
      order.payment_status = "REEMBOLSADO";
      const refund = { id: store.refunds.length + 1, order_id: order.id, customer_id: detail.customer_id, amount: order.total_amount, reason: "Pedido cancelado", reference: `RF-${Math.floor(100000 + Math.random() * 899999)}`, created_at: nowIso(), eta: "3-5 dias laborables" };
      store.refunds.push(refund);
      return withSave(refund);
    }
    if (action === "note") {
      store.interactions.push({ id: store.interactions.length + 1, customer_id: detail.customer_id, order_id: order.id, interaction_type: body.type || "Nota CRM", notes: body.notes, created_at: nowIso() });
      return withSave({ ok: true });
    }
  }
  throw new Error(`Ruta local no soportada: ${path}`);
}
