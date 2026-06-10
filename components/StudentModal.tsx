'use client'

import { useRef, useState, useEffect } from 'react'
import {
  X, CheckSquare, RotateCcw, ShoppingCart, Edit2, Trash2,
  Phone, FileText, Clock, ChevronDown, AlertCircle, Check,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Student, Checkin } from '@/lib/types'

type Tab = 'actions' | 'history' | 'edit'

interface Props {
  student: Student
  coachId: string
  onClose: () => void
  onUpdate: () => void
}

export default function StudentModal({ student, coachId, onClose, onUpdate }: Props) {
  const [tab, setTab] = useState<Tab>('actions')
  const [checkins, setCheckins] = useState<Checkin[]>([])
  const [loadingCheckins, setLoadingCheckins] = useState(false)

  // Purchase form
  const [showPurchase, setShowPurchase] = useState(false)
  const [purchaseSessions, setPurchaseSessions] = useState('')
  const [purchaseAmount, setPurchaseAmount] = useState('')
  const [purchaseNote, setPurchaseNote] = useState('')
  const [purchaseLoading, setPurchaseLoading] = useState(false)

  // Edit form
  const [editName, setEditName] = useState(student.name)
  const [editPhone, setEditPhone] = useState(student.phone || '')
  const [editNotes, setEditNotes] = useState(student.notes || '')
  const [editLoading, setEditLoading] = useState(false)

  // Delete
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Action feedback
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  // Swipe to dismiss
  const sheetRef = useRef<HTMLDivElement>(null)
  const startYRef = useRef(0)

  function showFeedback(type: 'success' | 'error', msg: string) {
    setFeedback({ type, msg })
    setTimeout(() => setFeedback(null), 2500)
  }

  async function loadCheckins() {
    setLoadingCheckins(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('checkins')
      .select('*')
      .eq('student_id', student.id)
      .order('checked_in_at', { ascending: false })
      .limit(10)
    setCheckins(data || [])
    setLoadingCheckins(false)
  }

  useEffect(() => {
    if (tab === 'history') loadCheckins()
  }, [tab])

  // Swipe handlers
  function onTouchStart(e: React.TouchEvent) {
    startYRef.current = e.touches[0].clientY
  }
  function onTouchEnd(e: React.TouchEvent) {
    const delta = e.changedTouches[0].clientY - startYRef.current
    if (delta > 80) onClose()
  }

  async function handleCheckin() {
    if (student.sessions_remaining <= 0) {
      showFeedback('error', '剩餘堂數為 0，無法報到')
      return
    }
    setActionLoading(true)
    const supabase = createClient()
    const { error: ciErr } = await supabase.from('checkins').insert({
      coach_id: coachId,
      student_id: student.id,
    })
    if (ciErr) { showFeedback('error', '報到失敗'); setActionLoading(false); return }

    const { error: upErr } = await supabase
      .from('students')
      .update({ sessions_remaining: student.sessions_remaining - 1 })
      .eq('id', student.id)
    if (upErr) { showFeedback('error', '更新堂數失敗'); setActionLoading(false); return }

    showFeedback('success', '報到成功！剩餘 ' + (student.sessions_remaining - 1) + ' 堂')
    setActionLoading(false)
    onUpdate()
  }

  async function handleUndoCheckin() {
    setActionLoading(true)
    const supabase = createClient()
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
    const { data: recent } = await supabase
      .from('checkins')
      .select('*')
      .eq('student_id', student.id)
      .gte('checked_in_at', fiveMinAgo)
      .order('checked_in_at', { ascending: false })
      .limit(1)

    if (!recent || recent.length === 0) {
      showFeedback('error', '5 分鐘內無可還原的報到')
      setActionLoading(false)
      return
    }

    const { error: delErr } = await supabase.from('checkins').delete().eq('id', recent[0].id)
    if (delErr) { showFeedback('error', '取消失敗'); setActionLoading(false); return }

    await supabase
      .from('students')
      .update({ sessions_remaining: student.sessions_remaining + 1 })
      .eq('id', student.id)

    showFeedback('success', '已取消最近一次報到')
    setActionLoading(false)
    onUpdate()
  }

  async function handlePurchase(e: React.FormEvent) {
    e.preventDefault()
    const sessions = parseInt(purchaseSessions)
    const amount = parseFloat(purchaseAmount)
    if (!sessions || sessions <= 0 || !amount || amount < 0) return

    setPurchaseLoading(true)
    const supabase = createClient()
    const { error: pErr } = await supabase.from('purchases').insert({
      coach_id: coachId,
      student_id: student.id,
      sessions_added: sessions,
      amount_paid: amount,
      note: purchaseNote || null,
    })
    if (pErr) { showFeedback('error', '購買失敗'); setPurchaseLoading(false); return }

    await supabase
      .from('students')
      .update({
        sessions_remaining: student.sessions_remaining + sessions,
        total_paid: student.total_paid + amount,
      })
      .eq('id', student.id)

    showFeedback('success', `已加購 ${sessions} 堂，金額 $${amount}`)
    setPurchaseSessions('')
    setPurchaseAmount('')
    setPurchaseNote('')
    setShowPurchase(false)
    setPurchaseLoading(false)
    onUpdate()
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editName.trim()) return
    setEditLoading(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('students')
      .update({ name: editName.trim(), phone: editPhone.trim() || null, notes: editNotes.trim() || null })
      .eq('id', student.id)
    if (error) { showFeedback('error', '更新失敗'); setEditLoading(false); return }
    showFeedback('success', '學員資料已更新')
    setEditLoading(false)
    onUpdate()
  }

  async function handleDelete() {
    setDeleteLoading(true)
    const supabase = createClient()
    await supabase.from('students').delete().eq('id', student.id)
    onClose()
    onUpdate()
  }

  function formatDate(iso: string) {
    const d = new Date(iso)
    return d.toLocaleDateString('zh-TW', { month: 'long', day: 'numeric' }) +
      ' ' + d.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet */}
      <div
        ref={sheetRef}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        className="absolute bottom-0 left-0 right-0 bg-[#FAF7F2] rounded-t-3xl shadow-2xl max-h-[90vh] flex flex-col"
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-[#3D2B1F]/20" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#EDE8E0]">
          <div>
            <h2 className="text-lg font-bold text-[#3D2B1F]">{student.name}</h2>
            <p className="text-sm text-[#3D2B1F]/60">
              剩餘 <span className={`font-semibold ${student.sessions_remaining <= 3 ? 'text-[#E07070]' : 'text-[#C49A6C]'}`}>
                {student.sessions_remaining}
              </span> 堂
              {student.phone && <span className="ml-2">· {student.phone}</span>}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-[#EDE8E0] transition">
            <X size={20} />
          </button>
        </div>

        {/* Feedback toast */}
        {feedback && (
          <div className={`mx-5 mt-3 flex items-center gap-2 text-sm px-3 py-2.5 rounded-xl ${
            feedback.type === 'success'
              ? 'bg-green-50 text-green-700'
              : 'bg-[#E07070]/10 text-[#E07070]'
          }`}>
            {feedback.type === 'success' ? <Check size={15} /> : <AlertCircle size={15} />}
            {feedback.msg}
          </div>
        )}

        {/* Tabs */}
        <div className="flex px-5 pt-3 gap-2">
          {(['actions', 'history', 'edit'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
                tab === t
                  ? 'bg-[#C49A6C] text-white'
                  : 'bg-[#EDE8E0] text-[#3D2B1F]/70 hover:bg-[#E0D9CF]'
              }`}
            >
              {t === 'actions' ? '操作' : t === 'history' ? '報到紀錄' : '編輯'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-3 pb-8">

          {/* ACTIONS TAB */}
          {tab === 'actions' && (
            <>
              {/* Checkin / Undo row */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleCheckin}
                  disabled={actionLoading}
                  className="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-[#C49A6C] text-white font-semibold text-sm shadow-sm active:scale-[0.97] transition disabled:opacity-60"
                >
                  <CheckSquare size={17} />
                  報到
                </button>
                <button
                  onClick={handleUndoCheckin}
                  disabled={actionLoading}
                  className="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-white border border-[#EDE8E0] text-[#3D2B1F] font-semibold text-sm active:scale-[0.97] transition disabled:opacity-60"
                >
                  <RotateCcw size={17} />
                  取消報到
                </button>
              </div>

              {/* Purchase */}
              <div className="bg-white rounded-2xl border border-[#EDE8E0] overflow-hidden">
                <button
                  onClick={() => setShowPurchase(v => !v)}
                  className="w-full flex items-center justify-between px-4 py-3.5 text-[#3D2B1F]"
                >
                  <span className="flex items-center gap-2 font-semibold text-sm">
                    <ShoppingCart size={16} className="text-[#C49A6C]" />
                    購買新方案
                  </span>
                  <ChevronDown size={16} className={`transition-transform ${showPurchase ? 'rotate-180' : ''}`} />
                </button>

                {showPurchase && (
                  <form onSubmit={handlePurchase} className="px-4 pb-4 space-y-3 border-t border-[#EDE8E0] pt-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-[#3D2B1F]/60 mb-1 block">加購堂數</label>
                        <input
                          type="number"
                          value={purchaseSessions}
                          onChange={e => setPurchaseSessions(e.target.value)}
                          required min="1"
                          placeholder="10"
                          className="w-full px-3 py-2 rounded-xl border border-[#EDE8E0] bg-[#FAF7F2] text-sm outline-none focus:border-[#C49A6C]"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-[#3D2B1F]/60 mb-1 block">金額 ($)</label>
                        <input
                          type="number"
                          value={purchaseAmount}
                          onChange={e => setPurchaseAmount(e.target.value)}
                          required min="0"
                          placeholder="5000"
                          className="w-full px-3 py-2 rounded-xl border border-[#EDE8E0] bg-[#FAF7F2] text-sm outline-none focus:border-[#C49A6C]"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-[#3D2B1F]/60 mb-1 block">備註（選填）</label>
                      <input
                        type="text"
                        value={purchaseNote}
                        onChange={e => setPurchaseNote(e.target.value)}
                        placeholder="例：年度優惠方案"
                        className="w-full px-3 py-2 rounded-xl border border-[#EDE8E0] bg-[#FAF7F2] text-sm outline-none focus:border-[#C49A6C]"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={purchaseLoading}
                      className="w-full py-2.5 rounded-xl bg-[#C49A6C] text-white font-semibold text-sm disabled:opacity-60"
                    >
                      {purchaseLoading ? '處理中…' : '確認購買'}
                    </button>
                  </form>
                )}
              </div>

              {/* Notes display */}
              {student.notes && (
                <div className="bg-white rounded-2xl border border-[#EDE8E0] p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[#3D2B1F] mb-2">
                    <FileText size={15} className="text-[#C49A6C]" />
                    備註
                  </div>
                  <p className="text-sm text-[#3D2B1F]/70 whitespace-pre-wrap">{student.notes}</p>
                </div>
              )}

              {/* Delete */}
              {!confirmDelete ? (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="w-full py-3 rounded-2xl border border-[#E07070]/40 text-[#E07070] text-sm font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition"
                >
                  <Trash2 size={15} />
                  刪除學員
                </button>
              ) : (
                <div className="bg-[#E07070]/10 rounded-2xl border border-[#E07070]/30 p-4">
                  <p className="text-sm text-[#E07070] font-medium mb-3 text-center">確定要刪除「{student.name}」嗎？此操作無法復原</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setConfirmDelete(false)}
                      className="py-2.5 rounded-xl bg-white border border-[#EDE8E0] text-sm font-medium text-[#3D2B1F]"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={deleteLoading}
                      className="py-2.5 rounded-xl bg-[#E07070] text-white text-sm font-medium disabled:opacity-60"
                    >
                      確定刪除
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* HISTORY TAB */}
          {tab === 'history' && (
            <div className="bg-white rounded-2xl border border-[#EDE8E0] overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-[#EDE8E0]">
                <Clock size={15} className="text-[#C49A6C]" />
                <span className="text-sm font-semibold text-[#3D2B1F]">最近 10 次報到</span>
              </div>
              {loadingCheckins ? (
                <p className="text-sm text-[#3D2B1F]/50 text-center py-6">載入中…</p>
              ) : checkins.length === 0 ? (
                <p className="text-sm text-[#3D2B1F]/50 text-center py-6">尚無報到紀錄</p>
              ) : (
                <ul>
                  {checkins.map((c, i) => (
                    <li key={c.id} className={`flex items-center gap-3 px-4 py-3 ${i < checkins.length - 1 ? 'border-b border-[#EDE8E0]' : ''}`}>
                      <div className="w-7 h-7 rounded-full bg-[#C49A6C]/10 flex items-center justify-center shrink-0">
                        <CheckSquare size={13} className="text-[#C49A6C]" />
                      </div>
                      <span className="text-sm text-[#3D2B1F]">{formatDate(c.checked_in_at)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* EDIT TAB */}
          {tab === 'edit' && (
            <form onSubmit={handleEdit} className="bg-white rounded-2xl border border-[#EDE8E0] p-4 space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#3D2B1F] mb-1">
                <Edit2 size={15} className="text-[#C49A6C]" />
                編輯學員資料
              </div>

              <div>
                <label className="text-xs text-[#3D2B1F]/60 mb-1 block">姓名</label>
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 rounded-xl border border-[#EDE8E0] bg-[#FAF7F2] text-sm outline-none focus:border-[#C49A6C]"
                />
              </div>

              <div>
                <label className="text-xs text-[#3D2B1F]/60 mb-1 block">電話</label>
                <div className="relative">
                  <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#3D2B1F]/40" />
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={e => setEditPhone(e.target.value)}
                    placeholder="0912-345-678"
                    className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-[#EDE8E0] bg-[#FAF7F2] text-sm outline-none focus:border-[#C49A6C]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-[#3D2B1F]/60 mb-1 block">備註</label>
                <textarea
                  value={editNotes}
                  onChange={e => setEditNotes(e.target.value)}
                  rows={3}
                  placeholder="任何備注…"
                  className="w-full px-3 py-2.5 rounded-xl border border-[#EDE8E0] bg-[#FAF7F2] text-sm outline-none focus:border-[#C49A6C] resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={editLoading}
                className="w-full py-3 rounded-xl bg-[#C49A6C] text-white font-semibold text-sm disabled:opacity-60"
              >
                {editLoading ? '儲存中…' : '儲存變更'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
