'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-[#FAF7F2]">
        <div className="w-full max-w-sm text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-green-100 mb-4">
            <CheckCircle size={28} className="text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-[#3D2B1F] mb-2">信件已寄出</h2>
          <p className="text-sm text-[#3D2B1F]/60 mb-6">請去信箱點擊重設密碼連結</p>
          <Link
            href="/login"
            className="inline-block px-6 py-3 rounded-xl bg-[#C49A6C] text-white font-semibold text-sm hover:bg-[#B08055] transition"
          >
            回到登入頁
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#FAF7F2]">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#C49A6C] mb-4 shadow-md">
            <Mail size={28} color="white" />
          </div>
          <h1 className="text-2xl font-bold text-[#3D2B1F]">忘記密碼</h1>
          <p className="text-sm text-[#3D2B1F]/60 mt-1">輸入你的 Email，我們寄重設連結給你</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-[#EDE8E0] p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
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
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[#C49A6C] text-white font-semibold text-sm transition hover:bg-[#B08055] disabled:opacity-60"
            >
              {loading ? '寄送中…' : '寄送重設連結'}
            </button>
          </form>
        </div>

        <Link href="/login" className="flex items-center justify-center gap-1.5 text-sm text-[#3D2B1F]/60 mt-5 hover:text-[#C49A6C] transition">
          <ArrowLeft size={14} />
          回到登入頁
        </Link>
      </div>
    </div>
  )
}
