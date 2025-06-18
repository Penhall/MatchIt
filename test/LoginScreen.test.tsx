import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginScreen from '../screens/LoginScreen';
import { AuthContext } from '../src/context/AuthContext.tsx';
import { BrowserRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '../src/i18n';

// Mock do contexto de autenticação
const mockAuthContextValue = {
  login: jest.fn(),
  register: jest.fn(),
  isLoggingIn: false,
  isRegistering: false,
  error: null,
  setError: jest.fn(),
};

interface RenderWithContextProps {
  children: React.ReactNode;
}

const renderWithContext = (ui: React.ReactElement) => {
  return render(
    <I18nextProvider i18n={i18n}>
      <BrowserRouter>
        <AuthContext.Provider value={mockAuthContextValue}>
          {ui}
        </AuthContext.Provider>
      </BrowserRouter>
    </I18nextProvider>
  );
};

describe('LoginScreen', () => {
  beforeEach(() => {
    mockAuthContextValue.login.mockClear();
    mockAuthContextValue.register.mockClear();
    mockAuthContextValue.setError.mockClear();
  });

  it('deve renderizar os campos de email e senha', () => {
    renderWithContext(<LoginScreen />);
    expect(screen.getByLabelText('login.email')).toBeInTheDocument();
    expect(screen.getByLabelText('login.password')).toBeInTheDocument();
  });

  it('deve permitir a digitação nos campos de email e senha', async () => {
    renderWithContext(<LoginScreen />);
    const emailInput = screen.getByLabelText('login.email');
    const passwordInput = screen.getByLabelText('login.password');

    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'password123');

    expect((emailInput as HTMLInputElement).value).toBe('test@example.com');
    expect((passwordInput as HTMLInputElement).value).toBe('password123');
  });

  it('deve chamar a função de login com os valores corretos ao enviar o formulário', async () => {
    renderWithContext(<LoginScreen />);
    const emailInput = screen.getByLabelText('login.email');
    const passwordInput = screen.getByLabelText('login.password');
    const loginButton = screen.getByRole('button', { name: 'login.logIn' });

    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'password123');
    fireEvent.click(loginButton);

    expect(mockAuthContextValue.login).toHaveBeenCalledTimes(1);
    expect(mockAuthContextValue.login).toHaveBeenCalledWith('test@example.com', 'password123');
  });

  it('deve exibir uma mensagem de erro se as senhas não coincidirem no modo de registro', async () => {
    renderWithContext(<LoginScreen />);
    const signUpButton = screen.getByText('login.noAccount');
    fireEvent.click(signUpButton);

    const confirmPasswordInput = screen.getByLabelText('login.confirmPassword');
    const passwordInput = screen.getByLabelText('login.password');
    const registerButton = screen.getByRole('button', { name: 'login.signUp' });

    await userEvent.type(passwordInput, 'password123');
    await userEvent.type(confirmPasswordInput, 'differentPassword');
    fireEvent.click(registerButton);

    expect(mockAuthContextValue.setError).toHaveBeenCalledWith('login.passwordsDontMatch');
  });

  it('deve chamar a função de registro com os valores corretos ao enviar o formulário no modo de registro', async () => {
    renderWithContext(<LoginScreen />);
    const signUpButton = screen.getByText('login.noAccount');
    fireEvent.click(signUpButton);

    const emailInput = screen.getByLabelText('login.email');
    const passwordInput = screen.getByLabelText('login.password');
    const confirmPasswordInput = screen.getByLabelText('login.confirmPassword');
    const registerButton = screen.getByRole('button', { name: 'login.signUp' });

    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'password123');
    await userEvent.type(confirmPasswordInput, 'password123');
    fireEvent.click(registerButton);

    expect(mockAuthContextValue.register).toHaveBeenCalledTimes(1);
    expect(mockAuthContextValue.register).toHaveBeenCalledWith('test@example.com', 'password123', 'test');
  });

  it('deve exibir uma mensagem de erro ao falhar a autenticação', async () => {
    mockAuthContextValue.login.mockRejectedValue(new Error('Authentication failed'));
    renderWithContext(<LoginScreen />);
    const emailInput = screen.getByLabelText('login.email');
    const passwordInput = screen.getByLabelText('login.password');
    const loginButton = screen.getByRole('button', { name: 'login.logIn' });

    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'password123');
    fireEvent.click(loginButton);

    // Aguarda a mensagem de erro ser exibida
    await screen.findByText('login.authError');
    expect(screen.getByText('login.authError')).toBeInTheDocument();
  });
});
