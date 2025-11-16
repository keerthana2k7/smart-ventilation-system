import React from 'react'
import { api } from '../lib/api'
import { motion, AnimatePresence } from 'framer-motion'
import io from 'socket.io-client'

const GAS_THRESHOLD = Number(import.meta.env.VITE_GAS_THRESHOLD || 200)
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

function FanCard({ fan, onClick }) {
  const isOn = fan.status === 'ON'
  const gasLevel = fan.last_gas_level || 0
  const over = gasLevel > GAS_THRESHOLD
  
  // Calculate time since last update
  const getTimeAgo = (lastUpdated) => {
    if (!lastUpdated) return 'No data yet'
    const now = new Date()
    const updated = new Date(lastUpdated)
    const seconds = Math.floor((now - updated) / 1000)
    if (seconds < 30) return `${seconds}s ago`
    if (seconds < 60) return `${seconds}s ago`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    return `${hours}h ago`
  }
  
  // Status indicator
  const getStatusIndicator = (lastUpdated) => {
    if (!lastUpdated) return '⚪'
    const now = new Date()
    const updated = new Date(lastUpdated)
    const seconds = Math.floor((now - updated) / 1000)
    if (seconds < 30) return '🟢'
    if (seconds < 300) return '🟡' // 5 minutes
    return '⚪'
  }
  
  const statusIndicator = getStatusIndicator(fan.last_updated)
  const timeAgo = getTimeAgo(fan.last_updated)
  
  return (
    <motion.button 
      whileHover={{ scale: 1.02 }} 
      onClick={onClick} 
      className={`text-left p-4 rounded-xl border ${isOn ? 'border-red-500 bg-gray-900/70' : 'border-gray-700 bg-gray-900/40'} ${isOn && over ? 'shadow-[0_0_24px_#ef4444aa] animate-glow-red' : ''}`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <FanIcon on={isOn} danger={over} />
          <div>
            <div className="text-lg font-semibold text-red-300">{fan.name}</div>
            <div className="text-sm text-gray-400">{fan.location}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-lg">{statusIndicator}</span>
          <div className={`text-sm font-medium ${isOn ? 'text-red-400' : 'text-gray-400'}`}>
            {isOn ? 'ON' : 'OFF'}
          </div>
        </div>
      </div>
      
      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-400">Gas Level:</span>
          <span className={over ? 'text-red-400 font-semibold' : 'text-gray-300'}>
            {gasLevel > 0 ? Math.round(gasLevel) : 'N/A'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Runtime Today:</span>
          <span className="text-gray-300">
            {fan.runtime_today ? `${fan.runtime_today.toFixed(1)}h` : '0h'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Last Updated:</span>
          <span className="text-gray-300 text-xs">{timeAgo}</span>
        </div>
      </div>
    </motion.button>
  )
}

function FanIcon({ on, danger }) {
  const ring = on ? (danger ? 'text-red-400' : 'text-red-300') : 'text-gray-600'
  const blades = on ? 'animate-spin-slow' : 'opacity-60'
  return (
    <svg width="34" height="34" viewBox="0 0 24 24" className={ring}>
      <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1" />
      <g className={blades} fill="currentColor" transform-origin="12 12">
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
  const [fans, setFans] = React.useState([])
  const [selected, setSelected] = React.useState(null)
  const [showAdd, setShowAdd] = React.useState(false)
  const [newFan, setNewFan] = React.useState({ name: '', location: '', device_id: '', thing_id: '' })
  const [socket, setSocket] = React.useState(null)

  // Fetch fan list
  async function fetchFanList() {
    try {
      const res = await api.get('/api/fans')
      setFans(res.data.fans || [])
    } catch (err) {
      console.error('Failed to fetch fans:', err)
    }
  }

  // Initialize Socket.IO connection
  React.useEffect(() => {
    const newSocket = io(API_BASE, {
      transports: ['websocket', 'polling']
    })
    
    newSocket.on('connect', () => {
      console.log('Socket.IO connected')
    })
    
    newSocket.on('disconnect', () => {
      console.log('Socket.IO disconnected')
    })
    
    newSocket.on('fan-update', (data) => {
      console.log('Fan update received:', data)
      // Update the specific fan in the list
      setFans(prevFans => 
        prevFans.map(fan => {
          if (fan.id === data.fan_id || fan.device_id === data.device_id) {
            return {
              ...fan,
              status: data.status,
              last_gas_level: data.gas_level,
              last_updated: data.last_updated
            }
          }
          return fan
        })
      )
      
      // Update selected fan if it's the one being updated
      if (selected && (selected.id === data.fan_id || selected.device_id === data.device_id)) {
        setSelected({
          ...selected,
          status: data.status,
          last_gas_level: data.gas_level,
          last_updated: data.last_updated
        })
      }
    })
    
    setSocket(newSocket)
    
    return () => {
      newSocket.close()
    }
  }, [])

  // Fetch fans on mount
  React.useEffect(() => {
    fetchFanList()
    // Refresh every 30 seconds as backup
    const interval = setInterval(fetchFanList, 30000)
    return () => clearInterval(interval)
  }, [])

  async function addFan() {
    if (!newFan.name || !newFan.location || !newFan.device_id) {
      alert('Please fill name, location and device ID')
      return
    }
    try {
      await api.post('/api/fans', {
        name: newFan.name,
        location: newFan.location,
        device_id: newFan.device_id,
        thing_id: newFan.thing_id || null
      })
      setShowAdd(false)
      setNewFan({ name: '', location: '', device_id: '', thing_id: '' })
      await fetchFanList()
      alert('Fan registered successfully')
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to register fan'
      alert(message)
    }
  }

  const [showDownloadMenu, setShowDownloadMenu] = React.useState(false)

  // Close download menu when clicking outside
  React.useEffect(() => {
    if (!showDownloadMenu) return
    function handleClickOutside(event) {
      const menu = document.querySelector('.download-menu-container')
      if (menu && !menu.contains(event.target)) {
        setShowDownloadMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showDownloadMenu])

  async function downloadReport(format) {
    try {
      const response = await api.get(`/api/fans/report?format=${format}`, {
        responseType: 'blob'
      })
      const blob = new Blob([response.data], {
        type: format === 'pdf' ? 'application/pdf' : 'text/csv'
      })
      const downloadUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = downloadUrl
      a.download = `fan_report_${Date.now()}.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(downloadUrl)
      document.body.removeChild(a)
      setShowDownloadMenu(false)
    } catch (err) {
      console.error('Download error:', err)
      alert('Failed to download report: ' + (err.response?.data?.message || err.message || 'Unknown error'))
    }
  }

  const getTimeAgo = (lastUpdated) => {
    if (!lastUpdated) return 'No data yet'
    const now = new Date()
    const updated = new Date(lastUpdated)
    const seconds = Math.floor((now - updated) / 1000)
    if (seconds < 30) return `${seconds}s ago`
    if (seconds < 60) return `${seconds}s ago`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    return `${hours}h ago`
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-red-400">Dashboard</h1>
        <div className="flex items-center gap-3">
          <div className="relative download-menu-container">
            <button className="btn" onClick={() => setShowDownloadMenu(!showDownloadMenu)}>
              Download Report
            </button>
            {showDownloadMenu && (
              <div className="absolute right-0 mt-2 w-48 rounded-lg bg-gray-900 border border-red-800/40 shadow-xl z-10">
                <button
                  onClick={() => downloadReport('csv')}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:text-red-300 hover:bg-gray-800 rounded-t-lg"
                >
                  Download CSV
                </button>
                <button
                  onClick={() => downloadReport('pdf')}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:text-red-300 hover:bg-gray-800 rounded-b-lg"
                >
                  Download PDF
                </button>
              </div>
            )}
          </div>
          <button className="btn" onClick={() => setShowAdd(true)}>
            Register Fan
          </button>
        </div>
      </div>

      {fans.length === 0 && (
        <div className="mt-8 text-center text-gray-400">
          <div className="text-lg">No fans added yet 🚫</div>
          <button className="btn mt-3" onClick={() => setShowAdd(true)}>
            Register Fan
          </button>
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-6">
        {fans.map(f => (
          <FanCard key={f.id} fan={f} onClick={() => setSelected(f)} />
        ))}
      </div>

      <AnimatePresence>
        {selected && (
          <motion.div
            className="fixed inset-0 z-30 bg-black/70 flex items-center justify-center px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="max-w-md w-full rounded-xl p-5 bg-gray-900 border border-red-800/40"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-xl font-semibold text-red-300">{selected.name}</div>
                  <div className="text-sm text-gray-400">{selected.location}</div>
                </div>
                <button
                  className="text-gray-400 hover:text-red-400"
                  onClick={() => setSelected(null)}
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3">
                <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
                  <div className="text-sm text-gray-400 mb-1">Gas Level</div>
                  <div className="text-2xl font-bold text-red-400">
                    {selected.last_gas_level ? Math.round(selected.last_gas_level) : 'N/A'}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-gray-800/50 border border-gray-700">
                    <div className="text-xs text-gray-400 mb-1">Status</div>
                    <div className={`text-lg font-semibold ${selected.status === 'ON' ? 'text-red-400' : 'text-gray-400'}`}>
                      {selected.status || 'OFF'}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-800/50 border border-gray-700">
                    <div className="text-xs text-gray-400 mb-1">Runtime Today</div>
                    <div className="text-lg font-semibold text-gray-300">
                      {selected.runtime_today ? `${selected.runtime_today.toFixed(1)}h` : '0h'}
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-gray-800/50 border border-gray-700">
                  <div className="text-xs text-gray-400 mb-1">Last Updated</div>
                  <div className="text-sm text-gray-300">{getTimeAgo(selected.last_updated)}</div>
                </div>

                <div className="p-3 rounded-lg bg-gray-800/50 border border-gray-700">
                  <div className="text-xs text-gray-400 mb-1">Device ID</div>
                  <div className="text-xs text-gray-300 font-mono break-all">{selected.device_id || 'N/A'}</div>
                </div>
              </div>

              <div className="mt-4 flex gap-3">
                <button
                  className="px-4 py-2 rounded border border-gray-700 text-gray-300 hover:border-red-600 hover:text-red-300"
                  onClick={() => setSelected(null)}
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAdd && (
          <motion.div
            className="fixed inset-0 z-30 bg-black/70 flex items-center justify-center px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAdd(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="max-w-md w-full rounded-xl p-5 bg-gray-900 border border-red-800/40"
            >
              <div className="text-xl font-semibold text-red-300 mb-4">Register New Fan</div>
              <div className="space-y-3">
                <input
                  placeholder="Fan Name"
                  value={newFan.name}
                  onChange={e => setNewFan(s => ({ ...s, name: e.target.value }))}
                  className="w-full px-3 py-2 rounded bg-gray-900 border border-gray-700 focus:border-red-600 outline-none"
                />
                <input
                  placeholder="Location"
                  value={newFan.location}
                  onChange={e => setNewFan(s => ({ ...s, location: e.target.value }))}
                  className="w-full px-3 py-2 rounded bg-gray-900 border border-gray-700 focus:border-red-600 outline-none"
                />
                <input
                  placeholder="ESP32 Device ID (required)"
                  value={newFan.device_id}
                  onChange={e => setNewFan(s => ({ ...s, device_id: e.target.value }))}
                  className="w-full px-3 py-2 rounded bg-gray-900 border border-gray-700 focus:border-red-600 outline-none"
                />
                <input
                  placeholder="Arduino Thing ID (optional)"
                  value={newFan.thing_id}
                  onChange={e => setNewFan(s => ({ ...s, thing_id: e.target.value }))}
                  className="w-full px-3 py-2 rounded bg-gray-900 border border-gray-700 focus:border-red-600 outline-none"
                />
                <p className="text-xs text-gray-400">
                  Find ESP32 device ID in Arduino IoT Cloud or via Serial Monitor
                </p>
                <button className="btn w-full" onClick={addFan}>
                  Add Fan
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
