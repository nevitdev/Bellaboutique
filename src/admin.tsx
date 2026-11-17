import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { A, useDB, me, fmt, Product, Role } from './lib'

const blank: Product = { id: 0, nombre: '', descripcion: '', precio: 0, stock: 0, categoria: 'Ropa', proveedor: '', activo: true }
const dt = (s: string) => new Date(s).toLocaleString('es-CR')
function Bars({ data, fmtV = (n: number) => String(n), warn }: { data: [string, number][]; fmtV?: (n: number) => string; warn?: (l: string) => boolean }) {
  const max = Math.max(1, ...data.map(x => x[1]))
  return <div className="hbars">{data.map(([l, v]) => <div key={l} className="hb"><span title={l}>{l}</span><i><u style={{ width: (v / max * 100) + '%', background: warn?.(l) ? '#b3261e' : undefined }} /></i><b>{fmtV(v)}</b></div>)}</div>
}

export function Admin() {
  const d = useDB(), u = me(d), [tab, setTab] = useState('Resumen'), [e, setE] = useState<Product | null>(null), [err, setErr] = useState(''), [tl, setTl] = useState('')
  if (!u || u.rol === 'Cliente') return <Navigate to="/login" />
  const tabs = u.rol === 'Administrador' ? ['Resumen', 'Productos', 'Usuarios', 'Ventas', 'Bitácora'] : ['Productos', 'Ventas']
  const t = tabs.includes(tab) ? tab : tabs[0]
  const low = d.products.filter(p => p.activo && p.stock <= 5)
  const vend = d.orders.reduce((a, o) => a + o.items.reduce((s, i) => s + i.cant, 0), 0)
  const agg = (len: number) => { const m: Record<string, [number, number]> = {}; d.orders.forEach(o => { const k = o.fecha.slice(0, len); m[k] = [(m[k]?.[0] || 0) + o.items.reduce((s, i) => s + i.cant, 0), (m[k]?.[1] || 0) + o.total] }); return Object.entries(m) }
  const sum = (f: (o: typeof d.orders[number]) => [string, number][]) => { const m: Record<string, number> = {}; d.orders.forEach(o => f(o).forEach(([k, v]) => { m[k] = (m[k] || 0) + v })); return Object.entries(m) }
  const porDia = agg(10).sort((a, b) => a[0] < b[0] ? -1 : 1).slice(-7).map(([k, v]) => [k, v[1]] as [string, number])
  const porMetodo = sum(o => [[o.metodo, o.total] as [string, number]])
  const top = sum(o => o.items.map(i => [i.nombre.replace(/ \(.+\)$/, ''), i.cant] as [string, number])).sort((a, b) => b[1] - a[1]).slice(0, 5)
  const set = (k: keyof Product, v: string) => setE({ ...e!, [k]: k === 'precio' || k === 'stock' ? +v : v } as Product)
  const save = () => { if (!e!.nombre.trim() || e!.precio <= 0 || e!.stock < 0 || !Number.isInteger(e!.stock)) return setErr('Nombre, precio mayor a 0 y stock entero son obligatorios'); const tallas = [...new Set(tl.split(',').map(s => s.trim()).filter(Boolean))]; A.saveProduct({ ...e!, tallas: tallas.length ? tallas : ['Única'] }); setE(null); setErr('') }
  return <section className="sec"><h2>Administración</h2>
    <div className="tabs">{tabs.map(x => <button key={x} className={'chip' + (x === t ? ' on' : '')} onClick={() => setTab(x)}>{x}</button>)}</div>

    {t === 'Resumen' && <><div className="kpis"><div>Ingresos<b>{fmt(d.orders.reduce((a, o) => a + o.total, 0))}</b></div><div>Pedidos<b>{d.orders.length}</b></div><div>Productos vendidos<b>{vend}</b></div><div>Stock bajo<b>{low.length}</b></div></div>
      <p className="bar"><button className="btn sm out" onClick={() => window.print()}>Imprimir reporte del día</button><button className="btn sm" onClick={() => A.demoSales()}>Generar ventas de ejemplo</button><button className="btn sm out" onClick={() => { localStorage.removeItem('bellas-db'); location.reload() }}>Reiniciar datos</button></p>
      <div className="two"><div><h3>Ingresos por día (últimos 7)</h3>{porDia.length ? <Bars data={porDia} fmtV={fmt} /> : <p className="note">Aún no hay ventas para graficar: haz una compra con el cliente demo.</p>}
        <h3 style={{ marginTop: '1rem' }}>Ingresos por método de pago</h3><Bars data={porMetodo} fmtV={fmt} /></div>
        <div><h3>Productos más vendidos (unidades)</h3><Bars data={top} />
          <h3 style={{ marginTop: '1rem' }}>Stock actual (rojo: 5 o menos)</h3><Bars data={d.products.filter(p => p.activo).map(p => [p.nombre, p.stock] as [string, number])} warn={l => low.some(p => p.nombre === l)} /></div></div>
      <div className="two" style={{ marginTop: '2rem' }}><div><h3>Reporte diario</h3><div className="tw"><table><thead><tr><th>Día</th><th>Unidades</th><th>Ingresos</th></tr></thead><tbody>{agg(10).map(([k, [q, v]]) => <tr key={k}><td>{k}</td><td>{q}</td><td>{fmt(v)}</td></tr>)}</tbody></table></div>
        <h3 style={{ marginTop: '1rem' }}>Reporte mensual</h3><div className="tw"><table><thead><tr><th>Mes</th><th>Unidades</th><th>Ingresos</th></tr></thead><tbody>{agg(7).map(([k, [q, v]]) => <tr key={k}><td>{k}</td><td>{q}</td><td>{fmt(v)}</td></tr>)}</tbody></table></div></div>
        <div><h3>Productos con stock bajo (5 o menos)</h3>{low.map(p => <p key={p.id}>{p.nombre}: <b>{p.stock}</b></p>)}{!low.length && <p>Sin alertas.</p>}</div></div></>}

    {t === 'Productos' && (e ? <form className="narrow" onSubmit={x => { x.preventDefault(); save() }}><h3>{e.id ? 'Editar' : 'Nuevo'} producto</h3>
      {(['nombre', 'descripcion', 'precio', 'stock', 'categoria', 'proveedor'] as const).map(k => <label key={k}>{k[0].toUpperCase() + k.slice(1)}<input value={String(e[k])} onChange={x => set(k, x.target.value)} /></label>)}
      <label>Tallas (separadas por coma)<input value={tl} onChange={x => setTl(x.target.value)} placeholder="Ej: S, M, L o 36, 37, 38" /></label>
      {err && <p className="err">{err}</p>}<button className="btn">Guardar producto</button><button type="button" className="btn out" onClick={() => { setE(null); setErr('') }}>Cancelar</button></form> :
      <><button className="btn sm" onClick={() => { setE(blank); setTl('Única') }}>Nuevo producto</button><div className="tw"><table><thead><tr><th>Producto</th><th>Categoría</th><th>Precio</th><th>Stock</th><th>Estado</th><th></th></tr></thead><tbody>{d.products.map(p => <tr key={p.id}><td>{p.nombre}</td><td>{p.categoria}</td><td>{fmt(p.precio)}</td><td>{p.stock}</td><td>{p.activo ? 'Activo' : 'De baja'}</td>
        <td><button className="lnk" onClick={() => { setE(p); setTl((p.tallas ?? ['Única']).join(', ')) }}>Editar</button> · <button className="lnk" onClick={() => A.saveProduct({ ...p, activo: !p.activo })}>{p.activo ? 'Dar de baja' : 'Reactivar'}</button></td></tr>)}</tbody></table></div></>)}

    {t === 'Usuarios' && <div className="tw"><table><thead><tr><th>ID</th><th>Nombre</th><th>Correo</th><th>Rol</th><th>Estado</th></tr></thead><tbody>{d.users.map(x => <tr key={x.email}><td>{x.id}</td><td>{x.nombre} {x.apellidos}</td><td>{x.email}</td>
      <td><select disabled={x.email === u.email} value={x.rol} onChange={ev => A.setUser(x.email, { rol: ev.target.value as Role })}>{['Administrador', 'Vendedor', 'Cliente'].map(r => <option key={r}>{r}</option>)}</select></td>
      <td><button className="lnk" disabled={x.email === u.email} onClick={() => A.setUser(x.email, { activo: !x.activo })}>{x.activo ? 'Activa (desactivar)' : 'Inactiva (activar)'}</button></td></tr>)}</tbody></table></div>}

    {t === 'Ventas' && <div className="tw"><table><thead><tr><th>Factura</th><th>Fecha</th><th>Cliente</th><th>Producto · cant. · precio unit.</th><th>Pago</th><th>Total</th></tr></thead><tbody>{d.orders.map(o => <tr key={o.factura}><td>{o.factura}</td><td>{dt(o.fecha)}</td><td>{o.email}</td><td>{o.items.map(i => `${i.nombre} ×${i.cant} (${fmt(i.precio)})`).join(', ')}</td><td>{o.metodo} · {o.estado}</td><td>{fmt(o.total)}</td></tr>)}</tbody></table>{!d.orders.length && <p>Aún no hay ventas.</p>}</div>}

    {t === 'Bitácora' && <div className="two"><div><h3>Bitácora de actividades</h3><div className="tw"><table><tbody>{d.log.slice(0, 60).map((l, i) => <tr key={i}><td>{dt(l.f)}</td><td>{l.u}</td><td>{l.a}</td></tr>)}</tbody></table></div></div>
      <div><h3>Intentos de login</h3><div className="tw"><table><tbody>{d.intentos.slice(0, 60).map((l, i) => <tr key={i}><td>{dt(l.f)}</td><td>{l.email}</td><td>{l.ok ? 'Exitoso' : 'Fallido'}</td></tr>)}</tbody></table></div></div></div>}
  </section>
}
