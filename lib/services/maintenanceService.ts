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

// ✅ 1. CREATE TICKET (Operator creates maintenance request)
export async function createTicket(data: CreateTicketPayload): Promise<MaintenanceTicket> {
  const response = await apiClient.post('/api/maintenance', data);
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