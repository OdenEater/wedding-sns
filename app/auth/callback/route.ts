import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    //プロバイダからのリクエストを解析してURLからcodeとorigin(プロトコル+ドメイン+ポート)を取得する。
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const origin = requestUrl.origin

    //認可コードが存在する場合のみcodeとJWTを交換する(JWTはクライアントのブラウザで保持してもらう)
    //ステートレス通信のため、動作の度に認可の確認を行う必要。
    if (code) {
        const cookieStore = await cookies()

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll()
                    },
                    setAll(cookiesToSet) {
                        try {
                            cookiesToSet.forEach(({ name, value, options }) =>
                                cookieStore.set(name, value, options)
                            )
                        } catch {

                        }
                    }
                }
            }
        )
        await supabase.auth.exchangeCodeForSession(code)
    }
    return NextResponse.redirect(origin)
}