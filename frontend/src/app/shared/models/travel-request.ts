export interface TravelRequest {
  uuid: string;
  employeeUuid: string;
  employeeName: string;
  from: string;
  to: string;
  travelType: 'DOMESTIC' | 'INTERNATIONAL';
  startDate: string;
  endDate: string;
  purpose: string;
  status: 'PENDING' | 'APPROVED' | 'BOOKED' | 'REJECTED';
  managerUuid?: string;
  managerName?: string;
  attachments?: Attachment[];
  itineraryHtml?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTravelRequest {
  from: string;
  to: string;
  travelType: 'DOMESTIC' | 'INTERNATIONAL';
  startDate: string;
  endDate: string;
  purpose: string;
  managerUuid: string;
  attachments: File[];
}

export interface Attachment {
  name: string;
  url: string;
  type: string;
}

export interface DecisionRequest {
  status: 'APPROVED' | 'REJECTED';
  comment: string;
}
