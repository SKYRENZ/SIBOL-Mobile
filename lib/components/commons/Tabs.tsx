import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import tw from '../../utils/tailwind';

type TabItem = string | { label: string; value?: string };

interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (value: string) => void;
}


const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onTabChange }) => {
  return (
    <View style={tw`flex-row items-center justify-center bg-white border border-[#CAD3CA] rounded-2xl p-1`}>
      {tabs.map((tab, idx) => {
        const label = typeof tab === 'string' ? tab : tab.label;
        const value = typeof tab === 'string' ? tab : (tab.value ?? tab.label);
        const isActive = value === activeTab;

        return (
          <TouchableOpacity
            key={`${value}-${idx}`}
            onPress={() => onTabChange(value)}
            style={[
              tw`flex-1 py-2 px-3 rounded-2xl`,
              isActive && tw`bg-[#88AB8E] border border-[#88AB8E]`,
            ]}
          >
            <Text style={[tw`text-center text-[13px] font-semibold`, isActive ? tw`text-white` : tw`text-text-gray`]}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default Tabs;
