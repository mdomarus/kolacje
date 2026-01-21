'use client';

import { useState, useEffect } from 'react';
import LoginForm from '@/components/LoginForm';
import VotingSection from '@/components/VotingSection';
import NotVotedList from '@/components/NotVotedList';
import AdminPanel from '@/components/AdminPanel';
import { LogOut } from 'lucide-react';

interface User {
  id: number;
  phone: string;
  name: string;
  is_admin: number;
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [surveyDate, setSurveyDate] = useState('');
  const [adminViewMode, setAdminViewMode] = useState<'admin' | 'user'>('admin');

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);

    // Fetch survey date
    const fetchSurveyDate = async () => {
      try {
        const response = await fetch('/api/settings');
        const settings = await response.json();
        setSurveyDate(settings.survey_date || '');
      } catch (error) {
        console.error('Failed to fetch survey date:', error);
      }
    };
    fetchSurveyDate();
  }, []);

  const handleLoginSuccess = (loggedInUser: User) => {
    setUser(loggedInUser);
    localStorage.setItem('user', JSON.stringify(loggedInUser));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const handleVoteChange = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const handleDishChanged = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            🍽️ Aplikacja do głosowania na dania
          </h1>
          <p className="text-gray-600">
            {isLoading ? 'Ładowanie...' : user ? (user.is_admin ? 'Panel administracyjny' : 'Wybierz swoje ulubione dania') : 'Zaloguj się, aby zacząć'}
          </p>
          {surveyDate && !isLoading && (
            <div className="mt-4 bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
              <p className="text-sm text-gray-600">📅 Ankieta dotyczy dnia:</p>
              <p className="text-lg font-bold text-blue-700">{surveyDate}</p>
            </div>
          )}
        </div>

        {isLoading ? (
          // Loading State
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-auto border-2 border-gray-200">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Sprawdzanie sesji...</span>
            </div>
          </div>
        ) : !user ? (
          // Login Screen
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-auto border-2 border-gray-200">
            <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">🍽️ Logowanie</h2>
            <LoginForm onLoginSuccess={handleLoginSuccess} />
            <div className="mt-8 text-sm text-gray-700 border-t-2 pt-6 space-y-4">
              <div>
                <p className="font-bold text-blue-600 mb-2">👔 Konto admina:</p>
                <p className="text-gray-700">Telefon: <span className="font-mono font-bold">111111111</span></p>
                <p className="text-gray-700">Imię: Admin</p>
              </div>
              <div>
                <p className="font-bold text-green-600 mb-2">👤 Konto użytkownika:</p>
                <p className="text-gray-700">Telefon: dowolny numer</p>
                <p className="text-gray-700">Imię: twoje imię</p>
              </div>
            </div>
          </div>
        ) : user.is_admin ? (
          // Admin View
          adminViewMode === 'admin' ? (
            <AdminPanel
              user={user}
              onLogout={handleLogout}
              onDishChanged={handleDishChanged}
              refreshKey={refreshKey}
              onToggleUserView={() => setAdminViewMode('user')}
            />
          ) : (
            // User view for admin
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Back to Admin Button */}
              <div className="lg:col-span-2">
                <button
                  onClick={() => setAdminViewMode('admin')}
                  className="mb-4 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 font-medium transition"
                >
                  ← Powrót do panelu admina
                </button>
              </div>
              {/* Left Column - Voting */}
              <div className="lg:col-span-2 space-y-6">
                {/* User Card */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">Zalogowany jako</p>
                      <h2 className="text-2xl font-bold text-gray-800">
                        {user.name}
                      </h2>
                      <p className="text-gray-500 text-sm">{user.phone}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 bg-red-100 text-red-700 px-4 py-2 rounded-lg hover:bg-red-200 transition"
                    >
                      <LogOut className="w-4 h-4" />
                      Wyloguj
                    </button>
                  </div>
                </div>

                {/* Voting Section */}
                <div className="bg-white rounded-2xl shadow-lg p-6 space-y-8">
                  <h2 className="text-2xl font-bold text-gray-800">Głosowanie</h2>
                  <VotingSection
                    key={`first-${refreshKey}`}
                    course="first"
                    userId={user.id}
                    onVoteChange={handleVoteChange}
                  />
                  <div className="border-t pt-8">
                    <VotingSection
                      key={`second-${refreshKey}`}
                      course="second"
                      userId={user.id}
                      onVoteChange={handleVoteChange}
                    />
                  </div>
                </div>
              </div>

              {/* Right Column - Status */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-6">
                  <NotVotedList />
                </div>
              </div>
            </div>
          )
        ) : (
          // User View
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Voting */}
            <div className="lg:col-span-2 space-y-6">
              {/* User Card */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Zalogowany jako</p>
                    <h2 className="text-2xl font-bold text-gray-800">
                      {user.name}
                    </h2>
                    <p className="text-gray-500 text-sm">{user.phone}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 bg-red-100 text-red-700 px-4 py-2 rounded-lg hover:bg-red-200 transition"
                  >
                    <LogOut className="w-4 h-4" />
                    Wyloguj
                  </button>
                </div>
              </div>

              {/* Voting Section */}
              <div className="bg-white rounded-2xl shadow-lg p-6 space-y-8">
                <h2 className="text-2xl font-bold text-gray-800">Głosowanie</h2>
                <VotingSection
                  key={`first-${refreshKey}`}
                  course="first"
                  userId={user.id}
                  onVoteChange={handleVoteChange}
                />
                <div className="border-t pt-8">
                  <VotingSection
                    key={`second-${refreshKey}`}
                    course="second"
                    userId={user.id}
                    onVoteChange={handleVoteChange}
                  />
                </div>
              </div>
            </div>

            {/* Right Column - Status */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-6">
                <NotVotedList />
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
