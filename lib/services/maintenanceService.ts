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

// ✅ NEW: Interface for remarks
export interface MaintenanceRemark {
  Remark_Id: number;
  Request_Id: number;
  Remark_text: string;
  Created_by: number;
  User_role?: string;
  Created_at: string;
  CreatedByName?: string;
  CreatedByRoleName?: string;
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

export async function uploadToCloudinary(uri: string, fileName: string, mimeType?: string): Promise<string> {
  try {
    const formData = new FormData();
    
    if (Platform.OS === 'web') {
      const response = await fetch(uri);
      const blob = await response.blob();
      const file = new File([blob], fileName, { type: mimeType || 'image/jpeg' });
      formData.append('file', file);
    } else {
      formData.append('file', {
        uri: uri,
        name: fileName,
        type: mimeType || 'image/jpeg',
      } as any);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000);

    const response = await fetch(`${apiClient.defaults.baseURL}/api/upload`, {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': await getAuthHeader(),
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Upload failed' }));
      throw new Error(errorData.message || `Upload failed with status ${response.status}`);
    }

    const data = await response.json();
    return data.filepath;
  } catch (error: any) {
    throw new Error(error?.message || 'Failed to upload file. Please try again.');
  }
}

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

export async function getPriorities(): Promise<Array<{ Priority_id: number; Priority: string }>> {
  const response = await apiClient.get('/api/maintenance/priorities');
  return response.data;
}

export async function createTicket(data: CreateTicketPayload): Promise<MaintenanceTicket> {
  const response = await apiClient.post('/api/maintenance', data);
  return response.data;
}

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

// ✅ NEW: Add a remark to a ticket
export async function addRemark(
  requestId: number,
  remarkText: string,
  createdBy: number,
  userRole?: string
): Promise<MaintenanceRemark> {
  const response = await apiClient.post(`/api/maintenance/${requestId}/remarks`, {
    remark_text: remarkText,
    created_by: createdBy,
    user_role: userRole,
  });
  return response.data;
}

// ✅ NEW: Get all remarks for a ticket
export async function getTicketRemarks(requestId: number): Promise<MaintenanceRemark[]> {
  const response = await apiClient.get(`/api/maintenance/${requestId}/remarks`);
  return response.data || [];
}

export async function markOngoing(
  requestId: number,
  data: OperatorActionPayload
): Promise<MaintenanceTicket> {
  const response = await apiClient.put(`/api/maintenance/${requestId}/ongoing`, data);
  return response.data;
}

export async function markForVerification(
  requestId: number,
  data: OperatorActionPayload
): Promise<MaintenanceTicket> {
  const response = await apiClient.put(`/api/maintenance/${requestId}/for-verification`, data);
  return response.data;
}

// ✅ Keep old addRemarks for backward compatibility
export async function addRemarks(
  requestId: number,
  data: AddRemarksPayload
): Promise<MaintenanceTicket> {
  const response = await apiClient.put(`/api/maintenance/${requestId}/remarks`, data);
  return response.data;
}

export async function cancelTicket(
  requestId: number,
  operatorAccountId: number
): Promise<MaintenanceTicket> {
  const response = await apiClient.put(`/api/maintenance/${requestId}/cancel`, {
    actor_account_id: operatorAccountId
  });
  return response.data;
}

export async function getTicket(requestId: number): Promise<MaintenanceTicket> {
  const response = await apiClient.get(`/api/maintenance/${requestId}`);
  return response.data;
}

export async function listMyTickets(operatorAccountId: number): Promise<MaintenanceTicket[]> {
  const response = await apiClient.get('/api/maintenance', {
    params: { created_by: operatorAccountId }
  });
  return response.data;
}

export async function listAssignedTickets(operatorAccountId: number): Promise<MaintenanceTicket[]> {
  const response = await apiClient.get('/api/maintenance', {
    params: { assigned_to: operatorAccountId }
  });
  return response.data;
}

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