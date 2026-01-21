'use client';

import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';

interface DishWithVotes {
  id: number;
  name: string;
  vote_count: number;
}

interface VotingSectionProps {
  course: 'first' | 'second';
  userId: number;
  onVoteChange: () => void;
}

export default function VotingSection({
  course,
  userId,
  onVoteChange,
}: VotingSectionProps) {
  const [dishes, setDishes] = useState<DishWithVotes[]>([]);
  const [selectedDishId, setSelectedDishId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [menusLocked, setMenusLocked] = useState(false);

  const courseLabel = course === 'first' ? 'Pierwsze dania' : 'Drugie dania';

  useEffect(() => {
    fetchDishes();
    fetchUserVote();
    fetchSettings();
  }, [course, userId]);

  const fetchDishes = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/votes?course=${course}`);
      const data = await response.json();
      setDishes(data);
    } catch (error) {
      console.error('Failed to fetch dishes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserVote = async () => {
    try {
      const response = await fetch(`/api/user-vote?userId=${userId}&course=${course}`);
      if (response.ok) {
        const vote = await response.json();
        setSelectedDishId(vote.dish_id);
      }
    } catch (error) {
      console.error('Failed to fetch user vote:', error);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      const settings = await response.json();
      setMenusLocked(settings.menus_locked === '1');
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  };

  const handleVote = async (dishId: number) => {
    if (menusLocked) {
      alert('Menu są zablokowane. Możesz widzieć swoje wybory, ale nie możesz ich zmieniać.');
      return;
    }

    if (selectedDishId === dishId) return;

    setVoting(true);
    try {
      const response = await fetch('/api/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          dishId,
          course,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to vote');
      }

      setSelectedDishId(dishId);
      onVoteChange();
      await fetchDishes();
    } catch (error) {
      console.error('Failed to vote:', error);
      alert('Błąd głosowania. Spróbuj ponownie.');
    } finally {
      setVoting(false);
    }
  };

  if (loading) {
    return <div className="text-gray-500">Wczytywanie {courseLabel}...</div>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">{courseLabel}</h3>
        {menusLocked && (
          <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded font-medium">
            Zablokowane
          </span>
        )}
      </div>

      {menusLocked && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
          Menu są zablokowane. Możesz widzieć swoje wybory, ale nie możesz ich zmieniać.
        </div>
      )}

      {dishes.length === 0 ? (
        <p className="text-gray-500 text-sm">Brak dostępnych dan</p>
      ) : (
        <div className="space-y-2">
          {dishes.map((dish) => (
            <button
              key={dish.id}
              onClick={() => handleVote(dish.id)}
              disabled={voting || menusLocked}
              className={`w-full p-3 rounded-lg border-2 transition text-left ${
                selectedDishId === dish.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              } disabled:opacity-50`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      selectedDishId === dish.id
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300'
                    }`}
                  >
                    {selectedDishId === dish.id && (
                      <Check className="w-3 h-3 text-white" />
                    )}
                  </div>
                  <span className="font-medium text-gray-800">{dish.name}</span>
                </div>
                <span className="text-sm font-semibold text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                  {dish.vote_count} vote{dish.vote_count !== 1 ? 's' : ''}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
