import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
// IMPORTS ATUALIZADOS - usando aliases configurados
import LoadingSpinner from '../src/components/common/LoadingSpinner'; // Caminho relativo
import Button from '../src/components/common/Button'; // Caminho relativo
import FloatingLabelInput from '../src/components/common/FloatingLabelInput'; // Caminho relativo
import { GoogleIcon, AppleIcon, SparklesIcon } from '../src/components/common/Icon'; // Caminho relativo
import { APP_ROUTES } from '../constants';
import { useAuth } from '../src/context/AuthContext'; // Caminho relativo

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
      setError(t('login.authError'));
    }
  };

  return (
    <div className="min-h-full flex flex-col justify-center items-center p-4 sm:p-6 bg-dark-bg text-gray-200 relative overflow-hidden" 
         style={{ width: '100%', maxWidth: '420px', margin: '1rem auto' }}>
      
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
      
      <div className="relative z-10 w-full space-y-6 sm:space-y-8 animate-fadeIn" 
           style={{ padding: '1rem', maxWidth: '90%' }}>
        
        {/* Header */}
        <div className="text-center">
          <SparklesIcon className="w-16 h-16 mx-auto text-neon-blue mb-2" />
          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-neon-blue to-neon-green">
            {t('login.title')}
          </h1>
          <p className="mt-2 text-gray-300 text-xs sm:text-sm">{t('login.subtitle')}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8 p-4 sm:p-6 bg-dark-card/70 backdrop-blur-sm rounded-xl shadow-lg border border-neon-blue/20">
          
          <FloatingLabelInput
            label={t('login.email')}
            type="email"
            value={email}
            onChange={setEmail}
            required
          />
          
          <FloatingLabelInput
            label={t('login.password')}
            type="password"
            value={password}
            onChange={setPassword}
            required
          />
          
          {isSignUp && (
            <FloatingLabelInput
              label={t('login.confirmPassword')}
              type="password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              required
            />
          )}
          
          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            glowEffect="blue"
            disabled={isLoggingIn || isRegistering}
          >
            {(isLoggingIn || isRegistering) ? (
              <span className="flex items-center justify-center">
                <LoadingSpinner className="mr-2" />
                {isSignUp ? t('login.signingUp') : t('login.loggingIn')}
              </span>
            ) : (
              isSignUp ? t('login.signUp') : t('login.logIn')
            )}
          </Button>
          
          {/* Error Display */}
          {error && (
            <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm text-center animate-fadeIn">
              {error}
            </div>
          )}
        </form>

        {/* Toggle Sign Up/Login */}
        <div className="text-center">
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-sm text-neon-blue hover:text-neon-green hover:underline transition-colors"
          >
            {isSignUp ? t('login.alreadyHaveAccount') : t('login.noAccount')}
          </button>
        </div>

        {/* Social Login */}
        <div className="space-y-3">
          <p className="text-center text-sm text-gray-400">{t('login.continueWith')}</p>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" size="md" className="flex items-center justify-center">
              <GoogleIcon className="w-5 h-5 mr-2" />
              Google
            </Button>
            <Button variant="outline" size="md" className="flex items-center justify-center">
              <AppleIcon className="w-5 h-5 mr-2" />
              Apple
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
