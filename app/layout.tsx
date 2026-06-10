import type { Metadata, Viewport } from 'next'
import { Noto_Sans_TC } from 'next/font/google'
import './globals.css'

const notoSansTC = Noto_Sans_TC({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'CoachPro — 教練學員管理系統',
  description: '專業教練學員管理，報到、購課、追蹤一站搞定',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'CoachPro',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-TW" className={notoSansTC.className}>
      <body className="min-h-screen bg-[#FAF7F2] text-[#3D2B1F]">
        {children}
      </body>
    </html>
  )
}
