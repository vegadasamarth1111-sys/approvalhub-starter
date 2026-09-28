import { useMemo, useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import type { Profile, RequestRow, Status } from '../types'
import { formatDate, formatMoney } from '../lib/format'
import StatusBadge from '../components/StatusBadge'
import DecisionModal from '../components/DecisionModal'

interface Props {
  profile: Profile
  requests: RequestRow[]
  reload: () => Promise<void>
  notify: (kind: 'success' | 'error', text: string) => void
}

type Filter = 'all' | Status

export default function Requests({ profile, requests, reload, notify }: Props) {
  const isReviewer = profile.role !== 'employee'

  // ---- create form state ----
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)

  // ---- list state ----
  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')
  const [deciding, setDeciding] = useState<{ request: RequestRow; decision: 'approved' | 'rejected' } | null>(null)

  const create = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const { error } = await supabase.from('requests').insert({
      requester_id: profile.id,
      title: title.trim(),
      description: description.trim() || null,
      amount: Number(amount),
    })
    setSaving(false)
    if (error) return notify('error', error.message)
    setTitle('')
    setAmount('')
    setDescription('')
    notify('success', 'Request submitted')
    await reload()
  }

  const decide = async (comment: string) => {
    if (!deciding) return
    const { error } = await supabase
      .from('requests')
      .update({ status: deciding.decision, decision_comment: comment || null })
      .eq('id', deciding.request.id)
    if (error) {
      notify('error', error.message)
    } else {
      notify('success', `Request ${deciding.decision}`)
      await reload()
    }
    setDeciding(null)
  }

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    return requests.filter(
      (r) =>
        (filter === 'all' || r.status === filter) &&
        (q === '' ||
          r.title.toLowerCase().includes(q) ||
          (r.requester?.full_name ?? '').toLowerCase().includes(q)),
    )
  }, [requests, filter, search])

  const filters: Filter[] = ['all', 'pending', 'approved', 'rejected']

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{isReviewer ? 'All requests' : 'My requests'}</h1>
          <p className="muted">
            {isReviewer ? 'Review and decide on pending requests.' : 'Create a request and track its status.'}
          </p>
        </div>
      </div>

      <section className="card">
        <h3>New request</h3>
        <form className="form-grid" onSubmit={create}>
          <label className="field">
            <span>Title</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              minLength={3}
              maxLength={120}
              placeholder="e.g. Laptop purchase for new hire"
              required
            />
          </label>
          <label className="field">
            <span>Amount (INR)</span>
            <input
              type="number"
              min={0}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              required
            />
          </label>
          <label className="field span-2">
            <span>Description</span>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Why is this needed?"
            />
          </label>
          <div className="span-2 row end">
            <button className="btn btn-primary" disabled={saving}>
              {saving ? 'Submitting...' : 'Submit request'}
            </button>
          </div>
        </form>
      </section>

      <section className="card">
        <div className="toolbar">
          <div className="tabs">
            {filters.map((f) => (
              <button key={f} className={`tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                {f[0].toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <input
            className="search"
            placeholder="Search title or name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {visible.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">📭</div>
            <p>No requests match your view.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Request</th>
                  {isReviewer && <th>Requested by</th>}
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Status</th>
                  {isReviewer && <th />}
                </tr>
              </thead>
              <tbody>
                {visible.map((r) => {
                  const canDecide = isReviewer && r.status === 'pending' && r.requester_id !== profile.id
                  return (
                    <tr key={r.id}>
                      <td>
                        <strong>{r.title}</strong>
                        {r.description && <div className="muted small">{r.description}</div>}
                        {r.decision_comment && <div className="note">💬 {r.decision_comment}</div>}
                      </td>
                      {isReviewer && <td>{r.requester?.full_name ?? 'Unknown'}</td>}
                      <td>{formatMoney(r.amount)}</td>
                      <td>{formatDate(r.created_at)}</td>
                      <td>
                        <StatusBadge status={r.status} />
                      </td>
                      {isReviewer && (
                        <td className="actions">
                          {canDecide && (
                            <>
                              <button
                                className="btn btn-sm btn-success"
                                onClick={() => setDeciding({ request: r, decision: 'approved' })}
                              >
                                Approve
                              </button>
                              <button
                                className="btn btn-sm btn-danger"
                                onClick={() => setDeciding({ request: r, decision: 'rejected' })}
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {deciding && (
        <DecisionModal
          request={deciding.request}
          decision={deciding.decision}
          onCancel={() => setDeciding(null)}
          onConfirm={decide}
        />
      )}
    </>
  )
}
