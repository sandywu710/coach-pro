'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { LogIn, Mail, Lock, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Email 或密碼錯誤，請再試一次')
      setLoading(false)
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#FAF7F2]">
      <div className="w-full max-w-sm">
        {/* Logo / Brand */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#C49A6C] mb-4 shadow-md">
            <LogIn size={28} color="white" />
          </div>
          <h1 className="text-2xl font-bold text-[#3D2B1F]">CoachPro</h1>
          <p className="text-sm text-[#3D2B1F]/60 mt-1">教練學員管理系統</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#EDE8E0] p-6">
          <h2 className="text-lg font-semibold text-[#3D2B1F] mb-6">登入帳號</h2>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#3D2B1F] mb-1.5">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#3D2B1F]/40" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="your@email.com"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#EDE8E0] bg-[#FAF7F2] text-[#3D2B1F] text-sm outline-none focus:border-[#C49A6C] focus:ring-2 focus:ring-[#C49A6C]/20 transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-[#3D2B1F]">密碼</label>
                <Link href="/forgot-password" className="text-xs text-[#C49A6C] hover:underline">
                  忘記密碼？
                </Link>
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#3D2B1F]/40" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#EDE8E0] bg-[#FAF7F2] text-[#3D2B1F] text-sm outline-none focus:border-[#C49A6C] focus:ring-2 focus:ring-[#C49A6C]/20 transition"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-[#E07070] text-sm bg-[#E07070]/10 rounded-xl px-3 py-2.5">
                <AlertCircle size={15} />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[#C49A6C] text-white font-semibold text-sm transition hover:bg-[#B08055] active:scale-[0.98] disabled:opacity-60"
            >
              {loading ? '登入中…' : '登入'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-[#3D2B1F]/60 mt-5">
          還沒有帳號？{' '}
          <Link href="/register" className="text-[#C49A6C] font-medium hover:underline">
            立即註冊
          </Link>
        </p>
      </div>
    </div>
  )
}
