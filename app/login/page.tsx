'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Mail, Lock, Heart } from 'lucide-react'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false) //Loading
    const router = useRouter()

    //メールログイン処理
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) {
            alert('ログイン失敗' + error.message)
            setLoading(false)
        } else {
            router.push('/')
        }
    }

    //GoogleOAuthログイン処理
    const handleGoogleLogin = async () => {
        setLoading(true)
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                //認証後に戻ってくるURLを指定
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        })

        if (error) {
            alert('googleログインエラー: ' + error.message)
            setLoading(false)
        }
    }

    return (
        // 画面全体を中央寄せにするコンテナ
        <div className="min-h-screen flex items-center justify-center bg-secondary/30 p-4">

            <Card className="w-full max-w-md border-none shadow-lg">
                <CardHeader className="text-center space-y-2">
                    {/* ロゴ代わりのアイコン */}
                    <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit">
                        <Heart className="w-8 h-8 text-primary fill-primary" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">
                        M・O家結婚式へようこそ
                    </h1>
                    <p className="text-sm text-gray-500">
                        思い出を共有して、素敵な結婚式を作りましょう
                    </p>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                メールアドレス
                            </label>
                            <Input
                                type="email"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                icon={<Mail className="w-4 h-4" />}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none">
                                パスワード
                            </label>
                            <Input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                icon={<Lock className="w-4 h-4" />}
                            />
                        </div>

                        <Button type="submit" fullWidth disabled={loading}>
                            {loading ? 'ログイン中...' : 'メールアドレスでログイン'}
                        </Button>
                    </form>

                    {/* 区切り線 */}
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-border" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white px-2 text-gray-500">
                                または
                            </span>
                        </div>
                    </div>

                    <Button
                        variant="outline"
                        fullWidth
                        onClick={handleGoogleLogin}
                        disabled={loading}
                        className="gap-2"
                    >
                        {/* Googleのロゴ（SVG） */}
                        <svg className="w-4 h-4" viewBox="0 0 24 24">
                            <path
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                fill="#4285F4"
                            />
                            <path
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                fill="#34A853"
                            />
                            <path
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                fill="#FBBC05"
                            />
                            <path
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                fill="#EA4335"
                            />
                        </svg>
                        Googleでログイン
                    </Button>
                </CardContent>

                <CardFooter className="justify-center">
                    <p className="text-xs text-gray-500">
                        アカウントをお持ちでないですか？ <a href="#" className="text-primary hover:underline">新規登録</a>
                    </p>
                </CardFooter>
            </Card>
        </div>
    )
}
