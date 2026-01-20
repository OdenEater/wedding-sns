'use client'

import { useState } from 'react'
import { X, Check } from 'lucide-react'
import { 
  groomAvatars,
  brideAvatars,
  emojiAnimalAvatars, 
  emojiFaceAvatars, 
  emojiCelebrationAvatars, 
  type Avatar,
  type AvatarCategory 
} from '@/utils/avatars'
import { useMessages, formatMessage } from '@/hooks/useMessages'

type AvatarSelectorProps = {
  currentAvatarUrl: string | null
  isOpen: boolean
  onClose: () => void
  onSelect: (avatarUrl: string) => void
}

export function AvatarSelector({ currentAvatarUrl, isOpen, onClose, onSelect }: AvatarSelectorProps) {
  const [selectedUrl, setSelectedUrl] = useState<string | null>(currentAvatarUrl)
  const [activeTab, setActiveTab] = useState<AvatarCategory>('groom')
  const msg = useMessages()

  if (!isOpen) return null

  const handleSelect = () => {
    if (selectedUrl) {
      onSelect(selectedUrl)
      onClose()
    }
  }

  const renderAvatarItem = (avatar: Avatar) => {
    const avatarUrl = avatar.type === 'emoji' ? `emoji:${avatar.value}` : avatar.value
    const isSelected = selectedUrl === avatarUrl

    return (
      <button
        key={avatar.id}
        onClick={() => setSelectedUrl(avatarUrl)}
        className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all ${
          isSelected 
            ? 'ring-4 ring-primary bg-primary/10 scale-105' 
            : 'bg-gray-100 hover:bg-gray-200 hover:scale-105'
        }`}
      >
        {avatar.type === 'emoji' ? (
          <span className="text-3xl">{avatar.value}</span>
        ) : (
          <div className="w-full h-full rounded-full overflow-hidden">
            <img 
              src={avatar.value} 
              alt={avatar.label} 
              className="w-full h-full object-cover"
            />
          </div>
        )}
        {isSelected && (
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
            <Check className="w-4 h-4 text-white" />
          </div>
        )}
      </button>
    )
  }

  // 現在のタブに応じたアバターリストを取得
  const getCurrentAvatars = () => {
    switch (activeTab) {
      case 'groom':
        return groomAvatars
      case 'bride':
        return brideAvatars
      case 'emojiAnimals':
        return emojiAnimalAvatars
      case 'emojiFaces':
        return emojiFaceAvatars
      case 'emojiCelebration':
        return emojiCelebrationAvatars
      default:
        return groomAvatars
    }
  }

  // 環境変数から新郎新婦の名前を取得
  const groomName = process.env.NEXT_PUBLIC_GROOM_NAME || '新郎'
  const brideName = process.env.NEXT_PUBLIC_BRIDE_NAME || '新婦'

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <div 
        className="bg-white w-full sm:w-[600px] sm:rounded-lg shadow-xl max-h-[85vh] sm:max-h-[90vh] flex flex-col animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold">
            {msg.profile.selectAvatar || 'アバターを選択'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="閉じる"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* タブ */}
        <div className="flex border-b border-gray-200 overflow-x-auto">
          <button
            onClick={() => setActiveTab('groom')}
            className={`flex-1 min-w-[90px] py-3 px-2 text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap ${
              activeTab === 'groom'
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {formatMessage(msg.profile.groomAvatars, { name: groomName })}
          </button>
          <button
            onClick={() => setActiveTab('bride')}
            className={`flex-1 min-w-[90px] py-3 px-2 text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap ${
              activeTab === 'bride'
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {formatMessage(msg.profile.brideAvatars, { name: brideName })}
          </button>
          <button
            onClick={() => setActiveTab('emojiAnimals')}
            className={`flex-1 min-w-[90px] py-3 px-2 text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap ${
              activeTab === 'emojiAnimals'
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {msg.profile.emojiAnimals || '絵文字 - 動物'}
          </button>
          <button
            onClick={() => setActiveTab('emojiFaces')}
            className={`flex-1 min-w-[90px] py-3 px-2 text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap ${
              activeTab === 'emojiFaces'
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {msg.profile.emojiFaces || '絵文字 - 表情'}
          </button>
          <button
            onClick={() => setActiveTab('emojiCelebration')}
            className={`flex-1 min-w-[90px] py-3 px-2 text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap ${
              activeTab === 'emojiCelebration'
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {msg.profile.emojiCelebration || '絵文字 - お祝い'}
          </button>
        </div>

        {/* コンテンツ */}
        <div className="overflow-y-auto flex-1 p-6">
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
            {getCurrentAvatars().map(renderAvatarItem)}
          </div>
        </div>

        {/* フッター */}
        <div className="p-4 border-t border-gray-200 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors"
          >
            {msg.common.cancel || 'キャンセル'}
          </button>
          <button
            onClick={handleSelect}
            disabled={!selectedUrl}
            className="flex-1 py-3 px-4 bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {msg.common.save || '保存'}
          </button>
        </div>
      </div>
    </div>
  )
}
