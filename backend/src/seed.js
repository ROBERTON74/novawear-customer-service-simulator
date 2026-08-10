import crypto from "node:crypto";
import { pathToFileURL } from "node:url";
import { db, row } from "./db.js";

const firstNames = ["Laura", "Sofia", "Marta", "Carmen", "Lucia", "Paula", "Elena", "Irene", "Nuria", "Clara", "Diego", "Javier", "Pablo", "Sergio", "Alvaro", "Marcos", "Hugo", "Adrian", "Daniel", "Ivan"];
const lastNames = ["Martinez", "Garcia", "Lopez", "Sanchez", "Fernandez", "Gomez", "Ruiz", "Diaz", "Moreno", "Alvarez", "Romero", "Navarro", "Torres", "Vazquez", "Ortega"];
const streets = ["Calle Alcala", "Avenida Diagonal", "Calle Mayor", "Paseo de la Castellana", "Calle Valencia", "Ronda Norte", "Calle Arenal", "Gran Via", "Calle Serrano", "Avenida Andalucia"];
const cities = [
  ["Madrid", "28009"], ["Barcelona", "08013"], ["Valencia", "46002"], ["Sevilla", "41001"], ["Zaragoza", "50004"],
  ["Malaga", "29008"], ["Bilbao", "48001"], ["Alicante", "03001"], ["Valladolid", "47001"], ["A Coruna", "15003"]
];
const products = [
  ["Vestido Linen Summer", "Vestidos"], ["Zapatillas Urban White", "Calzado"], ["Camisa Oxford Essential", "Camisas"],
  ["Pantalon Wide Fit", "Pantalones"], ["Chaqueta Denim Nova", "Chaquetas"], ["Jersey Soft Knit", "Punto"],
  ["Bolso Mini City", "Accesorios"], ["Falda Satin Midi", "Faldas"], ["Top Rib Basic", "Tops"], ["Abrigo Wool Blend", "Abrigos"]
];
const carriers = [
  ["RapidGo Logistics", "incidencias@rapidgo.test", "910 482 301"],
  ["IberExpress Cargo", "soporte@iberexpress.test", "911 235 984"],
  ["NovaParcel", "operaciones@novaparcel.test", "912 882 504"],
  ["FlashRoute", "incidencias@flashroute.test", "913 447 118"],
  ["BlueBox Transport", "atencion@blueboxtransport.test", "914 201 769"]
];
const cancelReasons = ["Rotura de stock", "Incidencia logistica", "Error en almacen", "Pedido danado", "Problema de preparacion"];
const statuses = ["EN TIEMPO", "RETRASADO", "CANCELADO"];
const sizes = ["XS", "S", "M", "L", "XL", "39", "40", "41", "42", "U"];
const DEFAULT_TRAINING_PASSWORD_HASH = "143d14fb75efa4492fae9c298b11389a8c6616e6757a1edfd5c30d147c653290";

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function hash(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

function date(offsetDays) {
  const d = new Date("2026-08-08T10:00:00.000Z");
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

export function migrate() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_number TEXT UNIQUE NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      dni TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      address TEXT NOT NULL,
      postal_code TEXT NOT NULL,
      city TEXT NOT NULL,
      country TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS carriers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT UNIQUE NOT NULL,
      customer_id INTEGER NOT NULL,
      order_date TEXT NOT NULL,
      total_amount REAL NOT NULL,
      payment_method TEXT NOT NULL,
      payment_last_four TEXT NOT NULL,
      order_status TEXT NOT NULL,
      payment_status TEXT NOT NULL,
      carrier_id INTEGER NOT NULL,
      tracking_number TEXT NOT NULL,
      estimated_delivery TEXT NOT NULL,
      cancellation_reason TEXT,
      FOREIGN KEY(customer_id) REFERENCES customers(id),
      FOREIGN KEY(carrier_id) REFERENCES carriers(id)
    );
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_name TEXT NOT NULL,
      category TEXT NOT NULL,
      size TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price REAL NOT NULL,
      FOREIGN KEY(order_id) REFERENCES orders(id)
    );
    CREATE TABLE IF NOT EXISTS customer_interactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      order_id INTEGER,
      agent_id INTEGER NOT NULL,
      interaction_type TEXT NOT NULL,
      notes TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS carrier_emails (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      carrier_id INTEGER NOT NULL,
      agent_id INTEGER NOT NULL,
      recipient TEXT NOT NULL,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      sent_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS customer_emails (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      customer_id INTEGER NOT NULL,
      agent_id INTEGER NOT NULL,
      recipient TEXT NOT NULL,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      sent_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS refunds (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      customer_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      reason TEXT NOT NULL,
      reference TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS training_calls (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      order_id INTEGER NOT NULL,
      scenario_type TEXT NOT NULL,
      started_at TEXT,
      finished_at TEXT,
      result TEXT,
      score INTEGER,
      actions_json TEXT DEFAULT '{}',
      verification_json TEXT DEFAULT '{}',
      active INTEGER DEFAULT 0
    );
  `);
}

export function seed() {
  migrate();
  if (row("SELECT COUNT(*) AS count FROM customers").count > 0) {
    db.prepare("UPDATE users SET username = ?, name = ? WHERE username = ?").run("Mari Luz Sanabria", "Mari Luz Sanabria", "agente");
    db.prepare("UPDATE users SET name = ? WHERE username = ?").run("Mari Luz Sanabria", "Mari Luz Sanabria");
    db.prepare(`UPDATE customers
      SET email = lower(first_name || '.' || replace(last_name, ' ', '.') || id || '@example.com')
      WHERE email IS NULL OR trim(email) = ''`).run();
    return;
  }

  const insertUser = db.prepare("INSERT INTO users (username, password_hash, name, role) VALUES (?, ?, ?, ?)");
  insertUser.run("Mari Luz Sanabria", process.env.TRAINING_PASSWORD_HASH || DEFAULT_TRAINING_PASSWORD_HASH, "Mari Luz Sanabria", "training_agent");

  const insertCarrier = db.prepare("INSERT INTO carriers (name, email, phone) VALUES (?, ?, ?)");
  carriers.forEach((c) => insertCarrier.run(...c));

  const insertCustomer = db.prepare(`INSERT INTO customers
    (customer_number, first_name, last_name, dni, email, phone, address, postal_code, city, country, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  for (let i = 1; i <= 100; i++) {
    const first = pick(firstNames);
    const last = `${pick(lastNames)} ${pick(lastNames)}`;
    const city = pick(cities);
    insertCustomer.run(
      `CL-${String(10000 + i).padStart(5, "0")}`,
      first,
      last,
      `${Math.floor(10000000 + Math.random() * 80000000)}${pick("TRWAGMYFPDXBNJZSQVHLCKE")}`,
      `${first.toLowerCase()}.${last.split(" ")[0].toLowerCase()}${i}@example.com`,
      `6${Math.floor(10000000 + Math.random() * 89999999)}`,
      `${pick(streets)} ${Math.floor(8 + Math.random() * 190)}, ${Math.ceil(Math.random() * 6)} ${pick(["A", "B", "C", "D"])}`,
      city[1],
      city[0],
      "Espana",
      date(-Math.floor(Math.random() * 500))
    );
  }

  const insertOrder = db.prepare(`INSERT INTO orders
    (order_number, customer_id, order_date, total_amount, payment_method, payment_last_four, order_status, payment_status, carrier_id, tracking_number, estimated_delivery, cancellation_reason)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  const insertItem = db.prepare("INSERT INTO order_items (order_id, product_name, category, size, quantity, unit_price) VALUES (?, ?, ?, ?, ?, ?)");

  for (let i = 1; i <= 250; i++) {
    const forced = i <= 45 ? statuses[Math.floor((i - 1) / 15)] : pick(statuses);
    const customerId = 1 + Math.floor(Math.random() * 100);
    const carrierId = 1 + Math.floor(Math.random() * 5);
    const itemCount = 1 + Math.floor(Math.random() * 3);
    const orderNo = i === 1 ? "NV-284739" : `NV-${String(284739 + i).padStart(6, "0")}`;
    const estimated = forced === "RETRASADO" ? date(-3 - Math.floor(Math.random() * 4)) : date(1 + Math.floor(Math.random() * 8));
    const paymentStatus = forced === "CANCELADO" ? "COBRADO" : "COBRADO";
    const result = insertOrder.run(orderNo, customerId, date(-Math.floor(Math.random() * 20)), 0, "Visa", String(1000 + Math.floor(Math.random() * 8999)), forced, paymentStatus, carrierId, `${["RG", "IE", "NP", "FR", "BB"][carrierId - 1]}-${Math.floor(10000000 + Math.random() * 89999999)}`, estimated, forced === "CANCELADO" ? pick(cancelReasons) : null);
    let total = 0;
    for (let j = 0; j < itemCount; j++) {
      const p = pick(products);
      const price = Number((19.95 + Math.random() * 85).toFixed(2));
      const qty = 1 + Math.floor(Math.random() * 2);
      total += price * qty;
      insertItem.run(result.lastInsertRowid, p[0], p[1], pick(sizes), qty, price);
    }
    db.prepare("UPDATE orders SET total_amount = ? WHERE id = ?").run(Number(total.toFixed(2)), result.lastInsertRowid);
  }

  db.prepare(`UPDATE orders SET customer_id=1, total_amount=89.95, payment_last_four='4587', order_status='RETRASADO', carrier_id=1, tracking_number='RG-83749203', estimated_delivery='2026-08-05' WHERE order_number='NV-284739'`).run();
  db.prepare("DELETE FROM order_items WHERE order_id = (SELECT id FROM orders WHERE order_number='NV-284739')").run();
  const firstOrderId = row("SELECT id FROM orders WHERE order_number='NV-284739'").id;
  insertItem.run(firstOrderId, "Vestido Linen Summer", "Vestidos", "M", 1, 39.95);
  insertItem.run(firstOrderId, "Zapatillas Urban White", "Calzado", "40", 1, 50.0);

  const agentId = row("SELECT id FROM users WHERE username='Mari Luz Sanabria'").id;
  db.prepare("INSERT INTO customer_interactions (customer_id, order_id, agent_id, interaction_type, notes, created_at) VALUES (?, ?, ?, ?, ?, ?)").run(1, firstOrderId, agentId, "Nota historica", "Cliente consulta plazo de entrega en pedido anterior. Se informa correctamente.", "2026-07-18T11:20:00.000Z");
  db.prepare("INSERT INTO carrier_emails (order_id, carrier_id, agent_id, recipient, subject, message, sent_at) VALUES (?, ?, ?, ?, ?, ?, ?)").run(firstOrderId, 1, agentId, "incidencias@rapidgo.test", "Consulta previa NV-284739", "Comunicacion simulada de ejemplo.", "2026-08-07T09:42:00.000Z");
  db.prepare("INSERT INTO refunds (order_id, customer_id, amount, reason, reference, created_at) VALUES (?, ?, ?, ?, ?, ?)").run(2, 1, 24.95, "Devolucion parcial de ejemplo", "RF-120045", "2026-07-22T15:12:00.000Z");

  const insertCall = db.prepare(`INSERT INTO training_calls
    (customer_id, order_id, scenario_type, started_at, finished_at, result, score, actions_json, verification_json, active)
    SELECT customer_id, id, order_status, ?, ?, ?, ?, ?, ?, 0 FROM orders WHERE order_number = ?`);
  const resultJson = JSON.stringify({
    customerIdentification: "Correcta",
    verified: "4/4",
    orderLocated: "Correcto",
    actionApplied: "Correcta",
    carrierEmail: "No necesario",
    refund: "No necesario",
    crmNote: "Realizada"
  });
  const actionsJson = JSON.stringify({ customerFound: true, orderFound: true, correctAction: true, informedCustomer: true, noteSaved: true });
  const verificationJson = JSON.stringify({ name: true, email: true, address: true, postal: true });
  ["NV-284741", "NV-284742", "NV-284743", "NV-284744", "NV-284745", "NV-284746", "NV-284747", "NV-284748"].forEach((orderNumber, index) => {
    insertCall.run(`2026-08-0${index + 1}T09:15:00.000Z`, `2026-08-0${index + 1}T09:19:00.000Z`, resultJson, 84 + index, actionsJson, verificationJson, orderNumber);
  });
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  seed();
  console.log("Base de datos NOVAWEAR lista con datos ficticios.");
}
