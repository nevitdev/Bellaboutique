import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
// @ts-ignore CSS is handled by the bundler, not TypeScript.
import './styles.css'
createRoot(document.getElementById('root')!).render(<BrowserRouter><App /></BrowserRouter>)
