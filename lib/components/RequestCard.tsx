import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, TextInput, ScrollView, Alert } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import tw from '../utils/tailwind';
import AttachmentModal from './AttachmentModal';
import CommentsSection from './CommentsSection';
import ForCompletion from './ForCompletion';
import { Image as LucideImage, Send as LucideSend, Check as LucideCheck } from 'lucide-react-native';
import { uploadToCloudinary, addAttachmentToTicket } from '../services/maintenanceService';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  onMarkDone?: (requestId: string, remarks: string, attachments: any[]) => Promise<void>;
}

export default function RequestCard({
  request,
  onToggleExpand,
  onToggleCheck,
  onMarkDone
}: RequestCardProps) {
  const [attachmentModalVisible, setAttachmentModalVisible] = useState(false);
  const [commentsModalVisible, setCommentsModalVisible] = useState(false);
  const [forCompletionModalVisible, setForCompletionModalVisible] = useState(false);

  const [inlineMessages, setInlineMessages] = useState<Array<{
    id: string;
    sender: 'Brgy' | 'Operator';
    message: string;
    time: string;
    hasAttachment: boolean;
    attachmentName?: string;
  }>>([
    { id: '1', sender: 'Brgy', message: 'Please make sure to replace the entire filter unit, not just the cartridge.', time: 'Aug 14, 2:30 PM', hasAttachment: false },
    { id: '2', sender: 'Operator', message: 'Understood. I will replace the complete unit tomorrow morning.', time: 'Aug 14, 3:15 PM', hasAttachment: false },
    { id: '3', sender: 'Brgy', message: 'Attached the reference photo.', time: 'Aug 14, 3:45 PM', hasAttachment: true, attachmentName: 'brokenfilter.png' },
  ]);
  const [inlineNewMsg, setInlineNewMsg] = useState('');
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  // ✅ Load current user
  useEffect(() => {
    const loadUser = async () => {
      try {
        const userStr = await AsyncStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          setCurrentUserId(user.Account_id || user.account_id);
        }
      } catch (err) {
        console.error('Error loading user:', err);
      }
    };
    loadUser();
  }, []);

  const handleInlineSend = () => {
    if (!inlineNewMsg.trim()) return;
    setInlineMessages([
      ...inlineMessages,
      { id: String(inlineMessages.length + 1), sender: 'Operator', message: inlineNewMsg, time: new Date().toLocaleTimeString(), hasAttachment: false }
    ]);
    setInlineNewMsg('');
  };

  const handleModalSend = (text: string) => {
    if (!text.trim()) return;
    setInlineMessages([
      ...inlineMessages,
      { id: String(inlineMessages.length + 1), sender: 'Operator', message: text, time: new Date().toLocaleTimeString(), hasAttachment: false }
    ]);
  };

  const handleMarkDone = async (remarks: string, attachments: any[]) => {
    if (!currentUserId) {
      Alert.alert('Error', 'User not found. Please sign in again.');
      return;
    }

    try {
      // ✅ Upload all attachments to Cloudinary first
      if (attachments.length > 0) {
        console.log(`Uploading ${attachments.length} completion attachment(s)`);
        
        const uploadResults = await Promise.allSettled(
          attachments.map(async (attachment) => {
            console.log('Uploading completion attachment:', attachment.name);
            
            const cloudinaryUrl = await uploadToCloudinary(
              attachment.uri,
              attachment.name,
              attachment.type
            );
            console.log('Cloudinary URL:', cloudinaryUrl);

            await addAttachmentToTicket(
              Number(request.id),
              currentUserId,
              cloudinaryUrl,
              attachment.name,
              attachment.type,
              attachment.size
            );
            console.log('Completion attachment added to ticket:', attachment.name);

            return attachment.name;
          })
        );

        const failed = uploadResults.filter(r => r.status === 'rejected');
        const succeeded = uploadResults.filter(r => r.status === 'fulfilled');

        // ✅ Then mark for verification
        if (onMarkDone) {
          await onMarkDone(request.id, remarks, attachments);
        }

        if (failed.length > 0) {
          console.error('Failed uploads:', failed);
          Alert.alert(
            'Partial Success',
            `Request marked for verification.\n${succeeded.length} of ${attachments.length} photos uploaded successfully.`
          );
        } else {
          console.log('All completion attachments uploaded successfully');
          Alert.alert('Success', `Request marked for verification with ${attachments.length} photo(s)`);
        }
      } else {
        // ✅ No attachments, just mark for verification
        if (onMarkDone) {
          await onMarkDone(request.id, remarks, attachments);
        }
        Alert.alert('Success', 'Request marked for verification');
      }
    } catch (error: any) {
      console.error('Error in handleMarkDone:', error);
      Alert.alert('Error', error?.message || 'Failed to mark request as done');
      throw error;
    }
  };

  const isPending = request.status === 'Pending';
  const buttonLabel = isPending ? 'For Completion' : 'Follow-up';

  const shadowStyle = {
    shadowColor: '#88AB8E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  };

  const inlineScrollRef = useRef<any>(null);

  useEffect(() => {
    if (inlineScrollRef.current && typeof inlineScrollRef.current.scrollToEnd === 'function') {
      inlineScrollRef.current.scrollToEnd({ animated: true });
    }
  }, [inlineMessages.length]);

  return (
    <View style={tw`mb-4 bg-green-light rounded-xl overflow-hidden`}> 
      <View
        style={tw`p-5 mb-6 relative overflow-visible`}
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
            style={tw`w-[18px] h-[18px] rounded-sm border-2 border-[#49454F] items-center justify-center`}
          >
            {request.isChecked && (
              <View style={[tw`flex-1 w-full h-full items-center justify-center rounded-sm`, { backgroundColor: '#2E523A' }]}>
                <LucideCheck color="#fff" size={14} strokeWidth={3} />
              </View>
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
              
              {isPending && request.hasAttachment && (
                <View style={tw`mb-3 flex-row items-center justify-between`}>
                  <Text style={tw`text-gray-700 font-semibold text-sm`}>Attachment from brgy</Text>
                  <TouchableOpacity onPress={() => setAttachmentModalVisible(true)}>
                    <Text style={tw`text-green-800 underline text-sm`}>brokenfilter.png</Text>
                  </TouchableOpacity>
                </View>
              )}

              {isPending && (
                <View style={tw`mb-4`}>
                  <View style={tw`flex-row items-center justify-between mb-2`}>
                    <Text style={tw`text-gray-700 font-semibold text-sm`}>
                      Comments
                    </Text>
                  </View>

                  <View style={tw`bg-white border border-gray-300 rounded p-3 relative`}>
                    <View style={tw`absolute right-3 top-3 z-10`}>
                      <TouchableOpacity onPress={() => setCommentsModalVisible(true)}>
                        <Text style={tw`text-gray-600 text-lg`}>⛶</Text>
                      </TouchableOpacity>
                    </View>

                    {/* messages area */}
                    <View style={tw`min-h-24 max-h-40`}>
                      <ScrollView ref={inlineScrollRef}>
                        {inlineMessages.map(msg => {
                          const isBrgy = msg.sender === 'Brgy';
                          return (
                            <View key={msg.id} style={{ marginBottom: 12, alignSelf: isBrgy ? 'flex-start' : 'flex-end', maxWidth: '78%' }}>
                              <View style={{ marginBottom: 4, flexDirection: 'row' }}>
                                <Text style={{ fontWeight: '600', fontSize: 13, color: '#1F4D36' }}>
                                  {isBrgy ? 'Barangay' : 'You'}
                                </Text>
                                <Text style={tw`text-xs text-gray-400 ml-2`}>{msg.time}</Text>
                              </View>

                              <View style={[{ padding: 10, borderRadius: 10, backgroundColor: isBrgy ? '#88AB8E' : '#FFFFFF' }, shadowStyle]}>
                                <Text style={{ color: isBrgy ? '#FFFFFF' : '#1F4D36', fontSize: 14 }}>
                                  {msg.message}
                                </Text>
                                {msg.hasAttachment && msg.attachmentName && (
                                  <TouchableOpacity onPress={() => setAttachmentModalVisible(true)} style={tw`mt-2`}>
                                    <Text style={{ color: '#F9F4D3', textDecorationLine: 'underline', fontSize: 12 }}>{msg.attachmentName}</Text>
                                  </TouchableOpacity>
                                )}
                              </View>
                            </View>
                          );
                        })}
                      </ScrollView>
                     </View>

                    <View style={tw`mt-3`}>
                      <View style={tw`flex-row items-center bg-white border border-gray-200 rounded-full px-3`} >
                        <TouchableOpacity onPress={() => { /* open image picker */ }} style={{ marginRight: 8 }}>
                          <LucideImage color="#88AB8E" style={{ opacity: 0.89 }} size={20} strokeWidth={1.5} />
                        </TouchableOpacity>

                        <TextInput
                          style={[tw`flex-1 text-sm`, { paddingVertical: 0, height: 24, textAlignVertical: 'center' }]}
                          placeholder="Type a message..."
                          placeholderTextColor="#8A8A8A"
                          value={inlineNewMsg}
                          onChangeText={setInlineNewMsg}
                          multiline={false}
                        />

                        <TouchableOpacity onPress={handleInlineSend} style={{ marginLeft: 8 }}>
                          <LucideSend color="#88AB8E" style={{ opacity: 0.89 }} size={20} strokeWidth={1.5} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>
              )}

              <View style={tw`mt-2 items-center`}>
                <TouchableOpacity
                  onPress={() => setForCompletionModalVisible(true)}
                  style={tw`bg-[#2E523A] rounded-md py-2 px-6`}
                >
                  <Text style={tw`text-white text-[11px] font-bold`}>
                    {buttonLabel}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        <View style={tw`h-4`} />

        <View style={tw`mt-2 relative`}>
          {!request.isExpanded && isPending && (
            <View style={[{ position: 'absolute', left: 0, right: 0, alignItems: 'center' }]}>
              <TouchableOpacity
                onPress={() => setForCompletionModalVisible(true)}
                style={tw`bg-[#2E523A] rounded-md py-2 px-4`}
              >
                <Text style={tw`text-white text-[11px] font-bold`}>{buttonLabel}</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            onPress={() => onToggleExpand(request.id)}
            style={[tw`bg-[#88AB8E] rounded-full w-6 h-6 items-center justify-center`, { position: 'absolute', right: 0 }]}
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

      <AttachmentModal
        visible={attachmentModalVisible}
        onClose={() => setAttachmentModalVisible(false)}
        filename="brokenfilter.png"
      />

      <CommentsSection
        visible={commentsModalVisible}
        onClose={() => setCommentsModalVisible(false)}
        messages={inlineMessages}
        onSendMessage={handleModalSend}
      />

      <ForCompletion
        visible={forCompletionModalVisible}
        onClose={() => setForCompletionModalVisible(false)}
        onMarkDone={handleMarkDone}
      />
    </View>
  );
}
