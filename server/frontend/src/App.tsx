import './App.css'
import Topbar from './components/Topbar'
import Overview from './pages/Overview'
import ThreatHunt from './pages/ThreatHunt'
import Firehose from './pages/Firehose'
import RulesEngine from './pages/RulesEngine'
import AdminPanel from './pages/AdminPanel'
import { Login } from './pages/Login'
import AIPanel from './components/AIPanel'
import ErrorBoundary from './components/ErrorBoundary'
import { useState, useEffect } from 'react'
import { api } from './api/client'

// View can now include 'admin' for the admin panel
export type View = 'overview' | 'hunt' | 'firehose' | 'rules' | 'admin'

interface UserIdentity {
  email: string
  role: 'admin' | 'user'
  tenant: Record<string, unknown> | null
}

export default function App() {
  const [view, setView] = useState<View>('overview')
  const [huntHost, setHuntHost] = useState<string | null>(null)
  const [aiPanelOpen, setAiPanelOpen] = useState(false)
  const [aiContext, setAiContext] = useState<{ alert_id?: number; host_id?: string; hours?: number } | undefined>(undefined)

  // SaaS: current user identity (role, email, tenant)
  const [user, setUser] = useState<UserIdentity | null>(null)

  // Admin impersonation: when admin views a specific tenant's dashboard
  const [impersonateTenantId, setImpersonateTenantId] = useState<string | null>(null)
  const [impersonateEmail, setImpersonateEmail] = useState<string | null>(null)
  
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  // Load user identity on mount with fallback safety timeout
  useEffect(() => {
    let mounted = true
    const safetyTimer = setTimeout(() => {
      if (mounted) setIsCheckingAuth(false)
    }, 3000)

    api.getMe()
      .then(me => {
        if (!mounted) return
        if (!me.authenticated) {
          setIsCheckingAuth(false)
          return
        }
        setUser({ email: me.email, role: me.role, tenant: me.tenant ?? null })
        if (me.role === 'admin') setView('admin')
        setIsCheckingAuth(false)
      })
      .catch(() => {
        if (mounted) setIsCheckingAuth(false)
      })
      .finally(() => {
        clearTimeout(safetyTimer)
      })

    return () => {
      mounted = false
      clearTimeout(safetyTimer)
    }
  }, [])

  // Global event: open AI panel
  useEffect(() => {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent
      setAiContext(customEvent.detail)
      setAiPanelOpen(true)
    }
    window.addEventListener('open-ai', handler)
    return () => window.removeEventListener('open-ai', handler)
  }, [])

  const handleNavigateToHunt = (hostId: string) => {
    setHuntHost(hostId)
    setView('hunt')
  }

  // Admin: impersonate a tenant's dashboard
  const handleImpersonate = (tenantId: string, email: string) => {
    setImpersonateTenantId(tenantId)
    setImpersonateEmail(email)
    setView('overview')
  }

  // Admin: stop impersonating — go back to admin panel
  const handleStopImpersonating = () => {
    setImpersonateTenantId(null)
    setImpersonateEmail(null)
    setView('admin')
  }

  const handleSignOut = async () => {
    try {
      await api.logout()
    } finally {
      window.location.href = '/login'
    }
  }

  if (isCheckingAuth) {
    return (
      <div style={{
        height: '100vh', width: '100vw', background: '#0d0d0f',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 16, color: '#a1a1aa', fontFamily: 'sans-serif'
      }}>
        <div className="spinner" style={{ width: 28, height: 28 }} />
        <span style={{ fontSize: 13, fontWeight: 500, letterSpacing: '0.5px' }}>Loading ISHA-X EDR...</span>
      </div>
    )
  }

  if (!user || window.location.pathname === '/login') {
    return <Login onLoginSuccess={(u) => {
      setUser(u)
      window.history.pushState({}, '', '/')
      if (u.role === 'admin') setView('admin')
    }} />
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg-1)', overflow: 'hidden' }}>
      <Topbar
        view={view}
        onViewChange={setView}
        onToggleAI={() => {
          setAiContext(undefined)
          setAiPanelOpen(o => !o)
        }}
        user={user}
        onSignOut={handleSignOut}
        isAdmin={user?.role === 'admin'}
        impersonating={impersonateEmail}
        onStopImpersonating={handleStopImpersonating}
      />

      {/* Impersonation banner */}
      {impersonateEmail && (
        <div style={{
          background: 'rgba(99,102,241,0.15)',
          borderBottom: '1px solid rgba(99,102,241,0.3)',
          padding: '6px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          fontSize: 12,
          color: 'var(--accent)',
          fontWeight: 600,
        }}>
          <span>👁 Viewing dashboard as: <strong>{impersonateEmail}</strong></span>
          <button
            onClick={handleStopImpersonating}
            style={{
              marginLeft: 'auto', padding: '3px 10px', borderRadius: 6,
              background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.4)',
              color: 'var(--accent)', cursor: 'pointer', fontSize: 12, fontWeight: 700,
            }}
          >
            ← Back to Admin Panel
          </button>
        </div>
      )}

      <div className="main-layout" style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div className="page-content" style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <ErrorBoundary key={view} fallbackTitle={`${view.toUpperCase()} View Error`}>
            {view === 'overview' && <Overview
              onHostClick={handleNavigateToHunt}
              impersonateTenantId={impersonateTenantId ?? undefined}
            />}
            {view === 'hunt'     && <ThreatHunt initialHost={huntHost} />}
            {view === 'firehose' && <Firehose />}
            {view === 'rules'    && <RulesEngine />}
            {view === 'admin'    && user?.role === 'admin' && !impersonateTenantId &&
              <AdminPanel onImpersonate={handleImpersonate} />
            }
          </ErrorBoundary>
        </div>
      </div>

      <AIPanel
        isOpen={aiPanelOpen}
        onClose={() => setAiPanelOpen(false)}
        context={aiContext}
      />
    </div>
  )
}
