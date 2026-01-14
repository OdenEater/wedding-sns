'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { ArrowLeft, Send, Image as ImageIcon } from 'lucide-react'
import type { User } from '@supabase/supabase-js'

export default function NewPostPage() {
  const [content, setContent] = useState('')
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // 認証状態の確認
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        // 未認証の場合はログインページにリダイレクト
        router.push('/login')
        return
      }
      
      setUser(user)
      setLoading(false)
    }

    checkUser()

    // 認証状態の変更を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        router.push('/login')
      } else {
        setUser(session.user)
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  // 投稿処理
  const handlePost = async () => {
    if (!content.trim() || content.length > 140 || !user) return

    try {
      setLoading(true)

      // Supabaseに投稿を保存
      const { error } = await supabase
        .from('posts')
        .insert([
          {
            content: content.trim(),
            user_id: user.id
          }
        ])

      if (error) throw error

      // 投稿成功：タイムラインに戻る
      router.push('/')
      
    } catch (error) {
      console.error('投稿エラー:', error)
      alert('投稿に失敗しました。もう一度お試しください。')
    } finally {
      setLoading(false)
    }
  }

  // ローディング中の表示
  if (loading) {
    return (
      <div className="min-h-screen bg-secondary/30 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-secondary/30">
      {/* ヘッダー */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-border shadow-sm">
        <div className="container max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => router.push('/')}
              className="-ml-2"
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <h1 className="text-xl font-bold text-foreground">新規投稿</h1>
          </div>
          <Button 
            disabled={content.length === 0 || content.length > 140 || loading} 
            className="rounded-full px-6"
            onClick={handlePost}
          >
            <Send className="w-4 h-4 mr-2" />
            投稿する
          </Button>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="container max-w-2xl mx-auto px-4 py-6">
        <Card className="border-none shadow-md overflow-hidden">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-xl overflow-hidden flex-shrink-0">
                {user?.user_metadata?.avatar_url ? (
                  <img src={user.user_metadata.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <span>{user?.email?.[0].toUpperCase() || '👤'}</span>
                )}
              </div>
              <div className="flex-1">
                <textarea
                  className="w-full min-h-[300px] resize-none border-none focus:ring-0 text-lg placeholder:text-gray-400 bg-transparent outline-none"
                  placeholder="幸せな瞬間をシェアしよう..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  autoFocus
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-secondary/50 flex justify-between items-center py-4 px-6">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" disabled className="text-gray-400">
                <ImageIcon className="w-5 h-5" />
              </Button>
            </div>
            <span className={`text-sm ${content.length > 140 ? 'text-red-500 font-bold' : 'text-gray-500'}`}>
              {content.length} / 140
            </span>
          </CardFooter>
        </Card>

        {/* ヒント */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <p className="text-sm text-blue-800">
            💡 140文字以内で投稿できます。幸せな瞬間をみんなとシェアしましょう！
          </p>
        </div>
      </main>
    </div>
  )
}
