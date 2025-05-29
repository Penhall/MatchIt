
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
  const [isSignUp, setIsSignUp] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock login/signup logic
    console.log(`${isSignUp ? 'Signing up' : 'Logging in'} with:`, email, password);
    login(); // Set authenticated state
    navigate(APP_ROUTES.PROFILE);
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
          <SparklesIcon className="w-16 h-16 mx-auto text-neon-blue mb-2" />
          <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-neon-blue to-neon-green">
            {t('login.title')}
          </h1>
          <p className="mt-2 text-gray-400">{t('login.subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 p-6 bg-dark-card/70 backdrop-blur-sm rounded-xl shadow-lg border border-neon-blue/20">
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
          <Button type="submit" variant="primary" size="lg" className="w-full" glowEffect="blue">
            {isSignUp ? t('login.signUp') : t('login.logIn')}
          </Button>
        </form>

        <div className="text-center">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-sm text-neon-blue hover:text-neon-green hover:underline"
          >
            {isSignUp ? t('login.alreadyHaveAccount') : t('login.noAccount')}
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
          <Button variant="outline" glowEffect="blue" className="w-full flex items-center justify-center">
            <GoogleIcon className="mr-2" /> Google
          </Button>
          <Button variant="outline" glowEffect="green" className="w-full flex items-center justify-center">
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
