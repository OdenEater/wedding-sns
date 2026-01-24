'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Toast } from '@/components/ui/toast'
import { ArrowLeft, Send, MessageCircle } from 'lucide-react'
import type { User } from '@supabase/supabase-js'
import { useMessages, formatMessage } from '@/hooks/useMessages'

// 投稿の型定義
type Post = {
  id: string
  content: string
  created_at: string
  user_id: string
  username: string | null
  avatar_url: string | null
}

// プロフィール型定義
type Profile = {
  username: string | null
  avatar_url: string | null
}

// useSearchParams() を使用するコンポーネントを分離
function NewPostContent() {
  const [content, setContent] = useState('')
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [parentPost, setParentPost] = useState<Post | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const replyToId = searchParams.get('replyTo')
  const msg = useMessages()

  // 返信元投稿の取得
  useEffect(() => {
    const fetchParentPost = async () => {
      if (!replyToId) return

      const { data, error } = await supabase
        .from('posts_with_counts')
        .select('*')
        .eq('id', replyToId)
        .single()

      if (error) {
        console.error('返信元投稿取得エラー:', error)
        return
      }

      if (!data.id || !data.content || !data.created_at || !data.user_id) return

      // ユーザー情報を取得
      const { data: profile } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', data.user_id)
        .single()

      setParentPost({
        id: data.id,
        content: data.content,
        created_at: data.created_at,
        user_id: data.user_id,
        username: profile?.username || null,
        avatar_url: profile?.avatar_url || null
      })
    }

    fetchParentPost()
  }, [replyToId])

  // 認証状態の確認とプロフィール取得
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        // 未認証の場合はログインページにリダイレクト
        router.push('/login')
        return
      }
      
      setUser(user)

      // プロフィール情報を取得
      const { data: profile } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', user.id)
        .single()

      if (profile) {
        setUserProfile(profile)
      }
      
      setLoading(false)
    }

    checkUser()

    // 認証状態の変更を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session?.user) {
        router.push('/login')
      } else {
        setUser(session.user)
        
        // プロフィール情報を再取得
        const { data: profile } = await supabase
          .from('profiles')
          .select('username, avatar_url')
          .eq('id', session.user.id)
          .single()

        if (profile) {
          setUserProfile(profile)
        }
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
            user_id: user.id,
            parent_id: replyToId || null
          }
        ])

      if (error) throw error

      // 投稿成功：トーストを表示してからタイムラインに戻る
      const successMessage = replyToId ? msg.newPost.replySuccess : msg.newPost.postSuccess
      setToast({ message: successMessage, type: 'success' })
      
      // トーストを表示してから画面遷移
      setTimeout(() => {
        router.push('/')
      }, 1500)
      
    } catch (error) {
      console.error('投稿エラー:', error)
      setToast({ message: msg.newPost.postError, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  // ローディング中の表示
  if (loading) {
    return (
      <div className="min-h-screen bg-secondary/30 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">{msg.common.loading}</p>
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
            <h1 className="text-xl font-bold text-foreground">
              {replyToId ? msg.newPost.replyTitle : msg.newPost.title}
            </h1>
          </div>
          <Button 
            disabled={content.length === 0 || content.length > 140 || loading} 
            className="rounded-full px-6"
            onClick={handlePost}
          >
            <Send className="w-4 h-4 mr-2" />
            {replyToId ? msg.newPost.replyButton : msg.newPost.postButton}
          </Button>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="container max-w-2xl mx-auto px-4 py-6">
        {/* 返信元投稿の表示 */}
        {parentPost && (
          <Card className="border-none shadow-sm mb-4 bg-gray-50">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <MessageCircle className="w-4 h-4" />
                <span>{msg.newPost.replyTo}</span>
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-lg overflow-hidden flex-shrink-0">
                  {parentPost.avatar_url ? (
                    parentPost.avatar_url.startsWith('emoji:') ? (
                      <span className="text-2xl">{parentPost.avatar_url.replace('emoji:', '')}</span>
                    ) : (
                      <img src={parentPost.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                    )
                  ) : (
                    <span>{parentPost.username?.[0]?.toUpperCase() || '👤'}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-foreground break-all">
                      {parentPost.username || 'ゲスト'}
                    </p>
                    <span className="text-xs text-gray-400">
                      {new Date(parentPost.created_at).toLocaleString('ja-JP')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">
                    {parentPost.content}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border-none shadow-md overflow-hidden">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-xl overflow-hidden flex-shrink-0">
                {userProfile?.avatar_url ? (
                  userProfile.avatar_url.startsWith('emoji:') ? (
                    <span className="text-2xl">{userProfile.avatar_url.replace('emoji:', '')}</span>
                  ) : (
                    <img src={userProfile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                  )
                ) : (
                  <span>{userProfile?.username?.[0]?.toUpperCase() || user?.email?.[0].toUpperCase() || '👤'}</span>
                )}
              </div>
              <div className="flex-1">
                <textarea
                  className="w-full min-h-[300px] resize-none border-none focus:ring-0 text-lg placeholder:text-gray-400 bg-transparent outline-none"
                  placeholder={msg.newPost.placeholder}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  autoFocus
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-secondary/50 flex justify-between items-center py-4 px-6">
            {/* 画像投稿ボタンは削除（画像はギャラリーからのみ） */}
            <span className={`text-sm ${content.length > 140 ? 'text-red-500 font-bold' : 'text-gray-500'}`}>
              {formatMessage(msg.post.characterCount, { current: content.length.toString(), max: '140' })}
            </span>
          </CardFooter>
        </Card>

        {/* ヒント */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <p className="text-sm text-blue-800">
            {msg.newPost.hint}
          </p>
        </div>
      </main>

      {/* Toast通知 */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}

// Suspenseでラップしたメインコンポーネント
export default function NewPostPage() {
  const msg = useMessages()
  
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-secondary/30 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">{msg.common.loading}</p>
        </div>
      </div>
    }>
      <NewPostContent />
    </Suspense>
  )
}
