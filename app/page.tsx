'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Heart, MessageCircle, LogOut, Send, Image as ImageIcon, Home } from 'lucide-react'

// ダミーデータ (変更なし)
const DUMMY_POSTS = [
  {
    id: '1',
    user: { name: 'FM', avatar: '👰' },
    content: '来てくれてありがとう',
    likes: 12,
    isLiked: true,
    createdAt: '2時間前'
  },
  {
    id: '2',
    user: { name: 'KM', avatar: '🤵' },
    content: '来てくれてありがとう',
    likes: 5,
    isLiked: false,
    createdAt: '5時間前'
  },
]

export default function TimelinePage() {
  const [content, setContent] = useState('')
  const [activeTab, setActiveTab] = useState<'timeline' | 'gallery'>('timeline')

  // サイドバーのナビゲーション項目
  const NavItem = ({ id, icon: Icon, label }: { id: 'timeline' | 'gallery', icon: any, label: string }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-4 px-4 py-3 w-full rounded-full transition-colors text-lg font-medium
        ${activeTab === id 
          ? 'text-primary bg-primary/10' 
          : 'text-gray-600 hover:bg-secondary'
        }`}
    >
      <Icon className={`w-7 h-7 ${activeTab === id ? 'fill-primary' : ''}`} />
      {label}
    </button>
  )

  return (
    <div className="min-h-screen bg-secondary/30">
      
      {/* スマホ用ヘッダー (md以上で非表示) */}
      <header className="md:hidden sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-border shadow-sm">
        <div className="container px-4 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold text-primary flex items-center gap-2">
            <Heart className="w-6 h-6 fill-primary" />
            Wedding SNS
          </h1>
          <Button variant="ghost" size="sm">
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <div className="container max-w-6xl mx-auto flex gap-8">
        
        {/* PC用サイドバー (md未満で非表示) */}
        <aside className="hidden md:flex flex-col w-64 sticky top-0 h-screen py-8 pl-4 border-r border-border/50">
          <div className="mb-8 px-4">
            <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
              <Heart className="w-8 h-8 fill-primary" />
              Wedding SNS
            </h1>
          </div>

          <nav className="flex-1 space-y-2">
            <NavItem id="timeline" icon={Home} label="タイムライン" />
            <NavItem id="gallery" icon={ImageIcon} label="ギャラリー" />
          </nav>

          <div className="px-4 mt-auto">
            <Button variant="ghost" fullWidth className="justify-start gap-4 text-gray-600 hover:text-red-500 hover:bg-red-50">
              <LogOut className="w-6 h-6" />
              <span className="text-lg">ログアウト</span>
            </Button>
          </div>
        </aside>

        {/* メインコンテンツエリア */}
        <main className="flex-1 max-w-2xl py-6 px-4 md:px-0 mx-auto md:mx-0">
          
          {activeTab === 'timeline' ? (
            <div className="space-y-6">
              {/* 投稿フォーム */}
              <Card className="border-none shadow-md overflow-hidden">
                <CardContent className="pt-6">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-xl">
                      👤
                    </div>
                    <div className="flex-1">
                      <textarea
                        className="w-full min-h-[100px] resize-none border-none focus:ring-0 text-base placeholder:text-gray-400 bg-transparent outline-none"
                        placeholder="幸せな瞬間をシェアしよう..."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="bg-secondary/50 flex justify-between items-center py-3 px-6">
                  <span className={`text-xs ${content.length > 140 ? 'text-red-500 font-bold' : 'text-gray-500'}`}>
                    {content.length} / 140
                  </span>
                  <Button disabled={content.length === 0 || content.length > 140} className="rounded-full px-6">
                    <Send className="w-4 h-4 mr-2" />
                    投稿する
                  </Button>
                </CardFooter>
              </Card>

              {/* タイムライン */}
              <div className="space-y-4">
                {DUMMY_POSTS.map((post) => (
                  <Card key={post.id} className="border-none shadow-sm hover:shadow-md transition-shadow duration-200">
                    <CardHeader className="flex flex-row items-start gap-4 pb-2">
                      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-xl shadow-inner">
                        {post.user.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-bold text-foreground truncate">
                            {post.user.name}
                          </p>
                          <span className="text-xs text-gray-400">{post.createdAt}</span>
                        </div>
                        <p className="text-sm text-gray-500">@{post.id}user</p>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pb-2 pl-[4.5rem]">
                      <p className="text-base leading-relaxed whitespace-pre-wrap text-foreground/90">
                        {post.content}
                      </p>
                    </CardContent>

                    <CardFooter className="pl-[4.5rem] pt-2 pb-4 flex gap-6">
                      <button className={`flex items-center gap-1.5 text-sm transition-colors ${post.isLiked ? 'text-pink-500' : 'text-gray-400 hover:text-pink-500'}`}>
                        <Heart className={`w-5 h-5 ${post.isLiked ? 'fill-pink-500' : ''}`} />
                        <span>{post.likes}</span>
                      </button>
                      
                      <button className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-primary transition-colors">
                        <MessageCircle className="w-5 h-5" />
                        <span>返信</span>
                      </button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            /* ギャラリータブ (仮) */
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center text-gray-400">
                  <ImageIcon className="w-8 h-8" />
                </div>
              ))}
            </div>
          )}

        </main>
      </div>
    </div>
  )
}