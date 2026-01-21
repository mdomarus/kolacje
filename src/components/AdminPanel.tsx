'use client';

import { useEffect, useState } from 'react';
import { LogOut, Trash2, Users, Lock, LockOpen, Edit2, Check, X } from 'lucide-react';

interface User {
  id: number;
  phone: string;
  name: string;
  is_admin: number;
}

interface Dish {
  id: number;
  name: string;
  course: string;
}

interface DishWithVoters extends Dish {
  voters?: Array<{ id: number; name: string; phone: string }>;
}

interface AdminPanelProps {
  user: User;
  onLogout: () => void;
  onDishChanged: () => void;
  refreshKey: number;
  onToggleUserView?: () => void;
}

interface UserWithVotes {
  id: number;
  phone: string;
  name: string;
  has_first_vote: number;
  has_second_vote: number;
  is_admin: number;
}

export default function AdminPanel({
  user,
  onLogout,
  onDishChanged,
  refreshKey,
  onToggleUserView,
}: AdminPanelProps) {
  const [firstDishes, setFirstDishes] = useState<DishWithVoters[]>([]);
  const [secondDishes, setSecondDishes] = useState<DishWithVoters[]>([]);
  const [users, setUsers] = useState<UserWithVotes[]>([]);
  const [newDishName, setNewDishName] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<'first' | 'second'>('first');
  const [loading, setLoading] = useState(true);
  const [expandedDish, setExpandedDish] = useState<number | null>(null);
  const [voters, setVoters] = useState<{ [key: number]: any[] }>({});
  const [menusLocked, setMenusLocked] = useState(false);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [editingUserName, setEditingUserName] = useState('');
  const [surveyDate, setSurveyDate] = useState('');
  const [editingSurveyDate, setEditingSurveyDate] = useState('');
  const [savingSurveyDate, setSavingSurveyDate] = useState(false);

  useEffect(() => {
    fetchDishes();
    fetchUsers();
    fetchSettings();
  }, [refreshKey]);

  const fetchDishes = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/dishes');
      const dishes = await response.json();

      const first = dishes.filter((d: Dish) => d.course === 'first');
      const second = dishes.filter((d: Dish) => d.course === 'second');

      setFirstDishes(first);
      setSecondDishes(second);
    } catch (error) {
      console.error('Failed to fetch dishes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      const settings = await response.json();
      setMenusLocked(settings.menus_locked === '1');
      setSurveyDate(settings.survey_date || '');
      setEditingSurveyDate(settings.survey_date || '');
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  };

  const handleToggleLock = async () => {
    try {
      const newLockStatus = menusLocked ? '0' : '1';
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'menus_locked',
          value: newLockStatus,
          isAdmin: true,
        }),
      });

      if (response.ok) {
        setMenusLocked(newLockStatus === '1');
      } else {
        alert('Błąd przy aktualizacji statusu blokady');
      }
    } catch (error) {
      console.error('Błąd zmiany statusu blokady:', error);
      alert('Błąd przy aktualizacji statusu blokady');
    }
  };

  const handleSaveSurveyDate = async () => {
    setSavingSurveyDate(true);
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'survey_date',
          value: editingSurveyDate,
          isAdmin: true,
        }),
      });

      if (response.ok) {
        setSurveyDate(editingSurveyDate);
      } else {
        alert('Błąd przy zapisywaniu daty ankiety');
      }
    } catch (error) {
      console.error('Błąd zapisywania daty ankiety:', error);
      alert('Błąd przy zapisywaniu daty ankiety');
    } finally {
      setSavingSurveyDate(false);
    }
  };

  const handleAddDish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDishName.trim()) return;

    try {
      const response = await fetch('/api/dishes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newDishName,
          course: selectedCourse,
          isAdmin: true,
        }),
      });

      if (response.ok) {
        setNewDishName('');
        onDishChanged();
        await fetchDishes();
      }
    } catch (error) {
      console.error('Failed to add dish:', error);
    }
  };

  const handleDeleteDish = async (dishId: number) => {
    if (!confirm('Usunąć to danie i wszystkie jego głosy?')) return;

    try {
      const response = await fetch('/api/dishes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dishId,
          isAdmin: true,
        }),
      });

      if (response.ok) {
        onDishChanged();
        await fetchDishes();
      }
    } catch (error) {
      console.error('Failed to delete dish:', error);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Na pewno chcesz usunąć tego użytkownika i wszystkie jego głosy?')) return;

    try {
      const response = await fetch('/api/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          isAdmin: true,
        }),
      });

      if (response.ok) {
        onDishChanged();
        await fetchUsers();
      } else {
        alert('Błąd przy usuwaniu użytkownika');
      }
    } catch (error) {
      console.error('Failed to delete user:', error);
      alert('Błąd przy usuwaniu użytkownika');
    }
  };

  const handleToggleAdmin = async (userId: number, currentIsAdmin: number) => {
    const newAdminStatus = currentIsAdmin === 1 ? 0 : 1;
    const actionText = newAdminStatus === 1 ? 'awansować na admina' : 'usunąć prawa admina';

    if (!confirm(`Czy na pewno chcesz ${actionText} tego użytkownika?`)) return;

    try {
      const response = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          isAdmin: true,
          newIsAdmin: newAdminStatus,
        }),
      });

      if (response.ok) {
        await fetchUsers();
      } else {
        alert('Błąd przy aktualizacji statusu admina');
      }
    } catch (error) {
      console.error('Błąd zmiany statusu admina:', error);
      alert('Błąd przy aktualizacji statusu admina');
    }
  };

  const handleStartEditingName = (user: UserWithVotes) => {
    setEditingUserId(user.id);
    setEditingUserName(user.name);
  };

  const handleSaveUserName = async (userId: number) => {
    if (!editingUserName.trim()) {
      alert('Imię nie może być puste');
      return;
    }

    try {
      const response = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          isAdmin: true,
          newName: editingUserName,
        }),
      });

      if (response.ok) {
        setEditingUserId(null);
        setEditingUserName('');
        await fetchUsers();
      } else {
        alert('Błąd przy aktualizacji imienia');
      }
    } catch (error) {
      console.error('Błąd aktualizacji imienia:', error);
      alert('Błąd przy aktualizacji imienia');
    }
  };

  const handleCancelEditingName = () => {
    setEditingUserId(null);
    setEditingUserName('');
  };

  const handleClearCourse = async (course: 'first' | 'second') => {
    const courseLabel = course === 'first' ? 'dania główne' : 'drugie dania';
    if (!confirm(`Usunąć wszystkie ${courseLabel} i ich głosy?`)) return;

    try {
      const response = await fetch('/api/dishes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course,
          isAdmin: true,
        }),
      });

      if (response.ok) {
        onDishChanged();
        await fetchDishes();
      } else {
        alert(`Błąd przy czyszczeniu ${courseLabel}`);
      }
    } catch (error) {
      console.error(`Błąd czyszczenia ${courseLabel}:`, error);
      alert(`Błąd przy czyszczeniu ${courseLabel}`);
    }
  };

  const handleClearAllMenus = async () => {
    if (!confirm('Usunąć WSZYSTKIE dania i głosy? To nie może być cofnięte!')) return;

    try {
      const response = await fetch('/api/dishes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clearAll: true,
          isAdmin: true,
        }),
      });

      if (response.ok) {
        onDishChanged();
        await fetchDishes();
      } else {
        alert('Błąd przy czyszczeniu menu');
      }
    } catch (error) {
      console.error('Błąd czyszczenia menu:', error);
      alert('Błąd przy czyszczeniu menu');
    }
  };

  const toggleExpand = async (dishId: number) => {
    if (expandedDish === dishId) {
      setExpandedDish(null);
    } else {
      if (!voters[dishId]) {
        try {
          const response = await fetch(`/api/dish-voters?dishId=${dishId}`);
          const votersData = await response.json();
          setVoters((prev) => ({ ...prev, [dishId]: votersData }));
        } catch (error) {
          console.error('Failed to fetch voters:', error);
        }
      }
      setExpandedDish(dishId);
    }
  };

  const renderDishSection = (
    title: string,
    dishes: DishWithVoters[],
    course: 'first' | 'second'
  ) => (
    <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h3 className="text-xl md:text-2xl font-bold text-gray-800">{title}</h3>
        {dishes.length > 0 && (
          <button
            onClick={() => handleClearCourse(course)}
            className="flex items-center justify-center gap-2 bg-orange-100 text-orange-700 px-3 py-2 rounded text-sm hover:bg-orange-200 transition w-full sm:w-auto"
          >
            <Trash2 className="w-4 h-4" />
            Wyczyść dania
          </button>
        )}
      </div>

      {/* Add New Dish Form */}
      {selectedCourse === course && (
        <form onSubmit={handleAddDish} className="mb-6 flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={newDishName}
            onChange={(e) => setNewDishName(e.target.value)}
            placeholder={`Dodaj nowe danie...`}
            className="flex-1 px-4 py-2 border-2 border-gray-400 bg-white text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-sm"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium whitespace-nowrap text-sm"
          >
            Dodaj
          </button>
        </form>
      )}
      {selectedCourse !== course && (
        <button
          onClick={() => setSelectedCourse(course)}
          className="mb-6 w-full bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-800 font-medium text-sm"
        >
          Dodaj {title}
        </button>
      )}

      {/* Dishes List */}
      {dishes.length === 0 ? (
        <p className="text-gray-500 text-sm">Brak dań</p>
      ) : (
        <div className="space-y-2">
          {dishes.map((dish) => (
            <div key={dish.id}>
              <button
                onClick={() => toggleExpand(dish.id)}
                className="w-full p-3 rounded-lg border-2 border-gray-200 hover:border-gray-300 transition text-left flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
              >
                <span className="font-medium text-gray-800 text-sm md:text-base truncate">{dish.name}</span>
                <span className="text-xs md:text-sm font-semibold text-gray-600 bg-gray-100 px-3 py-1 rounded-full whitespace-nowrap w-fit">
                  Kliknij aby zobaczyć
                </span>
              </button>

              {expandedDish === dish.id && (
                <div className="mt-2 ml-0 sm:ml-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  {voters[dish.id]?.length === 0 ? (
                    <p className="text-gray-500 text-xs md:text-sm">Brak głosów</p>
                  ) : (
                    <ul className="space-y-1">
                      {voters[dish.id]?.map((voter) => (
                        <li key={voter.id} className="text-xs md:text-sm text-gray-700 truncate">
                          {voter.name} ({voter.phone})
                        </li>
                      ))}
                    </ul>
                  )}
                  <button
                    onClick={() => handleDeleteDish(dish.id)}
                    className="mt-3 flex items-center justify-center gap-2 bg-red-100 text-red-700 px-3 py-2 rounded text-xs hover:bg-red-200 transition w-full"
                  >
                    <Trash2 className="w-4 h-4" />
                    Usuń danie
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Admin Header Card */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-2xl shadow-lg p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="min-w-0">
            <p className="text-purple-100 text-sm">Panel administracyjny</p>
            <h2 className="text-xl md:text-2xl font-bold truncate">Cześć, {user.name}</h2>
            <p className="text-purple-100 text-sm truncate">{user.phone}</p>
            <p className="text-purple-100 text-sm mt-2">👥 {users.length} użytkowników</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <button
              onClick={handleToggleLock}
              className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition backdrop-blur-sm text-sm md:text-base whitespace-nowrap ${
                menusLocked
                  ? 'bg-red-600/40 hover:bg-red-600/60 text-white'
                  : 'bg-green-600/40 hover:bg-green-600/60 text-white'
              }`}
            >
              {menusLocked ? (
                <>
                  <Lock className="w-4 h-4" />
                  <span className="hidden sm:inline">Odblokuj</span>
                </>
              ) : (
                <>
                  <LockOpen className="w-4 h-4" />
                  <span className="hidden sm:inline">Zablokuj</span>
                </>
              )}
            </button>
            {onToggleUserView && (
              <button
                onClick={onToggleUserView}
                className="flex items-center justify-center gap-2 bg-indigo-600/40 hover:bg-indigo-600/60 text-white px-3 py-2 rounded-lg transition backdrop-blur-sm text-sm md:text-base whitespace-nowrap"
              >
                👤 <span className="hidden sm:inline">Widok</span>
              </button>
            )}
            <button
              onClick={onLogout}
              className="flex items-center justify-center gap-2 bg-white/20 hover:bg-white/30 text-white px-3 py-2 rounded-lg transition backdrop-blur-sm text-sm md:text-base whitespace-nowrap"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Wyloguj</span>
            </button>
          </div>
        </div>
      </div>

      {/* Survey Date Section */}
      <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📅 Data ankiety
            </label>
            <input
              type="text"
              value={editingSurveyDate}
              onChange={(e) => setEditingSurveyDate(e.target.value)}
              placeholder="np. Piątek, 24 stycznia 2025"
              className="w-full px-4 py-3 border-2 border-gray-400 bg-white text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-sm md:text-base"
            />
          </div>
          <button
            onClick={handleSaveSurveyDate}
            disabled={savingSurveyDate || editingSurveyDate === surveyDate}
            className="w-full sm:w-auto bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition text-sm md:text-base whitespace-nowrap"
          >
            {savingSurveyDate ? 'Zapisywanie...' : 'Zapisz'}
          </button>
        </div>
        {surveyDate && (
          <p className="text-xs md:text-sm text-gray-600 mt-2">
            Bieżąca data: <span className="font-semibold">{surveyDate}</span>
          </p>
        )}
      </div>

      {/* First Course Section */}
      {renderDishSection('Pierwsze dania', firstDishes, 'first')}

      {/* Second Course Section */}
      {renderDishSection('Drugie dania', secondDishes, 'second')}

      {/* Users Management Section */}
      <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-gray-700 flex-shrink-0" />
            <h3 className="text-base md:text-lg font-bold text-gray-800">Zarządzanie użytkownikami</h3>
          </div>
          <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-semibold w-fit">
            {users.length} użytkowników
          </span>
        </div>

        {users.length === 0 ? (
          <p className="text-gray-500 text-center py-4">👥 Brak użytkowników</p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {users.map((u) => (
              <div
                key={u.id}
                className="flex flex-col md:flex-row md:items-center md:justify-between bg-gray-50 p-3 md:p-4 rounded-lg hover:bg-gray-100 transition gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-start md:items-center gap-2 mb-2 md:mb-1 flex-wrap">
                    {editingUserId === u.id ? (
                      <div className="flex items-center gap-2 w-full">
                        <input
                          type="text"
                          value={editingUserName}
                          onChange={(e) => setEditingUserName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleSaveUserName(u.id);
                            } else if (e.key === 'Escape') {
                              handleCancelEditingName();
                            }
                          }}
                          className="flex-1 px-2 py-1 border-2 border-gray-400 bg-white text-gray-900 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveUserName(u.id)}
                          className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded text-xs hover:bg-green-200 transition flex-shrink-0"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                        <button
                          onClick={handleCancelEditingName}
                          className="flex items-center gap-1 bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs hover:bg-gray-200 transition flex-shrink-0"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <p className="font-semibold text-gray-800 break-words">{u.name}</p>
                        {u.is_admin && (
                          <span className="text-xs px-2 py-1 rounded bg-purple-100 text-purple-700 font-bold flex-shrink-0">
                            ADMIN
                          </span>
                        )}
                      </>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 break-all">{u.phone}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className={`text-xs px-2 py-1 rounded ${u.has_first_vote ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                      Pierwsze: {u.has_first_vote ? '✓' : '✗'}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded ${u.has_second_vote ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                      Drugie: {u.has_second_vote ? '✓' : '✗'}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto md:flex-shrink-0">
                  {editingUserId !== u.id && (
                    <button
                      onClick={() => handleStartEditingName(u)}
                      className="flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-3 py-2 rounded text-xs sm:text-sm hover:bg-gray-200 transition"
                    >
                      <Edit2 className="w-3 h-3 sm:w-4 sm:h-4" />
                      Edytuj
                    </button>
                  )}
                  <button
                    onClick={() => handleToggleAdmin(u.id, u.is_admin)}
                    className={`flex items-center justify-center gap-2 px-3 py-2 rounded text-xs sm:text-sm font-medium transition ${
                      u.is_admin
                        ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                        : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    }`}
                  >
                    {u.is_admin ? 'Usuń admin' : 'Zmień na admina'}
                  </button>
                  <button
                    onClick={() => handleDeleteUser(u.id)}
                    className="flex items-center justify-center gap-2 bg-red-100 text-red-700 px-3 py-2 rounded text-xs sm:text-sm hover:bg-red-200 transition"
                  >
                    <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                    Usuń
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Clear All Menus Button */}
      <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 md:p-6">
        <h3 className="text-base md:text-lg font-bold text-red-800 mb-3">Strefa niebezpieczna</h3>
        <button
          onClick={handleClearAllMenus}
          className="w-full flex items-center justify-center gap-2 bg-red-600 text-white px-4 md:px-6 py-2 md:py-3 rounded-lg hover:bg-red-700 font-medium transition text-sm md:text-base"
        >
          <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
          Wyczyść wszystkie menu i głosy
        </button>
        <p className="text-xs md:text-sm text-red-700 mt-3">
          Spowoduje to trwałe usunięcie wszystkich dań i głosów. Te akcji nie można cofnąć.
        </p>
      </div>
    </div>
  );
}
