import React from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

const slides = [
  {
    title: 'Smart Control',
    desc: 'Intelligent ventilation reacts to gas and occupancy in real time.',
  },
  {
    title: 'Monitor Fans',
    desc: 'Track fan status, locations, and runtime across your facility.',
  },
  {
    title: 'Energy Saving',
    desc: 'Reduce power usage with auto-control and analytics insights.',
  }
]

export default function Home() {
  const [index, setIndex] = React.useState(0)
  React.useEffect(() => {
    const id = setInterval(() => setIndex(i => (i + 1) % slides.length), 3500)
    return () => clearInterval(id)
  }, [])

  const slidesContent = ['Smart Automated Ventilation','Real-time Gas Detection','Save Power with Auto Shutoff','Cloud Dashboard','Enterprise Ready']
  function onDragEnd(event, info){
    const dx = info.offset.x
    if (dx < -60) setIndex(i => Math.min(i+1, slidesContent.length-1))
    else if (dx > 60) setIndex(i => Math.max(i-1, 0))
  }

  return (
    <div>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-900/20 via-transparent to-black animate-pulse" />
        <div className="max-w-7xl mx-auto px-4 py-20 relative">
          <AnimatePresence mode="wait">
            <motion.div key={index} initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}} className="text-center">
              <h1 className="text-4xl md:text-5xl font-extrabold text-red-400 drop-shadow-[0_0_12px_#b91c1c]">
                {slides[index].title}
              </h1>
              <p className="mt-4 text-gray-300 max-w-2xl mx-auto">{slides[index].desc}</p>
              <Link to="/dashboard" className="btn inline-block mt-8">Go to Dashboard</Link>
            </motion.div>
          </AnimatePresence>

          {/* Smooth single-slide carousel with drag & dots */}
          <div className="mt-10 overflow-hidden flex flex-col items-center">
            <motion.div className="w-72 md:w-[32rem] h-44 md:h-64 rounded-2xl bg-gray-900/70 border border-red-800/40 shadow-[0_10px_40px_#000] backdrop-blur overflow-hidden relative"
              drag="x" dragConstraints={{ left: 0, right: 0 }} onDragEnd={onDragEnd}
              initial={{ opacity: 0.9, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 120 }}>
              <img src={`https://images.unsplash.com/photo-1558002038-1055907df827?q=80&w=1400&auto=format&fit=crop`} className="w-full h-full object-cover opacity-60"/>
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-white/10 to-transparent mix-blend-overlay" />
              <div className="absolute inset-0 p-4 flex items-end">
                <div className="text-base md:text-lg text-gray-100">{slidesContent[index]}</div>
              </div>
            </motion.div>
            <div className="mt-3 flex gap-2">
              {slidesContent.map((_,i)=> (
                <button key={i} onClick={()=>setIndex(i)} className={`h-2.5 w-2.5 rounded-full ${i===index?'bg-red-500':'bg-gray-700'}`}/>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* About inline */}
      <section className="max-w-7xl mx-auto px-4 py-12 text-center" data-aos="fade-up">
        <h2 className="text-2xl font-bold text-red-400 mb-3">About Us</h2>
        <p className="text-gray-300 max-w-3xl mx-auto">We are a team focused on safer, greener restrooms. Our system monitors gas with MQ-135 and controls ventilation fans through ESP32 + Arduino IoT Cloud for real-time responsiveness and energy savings.</p>
        <div className="mt-4">
          <Link to="/about" className="btn">Learn More</Link>
        </div>
        <div className="mt-8 flex justify-center gap-4">
          {["Mithilesh","Keerthana","Kaviya"].map(n=> (
            <div key={n} className="p-4 rounded-xl bg-gray-900/60 border border-red-800/40 hover:shadow-[0_0_20px_#ef444455] transition">
              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-red-500 to-red-700 mb-2" />
              <div className="text-red-300 text-sm font-semibold">{n}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works inline */}
      <section className="max-w-7xl mx-auto px-4 pb-12">
        <h2 className="text-2xl font-bold text-red-400 mb-4">How It Works</h2>
        <div className="flex gap-4 overflow-x-auto snap-x pb-2">
          {['Detect Gas','Send Data','Auto Control','Dashboard Update','Analytics & Energy Saving'].map((t,i)=>(
            <motion.div key={t} whileHover={{scale:1.02}} className="min-w-[220px] snap-center p-4 rounded-lg bg-gray-900/60 border border-red-800/40">
              <div className="text-red-300 font-semibold">{i+1}. {t}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-7xl mx-auto px-4 pb-12">
        <h2 className="text-2xl font-bold text-red-400 mb-4">Smart Users Love It</h2>
        <div className="flex gap-4 overflow-x-auto snap-x pb-2">
          {[{n:'Rohit',p:'Pune'},{n:'Ananya',p:'Bengaluru'},{n:'Kiran',p:'Hyderabad'}].map((u,idx)=>(
            <motion.div key={u.n} whileHover={{y:-4}} whileInView={{ scale: 1 }} initial={{ scale: 0.98 }} viewport={{ once:true }} className="min-w-[280px] snap-center p-5 rounded-xl bg-gray-900/70 border border-red-800/40" data-aos="fade-up">
              <div className="text-sm text-yellow-400">★★★★★</div>
              <div className="mt-2 text-gray-300">Great air quality and lower bills. Live dashboard is slick!</div>
              <div className="mt-3 text-sm text-gray-400">— {u.n}, {u.p}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* App Download */}
      <section className="max-w-7xl mx-auto px-4 pb-16">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className="relative" data-aos="fade-right">
            <div className="absolute -inset-6 bg-red-700/20 blur-3xl rounded-full" />
            <div className="relative h-80 rounded-2xl border border-red-800/40 overflow-hidden bg-gray-900/60 flex items-center justify-center">
              <img src="https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=1200&auto=format&fit=crop" className="h-full object-cover opacity-70" />
            </div>
          </div>
          <div data-aos="fade-left">
            <h3 className="text-2xl font-bold text-red-400">Download Smart Ventilation App</h3>
            <p className="text-gray-300 mt-2">Control fans and view insights from your phone.</p>
            <div className="mt-4 flex items-center gap-4">
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=https://example.com" className="h-24 w-24 rounded" />
              <div className="space-y-2">
                <a className="btn inline-block">Google Play</a>
                <a className="btn inline-block">App Store</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact inline */}
      <section className="max-w-7xl mx-auto px-4 pb-16 text-center" data-aos="fade-up">
        <h2 className="text-2xl font-bold text-red-400 mb-4">Contact Us</h2>
        <div className="mx-auto w-10 h-10 rounded-full bg-red-600/40 mb-3 animate-glow-red" />
        <InlineContact />
        <div className="mt-4">
          <Link to="/contact" className="btn">Contact Support</Link>
        </div>
      </section>
    </div>
  )
}

function InlineContact(){
  const [name, setName] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [message, setMessage] = React.useState('')
  const [ok, setOk] = React.useState(false)
  async function submit(e){
    e.preventDefault()
    try{
      const res = await fetch((import.meta.env.VITE_API_URL||'http://localhost:5000')+'/api/contact',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,email,message})})
      if(res.ok){ setOk(true); setName(''); setEmail(''); setMessage('') }
      setTimeout(()=>setOk(false), 1500)
    }catch{}
  }
  return (
    <form onSubmit={submit} className="space-y-3 max-w-xl">
      {ok && <div className="text-green-400">Thanks! We'll reach out soon.</div>}
      <input value={name} onChange={e=>setName(e.target.value)} placeholder="Name" className="w-full px-3 py-2 rounded bg-gray-900 border border-gray-700 focus:border-red-600 outline-none" />
      <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" type="email" className="w-full px-3 py-2 rounded bg-gray-900 border border-gray-700 focus:border-red-600 outline-none" />
      <textarea value={message} onChange={e=>setMessage(e.target.value)} placeholder="Message" className="w-full h-28 px-3 py-2 rounded bg-gray-900 border border-gray-700 focus:border-red-600 outline-none" />
      <button className="btn">Send Message</button>
    </form>
  )
}

