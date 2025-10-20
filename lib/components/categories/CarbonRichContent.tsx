import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import tw from '../../utils/tailwind';
import { useResponsiveStyle } from '../../utils/responsiveStyles';

export default function CarbonRichContent() {
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

  const carbonRichFoods = [
    { name: 'Bread', icon: require('../../../assets/carbon-rich/bread.png'), size: 41 },
    { name: 'Pasta', icon: require('../../../assets/carbon-rich/pasta.png'), size: 41 },
    { name: 'Rice', icon: require('../../../assets/carbon-rich/rice.png'), size: 51 },
    { name: 'Fruits', icon: require('../../../assets/carbon-rich/fruits.png'), size: 51 },
    { name: 'Cereal', icon: require('../../../assets/carbon-rich/cereal.png'), size: 41 },
    { name: 'Potato', icon: require('../../../assets/carbon-rich/potato.png'), size: 41 }
  ];

  return (
    <View style={styles.foodGrid}>
      {carbonRichFoods.map((food) => (
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