import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import tw from '../utils/tailwind';
import { getLatestS3Readings, type S3SensorReading } from '../services/s3SensorService';

interface Alert {
  id: string;
  title: string;
  date: string;
  severity: 'error' | 'warning';
}

interface SensorMetric {
  label: string;
  value: string;
  status: string;
  percentage: number;
}

interface Props {
  machineId: number | null;
}

const OProcessSensors: React.FC<Props> = ({ machineId }) => {
  const [reading, setReading] = useState<S3SensorReading | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!machineId) {
      setReading(null);
      return;
    }

    let mounted = true;

    const fetchData = async () => {
      setLoading(true);
      try {
        const rows = await getLatestS3Readings(machineId, 1);
        if (!mounted) return;
        setReading(rows.length > 0 ? rows[0] : null);
      } catch {
        if (!mounted) return;
        setReading(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchData();

    // Poll every 5 seconds, matching frontend behaviour
    const id = setInterval(fetchData, 5000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [machineId]);

  const alerts: Alert[] = [
    {
      id: '1',
      title: 'All systems normal on Stage 3',
      date: '9/6/2025',
      severity: 'warning',
    },
    {
      id: '2',
      title: 'pH level stable on Stage 3',
      date: '9/6/2025',
      severity: 'warning',
    },
  ];

  const sensorMetrics: SensorMetric[] = useMemo(() => {
    if (!reading) return [];
    return [
      {
        label: 'pH Level',
        value: reading.Ph_Sensor != null ? reading.Ph_Sensor.toFixed(2) : 'N/A',
        status: 'Normal',
        percentage: reading.Ph_Sensor != null ? (reading.Ph_Sensor / 14) * 100 : 0,
      },
      {
        label: 'Temperature',
        value: reading.Temp_Sensor != null ? `${reading.Temp_Sensor.toFixed(1)}°C` : 'N/A',
        status: 'Normal',
        percentage: reading.Temp_Sensor != null ? (reading.Temp_Sensor / 100) * 100 : 0,
      },
      {
        label: 'Pressure',
        value: reading.Pressure_Sensor != null ? reading.Pressure_Sensor.toFixed(1) : 'N/A',
        status: 'Normal',
        percentage:
          reading.Pressure_Sensor != null
            ? Math.min((reading.Pressure_Sensor / 100) * 100, 100)
            : 0,
      },
      {
        label: 'Methane',
        value: reading.Methane_Sensor != null ? reading.Methane_Sensor.toFixed(1) : 'N/A',
        status: 'Normal',
        percentage:
          reading.Methane_Sensor != null
            ? Math.min((reading.Methane_Sensor / 100) * 100, 100)
            : 0,
      },
    ];
  }, [reading]);

  const AlertCard: React.FC<{ alert: Alert }> = ({ alert }) => {
    const isError = alert.severity === 'error';
    const indicatorColor = isError ? '#D80004' : '#88AB8E';

    return (
      <View
        style={tw`flex-row items-center rounded-[15px] border-2 border-[#F2F1EB] bg-white p-3 mb-4`}
      >
        <View
          style={[
            tw`w-12 h-12 rounded-lg mr-3`,
            { backgroundColor: indicatorColor },
          ]}
        />
        <View style={tw`flex-1 flex-row justify-between items-center`}>
          <View style={tw`flex-1`}>
            <Text
              style={tw`text-primary font-bold text-[15px]`}
              numberOfLines={2}
            >
              {alert.title}
            </Text>
          </View>
          <Text style={tw`text-[#CAD3CA] font-bold text-[9px] ml-2`}>
            {alert.date}
          </Text>
        </View>
      </View>
    );
  };

  const ProgressBar: React.FC<{
    percentage: number;
    status: string;
  }> = ({ percentage, status }) => {
    return (
      <View style={tw`w-full`}>
        <View
          style={[
            tw`flex-row rounded-full h-5 overflow-hidden border-2 border-[#AFC8AD]`,
            { height: 19 },
          ]}
        >
          <View
            style={[
              tw`bg-[#6C8770]`,
              {
                width: `${Math.min(Math.max(percentage, 0), 100)}%`,
              },
            ]}
          />
          <View
            style={[
              tw`bg-white`,
              {
                flex: 1,
              },
            ]}
          />
        </View>
        <Text style={tw`text-primary text-[10px] font-normal mt-1`}>
          {status}
        </Text>
      </View>
    );
  };

  return (
    <ScrollView
      style={tw`flex-1 bg-white`}
      contentContainerStyle={tw`px-4 py-4`}
    >
      <View style={tw`mb-6`}>
        <Text style={tw`text-text-gray font-bold text-base mb-4`}>Alert</Text>

        {alerts.map((alert) => (
          <AlertCard key={alert.id} alert={alert} />
        ))}
      </View>

      <View style={tw`border-t border-text-gray mb-6`} />

      <View>
        <Text style={tw`text-text-gray font-bold text-base mb-4`}>Sensors</Text>

        {loading ? (
          <View style={tw`items-center py-8`}>
            <ActivityIndicator size="large" color="#2E523A" />
            <Text style={tw`text-[#6C8770] text-xs mt-2`}>Loading sensors…</Text>
          </View>
        ) : !machineId ? (
          <View style={tw`rounded-[15px] border-2 border-[#F2F1EB] bg-white p-6 mb-4`}>
            <Text style={tw`text-[#6C8770] text-sm text-center`}>
              Select a machine to view sensor data
            </Text>
          </View>
        ) : sensorMetrics.length === 0 ? (
          <View style={tw`rounded-[15px] border-2 border-[#F2F1EB] bg-white p-6 mb-4`}>
            <Text style={tw`text-[#6C8770] text-sm text-center`}>
              No sensor data available
            </Text>
          </View>
        ) : (
          <View style={tw`rounded-[15px] border-2 border-[#F2F1EB] bg-white p-6 mb-4`}>
            <Text style={tw`text-primary font-bold text-[15px] mb-6`}>
              Stage 3
            </Text>

            {sensorMetrics.map((metric, index) => (
              <View key={index} style={tw`mb-6`}>
                <View style={tw`flex-row justify-between items-center mb-2`}>
                  <Text style={tw`text-primary font-bold text-[14px]`}>
                    {metric.label}
                  </Text>
                  <Text style={tw`text-primary font-bold text-[14px]`}>
                    {metric.value}
                  </Text>
                </View>
                <ProgressBar percentage={metric.percentage} status={metric.status} />
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
};

export default OProcessSensors;
