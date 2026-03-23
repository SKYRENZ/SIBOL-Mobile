import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import tw from '../utils/tailwind';
import { getWasteInputsByAccountId } from '../services/wasteInputService';

interface LogItem {
  Input_id: number;
  Machine_id: number;
  Account_id: number;
  Weight: number;
  Input_datetime: string;
  Created_at: string;
}

export default function OperatorLogs() {
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const logsData = await getWasteInputsByAccountId();
      setLogs(logsData || []);
    } catch (error) {
      console.error('Failed to fetch operator logs:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLogs();
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

  return (
    <View style={styles.container}>
      <View style={[styles.box, tw`bg-white`]}>
        <Text style={[tw`text-[#2E523A] font-bold text-lg mb-4`]}>Operator Activity Logs</Text>
        
        {logs.length === 0 && !loading ? (
          <View style={styles.emptyState}>
            <Text style={[tw`text-[#88AB8E] text-center`]}>No activity logs found.</Text>
            <Text style={[tw`text-[#88AB8E] text-sm text-center mt-2`]}>Start by inputting waste data to see your activity here.</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.logsContainer}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            showsVerticalScrollIndicator={false}
          >
            {logs.map((log) => (
              <View key={log.Input_id} style={styles.logItem}>
                <View style={styles.logHeader}>
                  <Text style={styles.logDate}>{formatDate(log.Created_at)}</Text>
                  <Text style={styles.logWeight}>{log.Weight} kg</Text>
                </View>
                <Text style={styles.logMachine}>Machine ID: {log.Machine_id}</Text>
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 40,
  },
  box: {
    width: '100%',
    height: 320,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#88AB8E',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logsContainer: {
    flex: 1,
  },
  logItem: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#88AB8E',
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  logDate: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6C8770',
  },
  logWeight: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2E523A',
  },
  logMachine: {
    fontSize: 11,
    color: '#88AB8E',
  },
});
