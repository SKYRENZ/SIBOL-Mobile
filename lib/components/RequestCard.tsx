import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import tw from '../utils/tailwind';

export interface RequestItem {
  id: string;
  title: string;
  description: string;
  requestNumber: string;
  dateAssigned: string;
  dueDate: string;
  remarksBrgy: string;
  remarksMaintenance: string;
  status: 'Pending' | 'Done' | 'For review' | 'Canceled';
  isChecked: boolean;
  isExpanded: boolean;
  hasAttachment: boolean;
}

interface RequestCardProps {
  request: RequestItem;
  onToggleExpand: (id: string) => void;
  onToggleCheck: (id: string) => void;
}

export default function RequestCard({ 
  request, 
  onToggleExpand, 
  onToggleCheck 
}: RequestCardProps) {
  return (
    <View
      style={tw`bg-green-light rounded-xl p-5 mb-6 relative overflow-visible`}
    >
      <View style={tw`flex-row items-center justify-between mb-3`}>
        <View style={tw`flex-row items-center gap-3`}>
          <Text style={tw`text-primary text-[13px] font-bold`}>
            {request.title}
          </Text>
          
          <View style={tw`bg-[#AFC8AD] border border-text-gray rounded-xl px-3 py-1`}>
            <Text style={tw`text-white text-[10px] font-bold`}>
              {request.status}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => onToggleCheck(request.id)}
          style={tw`w-[18px] h-[18px] rounded-sm border-2 border-[#49454F]`}
        >
          {request.isChecked && (
            <View style={tw`flex-1 bg-[#49454F]`} />
          )}
        </TouchableOpacity>
      </View>

      <Text style={tw`text-text-gray text-[10px] font-semibold mb-4`}>
        {request.description}
      </Text>

      <View style={tw`border-t border-green-light mb-4`} />

      <View style={tw`gap-2`}>
        <View style={tw`flex-row justify-between`}>
          <Text style={tw`text-[#4F6853] text-[11px] font-semibold`}>
            Request number:
          </Text>
          <Text style={tw`text-text-gray text-[11px] font-semibold`}>
            {request.requestNumber}
          </Text>
        </View>

        <View style={tw`flex-row justify-between`}>
          <Text style={tw`text-[#4F6853] text-[11px] font-semibold`}>
            Date Assigned:
          </Text>
          <Text style={tw`text-text-gray text-[11px] font-semibold`}>
            {request.dateAssigned}
          </Text>
        </View>

        <View style={tw`flex-row justify-between`}>
          <Text style={tw`text-[#4F6853] text-[11px] font-semibold`}>
            Due Date:
          </Text>
          <Text style={tw`text-text-gray text-[11px] font-semibold`}>
            {request.dueDate}
          </Text>
        </View>

        <View style={tw`flex-row justify-between`}>
          <Text style={tw`text-[#4F6853] text-[11px] font-semibold`}>
            Remarks from brgy:
          </Text>
          <Text style={tw`text-text-gray text-[11px] font-semibold`}>
            {request.remarksBrgy}
          </Text>
        </View>

        {request.isExpanded && (
          <>
            <View style={tw`flex-row justify-between`}>
              <Text style={tw`text-[#4F6853] text-[11px] font-semibold`}>
                Remarks from maintenance:
              </Text>
              <Text style={tw`text-text-gray text-[11px] font-semibold text-right flex-1 ml-4`}>
                {request.remarksMaintenance}
              </Text>
            </View>
            
            {request.hasAttachment && (
              <View style={tw`mt-1`}>
                <Text style={tw`text-[#4F6853] text-[11px] font-semibold mb-1`}>
                  Attachment:
                </Text>
                <View style={tw`items-center justify-center border-dashed border border-[#4F6853] h-16 rounded-lg bg-white/50`}>
                  <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <Path
                      d="M10 13.3333V3.33333M10 3.33333L6.66667 6.66667M10 3.33333L13.3333 6.66667M3.33333 13.3333L3.5 15.1667C3.58333 16.1667 4.16667 16.6667 5.33333 16.6667H14.6667C15.8333 16.6667 16.4167 16.1667 16.5 15.1667L16.6667 13.3333"
                      stroke="#4F6853"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                </View>
              </View>
            )}
            
            <View style={tw`mt-2 items-center`}>
              <TouchableOpacity
                style={tw`bg-[#2E523A] rounded-md py-2 px-6`}
              >
                <Text style={tw`text-white text-[11px] font-bold`}>Follow-up</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

     
      <View style={tw`h-4`} />

      <View style={tw`flex-row justify-end mt-2`}>
        <TouchableOpacity
          onPress={() => onToggleExpand(request.id)}
          style={tw`bg-[#88AB8E] rounded-full w-6 h-6 items-center justify-center`}
        >
          <Svg width="10" height="6" viewBox="0 0 10 6" fill="none">
            <Path
              d={request.isExpanded ? "M9 5L5 1L1 5" : "M1 1L5 5L9 1"}
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </TouchableOpacity>
      </View>
    </View>
  );
}
