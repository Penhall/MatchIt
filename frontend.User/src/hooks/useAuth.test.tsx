import { renderHook, act } from '@testing-library/react'
import { useAuth } from './useAuth'

// Mock do AuthContext
const mockAuthContext = {
  user: null,
  isAuthenticated: false,
  login: vi.fn(),
  logout: vi.fn(),
  isLoading: false
}

vi.mock('./useAuth', () => ({
  useAuth: () => mockAuthContext
}))

describe('useAuth Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('returns initial state when not authenticated', () => {
    const { result } = renderHook(() => useAuth())
    
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.user).toBeNull()
    expect(result.current.isLoading).toBe(false)
  })

  test('login function can be called', async () => {
    const { result } = renderHook(() => useAuth())
    
    await act(async () => {
      await result.current.login('test@example.com', 'password')
    })
    
    expect(mockAuthContext.login).toHaveBeenCalledWith('test@example.com', 'password')
  })

  test('logout function can be called', async () => {
    const { result } = renderHook(() => useAuth())
    
    await act(async () => {
      await result.current.logout()
    })
    
    expect(mockAuthContext.logout).toHaveBeenCalled()
  })
})