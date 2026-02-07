import React, { useRef, useState } from 'react';
import { View, TouchableOpacity, Text, Modal, TouchableWithoutFeedback, Dimensions } from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import tw from '../utils/tailwind';

type FilterOption = 'all' | 'today' | 'yesterday' | 'week' | 'month' | 'custom';

interface Props {
  value: FilterOption;
  onChange: (v: FilterOption) => void;
}

const options: Array<{ key: FilterOption; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
];

export default function HistoryFilter({ value, onChange }: Props) {
  const [visible, setVisible] = useState(false);
  const buttonRef = useRef<View | null>(null);
  const [pos, setPos] = useState({ x: 0, y: 0, width: 0, height: 0 });

  const open = () => {
    if (buttonRef.current) {
      // @ts-ignore
      buttonRef.current.measureInWindow((x: number, y: number, width: number, height: number) => {
        setPos({ x, y, width, height });
        setVisible(true);
      });
    } else {
      setVisible(true);
    }
  };

  const handleSelect = (k: FilterOption) => {
    onChange(k);
    setVisible(false);
  };

  const getDisplayLabel = () => {
    if (value === 'all') return 'Filter by';
    return options.find(o => o.key === value)?.label || 'Filter by';
  };

  return (
    <View style={{ alignItems: 'flex-end' }}>
      <View ref={buttonRef as any}>
        <TouchableOpacity 
          onPress={open} 
          style={tw`flex-row items-center bg-[#2E523A] rounded-lg px-3 py-2`}
        >
          <Text style={tw`text-white text-[13px] font-medium mr-1`}>
            {getDisplayLabel()}
          </Text>
          <ChevronDown size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {visible && (
        <Modal transparent animationType="none" visible={visible} onRequestClose={() => setVisible(false)}>
          <TouchableWithoutFeedback onPress={() => setVisible(false)}>
            <View style={{ flex: 1 }}>
              <View
                style={{
                  position: 'absolute',
                  top: pos.y + pos.height + 4,
                  right: Dimensions.get('window').width - pos.x - pos.width,
                  minWidth: 140,
                  zIndex: 200,
                }}
              >
                <View style={tw`bg-white rounded-lg shadow-lg border border-gray-200`}>
                  {options.map((opt, index) => (
                    <TouchableOpacity
                      key={opt.key}
                      onPress={() => handleSelect(opt.key)}
                      style={[
                        tw`px-4 py-3`,
                        index !== options.length - 1 && tw`border-b border-gray-100`,
                      ]}
                    >
                      <Text 
                        style={[
                          tw`text-[14px]`, 
                          value === opt.key ? tw`text-[#2E523A] font-semibold` : tw`text-gray-700`
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      )}
    </View>
  );
}
