'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { AvatarSelector } from '@/components/ui/avatar-selector'
import { ArrowLeft, ArrowRight, Check, User, Camera } from 'lucide-react'
import { useMessages } from '@/hooks/useMessages'
import type { User as SupabaseUser } from '@supabase/supabase-js'

export default function OnboardingPage() {
    const router = useRouter()
    const msg = useMessages()

    const [step, setStep] = useState<1 | 2>(1)
    const [user, setUser] = useState<SupabaseUser | null>(null)
    const [username, setUsername] = useState('')
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [showAvatarSelector, setShowAvatarSelector] = useState(false)

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/login')
                return
            }
            setUser(user)
            // デフォルトのユーザー名としてメールの@前の部分を使用
            const defaultName = user.email?.split('@')[0] || ''
            setUsername(defaultName)
            setLoading(false)
        }
        checkUser()
    }, [router])

    const handleNext = () => {
        setStep(2)
    }

    const handleBack = () => {
        setStep(1)
    }

    const saveProfile = async (skipAvatar: boolean = false) => {
        if (!user) return

        setSaving(true)
        try {
            const updates: { username?: string; avatar_url?: string | null; onboarding_completed?: boolean } = {}

            if (username.trim()) {
                updates.username = username.trim()
            }

            if (!skipAvatar && avatarUrl) {
                updates.avatar_url = avatarUrl
            }

            // オンボーディング完了フラグをセット
            updates.onboarding_completed = true

            if (Object.keys(updates).length > 0) {
                const { error } = await supabase
                    .from('profiles')
                    .update(updates)
                    .eq('id', user.id)

                if (error) throw error
            }

            router.push('/')
        } catch (error) {
            console.error('Profile update error:', error)
        } finally {
            setSaving(false)
        }
    }

    const handleSkipUsername = () => {
        // スキップ時はメールアドレスの@前をユーザー名として使用
        setUsername(user?.email?.split('@')[0] || '')
        setStep(2)
    }

    const handleSkipAvatar = () => {
        saveProfile(true)
    }

    const handleComplete = () => {
        saveProfile(false)
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50">
                <div className="animate-pulse text-primary">読み込み中...</div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex flex-col items-center justify-center p-4">
            {/* プログレスインジケーター */}
            <div className="flex items-center gap-2 mb-8">
                <div className={`w-3 h-3 rounded-full transition-colors ${step >= 1 ? 'bg-primary' : 'bg-gray-300'}`} />
                <div className={`w-8 h-0.5 transition-colors ${step >= 2 ? 'bg-primary' : 'bg-gray-300'}`} />
                <div className={`w-3 h-3 rounded-full transition-colors ${step >= 2 ? 'bg-primary' : 'bg-gray-300'}`} />
            </div>

            <Card className="w-full max-w-md shadow-xl">
                <CardContent className="p-6">
                    {step === 1 ? (
                        // Step 1: ユーザー名入力
                        <div className="space-y-6">
                            <div className="text-center">
                                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <User className="w-8 h-8 text-primary" />
                                </div>
                                <h1 className="text-2xl font-bold text-gray-800">ようこそ！</h1>
                                <p className="text-gray-600 mt-2">表示名を設定しましょう</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    ユーザー名
                                </label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="例: たろう"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                    maxLength={20}
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    他のユーザーに表示される名前です
                                </p>
                            </div>

                            <Button
                                onClick={handleNext}
                                className="w-full"
                                disabled={!username.trim()}
                            >
                                次へ
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>

                            {/* スキップ案内 */}
                            <div className="text-center">
                                <p className="text-xs text-gray-400 mb-2">
                                    後からプロフィールで設定できます
                                </p>
                                <button
                                    onClick={handleSkipUsername}
                                    className="text-sm text-gray-500 hover:text-primary transition-colors"
                                >
                                    スキップ
                                </button>
                            </div>
                        </div>
                    ) : (
                        // Step 2: アバター選択
                        <div className="space-y-6">
                            <div className="text-center">
                                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Camera className="w-8 h-8 text-primary" />
                                </div>
                                <h1 className="text-2xl font-bold text-gray-800">アバターを選択</h1>
                                <p className="text-gray-600 mt-2">{username}さん、アイコンを設定しましょう</p>
                            </div>

                            {/* アバター選択ボタン */}
                            <div className="flex flex-col items-center gap-4">
                                <button
                                    onClick={() => setShowAvatarSelector(true)}
                                    className="w-24 h-24 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all border-2 border-dashed border-gray-300 hover:border-primary"
                                >
                                    {avatarUrl ? (
                                        avatarUrl.startsWith('emoji:') ? (
                                            <span className="text-4xl">{avatarUrl.replace('emoji:', '')}</span>
                                        ) : (
                                            <img src={avatarUrl} alt="avatar" className="w-full h-full rounded-full object-cover" />
                                        )
                                    ) : (
                                        <Camera className="w-8 h-8 text-gray-400" />
                                    )}
                                </button>
                                <p className="text-center text-xs text-gray-500">
                                    タップしてアバターを選択
                                </p>
                            </div>

                            {/* アバター選択モーダル */}
                            <AvatarSelector
                                currentAvatarUrl={avatarUrl}
                                isOpen={showAvatarSelector}
                                onClose={() => setShowAvatarSelector(false)}
                                onSelect={(url: string) => setAvatarUrl(url)}
                            />

                            <Button
                                onClick={handleComplete}
                                className="w-full"
                                disabled={saving}
                            >
                                {saving ? '保存中...' : '完了'}
                                <Check className="w-4 h-4 ml-2" />
                            </Button>

                            {/* ナビゲーションボタン */}
                            <div className="flex justify-between items-center">
                                <button
                                    onClick={handleBack}
                                    className="flex items-center text-sm text-gray-500 hover:text-primary transition-colors"
                                >
                                    <ArrowLeft className="w-4 h-4 mr-1" />
                                    戻る
                                </button>
                                <div className="text-center flex-1">
                                    <p className="text-xs text-gray-400">
                                        後からプロフィールで設定できます
                                    </p>
                                </div>
                                <button
                                    onClick={handleSkipAvatar}
                                    className="text-sm text-gray-500 hover:text-primary transition-colors"
                                    disabled={saving}
                                >
                                    スキップ
                                </button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
