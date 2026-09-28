import type { Profile, RequestRow, Status } from '../types'
import { formatDate, formatMoney } from '../lib/format'
import StatusBadge from '../components/StatusBadge'

interface Props {
  profile: Profile
  requests: RequestRow[]
  onOpenRequests: () => void
}

export default function Dashboard({ profile, requests, onOpenRequests }: Props) {
  const isReviewer = profile.role !== 'employee'
  const count = (s: Status) => requests.filter((r) => r.status === s).length
  const pending = count('pending')
  const approved = count('approved')
  const rejected = count('rejected')
  const total = requests.length
  const approvedAmount = requests
    .filter((r) => r.status === 'approved')
    .reduce((sum, r) => sum + Number(r.amount), 0)

  const bars: { status: Status; value: number }[] = [
    { status: 'pending', value: pending },
    { status: 'approved', value: approved },
    { status: 'rejected', value: rejected },
  ]
  const recent = requests.slice(0, 5)

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Hello, {profile.full_name ?? 'there'}</h1>
          <p className="muted">
            {isReviewer ? 'Here is what is happening across the organisation.' : 'Here is a summary of your requests.'}
          </p>
        </div>
      </div>

      <div className="stats">
        <div className="stat">
          <span className="stat-label">{isReviewer ? 'Total requests' : 'My requests'}</span>
          <span className="stat-value">{total}</span>
        </div>
        <div className="stat stat-pending">
          <span className="stat-label">Pending</span>
          <span className="stat-value">{pending}</span>
        </div>
        <div className="stat stat-approved">
          <span className="stat-label">Approved</span>
          <span className="stat-value">{approved}</span>
        </div>
        <div className="stat stat-rejected">
          <span className="stat-label">Rejected</span>
          <span className="stat-value">{rejected}</span>
        </div>
      </div>

      <div className="grid-2">
        <section className="card">
          <h3>Status breakdown</h3>
          {total === 0 ? (
            <p className="muted">No data yet.</p>
          ) : (
            <div className="bars">
              {bars.map((b) => (
                <div key={b.status} className="bar-row">
                  <span className="bar-name">{b.status}</span>
                  <div className="bar-track">
                    <div className={`bar-fill bar-${b.status}`} style={{ width: `${(b.value / total) * 100}%` }} />
                  </div>
                  <span className="bar-num">{b.value}</span>
                </div>
              ))}
            </div>
          )}
          <div className="divider" />
          <div className="row between">
            <span className="muted">Total approved amount</span>
            <strong>{formatMoney(approvedAmount)}</strong>
          </div>
        </section>

        <section className="card">
          <div className="row between">
            <h3>Recent activity</h3>
            <button className="link" onClick={onOpenRequests}>
              View all
            </button>
          </div>
          {recent.length === 0 ? (
            <p className="muted">No requests yet. Create your first one from the Requests tab.</p>
          ) : (
            <ul className="activity">
              {recent.map((r) => (
                <li key={r.id}>
                  <div>
                    <strong>{r.title}</strong>
                    <div className="muted small">
                      {r.requester?.full_name ?? 'Unknown'} · {formatDate(r.created_at)} · {formatMoney(r.amount)}
                    </div>
                  </div>
                  <StatusBadge status={r.status} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {isReviewer && pending > 0 && (
        <div className="callout">
          <strong>{pending}</strong> request{pending > 1 ? 's are' : ' is'} waiting for a decision.
          <button className="btn btn-primary" onClick={onOpenRequests}>
            Review now
          </button>
        </div>
      )}
    </>
  )
}
