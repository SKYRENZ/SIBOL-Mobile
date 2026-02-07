import React, { useRef, useState } from 'react';
import { View, TouchableOpacity, Text, Modal, TouchableWithoutFeedback, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import tw from '../utils/tailwind';

type FilterOption = 'all' | 'today' | 'yesterday' | 'week' | 'month' | 'custom';

interface Props {
  value: FilterOption;
  onChange: (v: FilterOption) => void;
}

const options: Array<{ key: FilterOption; label: string }> = [
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'custom', label: 'Custom Date' },
];

export default function HistoryFilter({ value, onChange }: Props) {
  const [visible, setVisible] = useState(false);
  const buttonRef = useRef<View | null>(null);
  const [pos, setPos] = useState({ x: 0, y: 0, width: 0, height: 0 });

  const open = () => {
    if (buttonRef.current) {
      // measureInWindow sometimes available on ref via //@ts-ignore
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

  return (
    <View style={{ alignItems: 'center' }}>
      <View ref={buttonRef as any}>
        <TouchableOpacity onPress={open} style={tw`flex-row items-center bg-white border border-gray-200 rounded-md px-3 py-1`}>
          <MaterialIcons name="filter-list" size={18} color="#2E523A" />
          <Text style={{ color: '#2E523A', marginLeft: 6, fontSize: 13 }}>{value === 'all' ? 'Filter' : options.find(o => o.key === value)?.label}</Text>
        </TouchableOpacity>
      </View>

      {visible && (
        <Modal transparent animationType="none" visible={visible} onRequestClose={() => setVisible(false)}>
          <TouchableWithoutFeedback onPress={() => setVisible(false)}>
            <View style={{ flex: 1 }}>
              <View
                style={{
                  position: 'absolute',
                  top: pos.y + pos.height,
                  left: Math.max(8, pos.x - 80),
                  width: Math.min(Dimensions.get('window').width - 32, 200),
                  zIndex: 200,
                }}
              >
                <View style={tw`bg-white rounded-md shadow-lg border border-gray-200 p-1`}>
                  {options.map((opt) => (
                    <TouchableOpacity
                      key={opt.key}
                      onPress={() => handleSelect(opt.key)}
                      style={tw`px-3 py-2 ${opt.key !== options[options.length - 1].key ? 'border-b border-gray-100' : ''}`}
                    >
                      <Text style={[{ fontSize: 13 }, value === opt.key ? tw`text-primary` : tw`text-gray-800`]}>{opt.label}</Text>
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
