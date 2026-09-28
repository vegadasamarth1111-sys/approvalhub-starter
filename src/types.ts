export type Role = 'employee' | 'manager' | 'admin'
export type Status = 'pending' | 'approved' | 'rejected'

export interface Profile {
  id: string
  full_name: string | null
  role: Role
}

export interface RequestRow {
  id: string
  requester_id: string
  title: string
  description: string | null
  amount: number
  status: Status
  decision_comment: string | null
  decided_at: string | null
  created_at: string
  requester: { full_name: string | null } | null
}
