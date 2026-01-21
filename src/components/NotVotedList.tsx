'use client';

import { useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';

interface User {
  id: number;
  phone: string;
  name: string;
  has_first_vote: number;
  has_second_vote: number;
}

export default function NotVotedList() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/users');
        const data = await response.json();
        setUsers(data);
      } catch (error) {
        console.error('Failed to fetch users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
    const interval = setInterval(fetchUsers, 5000);
    return () => clearInterval(interval);
  }, []);

  const notVotedBoth = users.filter(
    (u) => !u.has_first_vote && !u.has_second_vote
  );
  const notVotedFirst = users.filter(
    (u) => !u.has_first_vote && u.has_second_vote
  );
  const notVotedSecond = users.filter(
    (u) => u.has_first_vote && !u.has_second_vote
  );

  if (loading) {
    return <div className="text-gray-500">Wczytywanie użytkowników...</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">Status głosowania</h3>

      {notVotedBoth.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-red-800 mb-2">
                Nie głosowali (oba dania)
              </h4>
              <ul className="space-y-1">
                {notVotedBoth.map((user) => (
                  <li key={user.id} className="text-sm text-red-700">
                    {user.name}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {notVotedFirst.length > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-yellow-800 mb-2">
                Brak głosu na pierwsze dania
              </h4>
              <ul className="space-y-1">
                {notVotedFirst.map((user) => (
                  <li key={user.id} className="text-sm text-yellow-700">
                    {user.name}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {notVotedSecond.length > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-yellow-800 mb-2">
                Brak głosu na drugie dania
              </h4>
              <ul className="space-y-1">
                {notVotedSecond.map((user) => (
                  <li key={user.id} className="text-sm text-yellow-700">
                    {user.name}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {notVotedBoth.length === 0 &&
        notVotedFirst.length === 0 &&
        notVotedSecond.length === 0 && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded text-green-700">
            ✓ Wszyscy głosowali!
          </div>
        )}
    </div>
  );
}
