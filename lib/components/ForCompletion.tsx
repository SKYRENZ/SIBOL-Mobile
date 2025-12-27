import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Modal, TouchableOpacity, TouchableWithoutFeedback, ScrollView, TextInput, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import tw from '../utils/tailwind';
import { X as LucideX, Paperclip as LucidePaperclip, Minus as LucideMinus, Plus as LucidePlus } from 'lucide-react-native';
import Button from './commons/Button';
import { getTicketRemarks, MaintenanceRemark } from '../services/maintenanceService';

interface Attachment {
  uri: string;
  name: string;
  type: string;
  size?: number;
}

interface ForCompletionProps {
  visible: boolean;
  onClose: () => void;
  onMarkDone?: (remarks: string, attachments: Attachment[]) => void;
  requestId?: string; // ✅ NEW: Add requestId prop
}

export default function ForCompletion({ visible, onClose, onMarkDone, requestId }: ForCompletionProps) {
  const [remarks, setRemarks] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  
  // ✅ NEW: State for historical remarks
  const [historicalRemarks, setHistoricalRemarks] = useState<MaintenanceRemark[]>([]);
  const [loadingRemarks, setLoadingRemarks] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  // ✅ NEW: Load remarks when modal opens
  useEffect(() => {
    if (visible && requestId) {
      loadRemarks();
    } else if (!visible) {
      setHistoricalRemarks([]);
    }
  }, [visible, requestId]);

  // ✅ NEW: Auto-scroll to bottom when remarks load
  useEffect(() => {
    if (historicalRemarks.length > 0 && scrollRef.current) {
      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [historicalRemarks.length]);

  // ✅ NEW: Load historical remarks
  const loadRemarks = async () => {
    if (!requestId) return;
    
    setLoadingRemarks(true);
    try {
      const data = await getTicketRemarks(Number(requestId));
      setHistoricalRemarks(data);
    } catch (error) {
      console.error('Error loading remarks:', error);
    } finally {
      setLoadingRemarks(false);
    }
  };

  const handleImagePick = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'Please allow access to your photo library');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      const newAttachments = result.assets.map((asset, index) => ({
        uri: asset.uri,
        name: asset.fileName || `completion_${Date.now()}_${index}.jpg`,
        type: asset.mimeType || 'image/jpeg',
        size: asset.fileSize,
      }));

      setAttachments(prev => [...prev, ...newAttachments]);
    }
  };

  const handleMarkDone = () => {
    if (attachments.length === 0) {
      Alert.alert('Missing Attachment', 'Please add at least one attachment');
      return;
    }

    if (onMarkDone) {
      onMarkDone(remarks, attachments);
    }

    setRemarks('');
    setAttachments([]);
    setHistoricalRemarks([]); // ✅ Clear remarks on close
    onClose();
  };

  const handleClose = () => {
    setRemarks('');
    setAttachments([]);
    setHistoricalRemarks([]); // ✅ Clear remarks on close
    onClose();
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const shadowStyle = {
    shadowColor: '#88AB8E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={tw`flex-1 bg-black bg-opacity-50 items-center justify-center`}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View
              style={[
                tw`bg-white p-4`,
                {
                  width: '85%',        
                  height: '45%',       
                  borderRadius: 10,
                  alignSelf: 'center',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.08,
                  shadowRadius: 6,
                  elevation: 6,
                },
              ]}
            >
              {/* Header */}
              <View style={tw`mb-4 relative`}>
                <View style={tw`items-center`}>
                  <Text style={tw`text-lg font-semibold text-text-gray text-center`}>Proof of maintenance</Text>
                </View>

                <TouchableOpacity
                  onPress={handleClose}
                  style={{ position: 'absolute', right: 16, top: 6, padding: 4 }} 
                  accessibilityLabel="Close"
                >
                  <LucideX color="#14532D" size={18} strokeWidth={2} />
                </TouchableOpacity>
              </View>
 
               <ScrollView ref={scrollRef} style={tw`flex-1`} showsVerticalScrollIndicator={false}>
                 {/* ✅ NEW: Historical Remarks Section - Only show if there are remarks */}
                 {historicalRemarks.length > 0 && (
                   <View style={tw`mb-6`}>
                     <Text style={tw`text-text-gray text-sm font-semibold mb-2`}>Previous Remarks:</Text>
                     <View style={tw`bg-gray-50 border border-gray-200 rounded-lg p-3 max-h-32`}>
                       <ScrollView showsVerticalScrollIndicator={false}>
                         {loadingRemarks ? (
                           <Text style={tw`text-gray-500 text-xs text-center py-2`}>Loading remarks...</Text>
                         ) : (
                           historicalRemarks.map((remark) => {
                             const isBrgy = remark.User_role === 'Barangay_staff' || remark.User_role === 'Admin';
                             return (
                               <View 
                                 key={remark.Remark_Id} 
                                 style={{ 
                                   marginBottom: 8, 
                                   alignSelf: isBrgy ? 'flex-start' : 'flex-end', 
                                   maxWidth: '78%' 
                                 }}
                               >
                                 <View style={{ marginBottom: 2, flexDirection: 'row' }}>
                                   <Text style={{ fontWeight: '600', fontSize: 11, color: '#1F4D36' }}>
                                     {isBrgy ? 'Barangay' : 'You'}
                                   </Text>
                                   <Text style={tw`text-xs text-gray-400 ml-2`}>
                                     {new Date(remark.Created_at).toLocaleString()}
                                   </Text>
                                 </View>

                                 <View 
                                   style={[
                                     { 
                                       padding: 8, 
                                       borderRadius: 8, 
                                       backgroundColor: isBrgy ? '#88AB8E' : '#FFFFFF' 
                                     }, 
                                     shadowStyle
                                   ]}
                                 >
                                   <Text style={{ color: isBrgy ? '#FFFFFF' : '#1F4D36', fontSize: 12 }}>
                                     {remark.Remark_text}
                                   </Text>
                                 </View>
                               </View>
                             );
                           })
                         )}
                       </ScrollView>
                     </View>
                   </View>
                 )}

                 {/* Remarks Section */}
                 <View style={tw`mb-6`}>
                  <Text style={tw`text-text-gray text-sm font-semibold mb-2`}>Remarks:</Text>
                  <TextInput
                    style={tw`border border-green-light rounded-lg p-3 text-gray-700 min-h-20 text-sm`}
                    placeholder="Add remarks (optional)"
                    placeholderTextColor="#AFC8AD"
                    value={remarks}
                    onChangeText={setRemarks}
                    multiline
                    textAlignVertical="top"
                  />
                 </View>
 
                 {/* Attachment Section */}
                 <View style={tw`mb-6`}>
                  <View style={tw`flex-row justify-between items-center mb-2`}>
                    <Text style={tw`text-text-gray text-sm font-semibold`}>Attachment</Text>
                    {attachments.length > 0 && (
                      <TouchableOpacity onPress={handleImagePick} style={tw`p-1`}>
                        <LucidePlus color="#14532D" size={18} strokeWidth={2} />
                      </TouchableOpacity>
                    )}
                  </View>
 
                  {attachments.length === 0 && (
                    <TouchableOpacity
                      onPress={handleImagePick}
                      style={tw`border border-green-light rounded-lg p-5 items-center justify-center min-h-24 bg-secondary`}
                    >
                      <View style={tw`items-center`}>
                        <LucidePaperclip color="#14532D" size={26} strokeWidth={2} />
                        <Text style={tw`text-text-gray text-xs font-medium text-center mt-2`}>
                          attach here the photos for proof
                        </Text>
                      </View>
                    </TouchableOpacity>
                  )}
 
                   {/* Attachments List */}
                   {attachments.length > 0 && (
                     <View style={tw`mt-4`}>
                       {attachments.map((attachment, index) => (
                         <View
                           key={index}
                           style={tw`flex-row justify-between items-center bg-secondary rounded-lg p-2 mb-2`}
                         >
                          <Text style={tw`text-gray-700 font-medium flex-1 mr-2 text-sm`} numberOfLines={1}>
                             {attachment.name}
                           </Text>
                           <TouchableOpacity
                             onPress={() => removeAttachment(index)}
                             style={tw`p-1`}
                           >
                            <LucideMinus color="#DC2626" size={16} strokeWidth={2} />
                           </TouchableOpacity>
                         </View>
                       ))}
                     </View>
                   )}
                 </View>
               </ScrollView>
 
               <View style={tw`mt-4 self-center w-full px-6`}> 
                <Button
                  title="Mark as Done"
                  onPress={handleMarkDone}
                  disabled={attachments.length === 0}
                  style={tw`w-full`} 
                  testID="for-completion-mark-done"
                />
               </View>
             </View>
           </TouchableWithoutFeedback>
         </View>
       </TouchableWithoutFeedback>
     </Modal>
   );
 }
