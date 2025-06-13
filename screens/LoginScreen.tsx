import React, { useState } from 'react';
import FloatingLabelInput from '../components/common/FloatingLabelInput';

const LoginScreen = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-center">Login</h1>
      
      <div className="mb-4">
        <FloatingLabelInput
          label="Name"
          value={name}
          onChange={setName}
        />
      </div>

      <div className="mb-4">
        <FloatingLabelInput
          label="Email"
          value={email}
          onChange={setEmail}
          type="email"
        />
      </div>

      <div className="mb-4">
        <FloatingLabelInput
          label="Password"
          value={password}
          onChange={setPassword}
          type="password"
        />
      </div>

      <div className="mb-6">
        <FloatingLabelInput
          label="Confirm Password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          type="password"
        />
      </div>

      <button className="w-full bg-blue-500 text-white px-4 py-2 rounded">
        Sign Up
      </button>
    </div>
  );
};

export default LoginScreen;
