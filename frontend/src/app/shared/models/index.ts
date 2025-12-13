// User roles
export enum UserRole {
  ORG_ADMIN = 'ORG_ADMIN',
  EMPLOYEE = 'EMPLOYEE',
  MANAGER = 'MANAGER',
  TRAVEL_DESK_ADMIN = 'TRAVEL_DESK_ADMIN'
}

// Request status
export enum RequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  BOOKED = 'BOOKED',
  REJECTED = 'REJECTED'
}

// Travel type
export enum TravelType {
  DOMESTIC = 'DOMESTIC',
  INTERNATIONAL = 'INTERNATIONAL'
}

// Transport mode
export enum TransportMode {
  FLIGHT = 'FLIGHT',
  TRAIN = 'TRAIN'
}

// User interface
export interface User {
  uuid: string;
  name: string;
  email: string;
  roleName: UserRole;
  createdAt?: Date;
  updatedAt?: Date;
}

// Manager assignment
export interface ManagerAssignment {
  employeeUuid: string;
  managerUuid: string;
}

// Travel request
export interface TravelRequest {
  uuid: string;
  employeeUuid: string;
  employeeName?: string;
  from: string;
  to: string;
  travelType: TravelType;
  modeOfTransport?: TransportMode;
  startDate: Date;
  endDate: Date;
  purpose: string;
  status: RequestStatus;
  primaryManagerUuid?: string;
  primaryManagerName?: string;
  managerComment?: string;
  idProofUrl?: string;
  passportUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Manager decision
export interface ManagerDecision {
  status: RequestStatus;
  comment: string;
}

// Booking details
export interface BookingDetails {
  requestUuid: string;
  flightAirline?: string;
  flightNumber?: string;
  flightDepartureAirport?: string;
  flightDepartureTime?: Date;
  flightArrivalAirport?: string;
  flightArrivalTime?: Date;
  hotelName?: string;
  hotelLocation?: string;
  hotelCheckin?: Date;
  hotelCheckout?: Date;
  cabProvider?: string;
  cabPickupTime?: Date;
  cabNotes?: string;
  hotelAmount?: number;
  itineraryHtml?: string;
  flightConfirmationUrl?: string;
  hotelConfirmationUrl?: string;
  cabConfirmationUrl?: string;
}

// Document upload
export interface DocumentUpload {
  type: string;
  file: File;
}

// Login request
export interface LoginRequest {
  email: string;
  password: string;
}

// Login response
export interface LoginResponse {
  userUuid: string;
  roleName: UserRole;
  name: string;
  email: string;
}

// Dashboard stats
export interface DashboardStats {
  totalUsers?: number;
  usersByRole?: { [key: string]: number };
  totalTrips?: number;
  upcomingTrips?: number;
  pendingApprovals?: number;
  approvedAwaitingBooking?: number;
  tripsBookedToday?: number;
  totalCost?: number;
}

// Itinerary data
export interface ItineraryData {
  employeeName: string;
  from: string;
  to: string;
  startDate: Date;
  endDate: Date;
  itineraryHtml: string;
  flightDetails?: {
    airline: string;
    flightNumber: string;
    departureAirport: string;
    departureTime: Date;
    arrivalAirport: string;
    arrivalTime: Date;
  };
  hotelDetails?: {
    name: string;
    location: string;
    checkin: Date;
    checkout: Date;
  };
  cabDetails?: {
    provider: string;
    pickupTime: Date;
    notes: string;
  };
}
