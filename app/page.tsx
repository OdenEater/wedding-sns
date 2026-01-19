'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Toast } from '@/components/ui/toast'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Heart, MessageCircle, LogOut, Image as ImageIcon, Home, Menu, X, Plus, Trash2, Edit2, Check, XCircle } from 'lucide-react'
import type { User } from '@supabase/supabase-js'
import { useMessages, formatMessage } from '@/hooks/useMessages'

// 投稿の型定義
type Post = {
  id: string | null
  content: string | null
  created_at: string | null
  user_id: string | null
  username: string | null
  avatar_url: string | null
  likes_count: number | null
  replies_count: number | null
  parent_id: string | null
  is_liked_by_me: boolean | null
}

export default function TimelinePage() {
  const [activeTab, setActiveTab] = useState<'timeline' | 'gallery'>('timeline')
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [posts, setPosts] = useState<Post[]>([])
  const [replies, setReplies] = useState<{ [key: string]: Post[] }>({})
  const [expandedPosts, setExpandedPosts] = useState<Set<string>>(new Set())
  const [editingPostId, setEditingPostId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const router = useRouter()
  const msg = useMessages()

  // 認証状態の確認
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }

    checkUser()

    // 認証状態の変更を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
    })

    return () => subscription.unsubscribe()
  }, [])

  // 投稿一覧の取得
  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from('posts_with_counts')
      .select('*')
      .is('parent_id', null)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('投稿取得エラー:', error)
      console.error('エラー詳細:', JSON.stringify(error, null, 2))
      return
    }

    // ユーザー情報を別途取得
    const userIds = [...new Set(data?.map(p => p.user_id).filter((id): id is string => id !== null))]
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, avatar_url')
      .in('id', userIds)

    // データを整形
    const profileMap = new Map(profiles?.map(p => [p.id, p]) || [])
    const formattedPosts = (data || []).map((post: any) => {
      const profile = profileMap.get(post.user_id)
      return {
        ...post,
        username: profile?.username,
        avatar_url: profile?.avatar_url,
        is_liked_by_me: post.is_liked
      }
    })

    setPosts(formattedPosts)
  }

  useEffect(() => {
    fetchPosts()

    // リアルタイム更新の購読
    const channel = supabase
      .channel('timeline-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'posts'
        },
        async () => {
          // 新規投稿があったら再取得
          await fetchPosts()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'posts'
        },
        async () => {
          // 投稿が編集されたら再取得
          await fetchPosts()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'posts'
        },
        async () => {
          // 投稿が削除されたら再取得
          await fetchPosts()
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'likes'
        },
        async () => {
          // いいねの変更があったら再取得
          await fetchPosts()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // ログアウト処理
  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // 返信一覧の取得
  const fetchReplies = async (postId: string) => {
    const { data, error } = await supabase
      .from('posts_with_counts')
      .select('*')
      .eq('parent_id', postId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('返信取得エラー:', error)
      return
    }

    // ユーザー情報を別途取得
    const userIds = [...new Set(data?.map(p => p.user_id).filter((id): id is string => id !== null))]
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, avatar_url')
      .in('id', userIds)

    // データを整形
    const profileMap = new Map(profiles?.map(p => [p.id, p]) || [])
    const formattedReplies = (data || []).map((reply: any) => {
      const profile = profileMap.get(reply.user_id)
      return {
        ...reply,
        username: profile?.username,
        avatar_url: profile?.avatar_url,
        is_liked_by_me: reply.is_liked
      }
    })

    setReplies(prev => ({ ...prev, [postId]: formattedReplies }))
  }

  // 返信の表示/非表示を切り替え
  const toggleReplies = async (postId: string) => {
    const newExpandedPosts = new Set(expandedPosts)
    
    if (expandedPosts.has(postId)) {
      newExpandedPosts.delete(postId)
    } else {
      newExpandedPosts.add(postId)
      // 返信をまだ取得していない場合は取得
      if (!replies[postId]) {
        await fetchReplies(postId)
      }
    }
    
    setExpandedPosts(newExpandedPosts)
  }

  // いいね処理
  const handleLike = async (postId: string | null, isLiked: boolean | null) => {
    if (!postId || !user) return

    try {
      if (isLiked) {
        // いいね削除
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id)

        if (error) throw error
      } else {
        // いいね追加
        const { error } = await supabase
          .from('likes')
          .insert([
            {
              post_id: postId,
              user_id: user.id
            }
          ])

        if (error) throw error
      }

      // 楽観的UI更新: すぐに画面を更新
      setPosts(posts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            is_liked_by_me: !isLiked,
            likes_count: isLiked 
              ? (post.likes_count || 0) - 1 
              : (post.likes_count || 0) + 1
          }
        }
        return post
      }))

    } catch (error) {
      console.error('いいねエラー:', error)
      // エラー時は元に戻す
      await fetchPosts()
    }
  }

  // 投稿削除
  const handleDeletePost = async (postId: string | null) => {
    if (!postId || !user) return
    
    // 確認ダイアログを表示
    setConfirmDelete(postId)
  }

  // 投稿削除実行
  const executeDelete = async () => {
    if (!confirmDelete || !user) return

    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', confirmDelete)
        .eq('user_id', user.id) // RLSで二重チェック

      if (error) throw error

      // 楽観的UI更新
      setPosts(posts.filter(post => post.id !== confirmDelete))
      
      // 返信として削除した場合、返信リストも更新
      setReplies(prev => {
        const newReplies = { ...prev }
        Object.keys(newReplies).forEach(key => {
          newReplies[key] = newReplies[key].filter(reply => reply.id !== confirmDelete)
        })
        return newReplies
      })

      setToast({ message: msg.post.deleteSuccess, type: "success" })

    } catch (error) {
      console.error('削除エラー:', error)
      setToast({ message: msg.post.deleteError, type: "error" })
      await fetchPosts()
    } finally {
      setConfirmDelete(null)
    }
  }

  // 投稿編集開始
  const startEditPost = (post: Post) => {
    if (!post.id || !post.content) return
    setEditingPostId(post.id)
    setEditContent(post.content)
  }

  // 投稿編集キャンセル
  const cancelEdit = () => {
    setEditingPostId(null)
    setEditContent('')
  }

  // 投稿編集保存
  const handleUpdatePost = async (postId: string) => {
    if (!user || !editContent.trim() || editContent.length > 140) return

    try {
      const { error } = await supabase
        .from('posts')
        .update({ content: editContent.trim() })
        .eq('id', postId)
        .eq('user_id', user.id) // RLSで二重チェック

      if (error) throw error

      // 楽観的UI更新
      setPosts(posts.map(post => 
        post.id === postId ? { ...post, content: editContent.trim() } : post
      ))

      // 返信リストも更新
      setReplies(prev => {
        const newReplies = { ...prev }
        Object.keys(newReplies).forEach(key => {
          newReplies[key] = newReplies[key].map(reply => 
            reply.id === postId ? { ...reply, content: editContent.trim() } : reply
          )
        })
        return newReplies
      })

      setEditingPostId(null)
      setEditContent('')
      setToast({ message: msg.post.updateSuccess, type: "success" })

    } catch (error) {
      console.error('更新エラー:', error)
      setToast({ message: msg.post.updateError, type: "error" })
      await fetchPosts()
    }
  }

  // ローディング中の表示
  if (loading) {
    return (
      <div className="min-h-screen bg-secondary/30 flex items-center justify-center">
        <div className="text-center">
          <Heart className="w-12 h-12 text-primary animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">{msg.common.loading}</p>
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
              {msg.common.appName}
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
                <span className="font-medium">{msg.navigation.timeline}</span>
              </button>
              <button 
                onClick={() => { setActiveTab('gallery'); setIsMenuOpen(false); }}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'gallery' ? 'bg-primary/10 text-primary' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <ImageIcon className="w-5 h-5" />
                <span className="font-medium">{msg.navigation.gallery}</span>
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
              {msg.common.appName}
            </h1>
          </div>

          <nav className="flex-1 space-y-2">
            <NavItem id="timeline" icon={Home} label={msg.navigation.timeline} />
            <NavItem id="gallery" icon={ImageIcon} label={msg.navigation.gallery} />
          </nav>

          <div className="px-4 mt-auto">
            <Button 
              variant="ghost" 
              fullWidth 
              className="justify-start gap-4 text-gray-600 hover:text-red-500 hover:bg-red-50"
              onClick={handleLogout}
            >
              <LogOut className="w-6 h-6" />
              <span className="text-lg">{msg.navigation.logout}</span>
            </Button>
          </div>
        </aside>

        {/* メインコンテンツエリア */}
        <main className="flex-1 max-w-2xl py-6 px-4 md:px-0 mx-auto md:mx-0">
          
          {activeTab === 'timeline' ? (
            <div className="space-y-6">
              {/* タイムライン */}
              <div className="space-y-4">
                {posts.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <p>{msg.timeline.noPosts}</p>
                    <p className="text-sm mt-2">{msg.timeline.noPostsHint}</p>
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
                            <div className="flex flex-col">
                              <button
                                onClick={() => router.push(`/profile/${post.user_id}`)}
                                className="text-sm font-bold text-foreground truncate hover:underline text-left"
                              >
                                {post.username || msg.common.guest}
                              </button>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-400">
                                {post.created_at ? new Date(post.created_at).toLocaleString('ja-JP') : ''}
                              </span>
                              {/* 自分の投稿の場合のみ編集・削除ボタン表示 */}
                              {user && post.user_id === user.id && (
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-gray-400 hover:text-primary"
                                    onClick={() => startEditPost(post)}
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-gray-400 hover:text-red-500"
                                    onClick={() => handleDeletePost(post.id)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="pb-2 pl-[4.5rem]">
                        {editingPostId === post.id ? (
                          <div className="space-y-2">
                            <textarea
                              className="w-full min-h-[100px] p-2 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-primary focus:border-transparent"
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              maxLength={140}
                              autoFocus
                            />
                            <div className="flex items-center justify-between">
                              <span className={`text-sm ${editContent.length > 140 ? 'text-red-500 font-bold' : 'text-gray-500'}`}>
                                {formatMessage(msg.post.characterCount, { current: editContent.length.toString(), max: '140' })}
                              </span>
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={cancelEdit}
                                  className="text-gray-500"
                                >
                                  <XCircle className="w-4 h-4 mr-1" />
                                  {msg.post.cancel}
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => post.id && handleUpdatePost(post.id)}
                                  disabled={!editContent.trim() || editContent.length > 140}
                                >
                                  <Check className="w-4 h-4 mr-1" />
                                  {msg.post.save}
                                </Button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <p className="text-base leading-relaxed whitespace-pre-wrap text-foreground/90">
                            {post.content}
                          </p>
                        )}
                      </CardContent>

                      <CardFooter className="pl-[4.5rem] pt-2 pb-4 flex flex-col gap-4">
                        <div className="flex gap-6">
                          <button 
                            className={`flex items-center gap-1.5 text-sm transition-colors ${post.is_liked_by_me ? 'text-pink-500' : 'text-gray-400 hover:text-pink-500'}`} 
                            onClick={() => handleLike(post.id, post.is_liked_by_me)}
                          >
                            <Heart className={`w-5 h-5 ${post.is_liked_by_me ? 'fill-pink-500' : ''}`} />
                            <span>{post.likes_count || 0}</span>
                          </button>
                          
                          {user && (
                            <button 
                              className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-primary transition-colors"
                              onClick={() => router.push(`/post/new?replyTo=${post.id}`)}
                            >
                              <MessageCircle className="w-5 h-5" />
                              <span>{msg.timeline.reply}</span>
                            </button>
                          )}

                          {(post.replies_count ?? 0) > 0 && (
                            <button 
                              className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-primary transition-colors"
                              onClick={() => post.id && toggleReplies(post.id)}
                            >
                              <span className="text-xs">
                                {expandedPosts.has(post.id || '') 
                                  ? msg.timeline.hideReplies 
                                  : formatMessage(msg.timeline.showReplies, { count: (post.replies_count ?? 0).toString() })}
                              </span>
                            </button>
                          )}
                        </div>

                        {/* 返信一覧 */}
                        {expandedPosts.has(post.id || '') && replies[post.id || ''] && (
                          <div className="border-t border-border/50 pt-4 space-y-3">
                            {replies[post.id || ''].map((reply) => (
                              <div key={reply.id} className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-sm overflow-hidden flex-shrink-0">
                                  {reply.avatar_url ? (
                                    <img src={reply.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                                  ) : (
                                    <span>{reply.username?.[0]?.toUpperCase() || '👤'}</span>
                                  )}
                                </div>
                                <div className="flex-1 bg-gray-50 rounded-lg p-3">
                                  <div className="flex items-center gap-2 mb-1">
                                    <button
                                      onClick={() => router.push(`/profile/${reply.user_id}`)}
                                      className="text-sm font-bold hover:underline"
                                    >
                                      {reply.username || msg.common.guest}
                                    </button>
                                    <span className="text-xs text-gray-400">
                                      {reply.created_at ? new Date(reply.created_at).toLocaleString('ja-JP') : ''}
                                    </span>
                                    {/* 自分の返信の場合のみ編集・削除ボタン表示 */}
                                    {user && reply.user_id === user.id && (
                                      <div className="ml-auto flex gap-1">
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-6 w-6 text-gray-400 hover:text-primary"
                                          onClick={() => startEditPost(reply)}
                                        >
                                          <Edit2 className="w-3 h-3" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-6 w-6 text-gray-400 hover:text-red-500"
                                          onClick={() => handleDeletePost(reply.id)}
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                  {editingPostId === reply.id ? (
                                    <div className="space-y-2">
                                      <textarea
                                        className="w-full min-h-[60px] p-2 border border-gray-300 rounded-md resize-none text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                                        value={editContent}
                                        onChange={(e) => setEditContent(e.target.value)}
                                        maxLength={140}
                                        autoFocus
                                      />
                                      <div className="flex items-center justify-between">
                                        <span className={`text-xs ${editContent.length > 140 ? 'text-red-500 font-bold' : 'text-gray-500'}`}>
                                          {formatMessage(msg.post.characterCount, { current: editContent.length.toString(), max: '140' })}
                                        </span>
                                        <div className="flex gap-1">
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={cancelEdit}
                                            className="text-gray-500 h-7 text-xs"
                                          >
                                            <XCircle className="w-3 h-3 mr-1" />
                                            {msg.post.cancel}
                                          </Button>
                                          <Button
                                            size="sm"
                                            onClick={() => reply.id && handleUpdatePost(reply.id)}
                                            disabled={!editContent.trim() || editContent.length > 140}
                                            className="h-7 text-xs"
                                          >
                                            <Check className="w-3 h-3 mr-1" />
                                            {msg.post.save}
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  ) : (
                                    <p className="text-sm text-foreground/90 whitespace-pre-wrap">
                                      {reply.content}
                                    </p>
                                  )}
                                  <div className="flex gap-4 mt-2">
                                    <button 
                                      className={`flex items-center gap-1 text-xs transition-colors ${reply.is_liked_by_me ? 'text-pink-500' : 'text-gray-400 hover:text-pink-500'}`}
                                      onClick={() => handleLike(reply.id, reply.is_liked_by_me)}
                                    >
                                      <Heart className={`w-4 h-4 ${reply.is_liked_by_me ? 'fill-pink-500' : ''}`} />
                                      <span>{reply.likes_count || 0}</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
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

      {/* フローティング新規投稿ボタン (認証済みユーザーのみ表示) */}
      {user && (
        <Button
          onClick={() => router.push('/post/new')}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 z-50"
          size="icon"
        >
          <Plus className="w-6 h-6" />
        </Button>
      )}

      {/* Toast通知 */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* 削除確認ダイアログ */}
      {confirmDelete && (
        <ConfirmDialog
          title={msg.post.deleteConfirmTitle}
          message={msg.post.deleteConfirmMessage}
          confirmText={msg.post.deleteConfirmButton}
          cancelText={msg.post.cancelButton}
          onConfirm={executeDelete}
          onCancel={() => setConfirmDelete(null)}
          variant="danger"
        />
      )}
    </div>
  )
}
