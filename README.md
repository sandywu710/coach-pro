# CoachPro — 多教練學員管理系統

## 環境變數設定（必填）

請在 `.env.local` 檔案中填入以下兩個值（到 Supabase 專案 → Settings → API 複製）：

```
NEXT_PUBLIC_SUPABASE_URL=https://你的專案id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的anon_key
```

在 Vercel 部署時，也要在 Vercel → Settings → Environment Variables 填入相同兩個值。

## Supabase 資料表初始化

1. 登入 Supabase → 點選你的專案 → 左側選 **SQL Editor**
2. 把 `supabase-schema.sql` 檔案的內容全部貼入
3. 點 **Run** 執行

## 本機啟動

```bash
npm install
npm run dev
```

打開 http://localhost:3000

## Vercel 部署

```bash
vercel --prod
```

## 功能說明

- `/login` — 教練登入
- `/register` — 教練註冊（填名稱、Email、密碼）
- `/` — 學員列表（搜尋、新增、點擊查看詳情）
- `/dashboard` — 本月統計、低堂數學員、購課紀錄

每位教練的資料完全隔離，由 Supabase Row Level Security 保護。
