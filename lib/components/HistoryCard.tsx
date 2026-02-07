import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface HistoryCardProps {
  date: string;
  pointsEarned: number;
  totalContribution: string;
  area: string;
}

export default function HistoryCard({
  date,
  pointsEarned,
  totalContribution,
  area,
}: HistoryCardProps) {
  const styles = StyleSheet.create({
    card: {
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      marginHorizontal: 16,
      borderLeftWidth: 4,
      borderLeftColor: '#2E523A',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
      borderWidth: 1,
      borderColor: '#E5E7EB',
    },
    title: {
      fontSize: 14,
      fontWeight: '600',
      color: '#6B7280',
      marginBottom: 12,
    },
    date: {
      fontSize: 13,
      color: '#9CA3AF',
      marginBottom: 14,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 12,
      alignItems: 'center',
    },
    label: {
      fontSize: 13,
      color: '#6B7280',
      fontWeight: '500',
    },
    value: {
      fontSize: 13,
      fontWeight: '600',
      color: '#111827',
    },
    pointsValue: {
      fontSize: 13,
      fontWeight: '600',
      color: '#2E523A',
    },
    areaRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    areaLabel: {
      fontSize: 13,
      color: '#6B7280',
      fontWeight: '500',
    },
    areaValue: {
      fontSize: 13,
      fontWeight: '600',
      color: '#111827',
      maxWidth: '60%',
      textAlign: 'right',
    },
  });

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Recent Activity</Text>
      <Text style={styles.date}>{date}</Text>

      <View style={styles.row}>
        <Text style={styles.label}>Points Earned</Text>
        <Text style={styles.pointsValue}>+{pointsEarned} pts</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Total Contribution</Text>
        <Text style={styles.value}>{totalContribution}</Text>
      </View>

      <View style={styles.areaRow}>
        <Text style={styles.areaLabel}>Area</Text>
        <Text style={styles.areaValue}>{area}</Text>
      </View>
    </View>
  );
}
