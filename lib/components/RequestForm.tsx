import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Paperclip, X, ChevronDown } from 'lucide-react-native';
import Button from './commons/Button';
import { createTicket, uploadToCloudinary, addAttachmentToTicket, getPriorities } from '../services/maintenanceService';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
        
        const uploadPromises = attachments.map(async (attachment) => {
          try {
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
          } catch (uploadError) {
            console.error('Error uploading attachment:', attachment.name, uploadError);
            throw uploadError;
          }
        });

        try {
          await Promise.all(uploadPromises);
          console.log('All attachments uploaded successfully');
        } catch (uploadError) {
          console.error('Error uploading attachments:', uploadError);
          Alert.alert('Warning', 'Ticket created but some attachments failed to upload');
        }
      }

      Alert.alert('Success', 'Maintenance request created successfully');
      
      if (onSave) {
        onSave({
          request,
          description,
          sibolMachineNo,
          area,
          date: selectedDate,
          attachment: attachments[0] || null, // Keep for backward compatibility
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

  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={styles.centered}
            >
              <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
              >
                <View style={styles.card}>
                  <View style={styles.headingContainer}>
                    <Text style={styles.heading}>Request Form</Text>
                    <TouchableOpacity
                      onPress={onClose}
                      style={styles.closeButton}
                      activeOpacity={0.7}
                      disabled={loading}
                    >
                      <X color="#88AB8E" size={20} strokeWidth={2.5} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.fieldContainer}>
                    <Text style={styles.label}>Request:</Text>
                    <TextInput
                      value={request}
                      onChangeText={(text) => {
                        setRequest(text);
                        if (error) setError(null);
                      }}
                      placeholder="Enter request"
                      placeholderTextColor="#B0C4B0"
                      style={styles.input}
                      maxLength={100}
                      editable={!loading}
                    />
                  </View>

                  <View style={styles.fieldContainer}>
                    <Text style={styles.label}>Description:</Text>
                    <TextInput
                      value={description}
                      onChangeText={(text) => {
                        setDescription(text);
                        if (error) setError(null);
                      }}
                      placeholder="Enter description"
                      placeholderTextColor="#B0C4B0"
                      style={styles.input}
                      maxLength={200}
                      editable={!loading}
                    />
                  </View>

                  <View style={styles.fieldContainer}>
                    <Text style={styles.label}>Priority:</Text>
                    <TouchableOpacity
                      onPress={() => !loading && setShowPriorityPicker(true)}
                      style={[styles.input, styles.pickerInput]}
                      disabled={loading}
                    >
                      <Text style={priority ? styles.pickerText : styles.pickerPlaceholder}>
                        {priority || 'Select priority'}
                      </Text>
                      <ChevronDown color="#88AB8E" size={18} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.fieldContainer}>
                    <Text style={styles.label}>Machine ID:</Text>
                    <TextInput
                      value={sibolMachineNo}
                      onChangeText={(text) => {
                        setSibolMachineNo(text);
                        if (error) setError(null);
                      }}
                      placeholder="Enter machine number"
                      placeholderTextColor="#B0C4B0"
                      style={styles.input}
                      maxLength={50}
                      editable={!loading}
                    />
                  </View>

                  <View style={styles.rowContainer}>
                    <View style={[styles.fieldContainer, { flex: 1, marginRight: 8 }]}>
                      <Text style={styles.label}>Area:</Text>
                      <TextInput
                        value={area}
                        onChangeText={(text) => {
                          setArea(text);
                          if (error) setError(null);
                        }}
                        placeholder="Enter area"
                        placeholderTextColor="#B0C4B0"
                        style={styles.input}
                        maxLength={50}
                        editable={!loading}
                      />
                    </View>

                    <View style={[styles.fieldContainer, { flex: 1, marginLeft: 8 }]}>
                      <Text style={styles.label}>Date:</Text>
                      <TextInput
                        style={styles.input}
                        value={formatDateDisplay()}
                        editable={false}
                        placeholder="MM/DD/YYYY"
                        placeholderTextColor="#B0C4B0"
                      />
                    </View>
                  </View>

                  <View style={styles.fieldContainer}>
                    <Text style={styles.label}>Attachments</Text>
                    
                    {/* ✅ Show selected attachments */}
                    {attachments.length > 0 && (
                      <View style={styles.attachmentsList}>
                        {attachments.map((att, index) => (
                          <View key={index} style={styles.attachmentItem}>
                            <Text style={styles.attachmentName} numberOfLines={1}>
                              {att.name}
                            </Text>
                            <TouchableOpacity 
                              onPress={() => removeAttachment(index)}
                              style={styles.removeButton}
                            >
                              <X color="#C65C5C" size={16} />
                            </TouchableOpacity>
                          </View>
                        ))}
                      </View>
                    )}

                    <TouchableOpacity
                      onPress={handleImagePick}
                      style={styles.attachmentButton}
                      disabled={loading}
                    >
                      <Paperclip
                        color="#88AB8E"
                        size={14}
                        strokeWidth={2}
                      />
                      <Text style={styles.attachmentText}>
                        {attachments.length > 0 
                          ? `${attachments.length} file(s) selected • Tap to add more`
                          : 'attach here the photos for proof'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {error && <Text style={styles.error}>{error}</Text>}

                  <View style={styles.buttonContainer}>
                    <Button
                      title={loading ? 'Creating...' : 'Add'}
                      onPress={validateAndSave}
                      variant="primary"
                      style={styles.button}
                      disabled={loading}
                    />
                  </View>

                  {loading && (
                    <View style={styles.loadingOverlay}>
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
          <View style={styles.pickerBackdrop}>
            <TouchableWithoutFeedback>
              <View style={styles.pickerContainer}>
                <Text style={styles.pickerTitle}>Select Priority</Text>
                <ScrollView style={styles.pickerScroll}>
                  {priorities.map((p) => (
                    <TouchableOpacity
                      key={p.Priority_id}
                      style={[
                        styles.pickerOption,
                        priority === p.Priority && styles.pickerOptionSelected
                      ]}
                      onPress={() => {
                        setPriority(p.Priority);
                        setShowPriorityPicker(false);
                        if (error) setError(null);
                      }}
                    >
                      <Text style={[
                        styles.pickerOptionText,
                        priority === p.Priority && styles.pickerOptionTextSelected
                      ]}>
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

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  centered: {
    width: '100%',
    alignItems: 'center',
    overflow: 'visible',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    overflow: 'visible',
  },
  card: {
    width: '100%',
    maxWidth: 345,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 20,
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 4,
    elevation: 8,
    overflow: 'visible',
    position: 'relative',
  },
  headingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
    position: 'relative',
  },
  heading: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: '#6C8770',
    flex: 1,
  },
  closeButton: {
    position: 'absolute',
    right: 0,
    padding: 4,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#88AB8E',
    marginBottom: 6,
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#88AB8E',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 12,
    color: '#2E523A',
    fontWeight: '500',
    minHeight: 40,
    justifyContent: 'center',
  },
  pickerInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerText: {
    fontSize: 12,
    color: '#2E523A',
    fontWeight: '500',
  },
  pickerPlaceholder: {
    fontSize: 12,
    color: '#B0C4B0',
    fontWeight: '500',
  },
  attachmentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#AFC8AD',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 42,
    borderBottomWidth: 2,
    borderBottomColor: '#e0e7e3',
  },
  attachmentText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#88AB8E',
    textDecorationLine: 'underline',
    marginLeft: 8,
    textAlign: 'center',
  },
  error: {
    color: '#C65C5C',
    fontSize: 12,
    marginBottom: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  buttonContainer: {
    marginTop: 8,
  },
  button: {
    minHeight: 44,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 14,
  },
  pickerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '100%',
    maxWidth: 300,
    maxHeight: 300,
    overflow: 'hidden',
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E523A',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  pickerScroll: {
    maxHeight: 240,
  },
  pickerOption: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  pickerOptionSelected: {
    backgroundColor: '#E8F5E9',
  },
  pickerOptionText: {
    fontSize: 14,
    color: '#2E523A',
    fontWeight: '500',
  },
  pickerOptionTextSelected: {
    color: '#2E523A',
    fontWeight: '700',
  },
  attachmentsList: {
    marginBottom: 8,
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 6,
  },
  attachmentName: {
    flex: 1,
    fontSize: 12,
    color: '#2E523A',
    fontWeight: '500',
    marginRight: 8,
  },
  removeButton: {
    padding: 4,
  },
});
