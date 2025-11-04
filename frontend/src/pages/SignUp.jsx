import React from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function SignUp(){
  const { signup } = useAuth()
  const nav = useNavigate()
  const [name, setName] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [show, setShow] = React.useState(false)
  const [error, setError] = React.useState('')

  async function onSubmit(e){
    e.preventDefault()
    setError('')
    if(name.length<2){ setError('Enter your name'); return }
    if(!email || !/^[^@]+@[^@]+\.[^@]+$/.test(email)){ setError('Enter a valid email'); return }
    if(password.length<6){ setError('Password must be at least 6 characters'); return }
    try{
      await signup({ name, email, password })
      nav('/dashboard')
    }catch(err){ setError('Sign up failed') }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-red-400 mb-6">Sign Up</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        {error && <div className="text-red-400 text-sm">{error}</div>}
        <div>
          <label className="block text-sm text-gray-300 mb-1">Name</label>
          <input value={name} onChange={e=>setName(e.target.value)} className="w-full px-3 py-2 rounded bg-gray-900 border border-gray-700 focus:border-red-600 outline-none" />
        </div>
        <div>
          <label className="block text-sm text-gray-300 mb-1">Email</label>
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full px-3 py-2 rounded bg-gray-900 border border-gray-700 focus:border-red-600 outline-none" />
        </div>
        <div>
          <label className="block text-sm text-gray-300 mb-1">Password</label>
          <div className="flex items-center gap-2">
            <input type={show?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} className="flex-1 px-3 py-2 rounded bg-gray-900 border border-gray-700 focus:border-red-600 outline-none" />
            <button type="button" onClick={()=>setShow(s=>!s)} className="px-3 py-2 rounded border border-gray-700 text-gray-300">{show?'Hide':'Show'}</button>
          </div>
        </div>
        <button className="btn w-full">Create Account</button>
      </form>
      <div className="mt-3 text-sm text-gray-400">Already have an account? <Link to="/login" className="text-red-400">Login</Link></div>
    </div>
  )
}


