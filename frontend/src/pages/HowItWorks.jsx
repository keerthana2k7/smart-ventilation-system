import React from 'react'
import { motion } from 'framer-motion'

const steps = [
  { title: 'Sensor detects gas', icon: '🧪', desc: 'MQ-135 senses air quality.' },
  { title: 'ESP32 sends data', icon: '📡', desc: 'Data to Arduino IoT Cloud.' },
  { title: 'IoT Cloud updates', icon: '☁️', desc: 'Cloud forwards to backend.' },
  { title: 'Auto fan control', icon: '🌀', desc: 'Motor ON/OFF automatically.' },
  { title: 'Dashboard & charts', icon: '📈', desc: 'Trends and reports live.' },
  { title: 'User controls many fans', icon: '🧰', desc: 'Manage multiple fans from one dashboard.' }
]

export default function HowItWorks(){
  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <h2 className="text-3xl font-bold text-red-400 mb-8">How the System Works</h2>
      <div className="relative overflow-x-auto pb-8">
        <div className="min-w-[900px]">
          <div className="h-1 bg-gray-800 rounded-full relative">
            <motion.div initial={{ width: 0 }} whileInView={{ width: '100%' }} viewport={{ once: true }} transition={{ duration: 1.2 }} className="h-full bg-red-600 rounded-full" />
          </div>
          <div className="mt-6 grid grid-cols-5 gap-6">
            {steps.map((s, i) => (
              <motion.div key={s.title} initial={{opacity:0, x: i%2? 30 : -30}} whileInView={{opacity:1, x:0}} viewport={{ once: true }} className="text-center">
                <div className="flex flex-col items-center">
                  <div className="h-4 w-4 rounded-full bg-red-600 shadow-[0_0_12px_#ef4444]" />
                  <div className="mt-3 p-4 rounded-xl bg-gray-900/60 border border-red-800/40">
                    <div className="text-3xl mb-1">{s.icon}</div>
                    <div className="text-red-300 font-semibold">{i+1}️⃣ {s.title}</div>
                    <div className="text-gray-300 text-sm mt-1">{s.desc}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

