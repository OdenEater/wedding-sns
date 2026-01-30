'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Toast } from '@/components/ui/toast'
import { AvatarSelector } from '@/components/ui/avatar-selector'
import { AvatarModal } from '@/components/ui/avatar-modal'
import { ArrowLeft, Heart, MessageCircle, Edit2, Check, XCircle, Camera } from 'lucide-react'
import { useMessages } from '@/hooks/useMessages'
import type { User } from '@supabase/supabase-js'

type Profile = {
  id: string
  username: string | null
  avatar_url: string | null
  updated_at: string | null
  onboarding_completed: boolean | null
}

type Post = {
  id: string | null
  content: string | null
  created_at: string | null
  likes_count: number
  replies_count: number
  is_liked_by_me: boolean
}

export default function ProfilePage() {
  const params = useParams()
  const userId = params.id as string
  const router = useRouter()
  const msg = useMessages()

  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editUsername, setEditUsername] = useState('')
  const [editAvatarUrl, setEditAvatarUrl] = useState<string | null>(null)
  const [showAvatarSelector, setShowAvatarSelector] = useState(false)
  const [showAvatarModal, setShowAvatarModal] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null)
  const [stats, setStats] = useState({
    postsCount: 0
  })

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // 現在のユーザー取得
        const { data: { user } } = await supabase.auth.getUser()
        setCurrentUser(user)

        // プロフィール情報取得
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()

        if (profileError) throw profileError
        setProfile(profileData)
        setEditUsername(profileData.username || '')

        // 投稿一覧取得
        const { data: postsData, error: postsError } = await supabase
          .from('posts_with_counts')
          .select('*')
          .eq('user_id', userId)
          .is('parent_id', null) // 返信は除外
          .order('created_at', { ascending: false })

        if (postsError) throw postsError

        // is_liked_by_meフィールドを追加
        const postsWithLikes = postsData.map(post => ({
          id: post.id,
          content: post.content,
          created_at: post.created_at,
          likes_count: post.likes_count || 0,
          replies_count: post.replies_count || 0,
          is_liked_by_me: false // 後で実装
        }))

        setPosts(postsWithLikes)

        // 統計情報の計算
        const postsCount = postsData.length

        setStats({
          postsCount
        })

      } catch (error) {
        console.error('プロフィール取得エラー:', error)
      } finally {
        setLoading(false)
      }
    }

    if (userId) {
      fetchProfile()
    }
  }, [userId])

  // プロフィール編集開始
  const startEdit = () => {
    setIsEditing(true)
    setEditUsername(profile?.username || '')
    setEditAvatarUrl(profile?.avatar_url || null)
  }

  // プロフィール編集キャンセル
  const cancelEdit = () => {
    setIsEditing(false)
    setEditUsername(profile?.username || '')
    setEditAvatarUrl(profile?.avatar_url || null)
  }

  // アバター選択
  const handleSelectAvatar = (avatarUrl: string) => {
    setEditAvatarUrl(avatarUrl)
  }

  // プロフィール更新
  const handleUpdateProfile = async () => {
    if (!currentUser || !editUsername.trim()) return

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          username: editUsername.trim(),
          avatar_url: editAvatarUrl
        })
        .eq('id', userId)

      if (error) throw error

      // ローカル状態を更新
      setProfile(prev => prev ? {
        ...prev,
        username: editUsername.trim(),
        avatar_url: editAvatarUrl
      } : null)
      setIsEditing(false)
      setToast({ message: msg.profile.updateSuccess, type: "success" })

    } catch (error) {
      console.error('プロフィール更新エラー:', error)
      setToast({ message: msg.profile.updateError, type: "error" })
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

  if (!profile) {
    return (
      <div className="min-h-screen bg-secondary/30 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">ユーザーが見つかりません</p>
          <Button onClick={() => router.push('/')} className="mt-4">
            {msg.profile.backToTimeline}
          </Button>
        </div>
      </div>
    )
  }

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
          <div>
            <h1 className="text-xl font-bold text-foreground">
              {profile.username || msg.common.guest}
            </h1>
            <p className="text-xs text-gray-500">{stats.postsCount} {msg.profile.posts}</p>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="container max-w-2xl mx-auto px-4 py-6">
        {/* プロフィールヘッダー */}
        <Card className="border-none shadow-md mb-6">
          <CardContent className="pt-6">
            <div className="flex gap-6 items-start">
              {/* アバター */}
              <div className="relative">
                <button
                  onClick={() => !isEditing && setShowAvatarModal(true)}
                  disabled={isEditing}
                  className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-3xl overflow-hidden flex-shrink-0 hover:ring-4 hover:ring-primary/50 transition-all disabled:hover:ring-0 disabled:cursor-default"
                >
                  {(isEditing ? editAvatarUrl : profile.avatar_url) ? (
                    (() => {
                      const url = isEditing ? editAvatarUrl : profile.avatar_url
                      if (url?.startsWith('emoji:')) {
                        const emoji = url.replace('emoji:', '')
                        return <span className="text-4xl">{emoji}</span>
                      }
                      return <img src={url!} alt="avatar" className="w-full h-full object-cover" />
                    })()
                  ) : (
                    <span>{profile.username?.[0]?.toUpperCase() || '👤'}</span>
                  )}
                </button>
                {/* 編集中のみアバター変更ボタン表示 */}
                {isEditing && (
                  <button
                    onClick={() => setShowAvatarSelector(true)}
                    className="absolute bottom-0 right-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors"
                    title={msg.profile.changeAvatar}
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* 統計情報 */}
              <div className="flex-1">
                {isEditing ? (
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm text-gray-600 block mb-1">{msg.profile.username}</label>
                      <input
                        type="text"
                        value={editUsername}
                        onChange={(e) => setEditUsername(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                        maxLength={50}
                        autoFocus
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleUpdateProfile} disabled={!editUsername.trim()}>
                        <Check className="w-4 h-4 mr-1" />
                        {msg.profile.saveProfile}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={cancelEdit}>
                        <XCircle className="w-4 h-4 mr-1" />
                        {msg.profile.cancelEdit}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-2xl font-bold">{profile.username || msg.common.guest}</h2>
                      {/* 自分のプロフィールの場合のみ編集ボタン表示 */}
                      {currentUser && currentUser.id === userId && (
                        <Button variant="ghost" size="sm" onClick={startEdit}>
                          <Edit2 className="w-4 h-4 mr-1" />
                          {msg.profile.editProfile}
                        </Button>
                      )}
                    </div>
                    <div className="flex gap-6 text-sm">
                      <div>
                        <span className="font-bold">{stats.postsCount}</span>
                        <span className="text-gray-600 ml-1">{msg.profile.posts}</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mt-3">
                      {msg.profile.joinedAt}: {new Date(profile.updated_at || '').toLocaleDateString('ja-JP')}
                    </p>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 投稿一覧 */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold px-2">{msg.profile.posts}</h3>

          {posts.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>{msg.profile.noPosts}</p>
            </div>
          ) : (
            posts.map((post) => (
              <button
                key={post.id}
                onClick={() => router.push(`/post/${post.id}`)}
                className="w-full text-left"
              >
                <Card className="border-none shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <p className="text-sm text-gray-500">
                        {post.created_at ? new Date(post.created_at).toLocaleString('ja-JP') : ''}
                      </p>
                    </div>
                  </CardHeader>

                  <CardContent className="pb-4">
                    <p className="text-base leading-relaxed whitespace-pre-wrap text-foreground/90 mb-3">
                      {post.content}
                    </p>

                    <div className="flex gap-6 text-sm text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <Heart className="w-4 h-4" />
                        <span>{post.likes_count}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MessageCircle className="w-4 h-4" />
                        <span>{post.replies_count}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </button>
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

      {/* アバター選択モーダル */}
      <AvatarSelector
        currentAvatarUrl={editAvatarUrl}
        isOpen={showAvatarSelector}
        onClose={() => setShowAvatarSelector(false)}
        onSelect={handleSelectAvatar}
      />

      {/* アバター拡大表示モーダル */}
      <AvatarModal
        avatarUrl={profile?.avatar_url || null}
        username={profile?.username || null}
        isOpen={showAvatarModal}
        onClose={() => setShowAvatarModal(false)}
      />
    </div>
  )
}
