'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../utils/supabase/client'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const router = useRouter()

    //メールログイン処理
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) {
            alert('ログイン失敗' + error.message)
        } else {
            alert('ログイン成功')
            router.push('/')
        }
    }

    //GoogleOAuthログイン処理
    const handleGoogleLogin = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                //認証後に戻ってくるURLを指定
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        })

        if (error) {
            alert('googleログインエラー: ' + error.message)
        }
    }

    return (
        <div>
            <h1>ログイン画面1</h1>
            {/* onsubmit:　送信ボタンを押した際にhandleLoginが呼ばれる */}
            <form onSubmit={handleLogin}>
                <div>
                    <label>メールアドレス: </label>
                    {/* value={email}: 画面の表示をstateの値と同期させる */}
                    {/* onChange: 入力されるたびにstateを更新する */}
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>

                <div>
                    <label>パスワード: </label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>

                <button type="submit">ログイン</button>

            </form>

            {/* 区切り線 */}
            <div style={{ margin: '20px 0', textAlign: 'center', borderBottom: '1px solid #ccc', lineHeight: '0.1em' }}>
                <span style={{ background: '#fff', padding: '0 10px', color: '#666' }}>または</span>
            </div>

            <button onClick={handleGoogleLogin}>Googleでログイン</button>
        </div>
    )
}
