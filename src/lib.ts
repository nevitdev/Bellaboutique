import { useSyncExternalStore } from 'react'
export type Role = 'Administrador' | 'Vendedor' | 'Cliente'
export interface User { id: string; cedula: string; nombre: string; apellidos: string; email: string; telefono: string; direccion: string; pass: string; rol: Role; activo: boolean }
export interface Product { id: number; nombre: string; descripcion: string; precio: number; stock: number; categoria: string; proveedor: string; activo: boolean; tallas?: string[] }
export interface Order { factura: string; email: string; fecha: string; metodo: string; estado: string; items: { id: number; nombre: string; cant: number; precio: number }[]; subtotal: number; iva: number; total: number }
export interface DB { users: User[]; products: Product[]; orders: Order[]; log: { f: string; u: string; a: string }[]; intentos: { f: string; email: string; ok: boolean }[]; fb: { f: string; email: string; tipo: string; t: string }[]; chat: { f: string; u: string; de: string; t: string }[]; carts: Record<string, Record<string, number>>; session: string | null }

// Hash simulado (NO es seguro para producción; en un backend real se usaría bcrypt).
const hash = (s: string) => { let a = 3735928559, b = 1103547991; for (let i = 0; i < s.length; i++) { const c = s.charCodeAt(i); a = Math.imul(a ^ c, 2654435761); b = Math.imul(b ^ c, 1597334677) } a = Math.imul(a ^ (a >>> 16), 2246822507) ^ Math.imul(b ^ (b >>> 13), 3266489909); b = Math.imul(b ^ (b >>> 16), 2246822507) ^ Math.imul(a ^ (a >>> 13), 3266489909); return (4294967296 * (2097151 & b) + (a >>> 0)).toString(16) }
export const fmt = (n: number) => '₡' + n.toLocaleString('de-DE')
export const emailOk = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)
export const passOk = (p: string) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/.test(p)

const P = (id: number, nombre: string, descripcion: string, precio: number, stock: number, categoria: string, proveedor: string): Product => ({ id, nombre, descripcion, precio, stock, categoria, proveedor, activo: true, tallas: categoria === 'Ropa' ? ['XS', 'S', 'M', 'L'] : categoria === 'Calzado' ? ['36', '37', '38', '39', '40'] : ['Única'] })
const U = (id: string, cedula: string, nombre: string, apellidos: string, email: string, pass: string, rol: Role): User => ({ id, cedula, nombre, apellidos, email, telefono: '88880000', direccion: 'San José, Costa Rica', pass: hash(pass), rol, activo: true })
const seed = (): DB => ({
  users: [U('U1', '101110111', 'Admin', 'Bellas', 'admin@bellas.cr', 'Admin#2026', 'Administrador'), U('U2', '202220222', 'Vera', 'Vendedora', 'vendedor@bellas.cr', 'Vende#2026', 'Vendedor'), U('U3', '303330333', 'Ana María', 'Pérez', 'cliente@bellas.cr', 'Cliente#2026', 'Cliente')],
  products: [
    P(1, 'Blazer Elegance', 'Blazer entallado de corte moderno, ideal para oficina.', 24900, 12, 'Ropa', 'Textiles Tica'),
    P(2, 'Vestido Aurora', 'Vestido midi fluido en tono arena.', 19900, 8, 'Ropa', 'Textiles Tica'),
    P(3, 'Bolso Classic', 'Bolso estructurado con cierre dorado.', 16500, 4, 'Accesorios', 'Cuero CR'),
    P(4, 'Zapatos Sofia', 'Zapato de tacón bajo, cuero suave.', 28900, 6, 'Calzado', 'Calzado Cartago'),
    P(5, 'Blusa Essential', 'Blusa de lino con botones de nácar.', 12900, 20, 'Ropa', 'Textiles Tica'),
    P(6, 'Cinturón Lino', 'Cinturón trenzado artesanal.', 8900, 15, 'Accesorios', 'Cuero CR'),
    P(7, 'Sandalias Luna', 'Sandalias planas para el día a día.', 21900, 0, 'Calzado', 'Calzado Cartago'),
    P(8, 'Falda Midi', 'Falda plisada con caída elegante.', 15900, 9, 'Ropa', 'Textiles Tica')],
  orders: [], log: [], intentos: [], fb: [], chat: [], carts: {}, session: null })
const K = 'bellas-db'
let db: DB
try { db = JSON.parse(localStorage.getItem(K) || '') } catch { db = seed() }
const subs = new Set<() => void>()
const save = () => { db = { ...db }; localStorage.setItem(K, JSON.stringify(db)); subs.forEach(f => f()) }
export const useDB = () => useSyncExternalStore(f => { subs.add(f); return () => { subs.delete(f) } }, () => db)
export const me = (d: DB) => d.users.find(u => u.email === d.session)
const now = () => new Date().toISOString()
const log = (a: string) => db.log.unshift({ f: now(), u: db.session || 'anónimo', a })

export const A = {
  role: () => db.users.find(u => u.email === db.session)?.rol,
  login(email: string, pass: string): string | null {
    const e = email.trim().toLowerCase(), u = db.users.find(x => x.email === e), ok = !!u && u.pass === hash(pass) && u.activo
    db.intentos.unshift({ f: now(), email: e, ok })
    if (ok) { db.session = e; log('Inicio de sesión') }
    save(); return ok ? null : u && !u.activo ? 'La cuenta está desactivada' : 'Correo o contraseña incorrectos'
  },
  logout(m = 'Cierre de sesión') { log(m); db.session = null; save() },
  register(d: Omit<User, 'id' | 'rol' | 'activo'>): string | null {
    if (db.users.some(u => u.email === d.email)) return 'Ese correo ya está registrado'
    db.users.push({ ...d, id: 'U' + (db.users.length + 1), pass: hash(d.pass), rol: 'Cliente', activo: true }); log('Registro de cliente ' + d.email); save(); return null
  },
  recover(email: string): string | null {
    const u = db.users.find(x => x.email === email); if (!u) return null
    const t = 'Bb' + Math.random().toString(36).slice(2, 8) + '#9'; u.pass = hash(t); log('Recuperación de contraseña ' + email); save(); return t
  },
  add(id: number, talla: string, n = 1) { const c = (db.carts[db.session!] ??= {}), k = id + ':' + talla; c[k] = (c[k] || 0) + n; save() },
  qty(k: string, n: number) { const c = (db.carts[db.session!] ??= {}); if (n <= 0) delete c[k]; else c[k] = n; save() },
  checkout(metodo: string): string | Order {
    const c = db.carts[db.session!] || {}
    const items = Object.entries(c).map(([k, cant]) => { const [id, talla] = k.split(':'); const p = db.products.find(x => x.id === +id)!; return { id: p.id, nombre: p.nombre + (talla && talla !== 'Única' ? ' (' + talla + ')' : ''), cant, precio: p.precio } })
    if (!items.length) return 'El carrito está vacío'
    for (const i of items) { const p = db.products.find(x => x.id === i.id)!; if (!p.activo || p.stock < items.filter(x => x.id === i.id).reduce((s, x) => s + x.cant, 0)) return 'Stock insuficiente: ' + p.nombre }
    items.forEach(i => { db.products.find(x => x.id === i.id)!.stock -= i.cant })
    const subtotal = items.reduce((s, i) => s + i.precio * i.cant, 0), iva = Math.round(subtotal * 0.13)
    const o: Order = { factura: 'BB-' + String(db.orders.length + 1).padStart(6, '0'), email: db.session!, fecha: now(), metodo, estado: metodo === 'Transferencia' ? 'Pendiente' : 'Exitoso', items, subtotal, iva, total: subtotal + iva }
    db.orders.unshift(o); db.carts[db.session!] = {}; log('Compra ' + o.factura); save(); return o
  },
  saveProduct(p: Product) {
    if (p.id) { db.products = db.products.map(x => x.id === p.id ? p : x); log('Modificó producto ' + p.nombre) }
    else { db.products.push({ ...p, id: Math.max(0, ...db.products.map(x => x.id)) + 1 }); log('Creó producto ' + p.nombre) }
    save()
  },
  setUser(email: string, patch: Partial<User>) { db.users = db.users.map(u => u.email === email ? { ...u, ...patch } : u); log('Actualizó usuario ' + email + ' ' + Object.keys(patch).join(',')); save() },
  demoSales() {
    const cl = db.users.find(u => u.rol === 'Cliente'); if (!cl) return
    const metodos = ['Tarjeta', 'SINPE', 'Transferencia']
    for (let k = 0; k < 10; k++) {
      const items = [0, 1].map(j => db.products[(k * 3 + j * 2) % db.products.length]).filter((p, i, a) => p.activo && p.stock > 0 && a.indexOf(p) === i).map(p => { p.stock -= 1; return { id: p.id, nombre: p.nombre, cant: 1, precio: p.precio } })
      if (!items.length) continue
      const subtotal = items.reduce((s, i) => s + i.precio, 0), iva = Math.round(subtotal * 0.13), metodo = metodos[k % 3]
      db.orders.unshift({ factura: 'BB-' + String(db.orders.length + 1).padStart(6, '0'), email: cl.email, fecha: new Date(Date.now() - (k % 6) * 86400000).toISOString(), metodo, estado: metodo === 'Transferencia' ? 'Pendiente' : 'Exitoso', items, subtotal, iva, total: subtotal + iva })
    }
    log('Generó ventas de ejemplo'); save()
  },
  fb(tipo: string, t: string) { db.fb.unshift({ f: now(), email: db.session!, tipo, t }); log('Envió ' + tipo); save() },
  chat(t: string) {
    const u = db.session!; db.chat.push({ f: now(), u, de: 'cliente', t }); save()
    setTimeout(() => { db.chat.push({ f: now(), u, de: 'vendedor', t: 'Hola, soy Vera de Bellas Boutique. Recibimos tu mensaje y te respondemos en breve.' }); save() }, 1200)
  },
}
