import React from 'react'
import { motion } from 'framer-motion'

const items = Array.from({ length: 8 }).map((_, i) => ({
  id: i+1,
  name: `Ventilation Unit ${i+1}`,
  price: (120+i*10).toFixed(2)
}))

export default function Store(){
  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <h2 className="text-3xl font-bold text-red-400 mb-6">Store</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {items.map(p => (
          <motion.div key={p.id} whileHover={{ y: -6, scale: 1.01 }} className="p-4 rounded-xl bg-gray-900/60 border border-red-800/40 overflow-hidden group">
            <div className="h-32 rounded bg-gradient-to-br from-gray-800 to-gray-900 mb-3 relative">
              <img src="https://images.unsplash.com/photo-1527443224154-c4f2a1b47c04?q=80&w=1200&auto=format&fit=crop" className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-80 transition"/>
            </div>
            <div className="font-semibold text-red-300">{p.name}</div>
            <div className="text-sm text-gray-400">${p.price}</div>
            <button className="btn mt-3 w-full">Add to Cart</button>
          </motion.div>
        ))}
      </div>
      <div className="mt-10 grid md:grid-cols-2 gap-6">
        <form className="p-4 rounded-xl bg-gray-900/60 border border-red-800/40">
          <div className="text-lg font-semibold text-red-300 mb-2">Leave a Review</div>
          <input placeholder="Product" className="w-full mb-2 px-3 py-2 rounded bg-gray-900 border border-gray-700 focus:border-red-600 outline-none" />
          <textarea placeholder="Your review" className="w-full h-28 px-3 py-2 rounded bg-gray-900 border border-gray-700 focus:border-red-600 outline-none" />
          <button className="btn mt-3">Submit</button>
        </form>
        <form className="p-4 rounded-xl bg-gray-900/60 border border-red-800/40">
          <div className="text-lg font-semibold text-red-300 mb-2">Complaint Form</div>
          <input placeholder="Order ID" className="w-full mb-2 px-3 py-2 rounded bg-gray-900 border border-gray-700 focus:border-red-600 outline-none" />
          <textarea placeholder="Describe the issue" className="w-full h-28 px-3 py-2 rounded bg-gray-900 border border-gray-700 focus:border-red-600 outline-none" />
          <button className="btn mt-3">Submit</button>
        </form>
      </div>
    </div>
  )
}

