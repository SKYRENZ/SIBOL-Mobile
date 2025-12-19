import apiClient from './apiClient';

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
    // Create FormData
    const formData = new FormData();
    
    // Add file with proper format for React Native
    formData.append('file', {
      uri: uri,
      name: fileName,
      type: mimeType || 'image/jpeg',
    } as any);

    console.log('Uploading file:', { uri, fileName, mimeType });

    // Use fetch instead of axios for file uploads in React Native
    const response = await fetch(`${apiClient.defaults.baseURL}/api/upload`, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
        // Get auth token from AsyncStorage
        'Authorization': await getAuthHeader(),
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Upload failed' }));
      throw new Error(errorData.message || `Upload failed with status ${response.status}`);
    }

    const data = await response.json();
    console.log('Upload successful:', data);
    return data.filepath;
  } catch (error: any) {
    console.error('Upload error:', error);
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