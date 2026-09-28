import { useState } from 'react'
import type { RequestRow } from '../types'
import { formatMoney } from '../lib/format'

interface Props {
  request: RequestRow
  decision: 'approved' | 'rejected'
  onCancel: () => void
  onConfirm: (comment: string) => Promise<void>
}

export default function DecisionModal({ request, decision, onCancel, onConfirm }: Props) {
  const [comment, setComment] = useState('')
  const [busy, setBusy] = useState(false)
  const approving = decision === 'approved'

  const submit = async () => {
    setBusy(true)
    await onConfirm(comment.trim())
    setBusy(false)
  }

  return (
    <div className="overlay" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>{approving ? 'Approve request' : 'Reject request'}</h3>
        <p className="muted">
          {request.title} · {formatMoney(request.amount)} · by {request.requester?.full_name ?? 'Unknown'}
        </p>
        <label className="field">
          <span>Comment {approving ? '(optional)' : '(recommended)'}</span>
          <textarea
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add a short note for the requester"
          />
        </label>
        <div className="row end gap">
          <button className="btn btn-ghost" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button className={`btn ${approving ? 'btn-success' : 'btn-danger'}`} onClick={submit} disabled={busy}>
            {busy ? 'Saving...' : approving ? 'Confirm approve' : 'Confirm reject'}
          </button>
        </div>
      </div>
    </div>
  )
}
