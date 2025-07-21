import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import LoginScreen from './LoginScreen'

// Mock do useAuth hook
const mockLogin = vi.fn()
const mockRegister = vi.fn()
vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    login: mockLogin,
    register: mockRegister,
    isLoggingIn: false,
    isRegistering: false,
    error: null,
    setError: vi.fn()
  })
}))

// Mock do react-router-dom
const mockNavigate = vi.fn()
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate
}))

// Mock do react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key
  })
}))

// Mock do constants
vi.mock('../constants', () => ({
  APP_ROUTES: {
    PROFILE: '/profile'
  }
}))

// Mock do Icon component
vi.mock('../components/common/Icon', () => ({
  SparklesIcon: ({ className }: { className: string }) => <div className={className}>Icon</div>
}))

describe('LoginScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('renders login screen', () => {
    render(<LoginScreen />)
    
    expect(screen.getByText('login.title')).toBeInTheDocument()
    expect(screen.getByText('login.subtitle')).toBeInTheDocument()
  })

  test('can toggle between login and signup', () => {
    render(<LoginScreen />)
    
    const toggleButton = screen.getByText(/login.signUpLink/i)
    fireEvent.click(toggleButton)
    
    expect(screen.getByDisplayValue('')).toBeInTheDocument() // confirm password field should appear
  })

  test('handles form submission', async () => {
    render(<LoginScreen />)
    
    const emailInput = screen.getByDisplayValue('')
    const passwordInput = screen.getAllByDisplayValue('')[1] // second empty input is password
    const submitButton = screen.getByText(/login.signIn/i)
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123')
    })
  })
})