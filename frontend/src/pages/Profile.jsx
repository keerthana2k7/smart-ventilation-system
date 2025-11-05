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

  // Sync form when user changes
  React.useEffect(() => {
    if (user) {
      setForm({
        name: user.name || 'User',
        email: user.email || 'user@example.com',
        phone: user.phone || '',
        role: 'User',
        photo: user.profile_photo || null
      })
    }
  }, [user])

  function onUpload(e){
    const file = e.target.files?.[0]
    if(file){ setForm(f=>({ ...f, photo: URL.createObjectURL(file) })) }
  }

  async function save(e){
    e.preventDefault()
    try{
      // Handle file upload if a new photo was selected
      let photoUrl = form.photo
      if (form.photo && form.photo.startsWith('blob:')) {
        // User selected a new file, need to upload it
        const formData = new FormData()
        const fileInput = document.querySelector('input[type="file"]')
        if (fileInput?.files?.[0]) {
          formData.append('file', fileInput.files[0])
          const uploadRes = await api.post('/api/uploads', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          })
          photoUrl = uploadRes.data.file.url || photoUrl
        }
      }
      
      // Prepare update data
      const updateData = { name: form.name, email: form.email }
      // Always preserve photo: send new uploaded URL, or existing URL, or existing user photo
      if (photoUrl && !photoUrl.startsWith('blob:')) {
        // Valid photo URL (either newly uploaded or existing)
        updateData.photo = photoUrl
      } else if (!photoUrl && user?.profile_photo) {
        // No new photo selected, preserve existing one
        updateData.photo = user.profile_photo
      }
      // If photoUrl is still a blob, upload must have failed - don't send it
      
      const response = await api.post('/api/profile/update', updateData)
      // Update user state with returned user data if available
      if (response.data.user) {
        auth.setUser?.(response.data.user)
        localStorage.setItem('user', JSON.stringify(response.data.user))
      }
      await refresh()
      // Update form state with new photo URL from response
      if (response.data.user?.profile_photo) {
        setForm(f => ({ ...f, photo: response.data.user.profile_photo }))
      }
      setEditing(false)
      alert('Profile updated successfully')
    }catch(err){ 
      console.error(err)
      alert('Failed to update profile: ' + (err.response?.data?.message || err.message))
    }
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

