import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

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
  contributions: HContributionItem[];
};

export default function HProfileContributions({
  fadeAnim,
  points,
  totalContributions,
  contributions,
}: Props) {
  return (
    <Animated.View style={[styles.tabContent, { opacity: fadeAnim }]}>
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{totalContributions}</Text>
          <Text style={styles.statLabel}>Contributions</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statValue}>{points}</Text>
          <Text style={styles.statLabel}>Total Points</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Recent Activity</Text>

      {contributions?.length ? (
        contributions.map((c) => (
          <View key={c.id} style={styles.contributionCard}>
            <Text style={styles.contributionDate}>{c.date}</Text>

            <View style={styles.contributionRow}>
              <Text style={styles.contributionLabel}>Points Earned</Text>
              <Text style={styles.contributionValue}>+{c.points} pts</Text>
            </View>

            <View style={styles.contributionRow}>
              <Text style={styles.contributionLabel}>Total Contribution</Text>
              <Text style={styles.contributionValue}>{c.totalContribution} kg</Text>
            </View>

            <View style={styles.contributionRow}>
              <Text style={styles.contributionLabel}>Area</Text>
              <Text style={styles.contributionValue}>{c.area}</Text>
            </View>
          </View>
        ))
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No contributions yet.</Text>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  tabContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(46,82,58,0.08)',
  },
  statValue: {
    fontSize: 22,
    fontFamily: 'Inter-Bold',
    color: '#2E523A',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#6C8770',
  },
  sectionTitle: {
    marginTop: 6,
    marginBottom: 10,
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: '#2E523A',
  },
  contributionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(46,82,58,0.08)',
    marginBottom: 12,
  },
  contributionDate: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#6C8770',
    marginBottom: 10,
  },
  contributionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  contributionLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#6C8770',
  },
  contributionValue: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#2E523A',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(46,82,58,0.08)',
  },
  emptyText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#6C8770',
  },
});