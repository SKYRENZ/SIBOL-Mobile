import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Animated, ActivityIndicator } from 'react-native';
import { fetchLeaderboard } from '../../services/leaderboardService';

export type HContributionItem = {
  id: string;
  date: string;
  points: number;
  totalContribution: number;
  area: string;
};

type Props = {
  fadeAnim: Animated.Value;
  points: number;
  totalContributions: number;
  currentUsername?: string; // ✅ needed for placement
};

export default function HProfileContributions({
  fadeAnim,
  points,
  totalContributions,
  currentUsername,
}: Props) {
  const [placementLoading, setPlacementLoading] = useState(false);
  const [placementText, setPlacementText] = useState<string>('—');

  const normalizedMe = useMemo(
    () => String(currentUsername ?? '').trim().toLowerCase(),
    [currentUsername]
  );

  useEffect(() => {
    let mounted = true;

    async function loadPlacement() {
      if (!normalizedMe) {
        setPlacementText('—');
        return;
      }

      setPlacementLoading(true);
      try {
        const rows = await fetchLeaderboard(200); // adjust if you want wider search
        if (!mounted) return;

        const found = rows.find((r) => String(r?.Username ?? '').trim().toLowerCase() === normalizedMe);

        if (found?.rank) {
          setPlacementText(`#${found.rank}`);
        } else {
          setPlacementText('Not in top 200');
        }
      } catch {
        if (!mounted) return;
        setPlacementText('—');
      } finally {
        if (mounted) setPlacementLoading(false);
      }
    }

    loadPlacement();

    return () => {
      mounted = false;
    };
  }, [normalizedMe]);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Total Points */}
      <View style={styles.bigCard}>
        <Text style={styles.cardLabel}>Total Points</Text>
        <Text style={styles.cardValue}>{points} points</Text>
      </View>

      {/* Contributions */}
      <View style={styles.bigCard}>
        <Text style={styles.cardLabel}>Contributions</Text>
        <Text style={styles.cardValue}>{totalContributions} kg</Text>
      </View>

      {/* Placement */}
      <View style={styles.bigCard}>
        <Text style={styles.cardLabel}>Placement</Text>

        {placementLoading ? (
          <View style={styles.placementRow}>
            <ActivityIndicator />
            <Text style={styles.placementHint}>Loading…</Text>
          </View>
        ) : (
          <Text style={styles.cardValue}>{placementText}</Text>
        )}

        <Text style={styles.placementSub}>
          Based on current leaderboard.
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 12,
  },

  // Big, full-width card (similar visual weight to the old Recent Activity card)
  bigCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(46,82,58,0.08)',
  },

  cardLabel: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#6C8770',
    marginBottom: 6,
  },

  cardValue: {
    fontSize: 26,
    fontFamily: 'Inter-Bold',
    color: '#2E523A',
    letterSpacing: 0.2,
  },

  placementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },

  placementHint: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6C8770',
  },

  placementSub: {
    marginTop: 8,
    fontSize: 11,
    fontFamily: 'Inter-Medium',
    color: '#6C8770',
    opacity: 0.9,
  },
});