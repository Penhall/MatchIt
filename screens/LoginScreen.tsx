// screens/LoginScreen.tsx - Corrigido (linha problemática removida)
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Button from '../components/common/Button';
import FloatingLabelInput from '../components/common/FloatingLabelInput';
import { APP_ROUTES } from '../constants';
import { useAuth } from '../context/AuthContext';
import { GoogleIcon, AppleIcon, SparklesIcon } from '../components/common/Icon';

const LoginScreen: React.FC = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { login, register, loading, error } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    setIsSubmitting(true);

    try {
      if (isSignUp) {
        // Validações básicas para cadastro
        if (password !== confirmPassword) {
          alert("As senhas não coincidem!");
          return;
        }
        
        if (password.length < 6) {
          alert("A senha deve ter pelo menos 6 caracteres!");
          return;
        }
        
        if (!name.trim()) {
          alert("Nome é obrigatório!");
          return;
        }

        console.log('Cadastrando usuário:', { email, name });
        await register(email, password, name);
      } else {
        console.log('Fazendo login:', { email });
        await login(email, password);
      }
      
      // Navegar para a tela principal após login/cadastro bem-sucedido
      navigate(APP_ROUTES.PROFILE);
      
    } catch (err) {
      console.error('Erro no login/cadastro:', err);
      // O erro já é tratado no AuthContext
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickLogin = async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      // Login rápido sem credenciais (modo desenvolvimento)
      await login();
      navigate(APP_ROUTES.PROFILE);
    } catch (err) {
      console.error('Erro no login rápido:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-full flex flex-col justify-center items-center p-4 sm:p-6 bg-dark-bg text-gray-200 relative overflow-hidden">
      {/* Background holographic/grid effect */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#00ffff" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>
      
      <div className="relative z-10 w-full max-w-md space-y-8 animate-fadeIn">
        <div className="text-center">
          <SparklesIcon 
            className="w-16 h-16 mx-auto mb-2"
            style={{ color: '#00f0ff' }}
          />
          <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-neon-blue to-neon-green">
            {t('login.title')}
          </h1>
          <p className="mt-2 text-gray-400">{t('login.subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 p-6 bg-dark-card/70 backdrop-blur-sm rounded-xl shadow-lg border border-neon-blue/20">
          {/* Campo Nome - apenas no cadastro */}
          {isSignUp && (
            <FloatingLabelInput
              id="name"
              label="Nome Completo"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required={isSignUp}
            />
          )}
          
          <FloatingLabelInput
            id="email"
            label={t('login.email')}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          
          <FloatingLabelInput
            id="password"
            label={t('login.password')}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          
          {isSignUp && (
            <FloatingLabelInput
              id="confirm-password"
              label={t('login.confirmPassword')}
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          )}

          {/* Mostrar erro se houver */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <Button 
            type="submit" 
            variant="primary" 
            size="lg" 
            className="w-full" 
            glowEffect="blue"
            disabled={isSubmitting || loading}
          >
            {isSubmitting || loading ? 'Carregando...' : (isSignUp ? t('login.signUp') : t('login.logIn'))}
          </Button>
        </form>

        <div className="text-center">
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              // ✅ REMOVIDO: setError(null); - Esta linha causava o erro!
              // Limpar campos ao alternar
              setEmail('');
              setPassword('');
              setConfirmPassword('');
              setName('');
            }}
            className="text-sm text-neon-blue hover:text-neon-green hover:underline"
            disabled={isSubmitting}
          >
            {isSignUp ? t('login.alreadyHaveAccount') : t('login.noAccount')}
          </button>
        </div>

        {/* Botão de login rápido para desenvolvimento */}
        <div className="text-center">
          <button
            onClick={handleQuickLogin}
            className="text-xs text-gray-500 hover:text-neon-orange underline"
            disabled={isSubmitting}
          >
            Login Rápido (Desenvolvimento)
          </button>
        </div>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-gray-600/50" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-dark-card text-gray-400 rounded-md">{t('login.continueWith')}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Button 
            variant="outline" 
            glowEffect="blue" 
            className="w-full flex items-center justify-center"
            disabled={isSubmitting}
            onClick={() => alert('Login com Google em desenvolvimento')}
          >
            <GoogleIcon className="mr-2" /> Google
          </Button>
          <Button 
            variant="outline" 
            glowEffect="green" 
            className="w-full flex items-center justify-center"
            disabled={isSubmitting}
            onClick={() => alert('Login com Apple em desenvolvimento')}
          >
            <AppleIcon className="mr-2" /> Apple
          </Button>
        </div>
      </div>
      
      {/* Subtle glowing orb effects */}
      <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-neon-blue/10 rounded-full blur-2xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-32 h-32 bg-neon-green/10 rounded-full blur-2xl animate-pulse animation-delay-2000"></div>
    </div>
  );
};

export default LoginScreen;