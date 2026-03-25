import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Calendar, Filter } from 'lucide-react-native';
import BottomNavbar from '../components/oBotNav';
import { getOperatorCollections, CollectionLog } from '../services/collectionLogService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function OCollectionLogs() {
  const insets = useSafeAreaInsets();
  const [logs, setLogs] = useState<CollectionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [operatorId, setOperatorId] = useState<number | null>(null);

  useEffect(() => {
    loadOperatorId();
  }, []);

  useEffect(() => {
    if (operatorId) {
      loadCollections();
    }
  }, [operatorId]);

  const loadOperatorId = async () => {
    try {
      const id = await AsyncStorage.getItem('userId');
      if (id) {
        setOperatorId(parseInt(id));
      }
    } catch (error) {
      console.error('Failed to load operator ID:', error);
    }
  };

  const loadCollections = async () => {
    if (!operatorId) return;

    try {
      setLoading(true);
      const response = await getOperatorCollections(operatorId, {
        limit: 50,
        offset: 0,
      });
      setLogs(response.logs);
    } catch (error) {
      console.error('Failed to load collections:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCollections();
    setRefreshing(false);
  };

  const formatWeight = (weight: number) => {
    return `${weight.toFixed(2)} kg`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'sensor':
        return '#10b981'; // green
      case 'qr_scan':
        return '#3b82f6'; // blue
      default:
        return '#6b7280'; // gray
    }
  };

  const getMethodLabel = (method: string) => {
    switch (method) {
      case 'sensor':
        return 'Sensor';
      case 'qr_scan':
        return 'QR Scan';
      default:
        return 'Manual';
    }
  };

  const renderLogItem = ({ item }: { item: CollectionLog }) => (
    <View style={styles.logItem}>
      <View style={styles.logHeader}>
        <Text style={styles.areaName}>{item.Area_Name || `Area ${item.area_id}`}</Text>
        <View style={[styles.methodBadge, { backgroundColor: getMethodColor(item.collection_method) }]}>
          <Text style={styles.methodText}>{getMethodLabel(item.collection_method)}</Text>
        </View>
      </View>
      
      <View style={styles.logDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Weight:</Text>
          <Text style={styles.detailValue}>{formatWeight(item.weight)}</Text>
        </View>
        
        {item.container_name && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Container:</Text>
            <Text style={styles.detailValue}>{item.container_name}</Text>
          </View>
        )}
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Time:</Text>
          <Text style={styles.detailValue}>{formatDate(item.collected_at)}</Text>
        </View>
      </View>
      
      {item.notes && (
        <Text style={styles.notes}>{item.notes}</Text>
      )}
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No collection logs found</Text>
      <Text style={styles.emptySubtext}>Start collecting waste to see your logs here</Text>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Collection Logs</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E523A" />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Collection Logs</Text>
        <TouchableOpacity style={styles.filterButton}>
          <Filter size={20} color="#2E523A" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={logs}
        renderItem={renderLogItem}
        keyExtractor={(item) => item.collection_id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
      />

      <View style={styles.bottomNavWrapper}>
        <BottomNavbar currentPage="Back" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  filterButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 16,
  },
  logItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  areaName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  methodBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  methodText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#fff',
  },
  logDetails: {
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
  },
  notes: {
    fontSize: 13,
    color: '#6b7280',
    fontStyle: 'italic',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  bottomNavWrapper: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
});
