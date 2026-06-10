'use client'

import { useState } from 'react'
import { X, UserPlus, Phone, FileText } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  coachId: string
  onClose: () => void
  onAdded: () => void
}

export default function AddStudentModal({ coachId, onClose, onAdded }: Props) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [sessions, setSessions] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.from('students').insert({
      coach_id: coachId,
      name: name.trim(),
      phone: phone.trim() || null,
      sessions_remaining: parseInt(sessions) || 0,
      notes: notes.trim() || null,
    })

    if (error) {
      setError('新增失敗，請再試一次')
      setLoading(false)
      return
    }

    onAdded()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute bottom-0 left-0 right-0 bg-[#FAF7F2] rounded-t-3xl shadow-2xl max-h-[85vh] flex flex-col">
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-[#3D2B1F]/20" />
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-b border-[#EDE8E0]">
          <div className="flex items-center gap-2">
            <UserPlus size={18} className="text-[#C49A6C]" />
            <h2 className="text-lg font-bold text-[#3D2B1F]">新增學員</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-[#EDE8E0] transition">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-5 py-4 space-y-4 pb-8">
          <div>
            <label className="block text-sm font-medium text-[#3D2B1F] mb-1.5">姓名 *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              placeholder="學員姓名"
              className="w-full px-4 py-2.5 rounded-xl border border-[#EDE8E0] bg-white text-[#3D2B1F] text-sm outline-none focus:border-[#C49A6C] focus:ring-2 focus:ring-[#C49A6C]/20 transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#3D2B1F] mb-1.5">電話</label>
            <div className="relative">
              <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#3D2B1F]/40" />
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="0912-345-678"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#EDE8E0] bg-white text-[#3D2B1F] text-sm outline-none focus:border-[#C49A6C] focus:ring-2 focus:ring-[#C49A6C]/20 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#3D2B1F] mb-1.5">初始堂數</label>
            <input
              type="number"
              value={sessions}
              onChange={e => setSessions(e.target.value)}
              min="0"
              placeholder="0"
              className="w-full px-4 py-2.5 rounded-xl border border-[#EDE8E0] bg-white text-[#3D2B1F] text-sm outline-none focus:border-[#C49A6C] focus:ring-2 focus:ring-[#C49A6C]/20 transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#3D2B1F] mb-1.5">備註</label>
            <div className="relative">
              <FileText size={15} className="absolute left-3 top-3 text-[#3D2B1F]/40" />
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
                placeholder="任何備注…"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#EDE8E0] bg-white text-[#3D2B1F] text-sm outline-none focus:border-[#C49A6C] focus:ring-2 focus:ring-[#C49A6C]/20 transition resize-none"
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-[#E07070] bg-[#E07070]/10 rounded-xl px-3 py-2.5">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-[#C49A6C] text-white font-semibold text-sm transition hover:bg-[#B08055] active:scale-[0.98] disabled:opacity-60"
          >
            {loading ? '新增中…' : '新增學員'}
          </button>
        </form>
      </div>
    </div>
  )
}
