import avatarsConfig from '@/public/avatars-config.json'

// アバター画像の定義
export type AvatarType = 'image' | 'emoji'

export type Avatar = {
  id: string
  type: AvatarType
  value: string // 画像の場合はパス、絵文字の場合は絵文字そのもの
  label: string // 表示名（日本語）
}

// アバターカテゴリー型
export type AvatarCategory = 'groom' | 'bride' | 'emojiAnimals' | 'emojiFaces' | 'emojiCelebration'

// JSONファイルから新郎の動物アバターを読み込み（画像）
export const groomAvatars: Avatar[] = avatarsConfig.groomAvatars.map(item => ({
  id: item.id,
  type: 'image' as const,
  value: `/images/icon/${item.filename}`,
  label: item.label
}))

// JSONファイルから新婦の動物アバターを読み込み（画像）
export const brideAvatars: Avatar[] = avatarsConfig.brideAvatars.map(item => ({
  id: item.id,
  type: 'image' as const,
  value: `/images/icon/${item.filename}`,
  label: item.label
}))

// 後方互換性のため、全動物画像を統合
export const animalAvatars: Avatar[] = [...groomAvatars, ...brideAvatars]

// JSONファイルから絵文字動物アバターを読み込み
export const emojiAnimalAvatars: Avatar[] = avatarsConfig.emojiAnimals.map(item => ({
  id: item.id,
  type: 'emoji' as const,
  value: item.emoji,
  label: item.label
}))

// JSONファイルから絵文字表情アバターを読み込み
export const emojiFaceAvatars: Avatar[] = avatarsConfig.emojiFaces.map(item => ({
  id: item.id,
  type: 'emoji' as const,
  value: item.emoji,
  label: item.label
}))

// JSONファイルから絵文字お祝いアバターを読み込み
export const emojiCelebrationAvatars: Avatar[] = avatarsConfig.emojiCelebration.map(item => ({
  id: item.id,
  type: 'emoji' as const,
  value: item.emoji,
  label: item.label
}))

// 後方互換性のため、全絵文字を統合
export const emojiAvatars: Avatar[] = [
  ...emojiAnimalAvatars,
  ...emojiFaceAvatars,
  ...emojiCelebrationAvatars
]

// 全アバター
export const allAvatars: Avatar[] = [...animalAvatars, ...emojiAvatars]

// アバターIDからURLを取得
export function getAvatarUrl(avatarId: string | null): string | null {
  if (!avatarId) return null
  
  const avatar = allAvatars.find(a => a.id === avatarId)
  if (!avatar) return null
  
  if (avatar.type === 'emoji') {
    return `emoji:${avatar.value}`
  }
  
  return avatar.value
}

// URLからアバターを検索
export function findAvatarByUrl(url: string | null): Avatar | null {
  if (!url) return null
  return allAvatars.find(a => {
    if (a.type === 'emoji') {
      return url === `emoji:${a.value}`
    }
    return url === a.value
  }) || null
}
