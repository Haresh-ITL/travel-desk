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

// User document interface
export interface UserDocument {
  type: string;
  url: string;
  uploadedAt?: Date;
}

// User interface
export interface User {
  uuid: string;
  name: string;
  email: string;
  roleName: UserRole;
  documents?: UserDocument[];
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
  weeklyApprovedCount?: number;
}

// Itinerary data
export interface ItineraryData {
  // 1. Traveler Identification Details
  employeeName: string;
  employeeId?: string;
  designation?: string;
  department?: string;
  travelRequestId: string;
  purpose: string;
  travelType: TravelType;
  startDate: Date;
  endDate: Date;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship?: string;
  };

  // 2. Transport Details (Flight/Train/Bus)
  outboundJourney?: {
    transportType: 'FLIGHT' | 'TRAIN' | 'BUS';
    provider: string; // Airline / Transport Provider
    number: string; // Flight / Train / Bus Number
    from: string; // City, Airport/Station Code
    to: string; // City, Airport/Station Code
    departureDateTime: Date;
    arrivalDateTime: Date;
    seatNumber?: string;
    bookingReference?: string; // PNR
    ticketNumber?: string;
  };
  returnJourney?: {
    transportType: 'FLIGHT' | 'TRAIN' | 'BUS';
    provider: string;
    number: string;
    from: string;
    to: string;
    departureDateTime: Date;
    arrivalDateTime: Date;
    seatNumber?: string;
    bookingReference?: string;
    ticketNumber?: string;
  };

  // 3. Hotel Accommodation Details
  hotelDetails?: {
    name: string;
    address: string;
    contactNumber?: string;
    checkinDateTime: Date;
    checkoutDateTime: Date;
    roomType?: string; // Single/Double
    bookingReference?: string;
  };

  // 4. Cab / Local Transport Details
  cabDetails?: {
    provider: string;
    pickupLocation: string;
    dropLocation: string;
    pickupDateTime: Date;
    driverName?: string;
    driverContact?: string;
    vehicleNumber?: string;
  };

  // Legacy fields for backward compatibility
  from?: string;
  to?: string;
  itineraryHtml?: string;
}

// Re-export booking-related types from booking.ts
export { 
  BookingStatus,
  BookingWithDetails,
  BookingFilters,
  PaginationInfo,
  ProcessBookingsResponse,
  AllBookingsResponse,
  CabDetails,
  HotelBookingDetails,
  ConfirmationFile,
  UpdateBookingRequest
} from './booking';