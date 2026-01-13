// ✅ Common type aliases (keep flexible — backend returns MySQL datetime strings)
export type Id = number;
export type MySqlDateTimeString = string; // e.g. "2026-01-05 21:31:16"
export type ISODateTimeString = string;

export type MaintenancePriorityName = 'Critical' | 'Urgent' | 'Mild' | (string & {});
export type MaintenanceTicketStatus =
  | 'Pending'
  | 'For review'
  | 'Done'
  | 'Canceled'
  | 'Cancel Requested'
  | (string & {});

export interface MaintenancePriority {
  Priority_id: number;
  Priority: string;
}

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

  // history endpoint fields
  CancelLogId?: number | null;
  CancelLogReason?: string | null;
  CancelRequestedAt?: MySqlDateTimeString | ISODateTimeString | null;
  CancelApprovedAt?: MySqlDateTimeString | ISODateTimeString | null;
}

export interface MaintenanceRemark {
  Remark_Id: number;
  Request_Id: number;
  Remark_text: string;
  Created_by: number;
  User_role?: string;
  Created_at: MySqlDateTimeString | ISODateTimeString;
  CreatedByName?: string;

  CreatedByRoleId?: number | null;
  CreatedByRoleName?: string | null;
}

export interface MaintenanceAttachment {
  Attachment_Id: number;
  Request_Id: number;
  Uploaded_by: number;
  File_path: string;
  File_name: string;
  File_type?: string | null;
  File_size?: number | null;
  Uploaded_at: MySqlDateTimeString | ISODateTimeString;

  UploaderName?: string | null;
  UploaderRole?: string | null;

  UploaderRoleId?: number | null;
  UploaderRoleName?: string | null;
}

export interface MaintenanceEvent {
  Event_Id: number;
  Request_Id: number;
  Event_type: string;
  Actor_Account_Id?: number | null;
  ActorName?: string | null;

  ActorRoleId?: number | null;
  ActorRoleName?: string | null;

  Notes?: string | null;
  Created_At: MySqlDateTimeString | ISODateTimeString;

  ToActorAccountId?: number | null;
  ToActorName?: string | null;
  ToActorRoleName?: string | null;
}

export interface CreateTicketPayload {
  title: string;
  details?: string;
  priority?: MaintenancePriorityName;
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