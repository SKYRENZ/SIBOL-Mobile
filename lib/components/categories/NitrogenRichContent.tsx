import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import tw from '../../utils/tailwind';
import { useResponsiveStyle } from '../../utils/responsiveStyles';

export default function NitrogenRichContent() {
  const styles = useResponsiveStyle(({ isSm, isMd }) => ({
    foodGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: isSm ? 16 : 20,
      alignItems: 'flex-start',
      width: '100%',
      maxWidth: isSm ? '100%' : 900,
      alignSelf: 'center',
      paddingHorizontal: isSm ? 0 : 16,
      marginBottom: 20,
    },
    foodItem: {
      width: isSm ? 89 : isMd ? 130 : 150,
      height: isSm ? 77 : isMd ? 110 : 130,
    },
  }));

  const nitrogenRichFoods = [
    { name: 'Egg', icon: require('../../../assets/nitrogen-rich/egg.png'), size: 41 },
    { name: 'Meat', icon: require('../../../assets/nitrogen-rich/meat.png'), size: 41 },
    { name: 'Fish', icon: require('../../../assets/nitrogen-rich/fish.png'), size: 51 },
    { name: 'Cabbage', icon: require('../../../assets/nitrogen-rich/cabbage.png'), size: 51 },
    { name: 'Cheese', icon: require('../../../assets/nitrogen-rich/cheese.png'), size: 41 },
    { name: 'Tofu', icon: require('../../../assets/nitrogen-rich/tofu.png'), size: 41 }
  ];

  return (
    <View style={styles.foodGrid}>
      {nitrogenRichFoods.map((food) => (
        <View key={food.name} style={tw`items-center`}>
          <TouchableOpacity style={[tw`bg-white rounded-[15px] border border-[#2E523A] justify-center items-center`, styles.foodItem]}>
            <Image
              source={food.icon}
              style={tw`w-[${food.size}px] h-[${food.size}px]`}
              resizeMode="contain"
            />
          </TouchableOpacity>
          <Text style={tw`text-[11px] font-semibold text-[#2E523A] text-center mt-[6px]`}>{food.name}</Text>
        </View>
      ))}
    </View>
  );
}