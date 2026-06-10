'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, CheckCircle, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password.length < 6) { setError('密碼至少需要 6 個字元'); return }
    if (password !== confirm) { setError('兩次密碼不一致'); return }

    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    if (error) { setError('重設失敗，請重新申請連結'); setLoading(false); return }
    setDone(true)
    setTimeout(() => router.push('/'), 2000)
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-[#FAF7F2]">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-green-100 mb-4">
            <CheckCircle size={28} className="text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-[#3D2B1F] mb-2">密碼重設成功！</h2>
          <p className="text-sm text-[#3D2B1F]/60">正在跳轉到主頁…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#FAF7F2]">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#C49A6C] mb-4 shadow-md">
            <Lock size={28} color="white" />
          </div>
          <h1 className="text-2xl font-bold text-[#3D2B1F]">設定新密碼</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-[#EDE8E0] p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#3D2B1F] mb-1.5">新密碼</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#3D2B1F]/40" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="至少 6 個字元"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#EDE8E0] bg-[#FAF7F2] text-[#3D2B1F] text-sm outline-none focus:border-[#C49A6C] focus:ring-2 focus:ring-[#C49A6C]/20 transition"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#3D2B1F] mb-1.5">確認新密碼</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#3D2B1F]/40" />
                <input
                  type="password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  required
                  placeholder="再輸入一次"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#EDE8E0] bg-[#FAF7F2] text-[#3D2B1F] text-sm outline-none focus:border-[#C49A6C] focus:ring-2 focus:ring-[#C49A6C]/20 transition"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-[#E07070] text-sm bg-[#E07070]/10 rounded-xl px-3 py-2.5">
                <AlertCircle size={15} />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[#C49A6C] text-white font-semibold text-sm transition hover:bg-[#B08055] disabled:opacity-60"
            >
              {loading ? '儲存中…' : '儲存新密碼'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
