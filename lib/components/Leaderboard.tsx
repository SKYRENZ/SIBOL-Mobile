import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import tw from '../utils/tailwind';
import { fetchLeaderboard } from '../services/leaderboardService';

interface LeaderboardEntry {
  rank: number;
  name: string;
  points: number;
}

interface LeaderboardProps {
  brgyName?: string;
  entries?: LeaderboardEntry[];
  loading?: boolean;
  userRank?: number;
}

export default function Leaderboard({
  brgyName = 'Brgy. 176-E',
  entries: _entries,
  loading: _loading = false,
  userRank = 1,
}: LeaderboardProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>(_entries ?? []);
  const [loading, setLoading] = useState<boolean>(_loading);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const rows = await fetchLeaderboard(50);
        if (!mounted) return;
        const mapped = rows.map((r: any, idx: number) => ({
          rank: r.rank ?? idx + 1,
          name: r.Username ?? r.name ?? r.username ?? 'Unknown',
          points: Number(r.Total_kg ?? r.points ?? 0),
        })) as LeaderboardEntry[];
        setEntries(mapped);
      } catch (err) {
        console.error('[Leaderboard] fetch failed', err);
        setEntries([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <View style={tw`bg-white rounded-2xl border border-gray-200 p-5 m-4 shadow`}>
        <View style={tw`py-8 items-center`}>
          <ActivityIndicator size="large" color="#2E523A" />
        </View>
      </View>
    );
  }

  if (!entries || entries.length === 0) {
    return (
      <View style={tw`bg-white rounded-2xl border border-gray-200 p-5 m-4 shadow`}>
        <View style={tw`items-center mb-4`}>
          <Text style={tw`text-2xl font-extrabold text-emerald-800`}>{brgyName} Leaderboard</Text>
          <Text style={tw`text-sm font-semibold text-emerald-700`}>You're on the lead!</Text>
        </View>
        <View style={tw`py-8 items-center`}>
          <Text style={tw`text-base text-gray-500`}>No leaderboard data available</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={tw`bg-white rounded-2xl border border-gray-200 p-5 m-4 shadow`}>
      <View style={tw`items-center mb-4`}>
        <Text style={tw`text-2xl font-extrabold text-emerald-800`}>{brgyName} Leaderboard</Text>
        <Text style={tw`text-sm font-semibold text-emerald-700`}>These are the Top Contributors!</Text>
      </View>

      <View style={tw`px-1`}>{/* small horizontal padding so badges are visible */}
        {entries.map((entry, idx) => {
          // badge background (use solid colors for RN)
          const badgeStyle =
            entry.rank === 1
              ? tw`bg-yellow-400`
              : entry.rank === 2
              ? tw`bg-gray-400`
              : entry.rank === 3
              ? tw`bg-orange-500`
              : tw`bg-emerald-800`;

          return (
            <View
              key={`${entry.rank}-${entry.name}`}
              style={tw`flex-row items-center bg-white rounded-lg overflow-hidden border border-gray-200 mb-3`}
            >
              {/* left colored square - full item height */}
              <View style={[tw`w-14 h-14 justify-center items-center rounded-l-lg`, badgeStyle]}>
                <Text style={tw`text-lg font-extrabold text-white`}>{entry.rank}</Text>
              </View>

              {/* content with gap */}
              <View style={tw`flex-1 flex-row justify-between items-center px-4 py-3`}>
                <Text numberOfLines={1} style={[tw`text-sm font-bold mr-4 flex-1`, { color: '#2E523A' }]}>{entry.name}</Text>
                <View style={tw`ml-2`}>
                  <Text style={tw`text-sm font-bold text-emerald-600`}>{entry.points} Kg</Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}
