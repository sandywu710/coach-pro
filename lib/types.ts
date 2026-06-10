export type Student = {
  id: string
  coach_id: string
  name: string
  phone: string | null
  sessions_remaining: number
  total_paid: number
  notes: string | null
  created_at: string
}

export type Checkin = {
  id: string
  coach_id: string
  student_id: string
  checked_in_at: string
}

export type Purchase = {
  id: string
  coach_id: string
  student_id: string
  sessions_added: number
  amount_paid: number
  purchased_at: string
  note: string | null
}
