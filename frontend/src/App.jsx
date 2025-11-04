import React from 'react'
import { BrowserRouter, Routes, Route, Link, NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import AOS from 'aos'
import Home from './pages/Home.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Store from './pages/Store.jsx'
import About from './pages/About.jsx'
import HowItWorks from './pages/HowItWorks.jsx'
import Contact from './pages/Contact.jsx'
import Profile from './pages/Profile.jsx'
import Login from './pages/Login.jsx'
import SignUp from './pages/SignUp.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'

function Navbar() {
  const { user, logout } = useAuth()
  const linkClass = ({ isActive }) => `px-3 py-2 rounded transition hover:text-red-300 hover:drop-shadow-[0_0_6px_#ef4444] ${isActive ? 'text-red-400' : 'text-gray-300'}`
  return (
    <nav className="sticky top-0 z-20 bg-black/60 backdrop-blur border-b border-red-800/40">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img src="/logo.png" alt="Logo" className="h-8 w-8" />
          <span className="font-semibold text-red-400">Smart Restroom Ventilation</span>
        </Link>
        <div className="hidden md:flex flex-wrap items-center gap-1">
          <NavLink to="/" className={linkClass}>Home</NavLink>
          <NavLink to="/dashboard" className={linkClass}>Dashboard</NavLink>
          <NavLink to="/store" className={linkClass}>Store</NavLink>
          <NavLink to="/about" className={linkClass}>About Us</NavLink>
          <NavLink to="/how-it-works" className={linkClass}>How It Works</NavLink>
          <NavLink to="/contact" className={linkClass}>Contact</NavLink>
          {user ? <UserMenu onLogout={logout} user={user} /> : <AuthLinks linkClass={linkClass} />}
        </div>
        <MobileMenu user={user} onLogout={logout} linkClass={linkClass} />
      </div>
    </nav>
  )
}

function AuthLinks({ linkClass }){
  return (
    <div className="flex items-center gap-1">
      <NavLink to="/login" className={linkClass}>Login</NavLink>
      <NavLink to="/signup" className={linkClass}>Sign Up</NavLink>
    </div>
  )
}

function UserMenu({ user, onLogout }){
  const [open, setOpen] = React.useState(false)
  return (
    <div className="relative">
      <button onClick={()=>setOpen(o=>!o)} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-800/60">
        <img src={user?.profile_photo || '/logo.png'} className="h-8 w-8 rounded-full object-cover" />
        <span className="text-gray-200 text-sm">{user?.name || 'User'}</span>
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-44 rounded-lg bg-gray-900 border border-red-800/40 shadow-xl">
          <NavLink to="/profile" className={({isActive})=>`block px-3 py-2 text-sm ${isActive?'text-red-400':'text-gray-300'} hover:text-red-300`}>My Profile</NavLink>
          <button onClick={onLogout} className="block w-full text-left px-3 py-2 text-sm text-gray-300 hover:text-red-300">Logout</button>
        </div>
      )}
    </div>
  )
}

function MobileMenu({ user, onLogout, linkClass }){
  const [open, setOpen] = React.useState(false)
  return (
    <div className="md:hidden">
      <button className="px-3 py-2 rounded border border-red-800/40 text-gray-200" onClick={()=>setOpen(o=>!o)}>Menu</button>
      {open && (
        <div className="absolute left-0 right-0 mt-2 bg-gray-950/95 border-t border-red-800/40 px-4 py-3 space-y-1">
          <div className="flex flex-wrap gap-2">
            <NavLink to="/" className={linkClass}>Home</NavLink>
            <NavLink to="/dashboard" className={linkClass}>Dashboard</NavLink>
            <NavLink to="/store" className={linkClass}>Store</NavLink>
            <NavLink to="/about" className={linkClass}>About Us</NavLink>
            <NavLink to="/how-it-works" className={linkClass}>How It Works</NavLink>
            <NavLink to="/contact" className={linkClass}>Contact</NavLink>
            {user ? (
              <>
                <NavLink to="/profile" className={linkClass}>My Profile</NavLink>
                <button onClick={onLogout} className="px-3 py-2 rounded text-gray-300 hover:text-red-300">Logout</button>
              </>
            ) : (
              <AuthLinks linkClass={linkClass} />
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function Footer() {
  return (
    <footer className="mt-16 border-t border-red-800/40">
      <div className="h-0.5 bg-gradient-to-r from-transparent via-red-600 to-transparent blur-sm"></div>
      <div className="max-w-7xl mx-auto px-4 py-8 text-sm text-gray-400 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <img src="/logo.png" className="h-6 w-6" />
          <span>© {new Date().getFullYear()} Smart Restroom Ventilation</span>
        </div>
        <div className="flex gap-4">
          <a className="hover:text-red-400" href="#privacy">Privacy</a>
          <a className="hover:text-red-400" href="#terms">Terms</a>
          <a className="hover:text-red-400" href="#twitter">Twitter</a>
          <a className="hover:text-red-400" href="#github">GitHub</a>
        </div>
      </div>
    </footer>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <motion.main initial={{opacity:0}} animate={{opacity:1}} className="flex-1">
            {React.useEffect(()=>{ AOS.init({ duration: 600, once: true }) }, [])}
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/store" element={<Store />} />
              <Route path="/about" element={<About />} />
              <Route path="/how-it-works" element={<HowItWorks />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<SignUp />} />
            </Routes>
          </motion.main>
          <Footer />
        </div>
      </AuthProvider>
    </BrowserRouter>
  )
}

