'use client';

import { useState } from 'react';

interface LoginFormProps {
  onLoginSuccess: (user: { id: number; phone: string; name: string; is_admin: number }) => void;
}

export default function LoginForm({ onLoginSuccess }: LoginFormProps) {
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate phone number is exactly 9 digits
    if (!/^\d{9}$/.test(phone)) {
      setError('Numer telefonu musi zawierać dokładnie 9 cyfr');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/setup-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, name }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Login failed with status ${response.status}`);
      }

      const user = await response.json();

      if (!user.id) {
        throw new Error('Invalid user data returned from server');
      }

      onLoginSuccess(user);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Nie udało się zalogować. Spróbuj ponownie.';
      setError(errorMessage);
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Numer telefonu
        </label>
        <input
          type="number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="123456789"
          required
          className="w-full px-4 py-3 border-2 border-gray-400 bg-white text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Twoje imię
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Jan Kowalski"
          required
          className="w-full px-4 py-3 border-2 border-gray-400 bg-white text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
        />
      </div>

      {error && <div className="text-red-600 text-sm">{error}</div>}

      <button
        type="submit"
        disabled={loading || !/^\d{9}$/.test(phone) || !name.trim()}
        className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
      >
        {loading ? 'Logowanie...' : 'Zaloguj się'}
      </button>
    </form>
  );
}
