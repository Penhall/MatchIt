import React, { useState } from 'react';
import FloatingLabelInput from '../components/common/FloatingLabelInput';
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

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-center">Login</h1>
      
      {error && <p className="text-red-500 mb-4">{error}</p>}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <FloatingLabelInput
            label="Email"
            value={email}
            onChange={setEmail}
            type="email"
            required
          />
        </div>

        <div className="mb-6">
          <FloatingLabelInput
            label="Password"
            value={password}
            onChange={setPassword}
            type="password"
            required
          />
        </div>

        <button 
          type="submit" 
          className="w-full bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
};

export default LoginScreen;
