import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock Supabase to prevent "supabaseUrl is required" errors during smoke tests
vi.mock('../supabaseClient', () => ({
    supabase: {
        auth: {
            onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
            getUser: vi.fn(async () => ({ data: { user: null } })),
        },
        schema: vi.fn(() => ({
            from: vi.fn(() => ({
                select: vi.fn(() => ({
                    order: vi.fn(() => ({})),
                    eq: vi.fn(() => ({})),
                })),
                insert: vi.fn(() => ({})),
            })),
        })),
    },
    core: {},
    task: {},
    finance: {},
    audit: {},
    publicDb: {},
}))
