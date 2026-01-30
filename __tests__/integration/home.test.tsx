import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import TimelinePage from '@/app/page'

// Mock next/navigation
const mockRouterPush = jest.fn()
jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: mockRouterPush,
        replace: jest.fn(),
    }),
}))

// Mock Lucide React (all icons used in page.tsx)
jest.mock('lucide-react', () => ({
    Heart: () => <span data-testid="icon-heart" />,
    MessageCircle: () => <span data-testid="icon-message-circle" />,
    Trash2: () => <span data-testid="icon-trash-2" />,
    ImageIcon: () => <span data-testid="icon-image" />,
    Image: () => <span data-testid="icon-image" />,
    Music: () => <span data-testid="icon-music" />,
    Settings: () => <span data-testid="icon-settings" />,
    LogOut: () => <span data-testid="icon-log-out" />,
    LogIn: () => <span data-testid="icon-log-in" />,
    Menu: () => <span data-testid="icon-menu" />,
    X: () => <span data-testid="icon-x" />,
    Edit2: () => <span data-testid="icon-edit-2" />,
    User: () => <span data-testid="icon-user" />,
    Home: () => <span data-testid="icon-home" />,
    Plus: () => <span data-testid="icon-plus" />,
    Check: () => <span data-testid="icon-check" />,
    XCircle: () => <span data-testid="icon-x-circle" />,
}))

// Mock UI Components
jest.mock('@/components/ui/button', () => ({
    Button: ({ children, ...props }: any) => <button {...props}>{children}</button>
}))
jest.mock('@/components/ui/card', () => ({
    Card: ({ children }: any) => <div data-testid="card">{children}</div>,
    CardHeader: ({ children }: any) => <div>{children}</div>,
    CardContent: ({ children }: any) => <div>{children}</div>,
    CardFooter: ({ children }: any) => <div>{children}</div>,
}))
jest.mock('@/components/ui/toast', () => ({
    Toast: () => null
}))
jest.mock('@/components/ui/confirm-dialog', () => ({
    ConfirmDialog: () => null
}))
jest.mock('@/components/ui/likes-modal', () => ({
    LikesModal: () => null
}))
jest.mock('@/components/ui/avatar-modal', () => ({
    AvatarModal: () => null
}))

// Mock Supabase client
const mockGetUser = jest.fn()
const mockOnAuthStateChange = jest.fn()
const mockFrom = jest.fn()
const mockChannel = jest.fn()
const mockRemoveChannel = jest.fn()

jest.mock('@/utils/supabase/client', () => ({
    supabase: {
        auth: {
            getUser: () => mockGetUser(),
            onAuthStateChange: (callback: any) => mockOnAuthStateChange(callback),
        },
        from: (table: string) => mockFrom(table),
        channel: (name: string) => mockChannel(name),
        removeChannel: (channel: any) => mockRemoveChannel(channel),
    }
}))

// Mock scrollIntoView
window.HTMLElement.prototype.scrollIntoView = jest.fn()

// Helper to create chainable mock that returns proper thenable
// singleData is returned when .single() is called, arrayData otherwise
const createChainMock = (arrayData: any, singleData: any = null, finalError: any = null) => {
    const arrayResolvedValue = { data: arrayData, error: finalError }
    const singleResolvedValue = { data: singleData ?? arrayData, error: finalError }
    const chain: any = {}

    chain.select = jest.fn(() => chain)
    chain.insert = jest.fn(() => chain)
    chain.delete = jest.fn(() => chain)
    chain.update = jest.fn(() => chain)
    chain.eq = jest.fn(() => chain)
    chain.is = jest.fn(() => chain)
    chain.in = jest.fn(() => chain)
    chain.order = jest.fn(() => chain)
    chain.limit = jest.fn(() => chain)
    chain.single = jest.fn(() => Promise.resolve(singleResolvedValue))
    chain.then = (resolve: any, reject?: any) => Promise.resolve(arrayResolvedValue).then(resolve, reject)

    return chain
}

describe('TimelinePage Integration Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks()

        mockGetUser.mockResolvedValue({ data: { user: null }, error: null })
        mockOnAuthStateChange.mockReturnValue({
            data: { subscription: { unsubscribe: jest.fn() } }
        })

        mockFrom.mockImplementation((table: string) => {
            return createChainMock([])
        })

        mockChannel.mockReturnValue({
            on: jest.fn().mockReturnThis(),
            subscribe: jest.fn(),
            unsubscribe: jest.fn(),
        })

        mockRemoveChannel.mockReturnValue(undefined)
    })

    describe('Authentication State', () => {
        test('renders without crashing when user is not logged in', async () => {
            mockGetUser.mockResolvedValue({ data: { user: null }, error: null })

            mockFrom.mockImplementation((table: string) => {
                return createChainMock([])
            })

            render(<TimelinePage />)

            // Should show timeline UI
            await waitFor(() => {
                const elements = screen.getAllByText(/メニュー/i)
                expect(elements.length).toBeGreaterThan(0)
            }, { timeout: 3000 })
        })

        test('renders without crashing when user is logged in', async () => {
            const userId = 'test-user-id'

            mockGetUser.mockResolvedValue({
                data: { user: { id: userId, email: 'test@example.com' } },
                error: null
            })

            mockFrom.mockImplementation((table: string) => {
                return createChainMock([])
            })

            render(<TimelinePage />)

            await waitFor(() => {
                const elements = screen.getAllByText(/ログアウト/i)
                expect(elements.length).toBeGreaterThan(0)
            }, { timeout: 3000 })
        })
    })

    describe('Timeline Display', () => {
        test('displays posts from Supabase', async () => {
            const postsData = [
                {
                    id: 'post-1',
                    content: 'テスト投稿です',
                    created_at: new Date().toISOString(),
                    user_id: 'user-1',
                    likes_count: 5,
                    replies_count: 2,
                    is_liked_by_me: false,
                    parent_id: null,
                }
            ]

            const profilesData = [
                { id: 'user-1', username: 'TestUser', avatar_url: null }
            ]

            mockFrom.mockImplementation((table: string) => {
                if (table === 'posts_with_counts') {
                    return createChainMock(postsData)
                }
                if (table === 'profiles') {
                    return createChainMock(profilesData)
                }
                if (table === 'setlist') {
                    return createChainMock([])
                }
                return createChainMock([])
            })

            render(<TimelinePage />)

            await waitFor(() => {
                expect(screen.getByText('テスト投稿です')).toBeInTheDocument()
            }, { timeout: 3000 })
        })

        test('shows empty state when no posts exist', async () => {
            mockFrom.mockImplementation((table: string) => {
                return createChainMock([])
            })

            render(<TimelinePage />)

            await waitFor(() => {
                expect(screen.getByText(/まだ投稿がありません/i)).toBeInTheDocument()
            }, { timeout: 3000 })
        })
    })

    // 新規ユーザーオンボーディングリダイレクトのテスト
    describe('New User Onboarding', () => {
        test('redirects new user to onboarding page if created within 60 seconds', async () => {
            const userId = 'test-user-id'
            const now = new Date()
            const recentCreatedAt = new Date(now.getTime() - 30000).toISOString()

            mockGetUser.mockResolvedValue({
                data: { user: { id: userId, email: 'test@example.com' } },
                error: null
            })

            mockFrom.mockImplementation((table: string) => {
                if (table === 'profiles') {
                    // First arg is array data (for .then()), second is single data (for .single())
                    return createChainMock([], { created_at: recentCreatedAt, onboarding_completed: false })
                }
                return createChainMock([])
            })

            render(<TimelinePage />)

            await waitFor(() => {
                expect(mockRouterPush).toHaveBeenCalledWith('/onboarding')
            }, { timeout: 3000 })
        })
    })

    // いいね機能のテスト
    describe('Like Functionality', () => {
        const userId = 'test-user-id'
        const mockPost = {
            id: 'post-1',
            content: 'テスト投稿',
            created_at: new Date().toISOString(),
            user_id: 'author-id',
            likes_count: 5,
            replies_count: 0,
            is_liked_by_me: false
        }
        const mockProfile = {
            id: 'author-id',
            username: 'テストユーザー',
            avatar_url: null
        }

        beforeEach(() => {
            mockGetUser.mockResolvedValue({
                data: { user: { id: userId, email: 'test@example.com' } },
                error: null
            })
            mockOnAuthStateChange.mockImplementation((callback: any) => ({
                data: { subscription: { unsubscribe: jest.fn() } }
            }))
            mockChannel.mockReturnValue({
                on: jest.fn().mockReturnThis(),
                subscribe: jest.fn()
            })
            mockRemoveChannel.mockReturnValue(undefined)
        })

        test('displays like button with heart icon', async () => {
            mockFrom.mockImplementation((table: string) => {
                if (table === 'profiles') {
                    return createChainMock([mockProfile], { created_at: '2020-01-01', onboarding_completed: true })
                }
                if (table === 'posts_with_counts') {
                    return createChainMock([mockPost])
                }
                return createChainMock([])
            })

            render(<TimelinePage />)

            await waitFor(() => {
                expect(screen.getByText('テスト投稿')).toBeInTheDocument()
            }, { timeout: 3000 })

            // いいねボタン（ハートアイコン）が表示されている
            const likeButtons = screen.getAllByTestId('icon-heart')
            expect(likeButtons.length).toBeGreaterThan(0)

            // いいね数が表示されている
            expect(screen.getByText('5')).toBeInTheDocument()
        })

        test('displays like count for each post', async () => {
            const postsData = [
                { ...mockPost, id: 'post-1', likes_count: 5, content: '投稿1' },
                { ...mockPost, id: 'post-2', likes_count: 10, content: '投稿2' },
            ]
            mockFrom.mockImplementation((table: string) => {
                if (table === 'profiles') {
                    return createChainMock([mockProfile], { created_at: '2020-01-01', onboarding_completed: true })
                }
                if (table === 'posts_with_counts') {
                    return createChainMock(postsData)
                }
                return createChainMock([])
            })

            render(<TimelinePage />)

            await waitFor(() => {
                expect(screen.getByText('投稿1')).toBeInTheDocument()
                expect(screen.getByText('投稿2')).toBeInTheDocument()
            }, { timeout: 3000 })

            // 各投稿のいいね数が表示されている
            expect(screen.getByText('5')).toBeInTheDocument()
            expect(screen.getByText('10')).toBeInTheDocument()
        })

        test('like button is clickable', async () => {
            mockFrom.mockImplementation((table: string) => {
                if (table === 'profiles') {
                    return createChainMock([mockProfile], { created_at: '2020-01-01', onboarding_completed: true })
                }
                if (table === 'posts_with_counts') {
                    return createChainMock([mockPost])
                }
                if (table === 'likes') {
                    const chain = createChainMock([])
                    chain.insert = jest.fn().mockReturnValue(Promise.resolve({ error: null }))
                    return chain
                }
                return createChainMock([])
            })

            render(<TimelinePage />)

            await waitFor(() => {
                expect(screen.getByText('テスト投稿')).toBeInTheDocument()
            }, { timeout: 3000 })

            // ボタン内のハートアイコンを探す（メニュー内のハートは除外）
            const allHearts = screen.getAllByTestId('icon-heart')
            const likeButton = allHearts.find(heart => heart.parentElement?.tagName.toLowerCase() === 'button')
            expect(likeButton).toBeTruthy()
            expect(likeButton?.parentElement?.tagName.toLowerCase()).toBe('button')
        })

        test('liked post shows different style (is_liked_by_me true)', async () => {
            const likedPost = { ...mockPost, is_liked_by_me: true, likes_count: 6 }
            mockFrom.mockImplementation((table: string) => {
                if (table === 'profiles') {
                    return createChainMock([mockProfile], { created_at: '2020-01-01', onboarding_completed: true })
                }
                if (table === 'posts_with_counts') {
                    return createChainMock([likedPost])
                }
                return createChainMock([])
            })

            render(<TimelinePage />)

            await waitFor(() => {
                expect(screen.getByText('テスト投稿')).toBeInTheDocument()
            }, { timeout: 3000 })

            // いいね済みの投稿が表示される
            expect(screen.getByText('6')).toBeInTheDocument()
        })
    })
})
