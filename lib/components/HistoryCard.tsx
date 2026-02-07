import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface HistoryCardProps {
  title: string;
  date: string;
  type: 'QR_SCAN' | 'REWARD_CLAIM';
  pointsDelta: number;
  kgDelta?: number;
  code?: string | null;
  onViewCode?: (code: string) => void;
}

export default function HistoryCard({
  title,
  date,
  type,
  pointsDelta,
  kgDelta = 0,
  code = null,
  onViewCode,
}: HistoryCardProps) {
  const isEarned = pointsDelta >= 0;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.date}>{date}</Text>

      <View style={styles.row}>
        <Text style={styles.label}>{isEarned ? 'Points Earned' : 'Points Deducted'}</Text>
        <Text
          style={[styles.value, isEarned ? styles.pointsEarned : styles.pointsDeducted]}
        >
          {isEarned ? `+${pointsDelta}` : `${pointsDelta}`} pts
        </Text>
      </View>

      {type === 'QR_SCAN' ? (
        <View style={styles.row}>
          <Text style={styles.label}>Contribution Added</Text>
          <Text style={styles.value}>{kgDelta} kg</Text>
        </View>
      ) : null}

      {type === 'REWARD_CLAIM' ? (
        <View style={styles.row}>
          <Text style={styles.label}>Item Obtained</Text>
          <Text style={styles.value} numberOfLines={1}>
            {title}
          </Text>
        </View>
      ) : null}

      {type === 'REWARD_CLAIM' && code ? (
        <View style={styles.row}>
          <Text style={styles.label}>Code</Text>
          <TouchableOpacity
            onPress={() => onViewCode?.(code)}
            style={styles.codeBtn}
            activeOpacity={0.8}
          >
            <Text style={styles.codeBtnText}>View</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}

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
    maxWidth: '60%',
    textAlign: 'right',
  },
  pointsEarned: {
    color: '#2E523A',
  },
  pointsDeducted: {
    color: '#B91C1C',
  },
  codeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#2E523A',
    borderRadius: 8,
  },
  codeBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});
