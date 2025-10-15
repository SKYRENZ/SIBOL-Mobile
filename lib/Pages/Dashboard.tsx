import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { 
  Text, 
  View, 
  ScrollView, 
  Image, 
  TextInput, 
  TouchableOpacity 
} from 'react-native';
import { SafeAreaView } from 'react-native';
import BottomNavbar from '../components/bottom_navbar';
import tw from '../utils/tailwind';

export default function Dashboard() {
  const [selectedCategory, setSelectedCategory] = useState('Carbon-rich');

  const categories = [
  {
    key: 'Carbon-rich',
    label: 'Carbon-rich\nfoods',
    icon: require('../../assets/carbon-rich.png'),
    large: false,
  },
  {
    key: 'Nitrogen-rich',
    label: 'Nitrogen-rich\nfoods',
    icon: require('../../assets/nitrogen-rich.png'),
    large: false,
  },
  {
    key: 'SIBOL',
    label: 'All about SIBOL\nBin',
    icon: require('../../assets/sibol-bin.png'),
    large: true,
  },
];


  return (
    <SafeAreaView style={tw`flex-1 bg-white pt-[50px]`}>
      <StatusBar style="dark" />
      <ScrollView style={tw`flex-1`} showsVerticalScrollIndicator={false}>
        <View style={tw`px-5 pt-5`}>
          <View style={tw`mb-5`}>
            <Text style={tw`text-[20px] font-bold text-[#2E523A] mb-1`}>Hi, User#39239!</Text>
            <Text style={tw`text-[11px] font-bold text-[#2E523A]`}>Welcome to SIBOL Community.</Text>
          </View>

          <View style={tw`bg-transparent mb-5 items-center justify-center w-[345px] h-[117px] self-center`}>
            <Image
              source={require('../../assets/segregation.png')}
              style={tw`w-[380px] h-[133px]`}
              resizeMode="contain"
            />
          </View>

          <View style={tw`bg-white rounded-[15px] border border-[rgba(0,0,0,0.25)] p-[15px] mb-5 flex-row justify-between items-center shadow-md`}>
            <Text style={tw`text-[13px] font-semibold text-[#6C8770] flex-1`}>
              You don't have a schedule{'\n'}for collection today!
            </Text>
            <TouchableOpacity style={tw`bg-[#2E523A] rounded-[15px] py-2 px-4`}>
              <Text style={tw`text-[11px] font-semibold text-white font-inter`}>View Map</Text>
            </TouchableOpacity>
          </View>

          <Text style={tw`text-[20px] font-bold text-[#2E523A] text-center mb-4`}>What to put in SIBOL Bin?</Text>

          <View style={tw`bg-[rgba(217,217,217,0.65)] rounded-[15px] flex-row items-center px-[15px] mb-6 h-[44px]`}>
            <TextInput
              style={tw`flex-1 text-[11px] font-semibold text-black`}
              placeholder="Search your food waste's category"
              placeholderTextColor="rgba(0, 0, 0, 0.3)"
            />
            <Image
              source={require('../../assets/search.png')}
              style={tw`w-4 h-4`}
            />
          </View>

          <View style={tw`flex-row justify-between mb-6 gap-[3]`}>
            {categories.map((category) => {
              const isSelected = selectedCategory === category.key;
              return (
                <TouchableOpacity
                  key={category.key}
                  onPress={() => setSelectedCategory(category.key)}
                  style={tw.style(
                    'flex-1 items-center bg-white rounded-[20px] w-[110px] h-[129px] py-[10px]',
                    isSelected && 'shadow-lg border border-[rgba(175,200,173,0.61)]'
                  )}
                >
                  <View
                    style={tw.style(
                      'w-[89px] h-[77px] bg-[rgba(175,200,173,0.61)] rounded-[15px] justify-center items-center mb-2',
                      isSelected && 'border-2 border-[rgba(175,200,173,0.61)]'
                    )}
                  >
                    <Image
                      source={category.icon}
                      style={tw.style(
                        category.large ? 'w-[80%] h-[80%]' : 'w-[65%] h-[65%]'
                      )}
                      resizeMode="contain"
                    />
                  </View>
                  <Text style={tw`text-[11px] font-semibold text-[#2E523A] text-center leading-[14px]`}>{category.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={tw`w-[305px] self-center border-b border-[#2E523A] opacity-30 mb-5`} />

          <View style={tw`flex-row justify-between mb-5 mx-5`}>
            <View style={tw`items-center`}>
              <TouchableOpacity style={tw`bg-white rounded-[15px] border border-[#2E523A] w-[89px] h-[77px] justify-center items-center`}>
                <Image
                  source={require('../../assets/bread.png')}
                  style={tw`w-[41px] h-[41px]`}
                  resizeMode="contain"
                />
              </TouchableOpacity>
              <Text style={tw`text-[11px] font-semibold text-[#2E523A] text-center mt-[6px]`}>Bread</Text>
            </View>

            <View style={tw`items-center`}>
              <TouchableOpacity style={tw`bg-white rounded-[15px] border border-[#2E523A] w-[89px] h-[77px] justify-center items-center`}>
                <Image
                  source={require('../../assets/pasta.png')}
                  style={tw`w-[41px] h-[41px]`}
                  resizeMode="contain"
                />
              </TouchableOpacity>
              <Text style={tw`text-[11px] font-semibold text-[#2E523A] text-center mt-[6px]`}>Pasta</Text>
            </View>

            <View style={tw`items-center`}>
              <TouchableOpacity style={tw`bg-white rounded-[15px] border border-[#2E523A] w-[89px] h-[77px] justify-center items-center`}>
                <Image
                  source={require('../../assets/rice.png')}
                  style={tw`w-[51px] h-[51px]`}
                  resizeMode="contain"
                />
              </TouchableOpacity>
              <Text style={tw`text-[11px] font-semibold text-[#2E523A] text-center mt-[6px]`}>Rice</Text>
            </View>
          </View>

          <View style={tw`flex-row justify-between mb-5 mx-5`}>
            <View style={tw`items-center`}>
              <TouchableOpacity style={tw`bg-white rounded-[15px] border border-[#2E523A] w-[89px] h-[77px] justify-center items-center`}>
                <Image
                  source={require('../../assets/fruits.png')}
                  style={tw`w-[51px] h-[51px]`}
                  resizeMode="contain"
                />
              </TouchableOpacity>
              <Text style={tw`text-[11px] font-semibold text-[#2E523A] text-center mt-[6px]`}>Fruits</Text>
            </View>

            <View style={tw`items-center`}>
              <TouchableOpacity style={tw`bg-white rounded-[15px] border border-[#2E523A] w-[89px] h-[77px] justify-center items-center`}>
                <Image
                  source={require('../../assets/cereal.png')}
                  style={tw`w-[41px] h-[41px]`}
                  resizeMode="contain"
                />
              </TouchableOpacity>
              <Text style={tw`text-[11px] font-semibold text-[#2E523A] text-center mt-[6px]`}>Cereal</Text>
            </View>

            <View style={tw`items-center`}>
              <TouchableOpacity style={tw`bg-white rounded-[15px] border border-[#2E523A] w-[89px] h-[77px] justify-center items-center`}>
                <Image
                  source={require('../../assets/potato.png')}
                  style={tw`w-[41px] h-[41px]`}
                  resizeMode="contain"
                />
              </TouchableOpacity>
              <Text style={tw`text-[11px] font-semibold text-[#2E523A] text-center mt-[6px]`}>Potato</Text>
            </View>
          </View>

          <View style={tw`h-10`} />
        </View>
      </ScrollView>
      <BottomNavbar />
    </SafeAreaView>
  );
}


