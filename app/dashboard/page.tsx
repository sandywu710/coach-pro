'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, DollarSign, Users, CalendarCheck, AlertTriangle,
  TrendingUp, ShoppingCart, Clock, BarChart2, PlusCircle, Check, AlertCircle, ChevronDown
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Student, Purchase } from '@/lib/types'

type MonthlyRevenue = { label: string; amount: number }

type Stats = {
  monthlyRevenue: number
  totalSessionsRemaining: number
  studentCount: number
  monthlyCheckins: number
  lowStudents: Student[]
  recentPurchases: (Purchase & { student_name: string })[]
  revenueHistory: MonthlyRevenue[]
}

export default function DashboardPage() {
  const router = useRouter()
  const [coachId, setCoachId] = useState('')
  const [stats, setStats] = useState<Stats | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [coachName, setCoachName] = useState('')
  const [loading, setLoading] = useState(true)

  // 補登收入表單
  const [showBackfill, setShowBackfill] = useState(false)
  const [bfStudent, setBfStudent] = useState('')
  const [bfAmount, setBfAmount] = useState('')
  const [bfDate, setBfDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [bfNote, setBfNote] = useState('')
  const [bfLoading, setBfLoading] = useState(false)
  const [bfFeedback, setBfFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  async function loadData() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    setCoachId(user.id)
    setCoachName(user.user_metadata?.display_name || user.email?.split('@')[0] || '教練')

    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString()
    const yearAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1).toISOString()

    const [studentsRes, checkinsRes, purchasesRes, recentPurchasesRes, allPurchasesRes] = await Promise.all([
      supabase.from('students').select('*').order('name'),
      supabase.from('checkins').select('id').gte('checked_in_at', monthStart).lte('checked_in_at', monthEnd),
      supabase.from('purchases').select('amount_paid').gte('purchased_at', monthStart).lte('purchased_at', monthEnd),
      supabase.from('purchases').select('*, students(name)').order('purchased_at', { ascending: false }).limit(10),
      supabase.from('purchases').select('amount_paid, purchased_at').gte('purchased_at', yearAgo),
    ])

    const studentList: Student[] = studentsRes.data || []
    setStudents(studentList)

    const monthlyCheckins = checkinsRes.data?.length || 0
    const monthlyRevenue = (purchasesRes.data || []).reduce((sum, p) => sum + (p.amount_paid || 0), 0)
    const totalSessionsRemaining = studentList.reduce((sum, s) => sum + (s.sessions_remaining || 0), 0)
    const lowStudents = studentList.filter(s => s.sessions_remaining <= 3).sort((a, b) => a.sessions_remaining - b.sessions_remaining)

    const recentPurchases = (recentPurchasesRes.data || []).map((p: any) => ({
      ...p,
      student_name: p.students?.name || '未知學員',
    }))

    const monthMap: Record<string, number> = {}
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      monthMap[key] = 0
    }
    for (const p of allPurchasesRes.data || []) {
      const d = new Date(p.purchased_at)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      if (key in monthMap) monthMap[key] += p.amount_paid || 0
    }
    const revenueHistory: MonthlyRevenue[] = Object.entries(monthMap).map(([key, amount]) => {
      const [, m] = key.split('-')
      return { label: `${parseInt(m)} 月`, amount }
    })

    setStats({ monthlyRevenue, totalSessionsRemaining, studentCount: studentList.length, monthlyCheckins, lowStudents, recentPurchases, revenueHistory })
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  async function handleBackfill(e: React.FormEvent) {
    e.preventDefault()
    const amount = parseFloat(bfAmount)
    if (!bfStudent || !amount || amount <= 0 || !bfDate) return
    setBfLoading(true)

    const supabase = createClient()
    const { error } = await supabase.from('purchases').insert({
      coach_id: coachId,
      student_id: bfStudent,
      sessions_added: 0,
      amount_paid: amount,
      purchased_at: new Date(bfDate).toISOString(),
      note: bfNote.trim() || '補登收入',
    })

    if (error) {
      setBfFeedback({ type: 'error', msg: '新增失敗，請再試一次' })
    } else {
      setBfFeedback({ type: 'success', msg: '補登成功！' })
      setBfAmount('')
      setBfNote('')
      setBfDate(new Date().toISOString().slice(0, 10))
      setBfStudent('')
      setShowBackfill(false)
      loadData()
    }
    setBfLoading(false)
    setTimeout(() => setBfFeedback(null), 3000)
  }

  function formatDate(iso: string) {
    const d = new Date(iso)
    return d.toLocaleDateString('zh-TW', { month: 'long', day: 'numeric' })
  }

  const now = new Date()
  const monthLabel = `${now.getMonth() + 1} 月`

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF7F2]">
        <div className="text-[#3D2B1F]/50 text-sm">載入中…</div>
      </div>
    )
  }

  const maxRevenue = Math.max(...(stats?.revenueHistory.map(r => r.amount) || [1]), 1)

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      <header className="sticky top-0 z-10 bg-[#FAF7F2]/90 backdrop-blur-sm border-b border-[#EDE8E0]">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => router.push('/')} className="p-2 -ml-2 rounded-full hover:bg-[#EDE8E0] transition">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-base font-bold text-[#3D2B1F]">儀表板</h1>
            <p className="text-xs text-[#3D2B1F]/50">{coachName} · {monthLabel}總覽</p>
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 pt-4 pb-10 space-y-4">

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={<DollarSign size={18} className="text-[#C49A6C]" />} label={`${monthLabel}收入`} value={`$${stats?.monthlyRevenue.toLocaleString() || 0}`} bg="bg-[#C49A6C]/10" />
          <StatCard icon={<CalendarCheck size={18} className="text-green-600" />} label={`${monthLabel}報到`} value={`${stats?.monthlyCheckins || 0} 次`} bg="bg-green-50" />
          <StatCard icon={<Users size={18} className="text-blue-500" />} label="學員人數" value={`${stats?.studentCount || 0} 位`} bg="bg-blue-50" />
          <StatCard icon={<TrendingUp size={18} className="text-purple-500" />} label="總剩餘堂數" value={`${stats?.totalSessionsRemaining || 0} 堂`} bg="bg-purple-50" />
        </div>

        {/* 補登收入 */}
        <div className="bg-white rounded-2xl border border-[#EDE8E0] overflow-hidden">
          <button
            onClick={() => setShowBackfill(v => !v)}
            className="w-full flex items-center justify-between px-4 py-3.5"
            style={{ touchAction: 'manipulation' }}
          >
            <span className="flex items-center gap-2 font-semibold text-sm text-[#3D2B1F]">
              <PlusCircle size={16} className="text-[#C49A6C]" />
              補登收入紀錄
            </span>
            <ChevronDown size={16} className={`text-[#3D2B1F]/40 transition-transform ${showBackfill ? 'rotate-180' : ''}`} />
          </button>

          {showBackfill && (
            <form onSubmit={handleBackfill} className="border-t border-[#EDE8E0] px-4 pb-4 pt-3 space-y-3">
              <p className="text-xs text-[#3D2B1F]/50">補登過去收入，不會影響學員剩餘堂數</p>

              <div>
                <label className="text-xs text-[#3D2B1F]/60 mb-1 block">選擇學員</label>
                <select
                  value={bfStudent}
                  onChange={e => setBfStudent(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 rounded-xl border border-[#EDE8E0] bg-[#FAF7F2] text-[#3D2B1F] text-sm outline-none focus:border-[#C49A6C]"
                >
                  <option value="">請選擇學員…</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#3D2B1F]/60 mb-1 block">金額 ($)</label>
                  <input
                    type="number"
                    value={bfAmount}
                    onChange={e => setBfAmount(e.target.value)}
                    required min="1"
                    placeholder="5000"
                    className="w-full px-3 py-2.5 rounded-xl border border-[#EDE8E0] bg-[#FAF7F2] text-sm outline-none focus:border-[#C49A6C]"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#3D2B1F]/60 mb-1 block">日期</label>
                  <input
                    type="date"
                    value={bfDate}
                    onChange={e => setBfDate(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 rounded-xl border border-[#EDE8E0] bg-[#FAF7F2] text-sm outline-none focus:border-[#C49A6C]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-[#3D2B1F]/60 mb-1 block">備註（選填）</label>
                <input
                  type="text"
                  value={bfNote}
                  onChange={e => setBfNote(e.target.value)}
                  placeholder="例：3月課程費用"
                  className="w-full px-3 py-2.5 rounded-xl border border-[#EDE8E0] bg-[#FAF7F2] text-sm outline-none focus:border-[#C49A6C]"
                />
              </div>

              {bfFeedback && (
                <div className={`flex items-center gap-2 text-sm px-3 py-2.5 rounded-xl ${bfFeedback.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-[#E07070]/10 text-[#E07070]'}`}>
                  {bfFeedback.type === 'success' ? <Check size={14} /> : <AlertCircle size={14} />}
                  {bfFeedback.msg}
                </div>
              )}

              <button
                type="submit"
                disabled={bfLoading}
                style={{ touchAction: 'manipulation' }}
                className="w-full py-3 rounded-xl bg-[#C49A6C] text-white font-semibold text-sm disabled:opacity-60"
              >
                {bfLoading ? '新增中…' : '確認新增'}
              </button>
            </form>
          )}
        </div>

        {/* Monthly revenue history */}
        <div className="bg-white rounded-2xl border border-[#EDE8E0] overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-[#EDE8E0]">
            <BarChart2 size={15} className="text-[#C49A6C]" />
            <span className="text-sm font-semibold text-[#3D2B1F]">每月收入（過去 12 個月）</span>
          </div>
          <div className="px-4 py-4 space-y-2.5">
            {stats?.revenueHistory.map((r, i) => {
              const isCurrentMonth = i === (stats.revenueHistory.length - 1)
              const pct = maxRevenue > 0 ? (r.amount / maxRevenue) * 100 : 0
              return (
                <div key={i} className="flex items-center gap-3">
                  <span className={`text-xs w-8 shrink-0 text-right ${isCurrentMonth ? 'font-bold text-[#C49A6C]' : 'text-[#3D2B1F]/50'}`}>
                    {r.label}
                  </span>
                  <div className="flex-1 h-6 bg-[#FAF7F2] rounded-lg overflow-hidden">
                    <div
                      className={`h-full rounded-lg transition-all duration-500 ${isCurrentMonth ? 'bg-[#C49A6C]' : 'bg-[#C49A6C]/40'}`}
                      style={{ width: `${pct}%`, minWidth: r.amount > 0 ? '4px' : '0' }}
                    />
                  </div>
                  <span className={`text-xs w-16 shrink-0 text-right ${isCurrentMonth ? 'font-bold text-[#C49A6C]' : 'text-[#3D2B1F]/60'}`}>
                    {r.amount > 0 ? `$${r.amount.toLocaleString()}` : '—'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Low sessions students */}
        {stats && stats.lowStudents.length > 0 && (
          <div className="bg-white rounded-2xl border border-[#E07070]/30 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-[#EDE8E0]">
              <AlertTriangle size={15} className="text-[#E07070]" />
              <span className="text-sm font-semibold text-[#3D2B1F]">堂數不足學員</span>
              <span className="ml-auto text-xs bg-[#E07070]/10 text-[#E07070] rounded-full px-2 py-0.5">{stats.lowStudents.length} 位</span>
            </div>
            <ul>
              {stats.lowStudents.map((s, i) => (
                <li key={s.id} className={`flex items-center justify-between px-4 py-3 ${i < stats.lowStudents.length - 1 ? 'border-b border-[#EDE8E0]' : ''}`}>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#E07070]/10 flex items-center justify-center text-xs font-bold text-[#E07070]">{s.name.charAt(0)}</div>
                    <span className="text-sm font-medium text-[#3D2B1F]">{s.name}</span>
                  </div>
                  <span className="text-sm font-bold text-[#E07070]">{s.sessions_remaining} 堂</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recent purchases */}
        <div className="bg-white rounded-2xl border border-[#EDE8E0] overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-[#EDE8E0]">
            <ShoppingCart size={15} className="text-[#C49A6C]" />
            <span className="text-sm font-semibold text-[#3D2B1F]">最近購課紀錄</span>
          </div>
          {!stats?.recentPurchases.length ? (
            <p className="text-sm text-[#3D2B1F]/40 text-center py-6">尚無購課紀錄</p>
          ) : (
            <ul>
              {stats.recentPurchases.map((p, i) => (
                <li key={p.id} className={`px-4 py-3 ${i < stats.recentPurchases.length - 1 ? 'border-b border-[#EDE8E0]' : ''}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-[#3D2B1F]">{p.student_name}</p>
                      <div className="flex items-center gap-1 text-xs text-[#3D2B1F]/50 mt-0.5">
                        <Clock size={11} />
                        {formatDate(p.purchased_at)}
                        {p.note && <span className="ml-1">· {p.note}</span>}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-[#C49A6C]">${p.amount_paid.toLocaleString()}</p>
                      <p className="text-xs text-[#3D2B1F]/50">{p.sessions_added > 0 ? `+${p.sessions_added} 堂` : '補登'}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

      </main>
    </div>
  )
}

function StatCard({ icon, label, value, bg }: { icon: React.ReactNode; label: string; value: string; bg: string }) {
  return (
    <div className="bg-white rounded-2xl border border-[#EDE8E0] p-4">
      <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center mb-3`}>{icon}</div>
      <p className="text-xl font-bold text-[#3D2B1F]">{value}</p>
      <p className="text-xs text-[#3D2B1F]/50 mt-0.5">{label}</p>
    </div>
  )
}
