import type { Status } from '../types'

const label: Record<Status, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
}

export default function StatusBadge({ status }: { status: Status }) {
  return <span className={`badge badge-${status}`}>{label[status]}</span>
}
