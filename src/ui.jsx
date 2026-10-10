import { createContext, useContext, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

export const press = { whileHover: { x: -2, y: -2 }, whileTap: { x: 4, y: 4 } }
export const MLink = motion.create(Link)
export { slug } from './seo.js'

// The order is shared across pages: add a service anywhere, send it from the till or the contact form.
const Order = createContext(null)
export function OrderProvider({ children }) {
  const [picked, setPicked] = useState([])
  const toggle = (s) => setPicked((p) => (p.includes(s) ? p.filter((x) => x !== s) : [...p, s]))
  const addMany = (list) => setPicked((p) => [...new Set([...p, ...list])])
  return <Order.Provider value={{ picked, toggle, addMany }}>{children}</Order.Provider>
}
export const useOrder = () => useContext(Order)
