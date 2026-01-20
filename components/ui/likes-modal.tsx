'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/utils/supabase/client'
import { X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { formatMessage, useMessages } from '@/hooks/useMessages'

type LikeUser = {
  user_id: string
  username: string | null
  avatar_url: string | null
}

type LikesModalProps = {
  postId: string
  isOpen: boolean
  onClose: () => void
}

export function LikesModal({ postId, isOpen, onClose }: LikesModalProps) {
  const [users, setUsers] = useState<LikeUser[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const msg = useMessages()

  useEffect(() => {
    if (!isOpen) return

    const fetchLikedUsers = async () => {
      setLoading(true)
      try {
        // いいねしたユーザーIDを取得
        const { data: likesData, error: likesError } = await supabase
          .from('likes')
          .select('user_id, created_at')
          .eq('post_id', postId)
          .order('created_at', { ascending: false })

        if (likesError) throw likesError

        if (!likesData || likesData.length === 0) {
          setUsers([])
          setLoading(false)
          return
        }

        // ユーザー情報を取得
        const userIds = likesData.map(like => like.user_id)
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .in('id', userIds)

        if (profilesError) throw profilesError

        // データをマージ
        const profileMap = new Map(profilesData?.map(p => [p.id, p]) || [])
        const likeUsers = likesData.map(like => {
          const profile = profileMap.get(like.user_id)
          return {
            user_id: like.user_id,
            username: profile?.username || null,
            avatar_url: profile?.avatar_url || null
          }
        })

        setUsers(likeUsers)
      } catch (error) {
        console.error('いいねユーザー取得エラー:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchLikedUsers()
  }, [postId, isOpen])

  if (!isOpen) return null

  const handleUserClick = (userId: string) => {
    onClose()
    router.push(`/profile/${userId}`)
  }

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <div 
        className="bg-white w-full sm:w-96 sm:rounded-lg shadow-xl max-h-[70vh] sm:max-h-[80vh] flex flex-col animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold">
            {msg.likes.title}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label={msg.likes.close}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* コンテンツ */}
        <div className="overflow-y-auto flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-gray-500">{msg.common.loading}</p>
            </div>
          ) : users.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-gray-500">{msg.likes.noLikes}</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {users.map((user) => (
                <button
                  key={user.user_id}
                  onClick={() => handleUserClick(user.user_id)}
                  className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-lg overflow-hidden flex-shrink-0">
                    {user.avatar_url ? (
                      user.avatar_url.startsWith('emoji:') ? (
                        <span className="text-2xl">{user.avatar_url.replace('emoji:', '')}</span>
                      ) : (
                        <img 
                          src={user.avatar_url} 
                          alt="avatar" 
                          className="w-full h-full object-cover" 
                        />
                      )
                    ) : (
                      <span>{user.username?.[0]?.toUpperCase() || '👤'}</span>
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-foreground">
                      {user.username || msg.common.guest}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* フッター（ユーザー数表示） */}
        {!loading && users.length > 0 && (
          <div className="p-3 border-t border-gray-200 text-center text-sm text-gray-500">
            {formatMessage(msg.likes.count, { count: users.length.toString() })}
          </div>
        )}
      </div>
    </div>
  )
}
