'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../utils/supabase/client'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const router = useRouter()

    //ログイン処理
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
        </div>
    )
}
