// アプリ（public/season）が Supabase につなぐための公開してよい値を返す。
// Vercel の環境変数から読む。Supabase の Vercel 連携を入れると、どちらかの名前で自動で入る。
// 値がないときは { enabled: false } を返し、アプリはログインなし（端末の中だけ）で動く。
export default function handler(req, res) {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  res.setHeader('Cache-Control', 'public, max-age=300');
  res.status(200).json(url && anonKey ? { enabled: true, url, anonKey } : { enabled: false });
}
