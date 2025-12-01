import React from 'react';
import { View, Text } from 'react-native';
import { MapPin, Weight } from 'lucide-react-native';
import tw from '../../utils/tailwind';

export interface ListCardProps {
  date: string;
  area: string;
  weight: string;
}

const ListCard: React.FC<ListCardProps> = ({ date, area, weight }) => {
  return (
    <View style={tw`flex-row rounded-2xl border border-[#CAD3CA] bg-white overflow-hidden mb-3`}>
      <View style={tw`w-[34px] bg-[#AFC8AD]`} />
      
      <View style={tw`flex-1 py-4 px-3`}>
        <Text style={tw`text-primary text-[15px] font-bold mb-3`}>
          {date}
        </Text>
        
        <View style={tw`flex-row items-center mb-2`}>
          <MapPin size={14} color="#000000" style={tw`mr-2`} />
          <Text style={tw`text-primary text-[13px]`}>
            <Text style={tw`font-bold`}>Area: </Text>
            <Text style={tw`font-semibold`}>{area}</Text>
          </Text>
        </View>
        
        <View style={tw`flex-row items-center`}>
          <Weight size={14} color="#000000" style={tw`mr-2`} />
          <Text style={tw`text-primary text-[13px]`}>
            <Text style={tw`font-bold`}>Weight collected: </Text>
            <Text style={tw`font-semibold`}>{weight}</Text>
          </Text>
        </View>
      </View>
    </View>
  );
};

export default ListCard;
