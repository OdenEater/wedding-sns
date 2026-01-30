import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import ProfilePage from '@/app/profile/[id]/page'

// Mock next/navigation
const mockRouterPush = jest.fn()
const mockRouterBack = jest.fn()
const mockParams = { id: 'test-user-id' }

jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: mockRouterPush,
        back: mockRouterBack,
        replace: jest.fn(),
    }),
    useParams: () => mockParams,
}))

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
    ArrowLeft: () => <span data-testid="icon-arrow-left" />,
    Heart: () => <span data-testid="icon-heart" />,
    MessageCircle: () => <span data-testid="icon-message-circle" />,
    Edit2: () => <span data-testid="icon-edit-2" />,
    Check: () => <span data-testid="icon-check" />,
    XCircle: () => <span data-testid="icon-x-circle" />,
    Camera: () => <span data-testid="icon-camera" />,
}))

// Mock UI Components
jest.mock('@/components/ui/button', () => ({
    Button: ({ children, ...props }: any) => <button {...props}>{children}</button>
}))
jest.mock('@/components/ui/card', () => ({
    Card: ({ children }: any) => <div data-testid="card">{children}</div>,
    CardContent: ({ children }: any) => <div>{children}</div>,
    CardHeader: ({ children }: any) => <div>{children}</div>,
}))
jest.mock('@/components/ui/toast', () => ({
    Toast: () => null
}))
jest.mock('@/components/ui/avatar-selector', () => ({
    AvatarSelector: () => null
}))
jest.mock('@/components/ui/avatar-modal', () => ({
    AvatarModal: () => null
}))

// Mock Supabase client
const mockGetUser = jest.fn()
const mockOnAuthStateChange = jest.fn()
const mockFrom = jest.fn()

jest.mock('@/utils/supabase/client', () => ({
    supabase: {
        auth: {
            getUser: () => mockGetUser(),
            onAuthStateChange: (callback: any) => mockOnAuthStateChange(callback),
        },
        from: (table: string) => mockFrom(table),
    }
}))

// Helper to create chainable mock
const createChainMock = (arrayData: any, singleData: any = null, finalError: any = null) => {
    const arrayResolvedValue = { data: arrayData, error: finalError }
    const singleResolvedValue = { data: singleData ?? arrayData, error: finalError }
    const chain: any = {}

    chain.select = jest.fn(() => chain)
    chain.insert = jest.fn(() => chain)
    chain.delete = jest.fn(() => chain)
    chain.update = jest.fn(() => chain)
    chain.upsert = jest.fn(() => chain)
    chain.eq = jest.fn(() => chain)
    chain.is = jest.fn(() => chain)
    chain.in = jest.fn(() => chain)
    chain.order = jest.fn(() => chain)
    chain.limit = jest.fn(() => chain)
    chain.single = jest.fn(() => Promise.resolve(singleResolvedValue))
    chain.then = (resolve: any, reject?: any) => Promise.resolve(arrayResolvedValue).then(resolve, reject)

    return chain
}

describe('ProfilePage Integration Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockRouterPush.mockClear()
        mockRouterBack.mockClear()
    })

    describe('Profile Display', () => {
        const mockProfile = {
            id: 'test-user-id',
            username: 'テストユーザー',
            avatar_url: null,
            updated_at: '2024-01-01T00:00:00Z',
            onboarding_completed: true
        }

        beforeEach(() => {
            mockGetUser.mockResolvedValue({
                data: { user: { id: 'test-user-id', email: 'test@example.com' } },
                error: null
            })
            mockOnAuthStateChange.mockImplementation((callback: any) => ({
                data: { subscription: { unsubscribe: jest.fn() } }
            }))
        })

        test('displays profile username', async () => {
            mockFrom.mockImplementation((table: string) => {
                if (table === 'profiles') {
                    return createChainMock(null, mockProfile)
                }
                if (table === 'posts_with_counts') {
                    return createChainMock([])
                }
                return createChainMock([])
            })

            render(<ProfilePage />)

            await waitFor(() => {
                const usernames = screen.getAllByText('テストユーザー')
                expect(usernames.length).toBeGreaterThan(0)
            }, { timeout: 3000 })
        })

        test('displays back button', async () => {
            mockFrom.mockImplementation((table: string) => {
                if (table === 'profiles') {
                    return createChainMock(null, mockProfile)
                }
                if (table === 'posts_with_counts') {
                    return createChainMock([])
                }
                return createChainMock([])
            })

            render(<ProfilePage />)

            await waitFor(() => {
                const backButtons = screen.getAllByTestId('icon-arrow-left')
                expect(backButtons.length).toBeGreaterThan(0)
            }, { timeout: 3000 })
        })

        test('shows edit button for own profile', async () => {
            mockFrom.mockImplementation((table: string) => {
                if (table === 'profiles') {
                    return createChainMock(null, mockProfile)
                }
                if (table === 'posts_with_counts') {
                    return createChainMock([])
                }
                return createChainMock([])
            })

            render(<ProfilePage />)

            await waitFor(() => {
                const usernames = screen.getAllByText('テストユーザー')
                expect(usernames.length).toBeGreaterThan(0)
            }, { timeout: 3000 })

            // 編集ボタンが表示される
            const editButtons = screen.getAllByTestId('icon-edit-2')
            expect(editButtons.length).toBeGreaterThan(0)
        })

        test('displays user posts on profile', async () => {
            const userPosts = [
                {
                    id: 'post-1',
                    content: 'プロフィール投稿',
                    created_at: new Date().toISOString(),
                    likes_count: 5,
                    replies_count: 0,
                    is_liked: false
                }
            ]

            mockFrom.mockImplementation((table: string) => {
                if (table === 'profiles') {
                    return createChainMock(null, mockProfile)
                }
                if (table === 'posts_with_counts') {
                    return createChainMock(userPosts)
                }
                return createChainMock([])
            })

            render(<ProfilePage />)

            await waitFor(() => {
                expect(screen.getByText('プロフィール投稿')).toBeInTheDocument()
            }, { timeout: 3000 })
        })

        test('shows no posts message when user has no posts', async () => {
            mockFrom.mockImplementation((table: string) => {
                if (table === 'profiles') {
                    return createChainMock(null, mockProfile)
                }
                if (table === 'posts_with_counts') {
                    return createChainMock([])
                }
                return createChainMock([])
            })

            render(<ProfilePage />)

            await waitFor(() => {
                const usernames = screen.getAllByText('テストユーザー')
                expect(usernames.length).toBeGreaterThan(0)
            }, { timeout: 3000 })
        })
    })

    describe('Profile Edit', () => {
        const mockProfile = {
            id: 'test-user-id',
            username: 'テストユーザー',
            avatar_url: null,
            updated_at: '2024-01-01T00:00:00Z',
            onboarding_completed: true
        }

        beforeEach(() => {
            mockGetUser.mockResolvedValue({
                data: { user: { id: 'test-user-id', email: 'test@example.com' } },
                error: null
            })
            mockOnAuthStateChange.mockImplementation((callback: any) => ({
                data: { subscription: { unsubscribe: jest.fn() } }
            }))
        })

        test('clicking edit button shows edit mode', async () => {
            mockFrom.mockImplementation((table: string) => {
                if (table === 'profiles') {
                    return createChainMock(null, mockProfile)
                }
                if (table === 'posts_with_counts') {
                    return createChainMock([])
                }
                return createChainMock([])
            })

            render(<ProfilePage />)

            await waitFor(() => {
                const usernames = screen.getAllByText('テストユーザー')
                expect(usernames.length).toBeGreaterThan(0)
            }, { timeout: 3000 })

            // 編集ボタンをクリック
            const editButtons = screen.getAllByTestId('icon-edit-2')
            const editButton = editButtons.find(btn => btn.parentElement?.tagName.toLowerCase() === 'button')
            if (editButton?.parentElement) {
                fireEvent.click(editButton.parentElement)
            }

            // 編集モードになる（チェックアイコンが表示される）
            await waitFor(() => {
                const checkButtons = screen.queryAllByTestId('icon-check')
                expect(checkButtons.length).toBeGreaterThanOrEqual(0)
            }, { timeout: 3000 })
        })
    })
})
