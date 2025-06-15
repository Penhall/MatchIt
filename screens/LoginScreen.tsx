import React, { useState } from 'react';
import FloatingLabelInput from '../components/common/FloatingLabelInput';
import BrandHeader from '../components/common/BrandHeader';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { APP_ROUTES } from '../constants';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate(APP_ROUTES.PROFILE);
    } catch (err) {
      setError('Login failed. Please try again.');
    }
  };

  const handleSocialLogin = (provider: string) => {
    // Implementar lógica de login social
    console.log(`Login with ${provider}`);
  };

  return (
    <div className="min-h-screen bg-dark-bg text-white flex flex-col">
      <BrandHeader />

      {/* Área principal */}
      <main className="flex-grow flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-dark-card rounded-lg p-8 shadow-glow-blue">
          <h1 className="text-2xl font-bold mb-6 text-center text-neon-green">Login</h1>
          
          {error && <p className="text-red-500 mb-4">{error}</p>}

          {/* Botões de login social */}
          <div className="flex flex-col space-y-4 mb-6">
            <button 
              onClick={() => handleSocialLogin('google')}
              className="flex items-center justify-center bg-white text-gray-800 px-4 py-2 rounded hover:bg-gray-100"
            >
              <span className="mr-2">G</span>
              Continuar com Google
            </button>
            <button 
              onClick={() => handleSocialLogin('apple')}
              className="flex items-center justify-center bg-black text-white px-4 py-2 rounded hover:bg-gray-900"
            >
              <span className="mr-2">A</span>
              Continuar com Apple
            </button>
          </div>

          <div className="flex items-center my-6">
            <div className="flex-grow border-t border-gray-700"></div>
            <span className="mx-4 text-gray-400">ou</span>
            <div className="flex-grow border-t border-gray-700"></div>
          </div>

          {/* Formulário tradicional */}
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <FloatingLabelInput
                label="Email"
                value={email}
                onChange={setEmail}
                type="email"
                required
                darkMode
              />
            </div>

            <div className="mb-6">
              <FloatingLabelInput
                label="Password"
                value={password}
                onChange={setPassword}
                type="password"
                required
                darkMode
              />
            </div>

            <button 
              type="submit" 
              className="w-full bg-neon-blue text-dark-bg px-4 py-2 rounded font-bold hover:bg-opacity-90 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      </main>

      {/* Barra de navegação inferior */}
      <footer className="bg-dark-card py-4 px-6 flex justify-around">
        <button className="text-neon-green">Cadastre-se</button>
        <button className="text-neon-blue">Esqueci a senha</button>
      </footer>
    </div>
  );
};

export default LoginScreen;
