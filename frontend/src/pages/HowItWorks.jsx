import React from 'react'
import { motion } from 'framer-motion'

const steps = [
  { 
    title: 'Detect Gas', 
    icon: '🧪', 
    desc: 'MQ-135 sensor detects harmful gas levels in real-time.',
    color: 'from-red-500 to-red-700'
  },
  { 
    title: 'Send Data (ESP32 → Cloud)', 
    icon: '📡', 
    desc: 'ESP32 microcontroller sends sensor data to Arduino IoT Cloud via WiFi.',
    color: 'from-blue-500 to-blue-700'
  },
  { 
    title: 'Cloud Automation', 
    icon: '☁️', 
    desc: 'Arduino IoT Cloud processes data and triggers webhook to backend.',
    color: 'from-purple-500 to-purple-700'
  },
  { 
    title: 'Fan ON', 
    icon: '🌀', 
    desc: 'System automatically turns ON fan when gas levels exceed threshold.',
    color: 'from-green-500 to-green-700'
  },
  { 
    title: 'Dashboard Live Update', 
    icon: '📊', 
    desc: 'Real-time dashboard shows fan status, gas levels, and analytics.',
    color: 'from-orange-500 to-orange-700'
  },
  { 
    title: 'Manage Many Fans', 
    icon: '🏢', 
    desc: 'Control and monitor multiple fans across different locations from one dashboard.',
    color: 'from-pink-500 to-pink-700'
  }
]

export default function HowItWorks(){
  React.useEffect(() => {
    // Initialize AOS
    if (typeof window !== 'undefined' && window.AOS) {
      window.AOS.init({ duration: 800, once: true })
    }
  }, [])

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <motion.h2 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }}
        className="text-4xl font-bold text-red-400 mb-12 text-center"
        data-aos="fade-up"
      >
        How the System Works
      </motion.h2>
      
      <div className="relative">
        {/* Vertical connecting line */}
        <div className="absolute left-8 md:left-1/2 md:transform md:-translate-x-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-red-600 via-purple-600 to-green-600 rounded-full hidden md:block" />
        
        <div className="space-y-8 md:space-y-12">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="relative"
              data-aos={index % 2 === 0 ? "fade-right" : "fade-left"}
            >
              <div className={`flex flex-col md:flex-row items-center gap-6 ${index % 2 === 0 ? 'md:flex-row-reverse' : ''}`}>
                {/* Icon Circle */}
                <div className="relative z-10 flex-shrink-0">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className="relative"
                  >
                    <div className={`w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center text-4xl md:text-5xl shadow-lg border-4 border-white/20`}>
                      <motion.span
                        animate={{ 
                          y: [0, -10, 0],
                        }}
                        transition={{ 
                          duration: 2,
                          repeat: Infinity,
                          delay: index * 0.3
                        }}
                      >
                        {step.icon}
                      </motion.span>
                    </div>
                    {/* Zig-zag border decoration */}
                    <div className="absolute -inset-2 border-2 border-red-400/30 rounded-lg transform rotate-3" style={{
                      clipPath: 'polygon(0% 20%, 20% 0%, 40% 20%, 60% 0%, 80% 20%, 100% 0%, 100% 80%, 80% 100%, 60% 80%, 40% 100%, 20% 80%, 0% 100%)'
                    }} />
                  </motion.div>
                </div>

                {/* Card */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  className="flex-1"
                  data-aos="zoom-in"
                >
                  <div className="relative p-6 md:p-8 rounded-2xl bg-gray-900/80 border-2 border-red-800/40 shadow-[0_0_30px_#7f1d1d66] backdrop-blur-sm">
                    {/* Comic-style border */}
                    <div className="absolute inset-0 border-2 border-red-400/20 rounded-2xl" style={{
                      clipPath: 'polygon(0% 5%, 5% 0%, 10% 5%, 15% 0%, 20% 5%, 25% 0%, 30% 5%, 35% 0%, 40% 5%, 45% 0%, 50% 5%, 55% 0%, 60% 5%, 65% 0%, 70% 5%, 75% 0%, 80% 5%, 85% 0%, 90% 5%, 95% 0%, 100% 5%, 100% 95%, 95% 100%, 90% 95%, 85% 100%, 80% 95%, 75% 100%, 70% 95%, 65% 100%, 60% 95%, 55% 100%, 50% 95%, 45% 100%, 40% 95%, 35% 100%, 30% 95%, 25% 100%, 20% 95%, 15% 100%, 10% 95%, 5% 100%, 0% 95%)'
                    }} />
                    
                    <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-3xl font-bold text-red-400">{index + 1}️⃣</span>
                        <h3 className="text-2xl font-bold text-red-300">{step.title}</h3>
                      </div>
                      <p className="text-gray-300 text-lg leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mt-16 text-center"
        data-aos="fade-up"
      >
        <div className="inline-block p-6 rounded-2xl bg-gradient-to-r from-red-900/40 to-purple-900/40 border border-red-800/40">
          <p className="text-gray-300 text-lg mb-4">Ready to automate your ventilation system?</p>
          <a href="/dashboard" className="btn inline-block">Go to Dashboard →</a>
        </div>
      </motion.div>
    </div>
  )
}
