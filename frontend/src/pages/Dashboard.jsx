import React from 'react'
import { api } from '../lib/api'
import { motion, AnimatePresence } from 'framer-motion'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'

const GAS_THRESHOLD = Number(import.meta.env.VITE_GAS_THRESHOLD || 200)

function Chart({ data, dataKey, color }) {
  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
          <XAxis dataKey="created_at" hide />
          <YAxis />
          <Tooltip contentStyle={{ background: '#111827', border: '1px solid #b91c1c', color: '#f3f4f6' }} />
          <Legend />
          <Line type="monotone" dataKey={dataKey} stroke={color} dot={false} strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

function FanCard({ fan, onClick, gasLevel = 0, motorState = false, threshold = 200 }) {
  const isOn = motorState || fan.status === 'ON'
  const over = gasLevel > threshold
  return (
    <motion.button whileHover={{ scale: 1.02 }} onClick={onClick} className={`text-left p-4 rounded-xl border ${isOn ? 'border-red-500 bg-gray-900/70' : 'border-gray-700 bg-gray-900/40'} ${isOn && over ? 'shadow-[0_0_24px_#ef4444aa] animate-glow-red' : ''}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FanIcon on={isOn} danger={over} />
          <div>
            <div className="text-lg font-semibold text-red-300">{fan.name}</div>
            <div className="text-sm text-gray-400">{fan.location}</div>
          </div>
        </div>
        <div className={`text-sm font-medium ${isOn ? 'text-red-400' : 'text-gray-400'}`}>{isOn ? 'ON' : 'OFF'}</div>
      </div>
      <div className="mt-2 text-sm text-gray-300">Runtime today: {fan.runtimeToday} min</div>
      <div className="mt-1 text-xs text-gray-400">Gas: <span className={over? 'text-red-400': 'text-gray-300'}>{Math.round(gasLevel)}</span></div>
    </motion.button>
  )
}

function FanIcon({ on, danger }){
  const ring = on ? (danger ? 'text-red-400' : 'text-red-300') : 'text-gray-600'
  const blades = on ? 'animate-spin-slow' : 'opacity-60'
  return (
    <svg width="34" height="34" viewBox="0 0 24 24" className={`${ring}`}>
      <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1" />
      <g className={`${blades}`} fill="currentColor">
        <path d="M12 7c1.5 0 1.5-3 0-3s-1.5 3 0 3z"/>
        <path d="M17 12c0 1.5 3 1.5 3 0s-3-1.5-3 0z"/>
        <path d="M12 17c-1.5 0-1.5 3 0 3s1.5-3 0-3z"/>
        <path d="M7 12c0-1.5-3-1.5-3 0s3 1.5 3 0z"/>
      </g>
      <circle cx="12" cy="12" r="1.6" fill="currentColor" />
    </svg>
  )
}

export default function Dashboard() {
  const [sensorData, setSensorData] = React.useState([])
  const [fans, setFans] = React.useState([])
  const [selected, setSelected] = React.useState(null)
  const [status, setStatus] = React.useState({ gasLevel: 0, motorState: false })
  const [showAdd, setShowAdd] = React.useState(false)
  const [newFan, setNewFan] = React.useState({ name: '', location: '', device_id: '', thing_id: '' })

  async function fetchStatus() {
    try {
      const res = await api.get('/api/fans/status')
      const f = res.data.fan
      // keep status for primary mapped fan; list will load from /api/fans
      setStatus({ gasLevel: res.data.gasLevel, motorState: res.data.motorState })
    } catch {}
  }
  async function fetchFanList(){
    try {
      const res = await api.get('/api/fans')
      setFans(res.data.fans || [])
    } catch {}
  }
  async function fetchData() {
    try {
      const res = await api.get('/api/arduino/data?limit=120')
      setSensorData(res.data.data || [])
    } catch {}
  }

  React.useEffect(() => {
    fetchFanList(); fetchStatus(); fetchData()
    const id = setInterval(() => { fetchStatus(); fetchData(); fetchFanList() }, 4000)
    return () => clearInterval(id)
  }, [])

  async function toggleSelectedFan() {
    if (!selected) return
    try { await api.post('/api/fans/control', { state: selected.status !== 'ON' }) } catch {}
    fetchStatus()
  }

  async function addFan() {
    if(!newFan.name || !newFan.location || !newFan.device_id){ alert('Please fill name, location and device ID'); return }
    try {
      await api.post('/api/fans', { name: newFan.name, location: newFan.location, device_id: newFan.device_id, thing_id: newFan.thing_id })
      setShowAdd(false)
      setNewFan({ name: '', location: '', device_id: '', thing_id: '' })
      await fetchFanList()
      alert('Fan registered successfully')
    } catch { alert('Failed to register fan') }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-red-400">Dashboard</h1>
        <button className="btn" onClick={()=>setShowAdd(true)}>Register Fan</button>
      </div>

      {fans.length === 0 && (
        <div className="mt-8 text-center text-gray-400">
          <div className="text-lg">No fans added yet 🚫</div>
          <button className="btn mt-3" onClick={()=>setShowAdd(true)}>Register Fan</button>
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-6">
        {fans.map(f => (
          <FanCard key={f.id} fan={{...f, runtimeToday: Math.round((f.runtime_hours||0)*60)}} gasLevel={status.gasLevel} motorState={status.motorState} threshold={GAS_THRESHOLD} onClick={() => setSelected(f)} />
        ))}
      </div>

      <AnimatePresence>
        {selected && (
          <motion.div className="fixed inset-0 z-30 bg-black/70 flex items-center justify-center px-4" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={() => setSelected(null)}>
            <motion.div initial={{scale:0.95, opacity:0}} animate={{scale:1, opacity:1}} exit={{scale:0.96, opacity:0}} onClick={e => e.stopPropagation()} className="max-w-2xl w-full rounded-xl p-5 bg-gray-900 border border-red-800/40">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xl font-semibold text-red-300">{selected.name}</div>
                  <div className="text-sm text-gray-400">{selected.location}</div>
                </div>
                <button className="text-gray-400 hover:text-red-400" onClick={() => setSelected(null)}>✕</button>
              </div>
              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <div>
                  <div className="text-sm text-gray-300 mb-2">Runtime (simulated)</div>
                  <Chart data={sensorData} dataKey="humidity" color="#ef4444" />
                </div>
                <div>
                  <div className="text-sm text-gray-300 mb-2">Gas Level</div>
                  <Chart data={sensorData.map(d=>({ ...d, created_at: d.timestamp, mq135_ppm: d.gas_level }))} dataKey="mq135_ppm" color="#f97373" />
                </div>
              </div>
              <div className="mt-4 flex gap-3">
                <button className="btn" onClick={toggleSelectedFan}>{selected.status === 'ON' ? 'Turn OFF' : 'Turn ON'}</button>
                <button className="px-4 py-2 rounded border border-gray-700 text-gray-300 hover:border-red-600 hover:text-red-300" onClick={() => setSelected(null)}>Close</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAdd && (
          <motion.div className="fixed inset-0 z-30 bg-black/70 flex items-center justify-center px-4" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={()=>setShowAdd(false)}>
            <motion.div initial={{scale:0.95, opacity:0}} animate={{scale:1, opacity:1}} exit={{scale:0.96, opacity:0}} onClick={e=>e.stopPropagation()} className="max-w-md w-full rounded-xl p-5 bg-gray-900 border border-red-800/40">
              <div className="text-xl font-semibold text-red-300 mb-4">Register New Fan</div>
              <div className="space-y-3">
                <input placeholder="Fan Name" value={newFan.name} onChange={e=>setNewFan(s=>({ ...s, name: e.target.value }))} className="w-full px-3 py-2 rounded bg-gray-900 border border-gray-700 focus:border-red-600 outline-none" />
                <input placeholder="Location" value={newFan.location} onChange={e=>setNewFan(s=>({ ...s, location: e.target.value }))} className="w-full px-3 py-2 rounded bg-gray-900 border border-gray-700 focus:border-red-600 outline-none" />
                <input placeholder="ESP32 Device ID" value={newFan.device_id} onChange={e=>setNewFan(s=>({ ...s, device_id: e.target.value }))} className="w-full px-3 py-2 rounded bg-gray-900 border border-gray-700 focus:border-red-600 outline-none" />
                <input placeholder="Arduino Thing ID (optional)" value={newFan.thing_id} onChange={e=>setNewFan(s=>({ ...s, thing_id: e.target.value }))} className="w-full px-3 py-2 rounded bg-gray-900 border border-gray-700 focus:border-red-600 outline-none" />
                <p className="text-xs text-gray-400">Find ESP32 device ID in Arduino IoT Cloud or via Serial Monitor</p>
                <button className="btn w-full" onClick={addFan}>Add Fan</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

