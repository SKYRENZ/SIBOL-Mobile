import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import tw from '../utils/tailwind';

interface Stage4PanelProps {
  onNavigate: () => void;
}

export default function Stage4Panel({ onNavigate }: Stage4PanelProps) {
  return (
    <>
      {/* Header: toggle + ACTIVE badge + title + stage */}
      <View style={tw`flex-row items-center justify-between px-4 pt-3 pb-2`}>
        <View style={tw`flex-row items-center gap-2`}>
          {/* Toggle indicator dot */}
          <View style={{ width: 13, height: 13, borderRadius: 6.5, backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.4, shadowRadius: 2, elevation: 2, alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#2E523A' }} />
          </View>
          {/* Toggle pill */}
          <View style={tw`flex-row items-center`}>
            <Text style={{ fontSize: 7, color: '#2E523A', marginRight: 3 }}>0</Text>
            <View style={{ width: 23, height: 13, borderRadius: 8, backgroundColor: '#88AB8E', alignItems: 'flex-end', justifyContent: 'center', paddingRight: 2 }}>
              <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#fff' }} />
            </View>
          </View>
          {/* ACTIVE badge */}
          <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, borderWidth: 1, borderColor: '#88EB99', backgroundColor: 'rgba(168,253,182,0.83)' }}>
            <Text style={{ fontSize: 8, color: '#2E523A' }}>ACTIVE</Text>
          </View>
        </View>
        <View style={tw`items-end`}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#2E523A' }}>Biogas Collection</Text>
          <Text style={{ fontSize: 10, color: '#2E523A', textAlign: 'right' }}>Stage 4</Text>
        </View>
      </View>

      {/* Last logged row (ON / DATE / ACTION) */}
      <View style={tw`mx-4 mb-2 border border-[#B7BDB7] rounded-md px-3 py-2`}>
        <View style={{ flexDirection: 'row' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 6, fontWeight: '600', color: '#525552' }}>ON</Text>
          </View>
          <View style={{ flex: 2 }}>
            <Text style={{ fontSize: 6, fontWeight: '600', color: '#525552' }}>DATE</Text>
          </View>
          <View style={{ flex: 2 }}>
            <Text style={{ fontSize: 6, fontWeight: '600', color: '#525552' }}>ACTION</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', marginTop: 4 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 6, fontWeight: '600', color: '#525552' }}>renz.renz</Text>
          </View>
          <View style={{ flex: 2 }}>
            <Text style={{ fontSize: 6, fontWeight: '600', color: '#525552' }}>February 8, 2026 at 3:41 AM</Text>
          </View>
          <View style={{ flex: 2 }}>
            <Text style={{ fontSize: 6, fontWeight: '600', color: '#525552' }}>Logged waste input</Text>
          </View>
        </View>
      </View>

      {/* Biogas Meter Gauge row */}
      <View style={tw`mx-4 mb-2 border border-[#B7BDB7] rounded-md px-3 py-2`}>
        <View style={tw`flex-row items-center justify-between`}>
          <Text style={{ fontSize: 6, fontWeight: '600', color: 'rgba(82,85,82,0.69)' }}>BIOGAS METER GAUGE</Text>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <Text style={{ fontSize: 6, fontWeight: '600', color: '#525552' }}>NORMAL</Text>
            <Text style={{ fontSize: 6, fontWeight: '600', color: '#525552' }}>STABLE</Text>
          </View>
        </View>
        {/* Progress bar */}
        <View style={{ marginTop: 6 }}>
          <View style={{ width: '100%', height: 7, borderRadius: 8, backgroundColor: '#D9D9D9' }}>
            <View style={{ width: '80%', height: 7, borderRadius: 8, backgroundColor: '#6C8770' }} />
          </View>
          <Text style={{ fontSize: 4, fontWeight: '600', color: '#525552', alignSelf: 'flex-end', marginTop: 1 }}>80</Text>
        </View>
      </View>

      {/* Stage4Generator image with circular containers and nav arrows */}
      <View style={{ alignItems: 'center', justifyContent: 'center', marginVertical: 8, position: 'relative' }}>
        {/* Outer circle */}
        <View style={{ width: 174, height: 166, borderRadius: 87, borderWidth: 1, borderColor: '#B7BDB7', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
          {/* Inner shadow circle */}
          <View style={{ width: 150, height: 143, borderRadius: 75, backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.18, shadowRadius: 6, elevation: 4, alignItems: 'center', justifyContent: 'center' }}>
            <Image
              source={require('../../assets/Stage4Generator.png')}
              style={{ width: 145, height: 142 }}
              resizeMode="contain"
            />
          </View>
        </View>
        {/* Left nav arrow */}
        <TouchableOpacity
          onPress={onNavigate}
          style={{ position: 'absolute', left: 16, width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: '#B7BDB7', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}
        >
          <ChevronLeft size={14} color="#B7BDB7" />
        </TouchableOpacity>
        {/* Right nav arrow */}
        <TouchableOpacity
          onPress={onNavigate}
          style={{ position: 'absolute', right: 16, width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: '#B7BDB7', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}
        >
          <ChevronRight size={14} color="#B7BDB7" />
        </TouchableOpacity>
      </View>

      {/* Sensors section */}
      <View style={tw`mx-4 mb-4 border border-[#B7BDB7] rounded-md px-3 py-2`}>
        <View style={tw`flex-row justify-between items-center mb-2`}>
          <Text style={{ fontSize: 6, fontWeight: '600', color: '#525552' }}>SENSORS</Text>
          <TouchableOpacity style={{ backgroundColor: '#6C8770', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 }}>
            <Text style={{ fontSize: 8, color: '#fff', fontWeight: '600' }}>View All</Text>
          </TouchableOpacity>
        </View>

        {/* Pressure */}
        <View style={{ marginBottom: 6 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
            <Text style={{ fontSize: 6, fontWeight: '600', color: '#525552' }}>Pressure</Text>
            <Text style={{ fontSize: 6, fontWeight: '600', color: '#6C8770' }}>NORMAL</Text>
          </View>
          <View style={{ width: '70%', height: 7, borderRadius: 8, backgroundColor: '#D9D9D9' }}>
            <View style={{ width: '80%', height: 7, borderRadius: 8, backgroundColor: '#6C8770' }} />
          </View>
          <Text style={{ fontSize: 4, fontWeight: '600', color: '#525552', marginTop: 1 }}>80</Text>
        </View>

        {/* Methane */}
        <View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
            <Text style={{ fontSize: 6, fontWeight: '600', color: '#525552' }}>Methane</Text>
            <Text style={{ fontSize: 6, fontWeight: '600', color: '#6C8770' }}>NORMAL</Text>
          </View>
          <View style={{ width: '70%', height: 7, borderRadius: 8, backgroundColor: '#D9D9D9' }}>
            <View style={{ width: '72%', height: 7, borderRadius: 8, backgroundColor: '#6C8770' }} />
          </View>
          <Text style={{ fontSize: 4, fontWeight: '600', color: '#525552', marginTop: 1 }}>72</Text>
        </View>
      </View>
    </>
  );
}
