import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Button from '../components/common/Button';
import { APP_ROUTES } from '../constants';
import { useAuth } from '../hooks/useAuth';
import { SparklesIcon } from '../components/common/Icon';

const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const navigate = useNavigate();
  const { login, register, isLoggingIn, isRegistering, error, setError } = useAuth();
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (isSignUp && password !== confirmPassword) {
      setError(t('login.passwordsDontMatch'));
      return;
    }

    try {
      if (isSignUp) {
        await register(email, password, email.split('@')[0]);
      } else {
        await login(email, password);
      }
      navigate(APP_ROUTES.PROFILE);
    } catch (err) {
      console.error('Auth error:', err);
    }
  };

  const isLoading = isLoggingIn || isRegistering;

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-bg text-gray-200 p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <SparklesIcon className="w-16 h-16 mx-auto text-neon-blue mb-4 animate-pulseGlow" />
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-neon-blue to-neon-green">
            {t('login.title')}
          </h1>
          <p className="text-gray-400 mt-2">{t('login.subtitle')}</p>
        </div>

        {/* Form */}
        <div className="bg-dark-card rounded-2xl p-8 border border-neon-blue/30 shadow-glow-blue">
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <input
                type="email"
                placeholder={t('login.email')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-dark-bg border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-neon-blue focus:border-transparent"
                required
                disabled={isLoading}
              />
            </div>
            
            <div>
              <input
                type="password"
                placeholder={t('login.password')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-dark-bg border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-neon-blue focus:border-transparent"
                required
                disabled={isLoading}
              />
            </div>

            {isSignUp && (
              <div>
                <input
                  type="password"
                  placeholder="Confirmar Senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-dark-bg border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-neon-blue focus:border-transparent"
                  required
                  disabled={isLoading}
                />
              </div>
            )}

            <Button 
              type="submit" 
              variant="primary" 
              size="lg" 
              className="w-full" 
              glowEffect="blue"
              disabled={isLoading}
            >
              {isLoading ? t('common.loading') : (isSignUp ? t('login.signUp') : t('login.signIn'))}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-neon-blue hover:text-neon-green transition-colors"
              disabled={isLoading}
            >
              {isSignUp ? t('login.alreadyHaveAccount') : t('login.noAccount')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
