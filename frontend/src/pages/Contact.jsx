import React from 'react'
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export default function Contact(){
  const [name, setName] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [message, setMessage] = React.useState('')
  const [sent, setSent] = React.useState(false)

  async function onSubmit(e){
    e.preventDefault()
    try {
      await axios.post(`${API}/api/contact`, { name, email, message })
      setSent(true)
      setName(''); setEmail(''); setMessage('')
      setTimeout(()=>setSent(false), 2000)
    } catch (e) {
      alert('Failed to send. Ensure backend /api/contact exists.')
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <motion.h2 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-4xl font-bold text-red-400 mb-6 text-center"
      >
        Contact Us
      </motion.h2>
      <motion.form 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        onSubmit={onSubmit} 
        className="space-y-3 p-5 rounded-xl bg-gray-900/60 border border-red-800/40"
      >
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="Your name" className="w-full px-3 py-2 rounded bg-gray-900 border border-gray-700 focus:border-red-600 outline-none" />
        <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" className="w-full px-3 py-2 rounded bg-gray-900 border border-gray-700 focus:border-red-600 outline-none" />
        <textarea value={message} onChange={e=>setMessage(e.target.value)} placeholder="Message" className="w-full h-32 px-3 py-2 rounded bg-gray-900 border border-gray-700 focus:border-red-600 outline-none" />
        <button className="btn">Send</button>
      </motion.form>
      <AnimatePresence>
        {sent && (
          <motion.div initial={{opacity:0, y:8}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-8}} className="mt-4 text-green-400">Thank you! We received your message.</motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

