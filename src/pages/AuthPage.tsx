import { useState, type FormEvent } from 'react'
import { useAuth } from '../AuthContext'

export default function AuthPage() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const err =
      mode === 'login' ? await signIn(email, password) : await signUp(email, password, fullName)
    if (err) setError(err)
    setBusy(false)
  }

  return (
    <div className="auth-wrap">
      <div className="auth-hero">
        <div className="logo big">A</div>
        <h1>ApprovalHub</h1>
        <p>Submit, review and approve internal requests in one place, with secure role-based access.</p>
        <ul>
          <li>Employees raise requests in seconds</li>
          <li>Managers approve or reject with comments</li>
          <li>Admins manage roles and see everything</li>
        </ul>
      </div>

      <form className="auth-card" onSubmit={submit}>
        <h2>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h2>
        <p className="muted">
          {mode === 'login' ? 'Sign in to continue' : 'New accounts start as Employee'}
        </p>

        {mode === 'signup' && (
          <label className="field">
            <span>Full name</span>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </label>
        )}
        <label className="field">
          <span>Email</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label className="field">
          <span>Password</span>
          <input
            type="password"
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>

        {error && <div className="alert">{error}</div>}

        <button className="btn btn-primary block" disabled={busy}>
          {busy ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Sign up'}
        </button>

        <p className="switch">
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button
            type="button"
            className="link"
            onClick={() => {
              setMode(mode === 'login' ? 'signup' : 'login')
              setError(null)
            }}
          >
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </form>
    </div>
  )
}
