'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, UserPlus, LogOut, LayoutDashboard, AlertTriangle, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Student } from '@/lib/types'
import StudentModal from '@/components/StudentModal'
import AddStudentModal from '@/components/AddStudentModal'

export default function HomePage() {
  const router = useRouter()
  const [user, setUser] = useState<{ id: string; name: string } | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [filtered, setFiltered] = useState<Student[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [showAdd, setShowAdd] = useState(false)

  async function loadData() {
    const supabase = createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) { router.push('/login'); return }

    setUser({
      id: authUser.id,
      name: authUser.user_metadata?.display_name || authUser.email?.split('@')[0] || '教練',
    })

    const { data } = await supabase
      .from('students')
      .select('*')
      .order('name', { ascending: true })

    const list = data || []
    setStudents(list)
    setFiltered(list)
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  function handleSearch(value: string) {
    setSearch(value)
    const q = value.trim().toLowerCase()
    if (!q) { setFiltered(students); return }
    setFiltered(students.filter(s =>
      s.name.toLowerCase().includes(q) ||
      (s.phone || '').includes(q)
    ))
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  function handleStudentUpdate() {
    setSelectedStudent(null)
    loadData()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF7F2]">
        <div className="text-[#3D2B1F]/50 text-sm">載入中…</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#FAF7F2]/90 backdrop-blur-sm border-b border-[#EDE8E0]">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-[#3D2B1F]">CoachPro</h1>
            <p className="text-xs text-[#3D2B1F]/50">{user?.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/dashboard')}
              className="p-2 rounded-full hover:bg-[#EDE8E0] transition text-[#3D2B1F]/70"
              title="儀表板"
            >
              <LayoutDashboard size={20} />
            </button>
            <button
              onClick={handleLogout}
              className="p-2 rounded-full hover:bg-[#EDE8E0] transition text-[#3D2B1F]/70"
              title="登出"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 pt-4 pb-24">
        {/* Search */}
        <div className="relative mb-4">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#3D2B1F]/40" />
          <input
            type="text"
            value={search}
            onInput={e => handleSearch((e.target as HTMLInputElement).value)}
            placeholder="搜尋學員姓名或電話…"
            className="w-full pl-10 pr-4 py-3 rounded-2xl border border-[#EDE8E0] bg-white text-[#3D2B1F] text-sm outline-none focus:border-[#C49A6C] focus:ring-2 focus:ring-[#C49A6C]/20 transition"
          />
        </div>

        {/* Stats bar */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-1.5 text-xs text-[#3D2B1F]/60">
            <Users size={13} />
            <span>{students.length} 位學員</span>
          </div>
          {students.filter(s => s.sessions_remaining <= 3).length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-[#E07070]">
              <AlertTriangle size={13} />
              <span>{students.filter(s => s.sessions_remaining <= 3).length} 位堂數不足</span>
            </div>
          )}
        </div>

        {/* Student list */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-[#3D2B1F]/40">
            <Users size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">{search ? '找不到符合的學員' : '尚無學員，點擊右下角新增'}</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filtered.map(student => {
              const isLow = student.sessions_remaining <= 3
              return (
                <button
                  key={student.id}
                  onClick={() => setSelectedStudent(student)}
                  style={{ touchAction: 'manipulation' }}
                  className={`w-full text-left bg-white rounded-2xl p-4 shadow-sm border transition active:scale-[0.99] ${
                    isLow ? 'border-[#E07070]/50' : 'border-[#EDE8E0]'
                  } hover:border-[#C49A6C]/40`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${
                        isLow ? 'bg-[#E07070]/10 text-[#E07070]' : 'bg-[#C49A6C]/10 text-[#C49A6C]'
                      }`}>
                        {student.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-[#3D2B1F] text-sm">{student.name}</p>
                        {student.phone && (
                          <p className="text-xs text-[#3D2B1F]/50 mt-0.5">{student.phone}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${isLow ? 'text-[#E07070]' : 'text-[#C49A6C]'}`}>
                        {student.sessions_remaining}
                      </p>
                      <p className="text-xs text-[#3D2B1F]/40">剩餘堂</p>
                    </div>
                  </div>
                  {isLow && (
                    <div className="mt-2.5 flex items-center gap-1.5 text-xs text-[#E07070] bg-[#E07070]/8 rounded-lg px-2 py-1.5">
                      <AlertTriangle size={12} />
                      堂數不足，請提醒學員購課
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </main>

      {/* FAB: Add student */}
      <button
        onClick={() => setShowAdd(true)}
        style={{ touchAction: 'manipulation' }}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-[#C49A6C] text-white shadow-lg flex items-center justify-center hover:bg-[#B08055] active:scale-95 transition z-20"
      >
        <UserPlus size={22} />
      </button>

      {/* Modals */}
      {selectedStudent && user && (
        <StudentModal
          student={selectedStudent}
          coachId={user.id}
          onClose={() => setSelectedStudent(null)}
          onUpdate={handleStudentUpdate}
        />
      )}

      {showAdd && user && (
        <AddStudentModal
          coachId={user.id}
          onClose={() => setShowAdd(false)}
          onAdded={() => { setShowAdd(false); loadData() }}
        />
      )}
    </div>
  )
}
