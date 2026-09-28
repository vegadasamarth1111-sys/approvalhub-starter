import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Profile, Role } from '../types'

interface Props {
  me: Profile
  notify: (kind: 'success' | 'error', text: string) => void
}

const roles: Role[] = ['employee', 'manager', 'admin']

export default function Users({ me, notify }: Props) {
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .order('created_at', { ascending: true })
    if (error) notify('error', error.message)
    else setUsers((data ?? []) as Profile[])
    setLoading(false)
  }, [notify])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [load])

  const changeRole = async (id: string, role: Role) => {
    const { error } = await supabase.from('profiles').update({ role }).eq('id', id)
    if (error) return notify('error', error.message)
    notify('success', 'Role updated')
    await load()
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Team &amp; roles</h1>
          <p className="muted">Only admins can change roles. Enforced by database policies.</p>
        </div>
      </div>
      <section className="card">
        {loading ? (
          <p className="muted">Loading...</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Role</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <strong>{u.full_name ?? 'Unnamed'}</strong>
                      {u.id === me.id && <span className="you">You</span>}
                    </td>
                    <td>
                      <select
                        value={u.role}
                        disabled={u.id === me.id}
                        onChange={(e) => changeRole(u.id, e.target.value as Role)}
                      >
                        {roles.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  )
}
