import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import tw from '../utils/tailwind';

interface Alert {
  id: string;
  title: string;
  date: string;
  severity: 'error' | 'warning';
}

interface SensorStage {
  stageName: string;
  metrics: Array<{
    label: string;
    value: string;
    status: string;
    percentage: number;
  }>;
}

const OProcessSensors: React.FC = () => {
  const alerts: Alert[] = [
    {
      id: '1',
      title: 'Amonia spike on Stage 3',
      date: '9/6/2025',
      severity: 'error',
    },
    {
      id: '2',
      title: 'pH level low on Stage 3',
      date: '9/6/2025',
      severity: 'warning',
    },
  ];

  const sensorStages: SensorStage[] = [
    {
      stageName: 'Stage 2',
      metrics: [
        {
          label: 'pH level',
          value: '7.0',
          status: 'Good',
          percentage: 100,
        },
        {
          label: 'Water level',
          value: '5 liters',
          status: 'Good',
          percentage: 65,
        },
      ],
    },
  ];

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
                width: `${percentage}%`,
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

  const SensorStageCard: React.FC<{ stage: SensorStage }> = ({ stage }) => {
    return (
      <View
        style={tw`rounded-[15px] border-2 border-[#F2F1EB] bg-white p-6 mb-4`}
      >
        <Text style={tw`text-primary font-bold text-[15px] mb-6`}>
          {stage.stageName}
        </Text>

        {stage.metrics.map((metric, index) => (
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

        {sensorStages.map((stage, index) => (
          <SensorStageCard key={index} stage={stage} />
        ))}
      </View>
    </ScrollView>
  );
};

export default OProcessSensors;
