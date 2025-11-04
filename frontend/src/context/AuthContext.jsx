import React from 'react'
import { api } from '../lib/api'

export const AuthContext = React.createContext(null)

export function AuthProvider({ children }){
  const [user, setUser] = React.useState(() => {
    const raw = localStorage.getItem('user')
    return raw ? JSON.parse(raw) : null
  })

  function loginSuccess(token, user){
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    setUser(user)
  }

  function logout(){
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  async function refreshUser(){
    if(!localStorage.getItem('token')) return
    try{
      const { data } = await api.get('/api/profile/me')
      localStorage.setItem('user', JSON.stringify(data.user))
      setUser(data.user)
    }catch{}
  }

  async function signup(payload){
    const { data } = await api.post('/api/auth/signup', payload)
    // Auto-login on signup
    const loginRes = await api.post('/api/auth/login', { email: payload.email, password: payload.password })
    loginSuccess(loginRes.data.token, loginRes.data.user)
    await refreshUser()
  }

  async function login(payload){
    const { data } = await api.post('/api/auth/login', payload)
    loginSuccess(data.token, data.user)
    await refreshUser()
  }

  React.useEffect(()=>{ refreshUser() }, [])

  const value = { user, login, signup, logout, refreshUser, setUser }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(){
  return React.useContext(AuthContext)
}


