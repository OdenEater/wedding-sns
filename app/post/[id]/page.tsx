'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Toast } from '@/components/ui/toast'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { LikesModal } from '@/components/ui/likes-modal'
import { ArrowLeft, Heart, MessageCircle, Edit2, Trash2, Check, XCircle, Link as LinkIcon } from 'lucide-react'
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
  is_liked_by_me: boolean | null
}

export default function PostDetailPage() {
  const params = useParams()
  const postId = params.id as string
  const router = useRouter()
  const msg = useMessages()
  
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [post, setPost] = useState<Post | null>(null)
  const [replies, setReplies] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [editingPostId, setEditingPostId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [likesModalPostId, setLikesModalPostId] = useState<string | null>(null)
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null)

  // 認証状態の確認
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user)
    }
    checkUser()
  }, [])

  // メイン投稿の取得
  const fetchPost = async () => {
    try {
      const { data, error } = await supabase
        .from('posts_with_counts')
        .select('*')
        .eq('id', postId)
        .single()

      if (error || !data) {
        setNotFound(true)
        setLoading(false)
        return
      }

      // ユーザー情報を取得
      if (data.user_id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .eq('id', data.user_id)
          .single()

        setPost({
          ...data,
          username: profile?.username || null,
          avatar_url: profile?.avatar_url || null,
          is_liked_by_me: data.is_liked
        })
      } else {
        setPost({
          ...data,
          username: null,
          avatar_url: null,
          is_liked_by_me: data.is_liked
        })
      }
      setLoading(false)
    } catch (error) {
      console.error('投稿取得エラー:', error)
      setNotFound(true)
      setLoading(false)
    }
  }

  // 返信の取得
  const fetchReplies = async () => {
    try {
      const { data, error } = await supabase
        .from('posts_with_counts')
        .select('*')
        .eq('parent_id', postId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('返信取得エラー:', error)
        return
      }

      // ユーザー情報を取得
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

      setReplies(formattedReplies)
    } catch (error) {
      console.error('返信取得エラー:', error)
    }
  }

  // 初回データ取得
  useEffect(() => {
    if (postId) {
      fetchPost()
      fetchReplies()
    }
  }, [postId])

  // リアルタイム更新
  useEffect(() => {
    if (!postId) return

    const channel = supabase
      .channel('post-detail')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'posts'
        },
        async () => {
          await fetchPost()
          await fetchReplies()
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
          await fetchPost()
          await fetchReplies()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [postId])

  // いいね処理
  const handleLike = async (targetPostId: string | null, isLiked: boolean | null) => {
    if (!targetPostId || !currentUser) return

    try {
      if (isLiked) {
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('post_id', targetPostId)
          .eq('user_id', currentUser.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('likes')
          .insert([
            {
              post_id: targetPostId,
              user_id: currentUser.id
            }
          ])

        if (error) throw error
      }

      // 楽観的UI更新
      if (post?.id === targetPostId) {
        setPost({
          ...post,
          is_liked_by_me: !isLiked,
          likes_count: isLiked 
            ? (post.likes_count || 0) - 1 
            : (post.likes_count || 0) + 1
        })
      } else {
        setReplies(replies.map(reply => {
          if (reply.id === targetPostId) {
            return {
              ...reply,
              is_liked_by_me: !isLiked,
              likes_count: isLiked 
                ? (reply.likes_count || 0) - 1 
                : (reply.likes_count || 0) + 1
            }
          }
          return reply
        }))
      }
    } catch (error) {
      console.error('いいねエラー:', error)
      await fetchPost()
      await fetchReplies()
    }
  }

  // 削除処理
  const handleDeletePost = (targetPostId: string | null) => {
    if (!targetPostId || !currentUser) return
    setConfirmDelete(targetPostId)
  }

  const executeDelete = async () => {
    if (!confirmDelete || !currentUser) return

    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', confirmDelete)
        .eq('user_id', currentUser.id)

      if (error) throw error

      setToast({ message: msg.post.deleteSuccess, type: 'success' })
      setConfirmDelete(null)

      // メイン投稿を削除した場合はタイムラインに戻る
      if (confirmDelete === postId) {
        setTimeout(() => {
          router.push('/')
        }, 1500)
      } else {
        // 返信を削除した場合はリストから除外
        setReplies(replies.filter(reply => reply.id !== confirmDelete))
      }
    } catch (error) {
      console.error('削除エラー:', error)
      setToast({ message: msg.post.deleteError, type: 'error' })
      setConfirmDelete(null)
    }
  }

  // 編集開始
  const startEdit = (targetPost: Post) => {
    if (!targetPost.id || !targetPost.content) return
    setEditingPostId(targetPost.id)
    setEditContent(targetPost.content)
  }

  // 編集キャンセル
  const cancelEdit = () => {
    setEditingPostId(null)
    setEditContent('')
  }

  // 編集保存
  const handleUpdatePost = async (targetPostId: string) => {
    if (!currentUser || !editContent.trim() || editContent.length > 140) return

    try {
      const { error } = await supabase
        .from('posts')
        .update({ content: editContent.trim() })
        .eq('id', targetPostId)
        .eq('user_id', currentUser.id)

      if (error) throw error

      // 楽観的UI更新
      if (post?.id === targetPostId) {
        setPost({ ...post, content: editContent.trim() })
      } else {
        setReplies(replies.map(reply => 
          reply.id === targetPostId ? { ...reply, content: editContent.trim() } : reply
        ))
      }

      setEditingPostId(null)
      setEditContent('')
      setToast({ message: msg.post.updateSuccess, type: 'success' })
    } catch (error) {
      console.error('更新エラー:', error)
      setToast({ message: msg.post.updateError, type: 'error' })
    }
  }

  // リンクコピー
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setToast({ message: msg.postDetail.linkCopied, type: 'success' })
    } catch (error) {
      // フォールバック
      const textarea = document.createElement('textarea')
      textarea.value = window.location.href
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setToast({ message: msg.postDetail.linkCopied, type: 'success' })
    }
  }

  // いいねボタン長押しハンドラー
  const handleLongPressStart = (postId: string | null, likesCount: number | null) => {
    if (!postId || (likesCount || 0) === 0) return
    
    const timer = setTimeout(() => {
      setLikesModalPostId(postId)
    }, 500) // 500ms長押しでモーダル表示
    
    setLongPressTimer(timer)
  }

  const handleLongPressEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      setLongPressTimer(null)
    }
  }

  // ローディング中
  if (loading) {
    return (
      <div className="min-h-screen bg-secondary/30 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">{msg.common.loading}</p>
        </div>
      </div>
    )
  }

  // 404エラー
  if (notFound || !post) {
    return (
      <div className="min-h-screen bg-secondary/30 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="mb-6">
            <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              {msg.postDetail.notFound}
            </h1>
            <p className="text-gray-600">
              {msg.postDetail.notFoundHint}
            </p>
          </div>
          <Button onClick={() => router.push('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            {msg.postDetail.backToTimeline}
          </Button>
        </div>
      </div>
    )
  }

  // 投稿詳細表示
  return (
    <div className="min-h-screen bg-secondary/30">
      {/* ヘッダー */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-border shadow-sm">
        <div className="container max-w-2xl mx-auto px-4 h-16 flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => router.push('/')}
            className="-ml-2"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-xl font-bold text-foreground">
            {msg.postDetail.title}
          </h1>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="container max-w-2xl mx-auto px-4 py-6">
        {/* メイン投稿（ハイライト表示） */}
        <Card className="border-none shadow-md mb-6 bg-primary/5 border-l-4 border-primary">
          <CardHeader className="flex flex-row items-start gap-4 pb-2">
            <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-xl shadow-inner overflow-hidden flex-shrink-0">
              {post.avatar_url ? (
                <img src={post.avatar_url} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <span>{post.username?.[0]?.toUpperCase() || '👤'}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => router.push(`/profile/${post.user_id}`)}
                  className="text-base font-bold text-foreground hover:underline truncate"
                >
                  {post.username || msg.common.guest}
                </button>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400">
                    {post.created_at ? new Date(post.created_at).toLocaleString('ja-JP') : ''}
                  </span>
                  {currentUser && post.user_id === currentUser.id && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-400 hover:text-primary"
                        onClick={() => startEdit(post)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-400 hover:text-red-500"
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

          <CardContent className="pb-2 pl-20">
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
                    <Button variant="ghost" size="sm" onClick={cancelEdit}>
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
              <p className="text-lg leading-relaxed whitespace-pre-wrap text-foreground mb-4">
                {post.content}
              </p>
            )}
          </CardContent>

          <CardFooter className="pl-20 pt-2 pb-4 flex flex-col gap-3">
            {/* アクションボタン */}
            <div className="flex gap-3">
              <button
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm transition-colors ${
                  post.is_liked_by_me 
                    ? 'text-pink-500 bg-pink-50' 
                    : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
                }`}
                onClick={() => handleLike(post.id, post.is_liked_by_me)}
                onTouchStart={() => handleLongPressStart(post.id, post.likes_count)}
                onTouchEnd={handleLongPressEnd}
                onMouseDown={() => handleLongPressStart(post.id, post.likes_count)}
                onMouseUp={handleLongPressEnd}
                onMouseLeave={handleLongPressEnd}
              >
                <Heart className={`w-4 h-4 ${post.is_liked_by_me ? 'fill-pink-500' : ''}`} />
                <span>{post.likes_count || 0}</span>
              </button>

              {currentUser && (
                <button
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                  onClick={() => router.push(`/post/new?replyTo=${post.id}`)}
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>{post.replies_count || 0}</span>
                </button>
              )}

              <button
                className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                onClick={handleCopyLink}
              >
                <LinkIcon className="w-4 h-4" />
                <span>{msg.postDetail.copyLink}</span>
              </button>
            </div>
          </CardFooter>
        </Card>

        {/* 返信セクション */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold px-2">
            {msg.postDetail.replies} ({replies.length})
          </h2>

          {replies.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="mb-2">{msg.postDetail.noReplies}</p>
              <p className="text-sm mb-4">{msg.postDetail.noRepliesHint}</p>
              {currentUser && (
                <Button onClick={() => router.push(`/post/new?replyTo=${post.id}`)}>
                  <MessageCircle className="w-4 h-4 mr-2" />
                  {msg.timeline.reply}
                </Button>
              )}
            </div>
          ) : (
            replies.map((reply) => (
              <Card key={reply.id} className="border-none shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-lg overflow-hidden flex-shrink-0">
                      {reply.avatar_url ? (
                        <img src={reply.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                      ) : (
                        <span>{reply.username?.[0]?.toUpperCase() || '👤'}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => router.push(`/profile/${reply.user_id}`)}
                          className="text-sm font-bold hover:underline"
                        >
                          {reply.username || msg.common.guest}
                        </button>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400">
                            {reply.created_at ? new Date(reply.created_at).toLocaleString('ja-JP') : ''}
                          </span>
                          {currentUser && reply.user_id === currentUser.id && (
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-gray-400 hover:text-primary"
                                onClick={() => startEdit(reply)}
                              >
                                <Edit2 className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-gray-400 hover:text-red-500"
                                onClick={() => handleDeletePost(reply.id)}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pl-16 pb-4">
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
                          <Button variant="ghost" size="sm" onClick={cancelEdit} className="h-7 text-xs">
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
                </CardContent>

                {editingPostId !== reply.id && (
                  <CardFooter className="pl-16 pt-0 pb-4">
                    <div className="flex gap-3">
                      <button
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm transition-colors ${
                          reply.is_liked_by_me 
                            ? 'text-pink-500 bg-pink-50' 
                            : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
                        }`}
                        onClick={() => handleLike(reply.id, reply.is_liked_by_me)}
                        onTouchStart={() => handleLongPressStart(reply.id, reply.likes_count)}
                        onTouchEnd={handleLongPressEnd}
                        onMouseDown={() => handleLongPressStart(reply.id, reply.likes_count)}
                        onMouseUp={handleLongPressEnd}
                        onMouseLeave={handleLongPressEnd}
                      >
                        <Heart className={`w-4 h-4 ${reply.is_liked_by_me ? 'fill-pink-500' : ''}`} />
                        <span>{reply.likes_count || 0}</span>
                      </button>

                      {currentUser && (
                        <button
                          className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                          onClick={() => router.push(`/post/new?replyTo=${reply.id}`)}
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span>{reply.replies_count || 0}</span>
                        </button>
                      )}
                    </div>
                  </CardFooter>
                )}
              </Card>
            ))
          )}
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

      {/* いいねユーザー一覧モーダル */}
      {likesModalPostId && (
        <LikesModal
          postId={likesModalPostId}
          isOpen={!!likesModalPostId}
          onClose={() => setLikesModalPostId(null)}
        />
      )}
    </div>
  )
}
