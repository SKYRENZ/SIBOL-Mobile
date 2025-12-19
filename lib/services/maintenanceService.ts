import apiClient from './apiClient';
import { Platform } from 'react-native';

export interface MaintenanceTicket {
  Request_Id: number;
  Title: string;
  Details?: string;
  Priority?: string;
  Priority_Id?: number;
  Status?: string;
  Main_stat_id?: number;
  Created_by: number;
  Assigned_to?: number;
  Due_date?: string;
  Request_date?: string;
  Completed_at?: string;
  Attachment?: string;
  Remarks?: string;
  AssignedOperatorName?: string;
}

export interface CreateTicketPayload {
  title: string;
  details?: string;
  priority?: 'Critical' | 'Urgent' | 'Mild';
  created_by: number;
  due_date?: string;
  attachment?: string;
}

export interface OperatorActionPayload {
  operator_account_id: number;
}

export interface AddRemarksPayload {
  remarks: string;
}

// ✅ UPLOAD TO BACKEND (which handles Cloudinary upload)
export async function uploadToCloudinary(uri: string, fileName: string, mimeType?: string): Promise<string> {
  try {
    const formData = new FormData();
    
    console.log(`[Upload Start] ${fileName}`, { uri, mimeType, platform: Platform.OS });
    
    if (Platform.OS === 'web') {
      const blobResponse = await fetch(uri);
      if (!blobResponse.ok) {
        throw new Error(`Failed to fetch blob from ${uri}`);
      }
      const blob = await blobResponse.blob();
      
      // ✅ Check blob size before upload
      const sizeMB = (blob.size / (1024 * 1024)).toFixed(2);
      if (blob.size > 10 * 1024 * 1024) {
        throw new Error(`File "${fileName}" is too large (${sizeMB}MB). Maximum size is 10MB.`);
      }
      
      const file = new File([blob], fileName, { type: mimeType || 'image/jpeg' });
      formData.append('file', file);
      console.log('Web upload - File object created:', { 
        name: fileName, 
        size: `${sizeMB}MB`, 
        type: file.type 
      });
    } else {
      formData.append('file', {
        uri: uri,
        name: fileName,
        type: mimeType || 'image/jpeg',
      } as any);
      console.log('Native upload - FormData with URI:', { uri, fileName, mimeType });
    }

    const authHeader = await getAuthHeader();
    
    const uploadResponse = await fetch(`${apiClient.defaults.baseURL}/api/upload`, {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': authHeader,
      },
    });

    console.log(`[Upload Response] ${fileName}:`, uploadResponse.status);

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText || 'Upload failed' };
      }
      
      // ✅ Provide clearer error messages
      const errorMessage = errorData.message || `Upload failed with status ${uploadResponse.status}`;
      throw new Error(errorMessage);
    }

    const data = await uploadResponse.json();
    console.log(`[Upload Success] ${fileName}:`, data.filepath);
    return data.filepath;
  } catch (error: any) {
    console.error(`[Upload Error] ${fileName}:`, error);
    throw new Error(error?.message || 'Failed to upload file');
  }
}

// Helper function to get auth header
async function getAuthHeader(): Promise<string> {
  try {
    const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
    const token = await AsyncStorage.getItem('token');
    return token ? `Bearer ${token}` : '';
  } catch (err) {
    console.error('Error getting auth token:', err);
    return '';
  }
}

// ✅ GET PRIORITIES
export async function getPriorities(): Promise<Array<{ Priority_id: number; Priority: string }>> {
  const response = await apiClient.get('/api/maintenance/priorities');
  return response.data;
}

// ✅ 1. CREATE TICKET (Operator creates maintenance request)
export async function createTicket(data: CreateTicketPayload): Promise<MaintenanceTicket> {
  const response = await apiClient.post('/api/maintenance', data);
  return response.data;
}

// ✅ ADD ATTACHMENT TO TICKET
export async function addAttachmentToTicket(
  requestId: number,
  uploadedBy: number,
  filepath: string,
  filename: string,
  filetype?: string,
  filesize?: number
): Promise<any> {
  const response = await apiClient.post(`/api/maintenance/${requestId}/attachments`, {
    uploaded_by: uploadedBy,
    filepath,
    filename,
    filetype,
    filesize,
  });
  return response.data;
}

// ✅ 2. MARK ON-GOING (Operator starts working on ticket)
export async function markOngoing(
  requestId: number,
  data: OperatorActionPayload
): Promise<MaintenanceTicket> {
  const response = await apiClient.put(`/api/maintenance/${requestId}/ongoing`, data);
  return response.data;
}

// ✅ 3. MARK FOR VERIFICATION (Operator finishes work)
export async function markForVerification(
  requestId: number,
  data: OperatorActionPayload
): Promise<MaintenanceTicket> {
  const response = await apiClient.put(`/api/maintenance/${requestId}/for-verification`, data);
  return response.data;
}

// ✅ 4. ADD REMARKS (Operator adds notes/updates)
export async function addRemarks(
  requestId: number,
  data: AddRemarksPayload
): Promise<MaintenanceTicket> {
  const response = await apiClient.put(`/api/maintenance/${requestId}/remarks`, data);
  return response.data;
}

// ✅ 5. CANCEL TICKET (Operator can cancel their own tickets)
export async function cancelTicket(
  requestId: number,
  operatorAccountId: number
): Promise<MaintenanceTicket> {
  const response = await apiClient.put(`/api/maintenance/${requestId}/cancel`, {
    actor_account_id: operatorAccountId
  });
  return response.data;
}

// ✅ 6. GET SINGLE TICKET (View ticket details)
export async function getTicket(requestId: number): Promise<MaintenanceTicket> {
  const response = await apiClient.get(`/api/maintenance/${requestId}`);
  return response.data;
}

// ✅ 7. LIST OPERATOR'S TICKETS (Filter by operator)
export async function listMyTickets(operatorAccountId: number): Promise<MaintenanceTicket[]> {
  const response = await apiClient.get('/api/maintenance', {
    params: { created_by: operatorAccountId }
  });
  return response.data;
}

// ✅ 8. LIST ASSIGNED TICKETS (Tickets assigned to operator)
export async function listAssignedTickets(operatorAccountId: number): Promise<MaintenanceTicket[]> {
  const response = await apiClient.get('/api/maintenance', {
    params: { assigned_to: operatorAccountId }
  });
  return response.data;
}

// ✅ 9. LIST TICKETS BY STATUS (Filter tickets)
export async function listTicketsByStatus(
  operatorAccountId: number, 
  status: string
): Promise<MaintenanceTicket[]> {
  const response = await apiClient.get('/api/maintenance', {
    params: { 
      created_by: operatorAccountId,
      status 
    }
  });
  return response.data;
}