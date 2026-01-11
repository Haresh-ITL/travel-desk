export interface Booking {
  uuid: string;
  requestUuid: string;
  employeeUuid: string;
  flight?: FlightDetails;
  hotel?: HotelDetails;
  cab?: CabDetails;
  totalAmount: number;
  paymentIntentId?: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  createdAt: string;
}

export interface FlightDetails {
  airline: string;
  flightNumber: string;
  departureAirport: string;
  departureTime: string;
  arrivalAirport: string;
  arrivalTime: string;
}

// Hotel details for booking creation (old structure)
export interface HotelDetails {
  name: string;
  location: string;
  checkInDate: string;
  checkOutDate: string;
}

// Hotel details for booking management (new structure from database)
export interface HotelBookingDetails {
  name: string;
  phoneNumber: string;
  roomNumber: string;
  location: string;
}

// Cab details interface for booking management (new structure)
export interface CabDetails {
  name: string;
  driverName: string;
  phoneNumber: string;
}

export interface CreateBookingRequest {
  requestUuid: string;
  flight?: FlightDetails;
  hotel?: HotelDetails;
  cab?: CabDetails;
  itineraryHtml: string;
  bookingConfirmations: File[];
}

export interface PaymentIntentResponse {
  clientSecret: string;
}

// API Response interfaces for backend integration
export type BookingStatus = 'PENDING' | 'IN_PROGRESS' | 'CONFIRMED' | 'CANCELLED';

export interface ConfirmationFile {
  fileName: string;
  base64: string;
  mimeType?: string;
}

export interface BookingWithDetails {
  uuid: string;
  requestUuid: string;
  flight?: string;
  hotel?: string | HotelBookingDetails; // Support both string (legacy) and object (new)
  cab?: string | CabDetails; // Support both string (legacy) and object (new)
  confirmationFiles?: (string | ConfirmationFile)[]; // Support both string (legacy) and object (new)
  itineraryHtml: string;
  status: BookingStatus;
  from?: string;
  to?: string;
  createdAt: string | Date;
  updatedAt?: string | Date;
  confirmedAt?: string | Date; // When booking was confirmed by travel admin
  travelRequest?: {
    uuid: string;
    employeeId: string;
    employeeName?: string;
    from: string;
    to: string;
    travelType: 'DOMESTIC' | 'INTERNATIONAL';
    startDate: string | Date;
    endDate: string | Date;
    purpose: string;
    status: string;
    createdAt: string | Date;
    filePaths?: string[];
    isDisabled?: boolean;
    disabilityDescription?: string;
    foodPreference?: 'VEG' | 'NON_VEG';
    specificFoodPreferences?: string;
    localTransportRequired?: boolean;
    numberOfSeats?: number;
    driverPhoneNumber?: string;
    carModel?: string;
    carColor?: string;
    numberPlate?: string;
    hotelStarRating?: string;
    numberOfRooms?: number;
  };
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ProcessBookingsResponse {
  bookings: BookingWithDetails[];
  pagination: PaginationInfo;
}

export interface AllBookingsResponse {
  bookings: BookingWithDetails[];
  pagination: PaginationInfo;
  filters: {
    status: string | null;
    employeeId: string | null;
    startDate: string | null;
    endDate: string | null;
    travelType: string | null;
  };
}

export interface BookingFilters {
  status?: BookingStatus | BookingStatus[];
  employeeId?: string;
  startDate?: string | Date;
  endDate?: string | Date;
  travelType?: 'DOMESTIC' | 'INTERNATIONAL';
  limit?: number;
  page?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface UpdateBookingRequest {
  flight?: string;
  hotel?: string | HotelBookingDetails;
  cab?: string | CabDetails;
  itineraryHtml?: string;
  from?: string;
  to?: string;
  status?: BookingStatus;
  confirmationFiles?: ConfirmationFile[];
}
