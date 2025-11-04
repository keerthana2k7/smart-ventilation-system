import React from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'

export default function Profile() {
  const auth = useAuth()
  const user = auth.user
  const [editing, setEditing] = React.useState(false)
  const [form, setForm] = React.useState({
    name: user?.name || 'User',
    email: user?.email || 'user@example.com',
    phone: user?.phone || '',
    role: 'User',
    photo: user?.profile_photo || null
  })

  function onUpload(e){
    const file = e.target.files?.[0]
    if(file){ setForm(f=>({ ...f, photo: URL.createObjectURL(file) })) }
  }

  async function save(e){
    e.preventDefault()
    try{
      await api.post('/api/profile/update', { name: form.name, email: form.email, profile_photo: form.photo })
      await refresh()
      setEditing(false)
      alert('Profile updated successfully')
    }catch(err){ alert('Failed to update profile') }
  }

  async function refresh(){
    try{ await auth.refreshUser?.() }catch{}
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <motion.h2 initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} className="text-3xl font-bold text-red-400 mb-6">My Profile</motion.h2>

      {!editing ? (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 rounded-full bg-gray-800 overflow-hidden border border-red-800/40">
              {form.photo ? <img src={form.photo} className="h-full w-full object-cover"/> : null}
            </div>
            <div>
              <div className="text-red-300 font-semibold">{form.name}</div>
              <div className="text-gray-400 text-sm">{form.email}</div>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4 text-sm text-gray-300">
            <div><span className="text-gray-400">Phone:</span> {form.phone || '—'}</div>
            <div><span className="text-gray-400">Role:</span> {form.role}</div>
            <div><span className="text-gray-400">User ID:</span> {user?.id || '—'}</div>
          </div>
          <button className="btn" onClick={()=>setEditing(true)}>Edit Profile</button>
        </div>
      ) : (
        <form onSubmit={save} className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 rounded-full bg-gray-800 overflow-hidden border border-red-800/40">
              {form.photo ? <img src={form.photo} className="h-full w-full object-cover"/> : null}
            </div>
            <label className="btn cursor-pointer">
              Upload Photo
              <input type="file" className="hidden" onChange={onUpload} />
            </label>
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Name</label>
            <input value={form.name} onChange={e=>setForm(s=>({ ...s, name: e.target.value }))} className="w-full px-3 py-2 rounded bg-gray-900 border border-gray-700 focus:border-red-600 outline-none" />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Email</label>
            <input type="email" value={form.email} onChange={e=>setForm(s=>({ ...s, email: e.target.value }))} className="w-full px-3 py-2 rounded bg-gray-900 border border-gray-700 focus:border-red-600 outline-none" />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Phone</label>
            <input value={form.phone} onChange={e=>setForm(s=>({ ...s, phone: e.target.value }))} className="w-full px-3 py-2 rounded bg-gray-900 border border-gray-700 focus:border-red-600 outline-none" />
          </div>
          <div className="flex gap-2">
            <button className="btn">Save</button>
            <button type="button" onClick={()=>setEditing(false)} className="px-4 py-2 rounded border border-gray-700 text-gray-300">Cancel</button>
          </div>
        </form>
      )}
    </div>
  )
}

