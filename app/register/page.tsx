'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { UserPlus, Mail, Lock, User, AlertCircle, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (password.length < 6) {
      setError('密碼至少需要 6 個字元')
      setLoading(false)
      return
    }

    const supabase = createClient()
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: name },
      },
    })

    if (signUpError) {
      setError(signUpError.message.includes('already') ? '此 Email 已被註冊' : '註冊失敗，請再試一次')
      setLoading(false)
      return
    }

    if (data.session) {
      router.push('/')
      router.refresh()
    } else {
      setSuccess(true)
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-[#FAF7F2]">
        <div className="w-full max-w-sm text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-green-100 mb-4">
            <CheckCircle size={28} className="text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-[#3D2B1F] mb-2">註冊成功！</h2>
          <p className="text-sm text-[#3D2B1F]/60 mb-6">請前往信箱確認驗證信，確認後即可登入</p>
          <Link
            href="/login"
            className="inline-block px-6 py-3 rounded-xl bg-[#C49A6C] text-white font-semibold text-sm hover:bg-[#B08055] transition"
          >
            前往登入
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#FAF7F2]">
      <div className="w-full max-w-sm">
        {/* Logo / Brand */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#C49A6C] mb-4 shadow-md">
            <UserPlus size={28} color="white" />
          </div>
          <h1 className="text-2xl font-bold text-[#3D2B1F]">CoachPro</h1>
          <p className="text-sm text-[#3D2B1F]/60 mt-1">建立你的教練帳號</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#EDE8E0] p-6">
          <h2 className="text-lg font-semibold text-[#3D2B1F] mb-6">註冊新帳號</h2>

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#3D2B1F] mb-1.5">教練名稱</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#3D2B1F]/40" />
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  placeholder="例：王小明教練"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#EDE8E0] bg-[#FAF7F2] text-[#3D2B1F] text-sm outline-none focus:border-[#C49A6C] focus:ring-2 focus:ring-[#C49A6C]/20 transition"
                />
              </div>
            </div>

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
              <label className="block text-sm font-medium text-[#3D2B1F] mb-1.5">密碼</label>
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
              {loading ? '建立中…' : '建立帳號'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-[#3D2B1F]/60 mt-5">
          已有帳號？{' '}
          <Link href="/login" className="text-[#C49A6C] font-medium hover:underline">
            登入
          </Link>
        </p>
      </div>
    </div>
  )
}
