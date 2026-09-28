import { useCallback, useEffect, useState } from 'react'
import { useAuth } from './AuthContext'
import { isConfigured, supabase } from './lib/supabase'
import type { RequestRow } from './types'
import AuthPage from './pages/AuthPage'
import Dashboard from './pages/Dashboard'
import Requests from './pages/Requests'
import Users from './pages/Users'
import Toasts, { type ToastMsg } from './components/Toast'

type View = 'dashboard' | 'requests' | 'users'

export default function App() {
  const { session, profile, loading, signOut } = useAuth()
  const [view, setView] = useState<View>('dashboard')
  const [requests, setRequests] = useState<RequestRow[]>([])
  const [toasts, setToasts] = useState<ToastMsg[]>([])

  const notify = useCallback((kind: 'success' | 'error', text: string) => {
    const id = Date.now() + Math.random()
    setToasts((t) => [...t, { id, kind, text }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500)
  }, [])

  // Row Level Security decides which rows come back: employees get only their own,
  // managers and admins get all of them.
  const reload = useCallback(async () => {
    const { data, error } = await supabase
      .from('requests')
      .select('*, requester:profiles!requester_id(full_name)')
      .order('created_at', { ascending: false })
    if (error) notify('error', error.message)
    else setRequests((data ?? []) as unknown as RequestRow[])
  }, [notify])

  const profileId = profile?.id
  useEffect(() => {
    if (profileId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      reload()
    }
  }, [profileId, reload])

  if (!isConfigured) {
    return (
      <div className="center-screen">
        <div className="card narrow">
          <h2>Setup needed</h2>
          <p className="muted">
            Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> to your <code>.env</code> file
            (locally) or to Netlify environment variables, then rebuild.
          </p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="center-screen">
        <div className="spinner" />
      </div>
    )
  }

  if (!session) return <AuthPage />

  if (!profile) {
    return (
      <div className="center-screen">
        <div className="card narrow">
          <h2>Profile not found</h2>
          <p className="muted">
            Your account exists but has no profile row. Make sure you ran <code>supabase/schema.sql</code> before signing up.
          </p>
          <button className="btn btn-ghost" onClick={signOut}>
            Sign out
          </button>
        </div>
      </div>
    )
  }

  const nav: { id: View; label: string; icon: string; show: boolean }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊', show: true },
    { id: 'requests', label: profile.role === 'employee' ? 'My requests' : 'All requests', icon: '🧾', show: true },
    { id: 'users', label: 'Team & roles', icon: '👥', show: profile.role === 'admin' },
  ]

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="logo">A</div>
          <span>ApprovalHub</span>
        </div>
        <nav>
          {nav
            .filter((n) => n.show)
            .map((n) => (
              <button
                key={n.id}
                className={`nav-item ${view === n.id ? 'active' : ''}`}
                onClick={() => setView(n.id)}
              >
                <span>{n.icon}</span>
                {n.label}
              </button>
            ))}
        </nav>
        <div className="user-box">
          <div className="avatar">{(profile.full_name ?? '?')[0].toUpperCase()}</div>
          <div className="user-meta">
            <strong>{profile.full_name}</strong>
            <span className={`role role-${profile.role}`}>{profile.role}</span>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={signOut}>
            Sign out
          </button>
        </div>
      </aside>

      <main className="content">
        {view === 'dashboard' && (
          <Dashboard profile={profile} requests={requests} onOpenRequests={() => setView('requests')} />
        )}
        {view === 'requests' && <Requests profile={profile} requests={requests} reload={reload} notify={notify} />}
        {view === 'users' && profile.role === 'admin' && <Users me={profile} notify={notify} />}
      </main>

      <Toasts items={toasts} />
    </div>
  )
}
