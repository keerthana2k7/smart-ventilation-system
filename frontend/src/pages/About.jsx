import React from 'react'
import { motion } from 'framer-motion'

const members = [
  'Mithilesh',
  'Keerthana',
  'Kaviya',
  'Mithun Chakravarthy',
  'Madhu',
  'Mirtula'
]

export default function About() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <motion.h2 
          initial={{opacity:0,y:8}} 
          animate={{opacity:1,y:0}} 
          className="text-4xl font-bold text-red-400 mb-6"
        >
          About Us
        </motion.h2>
        <p className="text-gray-300 max-w-3xl mx-auto text-lg">
          Our mission is to build an intelligent restroom ventilation system that keeps air safe and saves energy. We sense hazardous gas levels and occupancy, auto-control fans for optimal airflow, and provide a live dashboard with analytics.
        </p>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6"
        >
          <button 
            onClick={() => document.getElementById('team-section')?.scrollIntoView({ behavior: 'smooth' })}
            className="btn"
          >
            Meet the Team
          </button>
        </motion.div>
      </motion.div>
      <div id="team-section" className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 mt-12">
        {members.map((m, i) => (
          <motion.div 
            key={m} 
            initial={{opacity:0, y:10}} 
            whileInView={{opacity:1, y:0}} 
            viewport={{ once: true }} 
            transition={{ delay: i*0.05 }} 
            className="p-5 rounded-xl bg-gray-900/60 border border-red-800/40 shadow-[0_0_20px_#7f1d1d66] text-center"
          >
            <div className="h-14 w-14 rounded-full bg-gradient-to-br from-red-500 to-red-700 mb-3 mx-auto" />
            <div className="font-semibold text-red-300">{m}</div>
            <div className="text-sm text-gray-400">Smart Ventilation Team</div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

