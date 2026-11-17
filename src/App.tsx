import { useEffect } from 'react'
import { Route, Routes } from 'react-router-dom'
import { A, useDB } from './lib'
import { Layout, Home, Catalog, Cart, Checkout, Invoice, Login, Register, Recover, Account, Support, ProductPage } from './pages'
import { Admin } from './admin'

export default function App() {
  const d = useDB()
  useEffect(() => { // cierre de sesión tras 5 min de inactividad
    if (!d.session) return
    const off = () => A.logout('Sesión cerrada por inactividad')
    let t = setTimeout(off, 300000)
    const r = () => { clearTimeout(t); t = setTimeout(off, 300000) }
    const ev = ['click', 'keydown', 'mousemove', 'scroll']
    ev.forEach(e => addEventListener(e, r))
    return () => { clearTimeout(t); ev.forEach(e => removeEventListener(e, r)) }
  }, [d.session])
  return <Routes><Route element={<Layout />}>
    <Route path="/" element={<Home />} /><Route path="/catalogo" element={<Catalog />} /><Route path="/producto/:id" element={<ProductPage />} /><Route path="/carrito" element={<Cart />} />
    <Route path="/checkout" element={<Checkout />} /><Route path="/factura/:id" element={<Invoice />} />
    <Route path="/login" element={<Login />} /><Route path="/registro" element={<Register />} /><Route path="/recuperar" element={<Recover />} />
    <Route path="/cuenta" element={<Account />} /><Route path="/soporte" element={<Support />} /><Route path="/admin" element={<Admin />} />
  </Route></Routes>
}
