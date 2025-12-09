import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import tw from '../utils/tailwind';
import { useResponsiveStyle, useResponsiveSpacing, useResponsiveFontSize } from '../utils/responsiveStyles';

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
  entries = [
    { rank: 1, name: 'Joemen Barrios', points: 120 },
    { rank: 2, name: 'Laurenz Listangco', points: 100 },
    { rank: 3, name: 'Karl Miranda', points: 95 },
  ],
  loading = false,
  userRank = 1,
}: LeaderboardProps) {
  const styles = useResponsiveStyle(({ isSm, isMd, isLg }) => ({
    container: {
      backgroundColor: 'white',
      borderRadius: 30,
      borderWidth: 1,
      borderColor: 'rgba(0, 0, 0, 0.25)',
      padding: isSm ? 16 : 20,
      paddingTop: isSm ? 20 : 24,
      marginHorizontal: isSm ? 12 : 16,
      marginBottom: isSm ? 24 : 32,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
    },
    headerContainer: {
      alignItems: 'center',
      marginBottom: isSm ? 20 : 24,
    },
    title: {
      fontSize: isSm ? useResponsiveFontSize('2xl') : useResponsiveFontSize('3xl'),
      fontWeight: 'bold',
      color: '#2E523A',
      marginBottom: isSm ? 8 : 10,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: isSm ? useResponsiveFontSize('sm') : useResponsiveFontSize('md'),
      fontWeight: '700',
      color: '#2E523A',
      textAlign: 'center',
    },
    entriesContainer: {
      gap: isSm ? 10 : 12,
    },
    entryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'white',
      borderRadius: 15,
      borderWidth: 1,
      borderColor: 'rgba(0, 0, 0, 0.30)',
      overflow: 'hidden',
      paddingRight: isSm ? 12 : 14,
      minHeight: isSm ? 50 : 60,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    rankBadge: {
      width: isSm ? 50 : 60,
      height: '100%',
      backgroundColor: '#2E523A',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: isSm ? 50 : 60,
      marginRight: isSm ? 12 : 14,
    },
    rankText: {
      fontSize: isSm ? useResponsiveFontSize('xl') : useResponsiveFontSize('2xl'),
      fontWeight: 'bold',
      color: 'white',
    },
    entryContent: {
      flex: 1,
      justifyContent: 'space-between',
      flexDirection: 'row',
      alignItems: 'center',
    },
    nameText: {
      fontSize: isSm ? useResponsiveFontSize('sm') : useResponsiveFontSize('md'),
      fontWeight: 'bold',
      color: '#2E523A',
      flex: 1,
    },
    pointsText: {
      fontSize: isSm ? useResponsiveFontSize('sm') : useResponsiveFontSize('md'),
      fontWeight: 'bold',
      color: '#AFC8AD',
      textAlign: 'right',
    },
    loadingContainer: {
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: isSm ? 40 : 50,
    },
    emptyContainer: {
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: isSm ? 40 : 50,
    },
    emptyText: {
      fontSize: isSm ? useResponsiveFontSize('sm') : useResponsiveFontSize('md'),
      color: '#6B7280',
      textAlign: 'center',
    },
  }));

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E523A" />
        </View>
      </View>
    );
  }

  if (!entries || entries.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <Text style={styles.title}>{brgyName} Leaderboard</Text>
          <Text style={styles.subtitle}>You're on the lead!</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No leaderboard data available</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>{brgyName} Leaderboard</Text>
        <Text style={styles.subtitle}>You're on the lead!</Text>
      </View>

      <View style={styles.entriesContainer}>
        {entries.map((entry) => (
          <View key={`${entry.rank}-${entry.name}`} style={styles.entryRow}>
            <View style={styles.rankBadge}>
              <Text style={styles.rankText}>{entry.rank}</Text>
            </View>
            <View style={styles.entryContent}>
              <Text style={styles.nameText}>{entry.name}</Text>
              <Text style={styles.pointsText}>{entry.points} Sibol Points</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
