import crypto from "node:crypto";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import cors from "cors";
import { all, db, nowIso, row, run } from "./db.js";
import { seed } from "./seed.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
seed();
console.log("Base de datos NOVAWEAR lista con datos ficticios.");
const app = express();
const PORT = process.env.PORT || 4000;
const sessions = new Map();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "1mb" }));

function hash(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

function auth(req, res, next) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  const userId = sessions.get(token);
  if (!userId) return res.status(401).json({ error: "No autorizado" });
  req.user = row("SELECT id, username, name, role FROM users WHERE id=?", [userId]);
  next();
}

function orderDetails(orderNumberOrId, byNumber = true) {
  const where = byNumber ? "o.order_number = ?" : "o.id = ?";
  const order = row(`SELECT o.*, c.customer_number, c.first_name, c.last_name, c.dni, c.email, c.phone, c.address, c.postal_code, c.city, c.country, ca.name carrier_name, ca.email carrier_email, ca.phone carrier_phone
    FROM orders o JOIN customers c ON c.id=o.customer_id JOIN carriers ca ON ca.id=o.carrier_id WHERE ${where}`, [orderNumberOrId]);
  if (!order) return null;
  order.items = all("SELECT * FROM order_items WHERE order_id=?", [order.id]);
  order.interactions = all("SELECT * FROM customer_interactions WHERE order_id=? ORDER BY created_at DESC", [order.id]);
  order.carrierEmails = all("SELECT * FROM carrier_emails WHERE order_id=? ORDER BY sent_at DESC", [order.id]);
  order.refunds = all("SELECT * FROM refunds WHERE order_id=? ORDER BY created_at DESC", [order.id]);
  return order;
}

app.post("/api/login", (req, res) => {
  const user = row("SELECT * FROM users WHERE username=? AND password_hash=?", [req.body.username, hash(req.body.password)]);
  if (!user) return res.status(401).json({ error: "Credenciales incorrectas" });
  const token = crypto.randomUUID();
  sessions.set(token, user.id);
  res.json({ token, user: { id: user.id, username: user.username, name: user.name, role: user.role } });
});

app.get("/api/me", auth, (req, res) => res.json(req.user));

app.get("/api/dashboard", auth, (_req, res) => {
  res.json({
    customers: row("SELECT COUNT(*) count FROM customers").count,
    orders: row("SELECT COUNT(*) count FROM orders").count,
    delayed: row("SELECT COUNT(*) count FROM orders WHERE order_status='RETRASADO'").count,
    cancelled: row("SELECT COUNT(*) count FROM orders WHERE order_status='CANCELADO'").count,
    calls: all("SELECT * FROM training_calls ORDER BY id DESC LIMIT 8")
  });
});

app.get("/api/customers/search", auth, (req, res) => {
  const q = `%${(req.query.q || "").trim()}%`;
  const customers = all(`SELECT DISTINCT c.*, (SELECT COUNT(*) FROM orders o WHERE o.customer_id=c.id) order_count
    FROM customers c LEFT JOIN orders o ON o.customer_id=c.id
    WHERE c.customer_number LIKE ? OR c.first_name || ' ' || c.last_name LIKE ? OR c.email LIKE ? OR c.phone LIKE ? OR c.dni LIKE ? OR o.order_number LIKE ?
    ORDER BY c.last_name LIMIT 20`, [q, q, q, q, q, q]);
  res.json(customers);
});

app.get("/api/customers/:id", auth, (req, res) => {
  const customer = row("SELECT *, (SELECT COUNT(*) FROM orders WHERE customer_id=customers.id) order_count FROM customers WHERE id=?", [req.params.id]);
  if (!customer) return res.status(404).json({ error: "Cliente no encontrado" });
  customer.orders = all("SELECT * FROM orders WHERE customer_id=? ORDER BY order_date DESC", [customer.id]);
  customer.interactions = all("SELECT * FROM customer_interactions WHERE customer_id=? ORDER BY created_at DESC LIMIT 20", [customer.id]);
  res.json(customer);
});

app.get("/api/orders/search", auth, (req, res) => {
  const q = `%${(req.query.q || "").trim()}%`;
  const orders = all(`SELECT o.*, c.first_name, c.last_name, ca.name carrier_name FROM orders o
    JOIN customers c ON c.id=o.customer_id JOIN carriers ca ON ca.id=o.carrier_id
    WHERE o.order_number LIKE ? OR o.tracking_number LIKE ? OR c.email LIKE ? OR c.phone LIKE ?
    ORDER BY o.order_date DESC LIMIT 30`, [q, q, q, q]);
  res.json(orders);
});

app.get("/api/orders/:orderNumber", auth, (req, res) => {
  const order = orderDetails(req.params.orderNumber);
  if (!order) return res.status(404).json({ error: "Pedido no encontrado" });
  res.json(order);
});

app.get("/api/carriers", auth, (_req, res) => res.json(all("SELECT * FROM carriers ORDER BY name")));
app.get("/api/emails", auth, (_req, res) => res.json(all(`
  SELECT e.id, e.sent_at, o.order_number, ca.name AS destination_name, e.recipient, e.subject, 'Transportista' AS email_type
  FROM carrier_emails e JOIN orders o ON o.id=e.order_id JOIN carriers ca ON ca.id=e.carrier_id
  UNION ALL
  SELECT e.id, e.sent_at, o.order_number, c.first_name || ' ' || c.last_name AS destination_name, e.recipient, e.subject, 'Cliente' AS email_type
  FROM customer_emails e JOIN orders o ON o.id=e.order_id JOIN customers c ON c.id=e.customer_id
  ORDER BY sent_at DESC LIMIT 100`)));
app.get("/api/refunds", auth, (_req, res) => res.json(all(`SELECT r.*, o.order_number, c.first_name, c.last_name FROM refunds r JOIN orders o ON o.id=r.order_id JOIN customers c ON c.id=r.customer_id ORDER BY created_at DESC LIMIT 100`)));
app.get("/api/history", auth, (_req, res) => res.json(all(`SELECT t.*, o.order_number, c.first_name, c.last_name FROM training_calls t JOIN orders o ON o.id=t.order_id JOIN customers c ON c.id=t.customer_id ORDER BY t.id DESC LIMIT 100`)));

app.post("/api/training/new-call", auth, (_req, res) => {
  run("UPDATE training_calls SET active=0 WHERE active=1");
  const order = row(`SELECT o.*, c.first_name, c.last_name, c.phone, c.email, c.address, c.postal_code FROM orders o JOIN customers c ON c.id=o.customer_id ORDER BY RANDOM() LIMIT 1`);
  const result = run("INSERT INTO training_calls (customer_id, order_id, scenario_type, active, verification_json, actions_json) VALUES (?, ?, ?, 1, '{}', '{}')", [order.customer_id, order.id, order.order_status]);
  res.json({ callId: result.lastInsertRowid, customerName: `${order.first_name} ${order.last_name}`, orderNumber: order.order_number, phone: order.phone, email: order.email, address: order.address, postalCode: order.postal_code, reason: "Consulta sobre pedido", status: "incoming" });
});

app.post("/api/training/:id/start", auth, (req, res) => {
  run("UPDATE training_calls SET started_at=?, active=1 WHERE id=?", [nowIso(), req.params.id]);
  res.json(row("SELECT * FROM training_calls WHERE id=?", [req.params.id]));
});

app.get("/api/training/active", auth, (_req, res) => {
  const call = row(`SELECT t.*, o.order_number, c.first_name, c.last_name, c.phone, c.email, c.address, c.postal_code FROM training_calls t JOIN orders o ON o.id=t.order_id JOIN customers c ON c.id=t.customer_id WHERE t.active=1 ORDER BY t.id DESC LIMIT 1`);
  res.json(call || null);
});

app.patch("/api/training/:id/verify", auth, (req, res) => {
  run("UPDATE training_calls SET verification_json=? WHERE id=?", [JSON.stringify(req.body), req.params.id]);
  res.json({ ok: true });
});

app.patch("/api/training/:id/actions", auth, (req, res) => {
  const call = row("SELECT actions_json FROM training_calls WHERE id=?", [req.params.id]);
  if (!call) return res.status(404).json({ error: "Llamada no encontrada" });
  const current = JSON.parse(call.actions_json || "{}");
  run("UPDATE training_calls SET actions_json=? WHERE id=?", [JSON.stringify({ ...current, ...req.body }), req.params.id]);
  res.json({ ok: true });
});

app.post("/api/orders/:orderNumber/carrier-email", auth, (req, res) => {
  const order = orderDetails(req.params.orderNumber);
  if (!order) return res.status(404).json({ error: "Pedido no encontrado" });
  const sentAt = nowIso();
  const result = run("INSERT INTO carrier_emails (order_id, carrier_id, agent_id, recipient, subject, message, sent_at) VALUES (?, ?, ?, ?, ?, ?, ?)", [order.id, order.carrier_id, req.user.id, req.body.recipient, req.body.subject, req.body.message, sentAt]);
  res.json({ id: result.lastInsertRowid, sent_at: sentAt, agent: req.user.name, carrier: order.carrier_name });
});

app.post("/api/orders/:orderNumber/customer-email", auth, (req, res) => {
  const order = orderDetails(req.params.orderNumber);
  if (!order) return res.status(404).json({ error: "Pedido no encontrado" });
  const sentAt = nowIso();
  const result = run("INSERT INTO customer_emails (order_id, customer_id, agent_id, recipient, subject, message, sent_at) VALUES (?, ?, ?, ?, ?, ?, ?)", [order.id, order.customer_id, req.user.id, req.body.recipient, req.body.subject, req.body.message, sentAt]);
  run("INSERT INTO customer_interactions (customer_id, order_id, agent_id, interaction_type, notes, created_at) VALUES (?, ?, ?, ?, ?, ?)", [order.customer_id, order.id, req.user.id, "Email cliente", `Email simulado enviado al cliente sobre el pedido ${order.order_number}: ${req.body.subject}`, sentAt]);
  res.json({ id: result.lastInsertRowid, sent_at: sentAt, agent: req.user.name, customer: `${order.first_name} ${order.last_name}` });
});

app.post("/api/orders/:orderNumber/refund", auth, (req, res) => {
  const order = orderDetails(req.params.orderNumber);
  if (!order) return res.status(404).json({ error: "Pedido no encontrado" });
  const reference = `RF-${Math.floor(100000 + Math.random() * 899999)}`;
  const createdAt = nowIso();
  run("INSERT INTO refunds (order_id, customer_id, amount, reason, reference, created_at) VALUES (?, ?, ?, ?, ?, ?)", [order.id, order.customer_id, order.total_amount, req.body.reason || "Pedido cancelado", reference, createdAt]);
  run("UPDATE orders SET payment_status='REEMBOLSADO' WHERE id=?", [order.id]);
  run("INSERT INTO customer_interactions (customer_id, order_id, agent_id, interaction_type, notes, created_at) VALUES (?, ?, ?, ?, ?, ?)", [order.customer_id, order.id, req.user.id, "Reembolso", `Se procesa reembolso completo correspondiente al pedido ${order.order_number} por importe de ${order.total_amount.toFixed(2)} EUR debido a cancelacion del pedido.`, createdAt]);
  res.json({ reference, amount: order.total_amount, method: `${order.payment_method} ****${order.payment_last_four}`, created_at: createdAt, eta: "3-5 dias laborables" });
});

app.post("/api/orders/:orderNumber/note", auth, (req, res) => {
  const order = orderDetails(req.params.orderNumber);
  if (!order) return res.status(404).json({ error: "Pedido no encontrado" });
  run("INSERT INTO customer_interactions (customer_id, order_id, agent_id, interaction_type, notes, created_at) VALUES (?, ?, ?, ?, ?, ?)", [order.customer_id, order.id, req.user.id, req.body.type || "Nota CRM", req.body.notes, nowIso()]);
  res.json({ ok: true });
});

app.post("/api/training/:id/finish", auth, (req, res) => {
  const call = row("SELECT * FROM training_calls WHERE id=?", [req.params.id]);
  if (!call) return res.status(404).json({ error: "Llamada no encontrada" });
  const order = orderDetails(call.order_id, false);
  const storedVerification = JSON.parse(call.verification_json || "{}");
  const storedActions = JSON.parse(call.actions_json || "{}");
  const verification = { ...storedVerification, ...(req.body.verification || {}) };
  const actions = { ...storedActions, ...(req.body.actions || {}) };
  const verifiedCount = ["name", "email", "address", "postal"].filter((k) => verification[k]).length;
  let score = 25 + verifiedCount * 8;
  if (actions.customerFound) score += 10;
  if (actions.orderFound) score += 10;
  if (order.order_status === "RETRASADO") score += actions.emailSent ? 15 : -10;
  if (order.order_status === "CANCELADO") score += (actions.customerEmailSent ? 8 : -6) + (actions.refundProcessed ? 12 : -10);
  if (order.order_status === "EN TIEMPO") score += actions.customerEmailSent ? 15 : -10;
  if (actions.noteSaved) score += 8;
  score = Math.max(0, Math.min(100, score));
  const result = {
    customerIdentification: actions.customerFound ? "Correcta" : "Incorrecta",
    verified: `${verifiedCount}/4`,
    orderLocated: actions.orderFound ? "Correcto" : "Incorrecto",
    actionApplied: actions.correctAction ? "Correcta" : "Revisar",
    customerEmail: order.order_status === "RETRASADO" ? "No necesario" : (actions.customerEmailSent ? "Correcto" : "Incorrecto"),
    carrierEmail: order.order_status === "RETRASADO" ? (actions.emailSent ? "Correcto" : "Incorrecto") : "No necesario",
    refund: order.order_status === "CANCELADO" ? (actions.refundProcessed ? "Correcto" : "Incorrecto") : "No necesario",
    crmNote: actions.noteSaved ? "Realizada" : "No realizada"
  };
  run("UPDATE training_calls SET finished_at=?, result=?, score=?, actions_json=?, verification_json=?, active=0 WHERE id=?", [nowIso(), JSON.stringify(result), score, JSON.stringify(actions), JSON.stringify(verification), req.params.id]);
  res.json({ result, score, orderStatus: order.order_status });
});

const frontendDist = join(__dirname, "..", "..", "frontend", "dist");
if (existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get("*", (_req, res) => res.sendFile(join(frontendDist, "index.html")));
}

app.listen(PORT, () => console.log(`NOVAWEAR backend en http://localhost:${PORT}`));
