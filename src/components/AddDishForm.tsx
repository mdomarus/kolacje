'use client';

import { useState } from 'react';

interface AddDishFormProps {
  course: 'first' | 'second';
  onDishAdded: () => void;
}

export default function AddDishForm({ course, onDishAdded }: AddDishFormProps) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const courseLabel = course === 'first' ? 'pierwsze dania' : 'drugie dania';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/dishes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, course }),
      });

      if (!response.ok) {
        throw new Error('Failed to add dish');
      }

      setName('');
      onDishAdded();
    } catch (err) {
      setError('Błąd dodawania dania. Spróbuj ponownie.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Dodaj {courseLabel}
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={`np. Spaghetti (${courseLabel})`}
            required
            className="flex-1 px-4 py-2 border-2 border-gray-400 bg-white text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
          />
          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
          >
            {loading ? 'Dodawanie...' : 'Dodaj'}
          </button>
        </div>
      </div>

      {error && <div className="text-red-600 text-sm">{error}</div>}
    </form>
  );
}
