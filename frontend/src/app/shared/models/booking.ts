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

export interface HotelDetails {
  name: string;
  location: string;
  checkInDate: string;
  checkOutDate: string;
}

export interface CabDetails {
  provider: string;
  pickupTime: string;
  notes: string;
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
