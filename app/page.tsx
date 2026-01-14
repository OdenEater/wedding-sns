'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Heart, MessageCircle, LogOut, Send, Image as ImageIcon, Home, Menu, X } from 'lucide-react'
import type { User } from '@supabase/supabase-js'

// 投稿の型定義
type Post = {
  id: string | null
  content: string | null
  created_at: string | null
  user_id: string | null
  username: string | null
  avatar_url: string | null
  likes_count: number | null
  is_liked_by_me: boolean | null
}

export default function TimelinePage() {
  const [content, setContent] = useState('')
  const [activeTab, setActiveTab] = useState<'timeline' | 'gallery'>('timeline')
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [posts, setPosts] = useState<Post[]>([])
  const router = useRouter()

  // 認証状態の確認
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
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

  // 投稿一覧の取得
  const fetchPosts = async () => {
    if (!user) return

    const { data, error } = await supabase
      .from('posts_with_counts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('投稿取得エラー:', error)
      return
    }

    setPosts(data || [])
  }

  useEffect(() => {
    fetchPosts()
  }, [user])

  // ログアウト処理
  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

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

      // 投稿成功：フォームをリセット
      setContent('')
      alert('投稿しました！')
      
      // 投稿一覧を再取得
      await fetchPosts()
      
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
          <Heart className="w-12 h-12 text-primary animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  // サイドバーのナビゲーション項目
  const NavItem = ({ id, icon: Icon, label }: { id: 'timeline' | 'gallery', icon: any, label: string }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-4 px-4 py-3 w-full rounded-full transition-colors text-lg font-medium
        ${activeTab === id 
          ? 'text-primary bg-primary/10' 
          : 'text-gray-600 hover:bg-secondary'
        }`}
    >
      <Icon className={`w-7 h-7 ${activeTab === id ? 'fill-primary' : ''}`} />
      {label}
    </button>
  )

  return (
    <div className="min-h-screen bg-secondary/30">
      
      {/* スマホ用ヘッダー (md以上で非表示) */}
      <header className="md:hidden sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-border shadow-sm">
        <div className="container px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(!isMenuOpen)} className="-ml-2">
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
            <h1 className="text-xl font-bold text-primary flex items-center gap-2">
              <Heart className="w-6 h-6 fill-primary" />
              Wedding SNS
            </h1>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="w-5 h-5" />
          </Button>
        </div>

        {/* スマホ用メニュー (ドロップダウン) */}
        {isMenuOpen && (
          <div className="absolute top-16 left-0 right-0 bg-white/95 backdrop-blur-md border-b border-border shadow-lg animate-in slide-in-from-top-2 z-20">
            <nav className="flex flex-col p-4 space-y-2">
              <button 
                onClick={() => { setActiveTab('timeline'); setIsMenuOpen(false); }}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'timeline' ? 'bg-primary/10 text-primary' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <Home className="w-5 h-5" />
                <span className="font-medium">タイムライン</span>
              </button>
              <button 
                onClick={() => { setActiveTab('gallery'); setIsMenuOpen(false); }}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'gallery' ? 'bg-primary/10 text-primary' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <ImageIcon className="w-5 h-5" />
                <span className="font-medium">ギャラリー</span>
              </button>
            </nav>
          </div>
        )}
      </header>

      <div className="container max-w-6xl mx-auto flex gap-8">
        
        {/* PC用サイドバー (md未満で非表示) */}
        <aside className="hidden md:flex flex-col w-64 sticky top-0 h-screen py-8 pl-4 border-r border-border/50">
          <div className="mb-8 px-4">
            <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
              <Heart className="w-8 h-8 fill-primary" />
              Wedding SNS
            </h1>
          </div>

          <nav className="flex-1 space-y-2">
            <NavItem id="timeline" icon={Home} label="タイムライン" />
            <NavItem id="gallery" icon={ImageIcon} label="ギャラリー" />
          </nav>

          <div className="px-4 mt-auto">
            <Button 
              variant="ghost" 
              fullWidth 
              className="justify-start gap-4 text-gray-600 hover:text-red-500 hover:bg-red-50"
              onClick={handleLogout}
            >
              <LogOut className="w-6 h-6" />
              <span className="text-lg">ログアウト</span>
            </Button>
          </div>
        </aside>

        {/* メインコンテンツエリア */}
        <main className="flex-1 max-w-2xl py-6 px-4 md:px-0 mx-auto md:mx-0">
          
          {activeTab === 'timeline' ? (
            <div className="space-y-6">
              {/* 投稿フォーム */}
              <Card className="border-none shadow-md overflow-hidden">
                <CardContent className="pt-6">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-xl overflow-hidden">
                      {user?.user_metadata?.avatar_url ? (
                        <img src={user.user_metadata.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                      ) : (
                        <span>{user?.email?.[0].toUpperCase() || '👤'}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <textarea
                        className="w-full min-h-[100px] resize-none border-none focus:ring-0 text-base placeholder:text-gray-400 bg-transparent outline-none"
                        placeholder="幸せな瞬間をシェアしよう..."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="bg-secondary/50 flex justify-between items-center py-3 px-6">
                  <span className={`text-xs ${content.length > 140 ? 'text-red-500 font-bold' : 'text-gray-500'}`}>
                    {content.length} / 140
                  </span>
                  <Button 
                    disabled={content.length === 0 || content.length > 140 || loading} 
                    className="rounded-full px-6"
                    onClick={handlePost}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    投稿する
                  </Button>
                </CardFooter>
              </Card>

              {/* タイムライン */}
              <div className="space-y-4">
                {posts.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <p>まだ投稿がありません</p>
                    <p className="text-sm mt-2">最初の投稿をしてみましょう！</p>
                  </div>
                ) : (
                  posts.map((post) => (
                    <Card key={post.id} className="border-none shadow-sm hover:shadow-md transition-shadow duration-200">
                      <CardHeader className="flex flex-row items-start gap-4 pb-2">
                        <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-xl shadow-inner overflow-hidden">
                          {post.avatar_url ? (
                            <img src={post.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                          ) : (
                            <span>{post.username?.[0]?.toUpperCase() || '👤'}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-bold text-foreground truncate">
                              {post.username || 'ゲスト'}
                            </p>
                            <span className="text-xs text-gray-400">
                              {post.created_at ? new Date(post.created_at).toLocaleString('ja-JP') : ''}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500">@{post.user_id?.slice(0, 8)}</p>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="pb-2 pl-[4.5rem]">
                        <p className="text-base leading-relaxed whitespace-pre-wrap text-foreground/90">
                          {post.content}
                        </p>
                      </CardContent>

                      <CardFooter className="pl-[4.5rem] pt-2 pb-4 flex gap-6">
                        <button className={`flex items-center gap-1.5 text-sm transition-colors ${post.is_liked_by_me ? 'text-pink-500' : 'text-gray-400 hover:text-pink-500'}`}>
                          <Heart className={`w-5 h-5 ${post.is_liked_by_me ? 'fill-pink-500' : ''}`} />
                          <span>{post.likes_count || 0}</span>
                        </button>
                        
                        <button className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-primary transition-colors">
                          <MessageCircle className="w-5 h-5" />
                          <span>返信</span>
                        </button>
                      </CardFooter>
                    </Card>
                  ))
                )}
              </div>
            </div>
          ) : (
            /* ギャラリータブ (仮) */
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center text-gray-400">
                  <ImageIcon className="w-8 h-8" />
                </div>
              ))}
            </div>
          )}

        </main>
      </div>
    </div>
  )
}
