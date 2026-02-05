import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Paperclip, X, ChevronDown } from 'lucide-react-native';
import Button from '../commons/Button';
import { createTicket, uploadToCloudinary, addAttachmentToTicket, getPriorities } from '../../services/maintenanceService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AttachmentThumbnails from '../commons/AttachmentThumbnails'; // ✅ add
import tw from 'twrnc';

interface Attachment {
  uri: string;
  name: string;
  type: string;
  size?: number;
}

interface RequestFormProps {
  visible: boolean;
  onClose: () => void;
  onSave?: (payload: {
    request: string;
    description: string;
    sibolMachineNo: string;
    area: string;
    date: Date;
    attachment: Attachment | null;
  }) => void;
}

export default function RequestForm({
  visible,
  onClose,
  onSave,
}: RequestFormProps) {
  const [request, setRequest] = useState('');
  const [description, setDescription] = useState('');
  const [sibolMachineNo, setSibolMachineNo] = useState('');
  const [area, setArea] = useState('');
  const [priority, setPriority] = useState('');
  const [priorities, setPriorities] = useState<Array<{ Priority_id: number; Priority: string }>>([]);
  const [showPriorityPicker, setShowPriorityPicker] = useState(false);
  const [selectedDate] = useState<Date>(new Date());
  const [attachments, setAttachments] = useState<Attachment[]>([]); // ✅ Changed to array
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [kavKey, setKavKey] = useState(0);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

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

  useEffect(() => {
    if (visible) {
      // Fetch priorities when modal opens
      const fetchPriorities = async () => {
        try {
          const data = await getPriorities();
          setPriorities(data);
          // Set default priority to first option if available
          if (data.length > 0 && !priority) {
            setPriority(data[0].Priority);
          }
        } catch (err) {
          console.error('Error fetching priorities:', err);
        }
      };
      fetchPriorities();
    }
  }, [visible]);

  useEffect(() => {
    if (!visible) {
      resetForm();
    }
  }, [visible]);

  const resetForm = () => {
    setRequest('');
    setDescription('');
    setSibolMachineNo('');
    setArea('');
    setPriority('');
    setAttachments([]); // ✅ Reset array
    setError(null);
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
      allowsMultipleSelection: true, // ✅ Enable multiple selection
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      const newAttachments = result.assets.map((asset, index) => ({
        uri: asset.uri,
        name: asset.fileName || `image_${Date.now()}_${index}.jpg`,
        type: asset.mimeType || 'image/jpeg',
        size: asset.fileSize,
      }));

      setAttachments(prev => [...prev, ...newAttachments]); // ✅ Add to existing
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const validateAndSave = async () => {
    setError(null);

    if (!request || !request.trim()) {
      setError('Please enter a request');
      return;
    }

    if (!description || !description.trim()) {
      setError('Please enter a description');
      return;
    }

    if (!priority) {
      setError('Please select a priority');
      return;
    }

    if (!currentUserId) {
      setError('User not found. Please sign in again.');
      return;
    }

    setLoading(true);

    try {
      const dueDate = selectedDate.toISOString().split('T')[0];

      const ticketData = {
        title: request,
        details: description,
        priority: priority as 'Critical' | 'Urgent' | 'Mild',
        created_by: currentUserId,
        due_date: dueDate,
      };

      console.log('Creating ticket with data:', ticketData);
      const createdTicket = await createTicket(ticketData);
      console.log('Ticket created:', createdTicket);

      // ✅ Upload multiple attachments
      if (attachments.length > 0 && createdTicket.Request_Id) {
        console.log(`Uploading ${attachments.length} attachment(s)`);
        
        // ✅ Track successful and failed uploads
        const uploadResults = await Promise.allSettled(
          attachments.map(async (attachment) => {
            console.log('Uploading attachment:', attachment.name);
            
            const cloudinaryUrl = await uploadToCloudinary(
              attachment.uri, 
              attachment.name,
              attachment.type
            );
            console.log('Cloudinary URL:', cloudinaryUrl);

            await addAttachmentToTicket(
              createdTicket.Request_Id,
              currentUserId,
              cloudinaryUrl,
              attachment.name,
              attachment.type,
              attachment.size
            );
            console.log('Attachment added to ticket:', attachment.name);
            
            return attachment.name;
          })
        );

        const failed = uploadResults.filter(r => r.status === 'rejected');
        const succeeded = uploadResults.filter(r => r.status === 'fulfilled');

        if (failed.length > 0) {
          console.error('Failed uploads:', failed);
          Alert.alert(
            'Partial Success', 
            `Ticket created. ${succeeded.length} of ${attachments.length} attachments uploaded successfully.`
          );
        } else {
          console.log('All attachments uploaded successfully');
          Alert.alert('Success', 'Maintenance request created with all attachments');
        }
      } else {
        Alert.alert('Success', 'Maintenance request created successfully');
      }
      
      if (onSave) {
        onSave({
          request,
          description,
          sibolMachineNo,
          area,
          date: selectedDate,
          attachment: attachments[0] || null,
        });
      }

      resetForm();
      onClose();
    } catch (err: any) {
      console.error('Error creating ticket:', err);
      setError(err?.message || 'Failed to create maintenance request');
    } finally {
      setLoading(false);
    }
  };

  const formatDateDisplay = () => {
    return selectedDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Keyboard handling (prevents cutoff + fixes "stuck gap" on some Android devices)
  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
      if (Platform.OS === 'android') {
        // remount after keyboard fully dismisses to avoid leftover whitespace
        setTimeout(() => setKavKey(k => k + 1), 220);
      }
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={tw`flex-1 bg-black/35 justify-center items-center p-4`}>
        <TouchableWithoutFeedback>
          <KeyboardAvoidingView
            key={kavKey}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
            style={tw`flex-1 w-full`}
          >
            <ScrollView
              keyboardShouldPersistTaps="handled"
              // Center when closed; allow natural top layout + scrolling when keyboard is open
              contentContainerStyle={[
                tw`px-0 py-4`,
                { flexGrow: 1, justifyContent: keyboardVisible ? 'flex-start' : 'center' },
              ]}
            >
              <View
                style={[
                  tw`w-full max-w-[345px] bg-white rounded-[14px] p-5 pb-6 relative`,
                  { alignSelf: 'center' },
                  {
                    shadowColor: '#000',
                    shadowOpacity: 0.15,
                    shadowOffset: { width: 0, height: 4 },
                    shadowRadius: 4,
                    elevation: 8,
                  },
                ]}
              >
                <View style={tw`flex-row justify-between items-center mb-4 relative`}>
                  <Text style={tw`flex-1 text-center text-[18px] font-bold text-[#6C8770]`}>
                    Request Form
                  </Text>
                   <TouchableOpacity
                     onPress={onClose}
                     style={tw`absolute right-0 p-1`}
                     activeOpacity={0.7}
                     disabled={loading}
                   >
                     <X color="#88AB8E" size={20} strokeWidth={2.5} />
                   </TouchableOpacity>
                 </View>

                  <View style={tw`mb-4`}>
                    <Text style={tw`text-[13px] font-semibold text-[#88AB8E] mb-1.5`}>Request:</Text>
                     <TextInput
                       value={request}
                       onChangeText={(text) => {
                         setRequest(text);
                         if (error) setError(null);
                       }}
                       placeholder="Enter request"
                       placeholderTextColor="#B0C4B0"
                       style={tw`bg-white border border-[#88AB8E] rounded-[10px] px-3 py-2.5 text-[12px] text-[#2E523A] font-medium min-h-[40px]`}
                       maxLength={100}
                       editable={!loading}
                     />
                   </View>

                  <View style={tw`mb-4`}>
                    <Text style={tw`text-[13px] font-semibold text-[#88AB8E] mb-1.5`}>Description:</Text>
                     <TextInput
                       value={description}
                       onChangeText={(text) => {
                         setDescription(text);
                         if (error) setError(null);
                       }}
                       placeholder="Enter description"
                       placeholderTextColor="#B0C4B0"
                       style={tw`bg-white border border-[#88AB8E] rounded-[10px] px-3 py-2.5 text-[12px] text-[#2E523A] font-medium min-h-[40px]`}
                       maxLength={200}
                       editable={!loading}
                     />
                   </View>

                  <View style={tw`mb-4`}>
                    <Text style={tw`text-[13px] font-semibold text-[#88AB8E] mb-1.5`}>Priority:</Text>
                     <TouchableOpacity
                       onPress={() => !loading && setShowPriorityPicker(true)}
                       style={tw`bg-white border border-[#88AB8E] rounded-[10px] px-3 py-2.5 min-h-[40px] flex-row items-center justify-between`}
                       disabled={loading}
                     >
                       <Text style={priority ? tw`text-[12px] text-[#2E523A] font-medium` : tw`text-[12px] text-[#B0C4B0] font-medium`}>
                         {priority || 'Select priority'}
                       </Text>
                       <ChevronDown color="#88AB8E" size={18} />
                     </TouchableOpacity>
                   </View>

                  <View style={tw`mb-4`}>
                    <Text style={tw`text-[13px] font-semibold text-[#88AB8E] mb-1.5`}>Machine ID:</Text>
                     <TextInput
                       value={sibolMachineNo}
                       onChangeText={(text) => {
                         setSibolMachineNo(text);
                         if (error) setError(null);
                       }}
                       placeholder="Enter machine number"
                       placeholderTextColor="#B0C4B0"
                       style={tw`bg-white border border-[#88AB8E] rounded-[10px] px-3 py-2.5 text-[12px] text-[#2E523A] font-medium min-h-[40px]`}
                       maxLength={50}
                       editable={!loading}
                     />
                   </View>

                  <View style={tw`flex-row justify-between mb-4`}>
                    <View style={tw`flex-1 mr-2`}>
                      <Text style={tw`text-[13px] font-semibold text-[#88AB8E] mb-1.5`}>Area:</Text>
                       <TextInput
                         value={area}
                         onChangeText={(text) => {
                           setArea(text);
                           if (error) setError(null);
                         }}
                         placeholder="Enter area"
                         placeholderTextColor="#B0C4B0"
                         style={tw`bg-white border border-[#88AB8E] rounded-[10px] px-3 py-2.5 text-[12px] text-[#2E523A] font-medium min-h-[40px]`}
                         maxLength={50}
                         editable={!loading}
                       />
                     </View>

                    <View style={tw`flex-1 ml-2`}>
                      <Text style={tw`text-[13px] font-semibold text-[#88AB8E] mb-1.5`}>Date:</Text>
                       <TextInput
                        style={tw`bg-white border border-[#88AB8E] rounded-[10px] px-3 py-2.5 text-[12px] text-[#2E523A] font-medium min-h-[40px]`}
                         value={formatDateDisplay()}
                         editable={false}
                         placeholder="MM/DD/YYYY"
                         placeholderTextColor="#B0C4B0"
                       />
                     </View>
                   </View>

                  <View style={tw`mb-4`}>
                    <Text style={tw`text-[13px] font-semibold text-[#88AB8E] mb-1.5`}>Attachments</Text>

                    <AttachmentThumbnails
                      items={attachments}
                      onRemove={removeAttachment}
                      showCount
                      style={{ marginBottom: attachments.length > 0 ? 8 : 0 }}
                    />

                    <TouchableOpacity
                      onPress={handleImagePick}
                      style={tw`flex-row items-center justify-center bg-white border border-[#AFC8AD] rounded-[10px] px-3 py-3 min-h-[42px] border-b-2 border-b-[#e0e7e3]`}
                      disabled={loading}
                    >
                      <Paperclip color="#88AB8E" size={14} strokeWidth={2} />
                      <Text style={tw`text-[11px] font-semibold text-[#88AB8E] underline ml-2 text-center`}>
                        {attachments.length > 0
                          ? `${attachments.length} file(s) selected • Tap to add more`
                          : 'attach here the photos for proof'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {error && (
                    <Text style={tw`text-[#C65C5C] text-[12px] mb-3 text-center font-medium`}>
                      {error}
                    </Text>
                  )}

                  <View style={tw`mt-2`}>
                     <Button
                       title={loading ? 'Creating...' : 'Add'}
                       onPress={validateAndSave}
                       variant="primary"
                       style={tw`min-h-[44px]`}
                       disabled={loading}
                     />
                   </View>

                   {loading && (
                    <View style={tw`absolute inset-0 bg-white/80 justify-center items-center rounded-[14px]`}>
                       <ActivityIndicator size="large" color="#2E523A" />
                     </View>
                   )}
                 </View>
              </ScrollView>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>

      {/* Priority Picker Modal */}
      <Modal
        visible={showPriorityPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPriorityPicker(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowPriorityPicker(false)}>
          <View style={tw`flex-1 bg-black/50 justify-center items-center p-5`}>
            <TouchableWithoutFeedback>
              <View style={tw`bg-white rounded-[12px] w-full max-w-[300px] max-h-[300px] overflow-hidden`}>
                <Text style={tw`text-[16px] font-semibold text-[#2E523A] p-4 border-b border-[#E0E0E0]`}>
                  Select Priority
                </Text>
                <ScrollView style={tw`max-h-[240px]`}>
                  {priorities.map((p) => (
                    <TouchableOpacity
                      key={p.Priority_id}
                      style={priority === p.Priority ? tw`py-3.5 px-4 border-b border-[#F0F0F0] bg-[#E8F5E9]` : tw`py-3.5 px-4 border-b border-[#F0F0F0]`}
                      onPress={() => {
                        setPriority(p.Priority);
                        setShowPriorityPicker(false);
                        if (error) setError(null);
                      }}
                    >
                      <Text style={priority === p.Priority ? tw`text-[14px] text-[#2E523A] font-bold` : tw`text-[14px] text-[#2E523A] font-medium`}>
                        {p.Priority}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </Modal>
  );
}
