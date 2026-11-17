import { useState, FormEvent } from 'react'
import { Link, NavLink, Navigate, Outlet, useNavigate, useParams } from 'react-router-dom'
import { ArrowRight, Menu, ShoppingBag, User as UserIcon, X } from 'lucide-react'
import { A, useDB, me, fmt, emailOk, passOk, Product } from './lib'

export function Layout() {
  const d = useDB(), u = me(d), nav = useNavigate(), [open, setOpen] = useState(false)
  const n = Object.values(d.carts[d.session || ''] || {}).reduce((a, b) => a + b, 0)
  return <>
    <div className="top">ENVÍO GRATIS A PARTIR DE ₡40.000 · DEVOLUCIONES EN 30 DÍAS</div>
    <header className="hdr">
      <Link to="/" className="logo">Bellas<small>BOUTIQUE</small></Link>
      <button className="burger" aria-label="Menú" onClick={() => setOpen(!open)}>{open ? <X size={22} /> : <Menu size={22} />}</button>
      <nav className={open ? 'open' : ''} onClick={() => setOpen(false)}><NavLink to="/catalogo">Catálogo</NavLink><NavLink to="/soporte">Soporte</NavLink>{u && u.rol !== 'Cliente' && <NavLink to="/admin">Administración</NavLink>}</nav>
      <div className="acts">
        <Link to="/carrito" aria-label="Carrito"><ShoppingBag size={20} strokeWidth={1.25} /><b>{n}</b></Link>
        {u ? <><Link to="/cuenta"><UserIcon size={20} strokeWidth={1.25} /> {u.nombre}</Link><button className="lnk" onClick={() => { A.logout(); nav('/') }}>Salir</button></> : <Link to="/login">Ingresar</Link>}
      </div>
    </header>
    <main><Outlet /></main>
    <footer>© 2026 Bellas Boutique · San José, Costa Rica</footer>
  </>
}

function Card({ p }: { p: Product }) {
  const d = useDB(), nav = useNavigate()
  return <article className="card">
    {p.stock > 0 && p.stock <= 5 && <span className="badge">Últimas unidades</span>}
    <Link to={'/producto/' + p.id} className="ph"><span>{p.nombre[0]}</span></Link>
    <small>{p.categoria}</small><h3><Link to={'/producto/' + p.id}>{p.nombre}</Link></h3><p>{p.descripcion}</p>
    <em>Proveedor: {p.proveedor} · {p.stock > 0 ? p.stock + ' en stock' : 'Agotado'}</em>
    <div className="row"><b>{fmt(p.precio)}</b>
      {p.stock > 0 ? <Link className="btn sm" to={'/producto/' + p.id}><ShoppingBag size={13} /> Elegir talla</Link> : <button className="btn sm dis" disabled>No disponible</button>}</div>
  </article>
}

export function Home() {
  const d = useDB()
  return <>
    <section className="hero"><div><h1>Descubre tu esencia, viste tu elegancia</h1><p>Elegancia cotidiana, diseñada para perdurar.</p><Link className="btn" to="/catalogo">Ver colección</Link></div><div className="ph big"><span>B</span></div></section>
    <section className="sec"><h2>Destacados</h2><div className="grid">{d.products.filter(p => p.activo).slice(0, 4).map(p => <Card key={p.id} p={p} />)}</div></section>
    <section className="news"><h2>Inspírate con nosotras.</h2><form onSubmit={e => { e.preventDefault(); alert('¡Gracias por suscribirte!') }}><input type="email" required placeholder="Tu correo electrónico" /><button className="arrow" aria-label="Suscribirme"><ArrowRight size={20} /></button></form></section>
  </>
}

const PER = 6
export function Catalog() {
  const d = useDB(), [q, setQ] = useState(''), [c, setC] = useState('Todas'), [tl, setTl] = useState('Todas'), [min, setMin] = useState(''), [max, setMax] = useState(''), [disp, setDisp] = useState(false), [ord, setOrd] = useState('az'), [pag, setPag] = useState(1)
  const act = d.products.filter(p => p.activo)
  const cats = ['Todas', ...new Set(act.map(p => p.categoria))], tallas = ['Todas', ...new Set(act.flatMap(p => p.tallas ?? ['Única']))]
  const up = (fn: () => void) => { fn(); setPag(1) }
  const list = act.filter(p => (c === 'Todas' || p.categoria === c) && (tl === 'Todas' || (p.tallas ?? ['Única']).includes(tl)) && p.nombre.toLowerCase().includes(q.toLowerCase()) && (!min || p.precio >= +min) && (!max || p.precio <= +max) && (!disp || p.stock > 0))
    .sort((a, b) => ord === 'asc' ? a.precio - b.precio : ord === 'desc' ? b.precio - a.precio : a.nombre.localeCompare(b.nombre))
  const pages = Math.max(1, Math.ceil(list.length / PER)), cur = Math.min(pag, pages)
  return <section className="sec"><h2>Catálogo</h2>
    <div className="bar"><input placeholder="Buscar producto" value={q} onChange={e => up(() => setQ(e.target.value))} />{cats.map(x => <button key={x} className={'chip' + (x === c ? ' on' : '')} onClick={() => up(() => setC(x))}>{x}</button>)}</div>
    <div className="bar">
      <select aria-label="Talla" value={tl} onChange={e => up(() => setTl(e.target.value))}>{tallas.map(x => <option key={x} value={x}>{x === 'Todas' ? 'Todas las tallas' : 'Talla ' + x}</option>)}</select>
      <input type="number" min={0} placeholder="Precio mín. ₡" value={min} onChange={e => up(() => setMin(e.target.value))} />
      <input type="number" min={0} placeholder="Precio máx. ₡" value={max} onChange={e => up(() => setMax(e.target.value))} />
      <select aria-label="Ordenar" value={ord} onChange={e => up(() => setOrd(e.target.value))}><option value="az">Nombre A–Z</option><option value="asc">Precio: menor a mayor</option><option value="desc">Precio: mayor a menor</option></select>
      <label className="chk"><input type="checkbox" checked={disp} onChange={e => up(() => setDisp(e.target.checked))} /> Solo disponibles</label>
      <button className="lnk" onClick={() => up(() => { setQ(''); setC('Todas'); setTl('Todas'); setMin(''); setMax(''); setDisp(false); setOrd('az') })}>Limpiar filtros</button></div>
    <p className="note">{list.length} producto(s)</p>
    <div className="grid">{list.slice((cur - 1) * PER, cur * PER).map(p => <Card key={p.id} p={p} />)}</div>
    {!list.length && <p>No hay productos con esos filtros.</p>}
    {pages > 1 && <div className="bar pag"><button className="chip" disabled={cur === 1} onClick={() => setPag(cur - 1)}>‹ Anterior</button>{Array.from({ length: pages }, (_, i) => <button key={i} className={'chip' + (i + 1 === cur ? ' on' : '')} onClick={() => setPag(i + 1)}>{i + 1}</button>)}<button className="chip" disabled={cur === pages} onClick={() => setPag(cur + 1)}>Siguiente ›</button></div>}</section>
}

const totals = (items: { precio: number; cant: number }[]) => { const s = items.reduce((a, i) => a + i.precio * i.cant, 0), iva = Math.round(s * 0.13); return { s, iva, t: s + iva } }
function useCart() { const d = useDB(); const c = d.carts[d.session || ''] || {}; return Object.entries(c).flatMap(([k, cant]) => { const [id, talla = 'Única'] = k.split(':'); const p = d.products.find(x => x.id === +id); return p ? [{ ...p, cant, k, talla }] : [] }) }
const Sum = ({ t }: { t: { s: number; iva: number; t: number } }) => <div className="sum"><p>Subtotal <b>{fmt(t.s)}</b></p><p>IVA 13% <b>{fmt(t.iva)}</b></p><p>Total <b>{fmt(t.t)}</b></p></div>

export function Cart() {
  const d = useDB(), items = useCart(), t = totals(items)
  if (!d.session) return <Navigate to="/login" />
  return <section className="sec"><h2>Carrito</h2>
    {!items.length ? <p>Tu carrito está vacío. <Link className="lnk" to="/catalogo">Explora el catálogo</Link></p> : <>
      {items.map(i => <div className="line" key={i.k}><span>{i.nombre} · talla {i.talla}</span>
        <span><button className="chip" onClick={() => A.qty(i.k, i.cant - 1)}>−</button> {i.cant} <button className="chip" disabled={i.cant >= i.stock} onClick={() => A.qty(i.k, i.cant + 1)}>+</button></span>
        <b>{fmt(i.precio * i.cant)}</b><button className="lnk" onClick={() => A.qty(i.k, 0)}>Quitar</button></div>)}
      <Sum t={t} /><Link className="btn" to="/checkout">Ir a pagar</Link></>}</section>
}

export function Checkout() {
  const d = useDB(), items = useCart(), nav = useNavigate(), t = totals(items)
  const [m, setM] = useState('Tarjeta'), [v, setV] = useState({ n: '', e: '', c: '', tel: '' }), [err, setErr] = useState('')
  if (!d.session) return <Navigate to="/login" />
  const u = me(d)!, set = (k: string, x: string) => setV({ ...v, [k]: x })
  const go = (e: FormEvent) => {
    e.preventDefault()
    if (m === 'Tarjeta' && (!/^\d{16}$/.test(v.n.replace(/\s/g, '')) || !/^\d{2}\/\d{2}$/.test(v.e) || !/^\d{3}$/.test(v.c))) return setErr('Tarjeta inválida: 16 dígitos, vencimiento MM/AA y CVV de 3 dígitos')
    if (m === 'SINPE' && !/^\d{8}$/.test(v.tel)) return setErr('Número SINPE inválido: 8 dígitos')
    const r = A.checkout(m); if (typeof r === 'string') return setErr(r); nav('/factura/' + r.factura)
  }
  return <section className="sec two"><form onSubmit={go}><h2>Pago</h2>
    <p>Entrega a: <b>{u.nombre} {u.apellidos}</b>, {u.direccion}. Tel. {u.telefono}</p>
    {['Tarjeta', 'SINPE', 'Transferencia'].map(x => <label key={x}><span><input type="radio" style={{ width: 'auto' }} checked={m === x} onChange={() => setM(x)} /> {x === 'SINPE' ? 'SINPE Móvil' : x}</span></label>)}
    {m === 'Tarjeta' && <><input placeholder="Número de tarjeta" value={v.n} onChange={e => set('n', e.target.value)} /><input placeholder="MM/AA" value={v.e} onChange={e => set('e', e.target.value)} /><input placeholder="CVV" value={v.c} onChange={e => set('c', e.target.value)} /></>}
    {m === 'SINPE' && <input placeholder="Teléfono SINPE (8 dígitos)" value={v.tel} onChange={e => set('tel', e.target.value)} />}
    {m === 'Transferencia' && <p className="note">Transfiere a la cuenta simulada CR00 0000 0000 0000 y tu pedido quedará Pendiente hasta confirmar el pago.</p>}
    {err && <p className="err">{err}</p>}<button className="btn" disabled={!items.length}>Confirmar compra</button><p className="note">Simulación: no se procesa ningún pago real.</p></form>
    <div><h2>Resumen</h2>{items.map(i => <p key={i.k}>{i.cant} × {i.nombre} ({i.talla}) <b>{fmt(i.precio * i.cant)}</b></p>)}<Sum t={t} /></div></section>
}

export function Invoice() {
  const { id } = useParams(), d = useDB(), o = d.orders.find(x => x.factura === id)
  if (!o || (o.email !== d.session && me(d)?.rol === 'Cliente')) return <section className="sec"><p>No encontramos esa factura.</p></section>
  const c = d.users.find(x => x.email === o.email)
  return <section className="sec"><h2>Factura {o.factura}</h2>
    <p>Cliente: {c?.nombre} {c?.apellidos} ({o.email})<br />Dirección de entrega: {c?.direccion}<br />Fecha: {new Date(o.fecha).toLocaleString('es-CR')} · Pago: {o.metodo} ({o.estado})</p>
    <div className="tw"><table><thead><tr><th>Producto</th><th>Cant.</th><th>Precio</th><th>Total</th></tr></thead><tbody>{o.items.map(i => <tr key={i.id}><td>{i.nombre}</td><td>{i.cant}</td><td>{fmt(i.precio)}</td><td>{fmt(i.precio * i.cant)}</td></tr>)}</tbody></table></div>
    <Sum t={{ s: o.subtotal, iva: o.iva, t: o.total }} /><p className="note">Correo de confirmación enviado a {o.email} (simulado).</p><button className="btn" onClick={() => window.print()}>Imprimir factura</button></section>
}

export function Login() {
  const [e, setE] = useState(''), [p, setP] = useState(''), [err, setErr] = useState(''), nav = useNavigate()
  const go = (x: FormEvent) => { x.preventDefault(); if (!emailOk(e)) return setErr('Escribe un correo válido'); const r = A.login(e, p); if (r) return setErr(r); nav(A.role() === 'Cliente' ? '/catalogo' : '/admin') }
  return <section className="sec narrow"><h2>Ingresar</h2><form onSubmit={go}>
    <input placeholder="Correo electrónico" value={e} onChange={x => setE(x.target.value)} /><input type="password" placeholder="Contraseña" value={p} onChange={x => setP(x.target.value)} />
    {err && <p className="err">{err}</p>}<button className="btn">Ingresar</button></form>
    <p><Link className="lnk" to="/recuperar">Olvidé mi contraseña</Link> · <Link className="lnk" to="/registro">Crear cuenta</Link></p>
    <p className="note">Demo: cliente@bellas.cr / Cliente#2026 · vendedor@bellas.cr / Vende#2026 · admin@bellas.cr / Admin#2026</p></section>
}

const F = [['cedula', 'Cédula (9 dígitos)'], ['nombre', 'Nombre completo'], ['apellidos', 'Apellidos'], ['email', 'Correo electrónico'], ['telefono', 'Teléfono (8 dígitos)'], ['direccion', 'Dirección'], ['pass', 'Contraseña']] as const
export function Register() {
  const [s, setS] = useState<Record<string, string>>({}), [err, setErr] = useState(''), nav = useNavigate()
  const go = (x: FormEvent) => {
    x.preventDefault()
    if (F.some(([k]) => !s[k]?.trim())) return setErr('Completa todos los campos')
    if (!/^\d{9}$/.test(s.cedula)) return setErr('La cédula debe tener 9 dígitos')
    if (!emailOk(s.email)) return setErr('Correo inválido')
    if (!/^\d{8}$/.test(s.telefono)) return setErr('El teléfono debe tener 8 dígitos')
    if (!passOk(s.pass)) return setErr('Contraseña débil: mínimo 8 caracteres con minúscula, mayúscula, número y símbolo')
    const r = A.register({ cedula: s.cedula, nombre: s.nombre, apellidos: s.apellidos, email: s.email.trim().toLowerCase(), telefono: s.telefono, direccion: s.direccion, pass: s.pass })
    if (r) return setErr(r); alert('Cuenta creada. Confirmación enviada a tu correo (simulado).'); nav('/login')
  }
  return <section className="sec narrow"><h2>Crear cuenta</h2><form onSubmit={go}>{F.map(([k, l]) => <label key={k}>{l}<input type={k === 'pass' ? 'password' : 'text'} value={s[k] || ''} onChange={e => setS({ ...s, [k]: e.target.value })} /></label>)}{err && <p className="err">{err}</p>}<button className="btn">Registrarme</button></form></section>
}

export function Recover() {
  const [e, setE] = useState(''), [r, setR] = useState<string | null | undefined>()
  return <section className="sec narrow"><h2>Recuperar contraseña</h2><form onSubmit={x => { x.preventDefault(); setR(A.recover(e.trim().toLowerCase())) }}>
    <input type="email" required placeholder="Correo electrónico" value={e} onChange={x => setE(x.target.value)} /><button className="btn">Enviar nueva contraseña</button></form>
    {r === null && <p className="err">No existe una cuenta con ese correo.</p>}{r && <p className="ok">Correo simulado: tu nueva contraseña temporal es <b>{r}</b></p>}</section>
}

export function Account() {
  const d = useDB(), u = me(d), [s, setS] = useState<Record<string, string>>({}), [ok, setOk] = useState('')
  if (!u) return <Navigate to="/login" />
  const v = (k: 'nombre' | 'apellidos' | 'telefono' | 'direccion') => s[k] ?? u[k]
  return <section className="sec two"><form onSubmit={e => { e.preventDefault(); if (!/^\d{8}$/.test(v('telefono'))) return setOk('El teléfono debe tener 8 dígitos'); A.setUser(u.email, { nombre: v('nombre'), apellidos: v('apellidos'), telefono: v('telefono'), direccion: v('direccion') }); setOk('Perfil actualizado') }}>
    <h2>Mi perfil</h2><label>ID<input value={u.id} disabled /></label><label>Correo<input value={u.email} disabled /></label>
    {(['nombre', 'apellidos', 'telefono', 'direccion'] as const).map(k => <label key={k}>{k[0].toUpperCase() + k.slice(1)}<input value={v(k)} onChange={e => setS({ ...s, [k]: e.target.value })} /></label>)}
    {ok && <p className="ok">{ok}</p>}<button className="btn">Guardar cambios</button></form>
    <div><h2>Mis compras</h2>{!d.orders.some(o => o.email === u.email) && <p>Aún no tienes compras.</p>}{d.orders.filter(o => o.email === u.email).map(o => <p key={o.factura}><Link className="lnk" to={'/factura/' + o.factura}>{o.factura}</Link> · {new Date(o.fecha).toLocaleDateString('es-CR')} · {fmt(o.total)} · {o.estado}</p>)}</div></section>
}

const FAQ: [string, string][] = [['¿Cuánto tarda el envío?', 'De 2 a 5 días hábiles en Costa Rica.'], ['¿Cómo devuelvo un producto?', 'Tienes 30 días con la etiqueta puesta.'], ['¿Qué métodos de pago aceptan?', 'Tarjeta, SINPE Móvil o transferencia.'], ['¿Se cobra IVA?', 'Sí, el 13% aparece detallado en tu factura.']]
export function Support() {
  const d = useDB(), [t, setT] = useState(''), [n, setN] = useState(5), [c, setC] = useState(''), [m, setM] = useState(''), [ok, setOk] = useState('')
  const send = (tipo: string, txt: string) => { if (!d.session) return setOk('Inicia sesión para enviar.'); if (!txt.trim()) return setOk('Escribe un mensaje.'); A.fb(tipo, txt); setOk('¡Gracias! Recibimos tu ' + tipo.toLowerCase() + '.'); setT(''); setC('') }
  return <section className="sec two"><div><h2>Preguntas frecuentes</h2>{FAQ.map(([q, a]) => <details key={q}><summary>{q}</summary>{a}</details>)}
    <h2 style={{ marginTop: '2rem' }}>Chat con una vendedora</h2>
    <div className="chat">{d.chat.filter(x => x.u === d.session).map((x, i) => <p key={i} className={x.de}><b>{x.de === 'cliente' ? 'Tú' : 'Vera'}:</b> {x.t}</p>)}{!d.session && <p>Inicia sesión para chatear.</p>}</div>
    <form onSubmit={e => { e.preventDefault(); if (d.session && m.trim()) { A.chat(m); setM('') } }}><input placeholder="Escribe tu mensaje" value={m} onChange={e => setM(e.target.value)} /><button className="btn sm" disabled={!d.session}>Enviar</button></form></div>
    <div><h2>Sugerencias</h2><form onSubmit={e => { e.preventDefault(); send('Sugerencia', t) }}><textarea rows={3} value={t} onChange={e => setT(e.target.value)} placeholder="Cuéntanos cómo mejorar" /><button className="btn">Enviar sugerencia</button></form>
      <h2 style={{ marginTop: '2rem' }}>Encuesta de satisfacción</h2><form onSubmit={e => { e.preventDefault(); send('Encuesta', n + '/5 ' + c) }}><select value={n} onChange={e => setN(+e.target.value)}>{[5, 4, 3, 2, 1].map(x => <option key={x} value={x}>{x} de 5</option>)}</select><textarea rows={2} value={c} onChange={e => setC(e.target.value)} placeholder="Comentario" /><button className="btn out">Enviar encuesta</button></form>
      {ok && <p className="ok">{ok}</p>}</div></section>
}

const BG = ['linear-gradient(160deg,#D8C5B2,#F5F0E8)', 'linear-gradient(200deg,#F5F0E8,#D8C5B2)', 'linear-gradient(120deg,#c9aeb4,#D8C5B2)']
const VISTA = ['Frente', 'Detalle', 'Perfil']
export function ProductPage() {
  const { id } = useParams(), d = useDB(), nav = useNavigate(), p = d.products.find(x => x.id === +id!)
  const [g, setG] = useState(0), [t, setT] = useState(''), [q, setQ] = useState(1), [msg, setMsg] = useState('')
  if (!p || !p.activo) return <section className="sec"><p>Este producto no está disponible. <Link className="lnk" to="/catalogo">Volver al catálogo</Link></p></section>
  const tallas = p.tallas ?? ['Única'], rel = d.products.filter(x => x.activo && x.categoria === p.categoria && x.id !== p.id).slice(0, 4)
  const inCart = Object.entries(d.carts[d.session || ''] || {}).filter(([k]) => k.split(':')[0] === String(p.id)).reduce((a, [, n]) => a + n, 0)
  const add = () => {
    if (!d.session) return nav('/login')
    if (!t) return setMsg('Elige una talla para continuar')
    if (inCart + q > p.stock) return setMsg('Solo quedan ' + p.stock + ' unidades de este producto')
    A.add(p.id, t, q); setMsg('Añadido al carrito')
  }
  return <>
    <section className="sec two">
      <div><div className="ph big" style={{ background: BG[g] }}><span>{p.nombre[0]}</span></div>
        <div className="gal">{VISTA.map((v, i) => <button key={v} aria-label={'Vista ' + v} className={'thumb' + (i === g ? ' on' : '')} style={{ background: BG[i] }} onClick={() => setG(i)} />)}</div>
        <p className="note">Vista: {VISTA[g]} (imagen de ejemplo)</p></div>
      <div><small>{p.categoria}</small><h1 style={{ fontSize: '2.4rem' }}>{p.nombre}</h1><h2>{fmt(p.precio)}</h2><p>{p.descripcion}</p>
        <p className="note">Proveedor: {p.proveedor} · {p.stock > 0 ? p.stock + ' disponibles' : 'Agotado'}</p>
        <h3>Talla</h3><div className="bar">{tallas.map(x => <button key={x} className={'chip' + (x === t ? ' on' : '')} onClick={() => { setT(x); setMsg('') }}>{x}</button>)}</div>
        <h3>Cantidad</h3><div className="bar"><button className="chip" disabled={q <= 1} onClick={() => setQ(q - 1)}>−</button><b>{q}</b><button className="chip" disabled={q >= p.stock} onClick={() => setQ(q + 1)}>+</button></div>
        {p.stock > 0 ? <button className="btn" onClick={add}>Añadir al carrito</button> : <button className="btn dis" disabled>No disponible</button>}
        {msg && <p className={msg.startsWith('Añadido') ? 'ok' : 'err'}>{msg} {msg.startsWith('Añadido') && <Link className="lnk" to="/carrito">Ver carrito</Link>}</p>}</div>
    </section>
    {rel.length > 0 && <section className="sec"><h2>También te puede gustar</h2><div className="grid">{rel.map(x => <Card key={x.id} p={x} />)}</div></section>}
  </>
}
