import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { CheckCircle2, Clock, Copy, CreditCard, ExternalLink, History, Inbox, LayoutDashboard, Mail, PackageSearch, Phone, Search, Truck, UserRound } from "lucide-react";
import { localApi, localLogin, localMe } from "./localApi.js";
import "./styles.css";

const API = import.meta.env.VITE_API_URL || (["localhost", "127.0.0.1"].includes(window.location.hostname) ? "http://localhost:4000/api" : "/api");
const STATIC_MODE = import.meta.env.VITE_STATIC_MODE === "true";

function useAuth() {
  const [token, setToken] = useState(localStorage.getItem("nw_token"));
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("nw_user") || "null"));
  useEffect(() => {
    if (!token) return;
    if (STATIC_MODE) {
      localMe().then((freshUser) => {
        localStorage.setItem("nw_user", JSON.stringify(freshUser));
        setUser(freshUser);
      });
      return;
    }
    fetch(`${API}/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.ok ? res.json() : null)
      .then((freshUser) => {
        if (!freshUser) return;
        localStorage.setItem("nw_user", JSON.stringify(freshUser));
        setUser(freshUser);
      })
      .catch(() => {});
  }, [token]);
  const login = async (username, password) => {
    if (STATIC_MODE) {
      const data = await localLogin(username, password);
      localStorage.setItem("nw_token", data.token);
      localStorage.setItem("nw_user", JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      return;
    }
    const res = await fetch(`${API}/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, password }) });
    if (!res.ok) throw new Error("Credenciales incorrectas");
    const data = await res.json();
    localStorage.setItem("nw_token", data.token);
    localStorage.setItem("nw_user", JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
  };
  return { token, user, login };
}

function useApi(token) {
  return useMemo(() => async (path, options = {}) => {
    if (STATIC_MODE) return localApi(path, options);
    const res = await fetch(`${API}${path}`, {
      ...options,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(options.headers || {}) }
    });
    if (res.status === 401) {
      localStorage.removeItem("nw_token");
      localStorage.removeItem("nw_user");
      window.location.href = "/";
      throw new Error("Sesión caducada");
    }
    if (!res.ok) throw new Error((await res.json()).error || "Error de API");
    return res.json();
  }, [token]);
}

function Layout({ user, children }) {
  const location = useLocation();
  const nav = [
    ["/dashboard", LayoutDashboard, "Inicio"], ["/crm", UserRound, "Clientes"], ["/orders", PackageSearch, "Pedidos"],
    ["/carriers", Truck, "Transportistas"], ["/emails", Mail, "Emails"], ["/refunds", CreditCard, "Reembolsos"],
    ["/history", History, "Historial"], ["/training", Phone, "Entrenamiento"]
  ];
  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand">NOVAWEAR<span>Customer Service Workspace</span></div>
      <nav>{nav.map(([to, Icon, label]) => <Link key={to} className={location.pathname === to ? "active" : ""} to={to}><Icon size={18} />{label}</Link>)}</nav>
    </aside>
    <main>
      <header className="topbar"><strong>NOVAWEAR</strong><span>Agente: {user?.name || "Agente Formacion"}</span><span className="pill ok">Disponible</span></header>
      {children}
    </main>
  </div>;
}

function Login({ login }) {
  const [username, setUsername] = useState("agente");
  const [password, setPassword] = useState("novawear123");
  const [error, setError] = useState("");
  return <div className="login">
    <form onSubmit={async (e) => { e.preventDefault(); try { await login(username, password); } catch (err) { setError(err.message); } }}>
      <h1>NOVAWEAR</h1><p>Customer Service Workspace</p>
      <label>Usuario<input value={username} onChange={(e) => setUsername(e.target.value)} /></label>
      <label>Contraseña<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
      {error && <div className="alert danger">{error}</div>}
      <button>Entrar</button>
    </form>
  </div>;
}

function Dashboard({ api }) {
  const [data, setData] = useState(null);
  useEffect(() => { api("/dashboard").then(setData); }, [api]);
  if (!data) return <Section title="Inicio" />;
  return <Section title="Panel operativo">
    <div className="metrics">
      <Metric label="Clientes" value={data.customers} /><Metric label="Pedidos" value={data.orders} />
      <Metric label="Retrasados" value={data.delayed} /><Metric label="Cancelados" value={data.cancelled} />
      <button className="metric dpa-metric" type="button"><span>NO DPA</span><strong>{data.dpaFailed}</strong></button>
    </div>
    <h2>Últimas llamadas</h2><Table rows={data.calls} cols={["id", "scenario_type", "started_at", "finished_at", "score"]} />
  </Section>;
}

function Metric({ label, value }) { return <div className="metric"><span>{label}</span><strong>{value}</strong></div>; }
function Section({ title, children }) { return <section className="page"><h1>{title}</h1>{children}</section>; }
function CopyValue({ value }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(String(value ?? ""));
    setCopied(true);
    setTimeout(() => setCopied(false), 1100);
  };
  return <span className="copy-value"><span>{value}</span><button className="copy-btn" type="button" title={copied ? "Copiado" : "Copiar"} onClick={copy}><Copy size={14} /></button></span>;
}

function startIncomingRing() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return () => {};
  const ctx = new AudioContext();
  const master = ctx.createGain();
  master.gain.value = 0.16;
  master.connect(ctx.destination);
  let stopped = false;
  let timeoutId;
  const beep = (delay) => {
    const oscA = ctx.createOscillator();
    const oscB = ctx.createOscillator();
    const gain = ctx.createGain();
    oscA.type = "sine";
    oscB.type = "sine";
    oscA.frequency.setValueAtTime(440, ctx.currentTime + delay);
    oscB.frequency.setValueAtTime(480, ctx.currentTime + delay);
    gain.gain.setValueAtTime(0, ctx.currentTime + delay);
    gain.gain.linearRampToValueAtTime(1, ctx.currentTime + delay + 0.02);
    gain.gain.setValueAtTime(1, ctx.currentTime + delay + 0.9);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + delay + 1.05);
    oscA.connect(gain);
    oscB.connect(gain);
    gain.connect(master);
    oscA.start(ctx.currentTime + delay);
    oscB.start(ctx.currentTime + delay);
    oscA.stop(ctx.currentTime + delay + 1.08);
    oscB.stop(ctx.currentTime + delay + 1.08);
  };
  const ring = () => {
    if (stopped) return;
    beep(0);
    beep(1.25);
    timeoutId = window.setTimeout(ring, 4200);
  };
  ring();
  return () => {
    stopped = true;
    window.clearTimeout(timeoutId);
    ctx.close().catch(() => {});
  };
}

function CustomerSearch({ api, onVerified }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [customer, setCustomer] = useState(null);
  const [checks, setChecks] = useState({ name: false, email: false, address: false, postal: false });
  const search = async (term = q) => setResults(await api(`/customers/search?q=${encodeURIComponent(term)}`));
  const openCustomer = async (id) => {
    const c = await api(`/customers/${id}`);
    setCustomer(c);
    onVerified?.({ customerFound: true });
    if (!onVerified) syncActive(api, "actions", { customerFound: true });
  };
  useEffect(() => { const t = setTimeout(() => q && search(), 250); return () => clearTimeout(t); }, [q]);
  useEffect(() => {
    onVerified?.({ verification: checks });
    if (!onVerified) syncActive(api, "verify", checks);
  }, [checks]);
  return <div className="grid two">
    <div className="panel">
      <h2>Buscar cliente</h2>
      <div className="searchbox"><Search size={18} /><input placeholder="Pedido, nombre, email, teléfono, DNI o ID cliente" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      <div className="list">{results.map((c) => <button className="rowbtn" key={c.id} onClick={() => openCustomer(c.id)}>{c.customer_number}<strong>{c.first_name} {c.last_name}</strong><span>{c.email}</span></button>)}</div>
    </div>
    <div className="panel">
      <h2>Ficha del cliente</h2>
      {!customer ? <p className="muted">Busca por el dato facilitado durante la llamada.</p> : <>
        <div className="detail">
          <b>ID Cliente</b><CopyValue value={customer.customer_number} /><b>Nombre</b><CopyValue value={`${customer.first_name} ${customer.last_name}`} />
          <b>DNI</b><CopyValue value={customer.dni} /><b>Email</b><CopyValue value={customer.email} /><b>Teléfono</b><CopyValue value={customer.phone} />
          <b>Dirección</b><CopyValue value={customer.address} /><b>Código Postal</b><CopyValue value={customer.postal_code} /><b>Ciudad</b><CopyValue value={customer.city} />
          <b>País</b><CopyValue value={customer.country} /><b>Fecha de alta</b><CopyValue value={fmt(customer.created_at)} /><b>Número de pedidos</b><CopyValue value={customer.order_count} />
        </div>
        <h3>Datos a verificar con el cliente</h3>
        <div className="checks">{[
          ["name", "Nombre verificado"], ["email", "Email verificado"], ["address", "Dirección verificada"], ["postal", "Código postal verificado"]
        ].map(([k, label]) => <label key={k}><input type="checkbox" checked={checks[k]} onChange={(e) => setChecks({ ...checks, [k]: e.target.checked })} />{label}</label>)}</div>
        <h3>Pedidos anteriores</h3><Table rows={customer.orders} cols={["order_number", "order_date", "total_amount", "order_status", "payment_status"]} />
      </>}
    </div>
  </div>;
}

function CRM({ api }) {
  return <Section title="CRM Clientes"><CustomerSearch api={api} /></Section>;
}

function OrderTool({ api, trainingState, setTrainingState, agentName = "Mari Luz Sanabria" }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [order, setOrder] = useState(null);
  const [note, setNote] = useState("");
  const [email, setEmail] = useState(null);
  const [sent, setSent] = useState(null);
  const [refund, setRefund] = useState(null);
  const search = async (term = q) => setResults(await api(`/orders/search?q=${encodeURIComponent(term)}`));
  const openOrder = async (orderNumber) => {
    const o = await api(`/orders/${orderNumber}`);
    setOrder(o);
    setTrainingState?.({ ...trainingState, actions: { ...trainingState.actions, orderFound: true } });
    syncActive(api, "actions", { orderFound: true });
  };
  useEffect(() => { const t = setTimeout(() => q && search(), 250); return () => clearTimeout(t); }, [q]);
  const verified = Object.values(trainingState?.verification || {}).filter(Boolean).length === 4;
  const defaultEmail = () => setEmail({
    type: "carrier",
    recipient: order.carrier_email,
    subject: `Entrega urgente pedido retrasado ${order.order_number}`,
    message: `Buenos dias,\n\nMi nombre es ${agentName}, del Departamento de Atencion al Cliente de NOVAWEAR.\n\nContactamos en relacion con el envio asociado al pedido ${order.order_number}.\n\nNumero de seguimiento:\n${order.tracking_number}\n\nLa fecha estimada de entrega era el ${fmt(order.estimated_delivery)} y actualmente el pedido continua sin entregarse.\n\nSolicitamos priorizar este envio con entrega urgente e indicarnos informacion actualizada sobre su estado y nueva fecha estimada de entrega.\n\nGracias.\n\n${agentName}\nDepartamento de Atencion al Cliente\nNOVAWEAR`
  });
  const defaultCustomerEmail = () => setEmail({
    type: "customer",
    recipient: order.email,
    subject: order.order_status === "CANCELADO" ? `Cancelacion y abono del pedido ${order.order_number}` : `Informacion sobre su pedido ${order.order_number}`,
    message: order.order_status === "CANCELADO"
      ? `Buenos dias ${order.first_name},\n\nMi nombre es ${agentName}, del Departamento de Atencion al Cliente de NOVAWEAR.\n\nLe contactamos en relacion con su pedido ${order.order_number}.\n\nEl pedido consta como cancelado por el siguiente motivo:\n${order.cancellation_reason}\n\nVamos a gestionar el abono del importe cobrado por un total de ${money(order.total_amount)} en el metodo de pago original ${order.payment_method} **** ${order.payment_last_four}.\n\nEl plazo estimado para recibir el abono es de 3-5 dias laborables desde su procesamiento.\n\nDisculpe las molestias ocasionadas.\n\n${agentName}\nDepartamento de Atencion al Cliente\nNOVAWEAR`
      : `Buenos dias ${order.first_name},\n\nMi nombre es ${agentName}, del Departamento de Atencion al Cliente de NOVAWEAR.\n\nLe contactamos en relacion con su pedido ${order.order_number}.\n\nHemos comprobado el estado del pedido y actualmente se encuentra dentro del plazo previsto de entrega.\n\nFecha estimada de entrega:\n${fmt(order.estimated_delivery)}\n\nNo es necesario realizar ninguna gestion adicional en este momento.\n\nGracias por confiar en NOVAWEAR.\n\n${agentName}\nDepartamento de Atencion al Cliente\nNOVAWEAR`
  });
  const saveNote = async () => {
    await api(`/orders/${order.order_number}/note`, { method: "POST", body: JSON.stringify({ notes: note, type: "Nota CRM" }) });
    setTrainingState?.({ ...trainingState, actions: { ...trainingState.actions, noteSaved: true } });
    syncActive(api, "actions", { noteSaved: true });
    setNote("");
  };
  const sendEmail = async () => {
    const endpoint = email.type === "customer" ? "customer-email" : "carrier-email";
    const data = await api(`/orders/${order.order_number}/${endpoint}`, { method: "POST", body: JSON.stringify(email) });
    setSent(data);
    const actionPatch = email.type === "customer" ? { customerEmailSent: true, informedCustomer: true, correctAction: true } : { emailSent: true, correctAction: true };
    setTrainingState?.({ ...trainingState, actions: { ...trainingState.actions, ...actionPatch } });
    syncActive(api, "actions", actionPatch);
  };
  const doRefund = async () => {
    const data = await api(`/orders/${order.order_number}/refund`, { method: "POST", body: JSON.stringify({ reason: "Pedido cancelado" }) });
    setRefund(data);
    setTrainingState?.({ ...trainingState, actions: { ...trainingState.actions, refundProcessed: true, correctAction: true } });
    syncActive(api, "actions", { refundProcessed: true, correctAction: true });
    openOrder(order.order_number);
  };
  return <div className="grid two">
    <div className="panel">
      <h2>Buscar pedido</h2>
      <div className="searchbox"><PackageSearch size={18} /><input placeholder="Número de pedido o seguimiento" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      <div className="list">{results.map((o) => <button className="rowbtn" key={o.id} onClick={() => openOrder(o.order_number)}>{o.order_number}<strong>{o.first_name} {o.last_name}</strong><span>{o.order_status} · {o.carrier_name}</span></button>)}</div>
    </div>
    <div className="panel">
      <h2>Gestión de pedido</h2>
      {!order ? <p className="muted">Localiza el pedido para decidir la acción adecuada.</p> : <>
        <div className="order-head"><div><strong>Pedido {order.order_number}</strong><span>{order.first_name} {order.last_name}</span></div><span className={`pill ${statusClass(order.order_status)}`}>{order.order_status}</span></div>
        <div className="detail">
          <b>Fecha compra</b><CopyValue value={fmt(order.order_date)} /><b>Importe</b><CopyValue value={money(order.total_amount)} /><b>Método pago</b><CopyValue value={`${order.payment_method} **** ${order.payment_last_four}`} />
          <b>Transportista</b><CopyValue value={order.carrier_name} /><b>Seguimiento</b><CopyValue value={order.tracking_number} /><b>Entrega estimada</b><CopyValue value={fmt(order.estimated_delivery)} /><b>Estado pago</b><CopyValue value={order.payment_status} />
        </div>
        <Table rows={order.items} cols={["quantity", "product_name", "category", "size", "unit_price"]} />
        <Scenario order={order} verified={verified} defaultEmail={defaultEmail} defaultCustomerEmail={defaultCustomerEmail} doRefund={doRefund} refund={refund} setTrainingState={setTrainingState} trainingState={trainingState} api={api} />
        {email && <div className="modal"><div className="modal-body"><h2>Email simulado</h2><label>Para<input value={email.recipient} onChange={(e) => setEmail({ ...email, recipient: e.target.value })} /></label><label>Asunto<input value={email.subject} onChange={(e) => setEmail({ ...email, subject: e.target.value })} /></label><label>Cuerpo<textarea value={email.message} onChange={(e) => setEmail({ ...email, message: e.target.value })} /></label><button onClick={sendEmail}>Enviar email</button><button className="secondary" onClick={() => setEmail(null)}>Cerrar</button>{sent && <div className="alert ok">Email enviado correctamente · {fmtTime(sent.sent_at)} · {sent.agent} · {sent.carrier || sent.customer}</div>}</div></div>}
        <h3>Nota CRM</h3><textarea placeholder="Escribe el resumen de la llamada" value={note} onChange={(e) => setNote(e.target.value)} /><button disabled={!note.trim()} onClick={saveNote}>Guardar nota CRM</button>
      </>}
    </div>
  </div>;
}

function Scenario({ order, verified, defaultEmail, defaultCustomerEmail, doRefund, refund, trainingState, setTrainingState, api }) {
  if (order.order_status === "EN TIEMPO") return <div className="scenario"><p>El pedido se encuentra dentro del plazo estimado de entrega.</p><div className="actions-row"><button onClick={defaultCustomerEmail}>Enviar email al cliente</button></div><div className="hint">Su pedido se encuentra actualmente dentro del plazo previsto de entrega. La fecha estimada es el {fmt(order.estimated_delivery)}.</div></div>;
  if (order.order_status === "RETRASADO") return <div className="scenario danger-soft"><p>Fecha prevista: {fmt(order.estimated_delivery)} · Fecha actual: 08/08/2026 · Días de retraso: {delayDays(order.estimated_delivery)}</p><p>Este pedido necesita consulta con la empresa de transporte.</p><button onClick={defaultEmail}>Contactar transportista</button>{!verified && <span className="muted">Puedes consultar al transportista. Para reembolsos se exigirá verificación completa.</span>}</div>;
  return <div className="scenario warn-soft"><p>Motivo de cancelación: {order.cancellation_reason}</p><p>Importe del pedido: {money(order.total_amount)} · Estado del pago: {order.payment_status}</p><div className="actions-row"><button className="secondary" onClick={defaultCustomerEmail}>Enviar email al cliente</button><button disabled={order.payment_status === "REEMBOLSADO"} onClick={doRefund}>Gestionar reembolso</button></div>{refund && <div className="alert ok">Reembolso procesado · {refund.reference} · {money(refund.amount)} · {refund.eta}</div>}{!verified && <span className="muted">Puedes gestionar el reembolso. La verificación completa seguirá sumando en la puntuación.</span>}</div>;
}

function Orders({ api, agentName }) {
  const [state, setState] = useState({ actions: {}, verification: {} });
  useEffect(() => {
    let alive = true;
    const loadActive = async () => {
      const active = await api("/training/active");
      if (alive && active) {
        setState({
          actions: JSON.parse(active.actions_json || "{}"),
          verification: JSON.parse(active.verification_json || "{}")
        });
      }
    };
    loadActive();
    const t = setInterval(loadActive, 1500);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [api]);

  const updateState = (next) => {
    setState(next);
    syncActive(api, "actions", next.actions || {});
  };

  return <Section title="Pedidos / Logística"><OrderTool api={api} trainingState={state} setTrainingState={updateState} agentName={agentName} /></Section>;
}

function Training({ api, agentName }) {
  const [call, setCall] = useState(null);
  const stopRingRef = useRef(null);
  const [elapsed, setElapsed] = useState(0);
  const [dashboard, setDashboard] = useState(null);
  const [state, setState] = useState({ actions: {}, verification: {} });
  const [score, setScore] = useState(null);
  useEffect(() => { api("/training/active").then((c) => c && setCall({ ...c, status: c.started_at ? "active" : "incoming" })); }, [api]);
  useEffect(() => { api("/dashboard").then(setDashboard); }, [api]);
  useEffect(() => {
    if (call?.status !== "active") return;
    const t = setInterval(async () => {
      const c = await api("/training/active");
      if (c) setState({ actions: JSON.parse(c.actions_json || "{}"), verification: JSON.parse(c.verification_json || "{}") });
    }, 2000);
    return () => clearInterval(t);
  }, [api, call?.status]);
  useEffect(() => { if (call?.status !== "active") return; const t = setInterval(() => setElapsed((v) => v + 1), 1000); return () => clearInterval(t); }, [call]);
  useEffect(() => () => stopRingRef.current?.(), []);
  const newCall = async () => {
    stopRingRef.current?.();
    stopRingRef.current = startIncomingRing();
    setScore(null);
    setElapsed(0);
    setState({ actions: {}, verification: {} });
    const nextCall = await api("/training/new-call", { method: "POST" });
    setCall(nextCall);
  };
  const start = async () => {
    stopRingRef.current?.();
    stopRingRef.current = null;
    await api(`/training/${call.callId || call.id}/start`, { method: "POST" });
    setCall({ ...call, status: "active" });
  };
  const finish = async () => {
    stopRingRef.current?.();
    stopRingRef.current = null;
    const data = await api(`/training/${call.callId || call.id}/finish`, { method: "POST", body: JSON.stringify(state) });
    setScore(data);
    setCall(null);
    setElapsed(0);
    setState({ actions: {}, verification: {} });
  };
  const updateState = (next) => { setState(next); if (call) api(`/training/${call.callId || call.id}/verify`, { method: "PATCH", body: JSON.stringify(next.verification || {}) }).catch(() => {}); };
  return <Section title="Centro de entrenamiento">
    {dashboard && <div className="training-dpa"><button className="metric dpa-metric" type="button"><span>NO DPA</span><strong>{dashboard.dpaFailed}</strong></button></div>}
    <div className="training-bar">
      <button onClick={newCall}>Nueva llamada</button>
      <button className="secondary" onClick={() => window.open("/crm", "novawear-crm", "width=1200,height=800")}><ExternalLink size={16} /> Abrir CRM</button>
      <button className="secondary" onClick={() => window.open("/orders", "novawear-orders", "width=1200,height=800")}><ExternalLink size={16} /> Abrir pedidos</button>
    </div>
    {call && <div className="call-card">
      <div><span className="pill incoming">Llamada entrante</span><h2><CopyValue value={call.customerName || `${call.first_name} ${call.last_name}`} /></h2><p>Motivo: {call.reason || "Consulta sobre pedido"}</p><p>Número de pedido facilitado: <strong><CopyValue value={call.orderNumber || call.order_number} /></strong></p><p>Teléfono: <CopyValue value={call.phone || "Sin teléfono registrado"} /></p>{call.email && <p>Email: <CopyValue value={call.email} /></p>}<p>Dirección: <CopyValue value={call.address || "Sin dirección registrada"} /></p><p>Código postal: <CopyValue value={call.postalCode || call.postal_code || "Sin código postal"} /></p></div>
      <div className="timer"><Clock />{mmss(elapsed)}</div>
      {call.status !== "active" ? <button onClick={start}>Aceptar llamada</button> : <button onClick={finish}>Finalizar llamada</button>}
    </div>}
    {call?.status === "active" && <div className="split-work">
      <CustomerSearch api={api} onVerified={(patch) => setState((s) => ({ ...s, actions: { ...s.actions, ...(patch.customerFound ? { customerFound: true } : {}) }, verification: patch.verification || s.verification }))} />
      <OrderTool api={api} trainingState={state} setTrainingState={updateState} agentName={agentName} />
    </div>}
    {score && <div className="panel result"><h2>Resultado del ejercicio</h2><div className="detail">{Object.entries(score.result).map(([k, v]) => <React.Fragment key={k}><b>{label(k)}</b><span>{v}</span></React.Fragment>)}<b>Tiempo llamada</b><span>{mmss(elapsed)}</span><b>Puntuación</b><span>{score.score}/100</span></div></div>}
  </Section>;
}

function SimpleTablePage({ api, title, path, cols }) {
  const [rows, setRows] = useState([]);
  useEffect(() => { api(path).then(setRows); }, [api, path]);
  return <Section title={title}><Table rows={rows} cols={cols} /></Section>;
}

function Table({ rows = [], cols = [] }) {
  if (!rows.length) return <p className="muted">Sin registros.</p>;
  return <div className="table-wrap"><table><thead><tr>{cols.map((c) => <th key={c}>{label(c)}</th>)}</tr></thead><tbody>{rows.map((r, i) => <tr key={r.id || i}>{cols.map((c) => <td key={c}>{formatCell(c, r[c])}</td>)}</tr>)}</tbody></table></div>;
}

function App() {
  const auth = useAuth();
  const api = useApi(auth.token);
  if (!auth.token) return <Login login={auth.login} />;
  return <BrowserRouter><Layout user={auth.user}><Routes>
    <Route path="/" element={<Navigate to="/training" />} />
    <Route path="/dashboard" element={<Dashboard api={api} />} />
    <Route path="/crm" element={<CRM api={api} />} />
    <Route path="/orders" element={<Orders api={api} agentName={auth.user?.name} />} />
    <Route path="/training" element={<Training api={api} agentName={auth.user?.name} />} />
    <Route path="/carriers" element={<SimpleTablePage api={api} title="Transportistas" path="/carriers" cols={["name", "email", "phone"]} />} />
    <Route path="/emails" element={<SimpleTablePage api={api} title="Emails simulados" path="/emails" cols={["sent_at", "email_type", "order_number", "destination_name", "recipient", "subject"]} />} />
    <Route path="/refunds" element={<SimpleTablePage api={api} title="Reembolsos ficticios" path="/refunds" cols={["created_at", "reference", "order_number", "first_name", "last_name", "amount", "reason"]} />} />
    <Route path="/history" element={<SimpleTablePage api={api} title="Historial de entrenamiento" path="/history" cols={["id", "order_number", "first_name", "last_name", "scenario_type", "started_at", "finished_at", "score"]} />} />
  </Routes></Layout></BrowserRouter>;
}

function label(k) { return ({ customerIdentification: "Identificación del cliente", verified: "Datos verificados", orderLocated: "Pedido localizado", actionApplied: "Acción aplicada", customerEmail: "Email cliente", carrierEmail: "Email transportista", crmNote: "Nota CRM", first_name: "Nombre", last_name: "Apellidos", order_number: "Pedido", order_status: "Estado", total_amount: "Importe", unit_price: "Precio", quantity: "Cantidad" }[k] || k.replaceAll("_", " ")); }
function fmt(v) { return v ? new Date(v).toLocaleDateString("es-ES") : ""; }
function fmtTime(v) { return v ? new Date(v).toLocaleString("es-ES") : ""; }
function money(v) { return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(v || 0); }
function statusClass(s) { return s === "EN TIEMPO" ? "ok" : s === "RETRASADO" ? "warn" : "danger"; }
function delayDays(d) { return Math.max(1, Math.ceil((new Date("2026-08-08") - new Date(d)) / 86400000)); }
function mmss(s) { return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`; }
function formatCell(k, v) { if (k.includes("date") || k.includes("created") || k.includes("sent") || k.includes("started") || k.includes("finished")) return fmtTime(v); if (k.includes("amount") || k.includes("price")) return money(v); return String(v ?? ""); }
async function syncActive(api, type, payload) {
  try {
    const active = await api("/training/active");
    if (active?.id) await api(`/training/${active.id}/${type}`, { method: "PATCH", body: JSON.stringify(payload) });
  } catch {
    /* Optional cross-window training sync. */
  }
}

createRoot(document.getElementById("root")).render(<App />);
