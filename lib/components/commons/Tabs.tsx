import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import tw from '../../utils/tailwind';
import { AlertCircle } from 'lucide-react-native';

type TabItem = string | { label: string; value?: string };

interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (value: string) => void;
  indicators?: Record<string, boolean>; // Map tab value to show indicator
}


const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onTabChange, indicators }) => {
  return (
    <View style={tw`flex-row items-center justify-center bg-white border border-[#CAD3CA] rounded-2xl p-1`}>
      {tabs.map((tab, idx) => {
        const label = typeof tab === 'string' ? tab : tab.label;
        const value = typeof tab === 'string' ? tab : (tab.value ?? tab.label);
        const isActive = value === activeTab;
        const showIndicator = indicators?.[value];

        return (
          <TouchableOpacity
            key={`${value}-${idx}`}
            onPress={() => onTabChange(value)}
            style={[
              tw`flex-1 py-2 px-3 rounded-2xl flex-row items-center justify-center`,
              isActive && tw`bg-[#88AB8E] border border-[#88AB8E]`,
            ]}
          >
            <Text style={[tw`text-center text-[13px] font-semibold`, isActive ? tw`text-white` : tw`text-text-gray`]}>
              {label}
            </Text>
            {showIndicator && (
              <View style={tw`ml-1`}> 
                <View style={tw`w-5 h-5 rounded-full bg-red-500 items-center justify-center`}>
                  <AlertCircle color="white" size={12} strokeWidth={2} />
                </View>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default Tabs;
