'use client'

import { X } from 'lucide-react'

type AvatarModalProps = {
  avatarUrl: string | null
  username: string | null
  isOpen: boolean
  onClose: () => void
}

export function AvatarModal({ avatarUrl, username, isOpen, onClose }: AvatarModalProps) {
  if (!isOpen) return null

  const renderAvatar = () => {
    if (!avatarUrl) {
      return (
        <div className="w-80 h-80 rounded-full bg-primary/10 flex items-center justify-center text-9xl">
          <span>{username?.[0]?.toUpperCase() || '👤'}</span>
        </div>
      )
    }

    if (avatarUrl.startsWith('emoji:')) {
      const emoji = avatarUrl.replace('emoji:', '')
      return (
        <div className="w-80 h-80 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="text-9xl">{emoji}</span>
        </div>
      )
    }

    return (
      <div className="w-80 h-80 rounded-full overflow-hidden shadow-2xl">
        <img 
          src={avatarUrl} 
          alt={username || 'avatar'} 
          className="w-full h-full object-cover"
        />
      </div>
    )
  }

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative animate-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 閉じるボタン */}
        <button
          onClick={onClose}
          className="absolute -top-4 -right-4 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-100 transition-colors z-10"
          aria-label="閉じる"
        >
          <X className="w-6 h-6 text-gray-600" />
        </button>

        {/* アバター表示 */}
        {renderAvatar()}

        {/* ユーザー名表示 */}
        {username && (
          <div className="mt-4 text-center">
            <p className="text-white text-xl font-bold bg-black/50 backdrop-blur-sm px-6 py-3 rounded-full inline-block">
              {username}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
