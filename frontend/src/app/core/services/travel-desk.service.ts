import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { TravelRequest, BookingDetails, ProcessBookingsResponse, AllBookingsResponse, BookingFilters, BookingStatus, BookingWithDetails, UpdateBookingRequest, TravelType, RequestStatus } from '../../shared/models';

@Injectable({
  providedIn: 'root'
})
export class TravelDeskService {
  private apiUrl = `${environment.apiUrl}/travel-desk`;

  constructor(private http: HttpClient) {}

  getApprovedRequests(): Observable<TravelRequest[]> {
    return this.http.get<TravelRequest[]>(`${this.apiUrl}/requests/approved`);
  }

  /**
   * Get user documents (profile files) for a specific employee/manager
   * @param employeeUuid UUID of the employee/manager
   */
  getUserDocuments(employeeUuid: string): Observable<{
    uuid: string;
    name: string;
    email: string;
    documents: Array<{
      type: string;
      url?: string;
      data?: string;
      mimeType?: string;
      fileName?: string;
      uploadedAt?: Date;
    }>;
  }> {
    return this.http.get<{
      uuid: string;
      name: string;
      email: string;
      documents: Array<{
        type: string;
        url?: string;
        data?: string;
        mimeType?: string;
        fileName?: string;
        uploadedAt?: Date;
      }>;
    }>(`${this.apiUrl}/users/${employeeUuid}/documents`);
  }

  /**
   * Create a booking for an approved travel request
   * This replaces the deprecated PUT /requests/:uuid/book endpoint
   * @param requestUuid UUID of the approved travel request
   * @param bookingData Optional booking details (flight, hotel, cab, itineraryHtml)
   * @param files Optional files to upload
   */
  createBookingForRequest(requestUuid: string, bookingData?: {
    flightAirline?: string;
    flightNumber?: string;
    hotelName?: string;
    hotelLocation?: string;
    cabProvider?: string;
    itineraryHtml?: string;
    confirmationFiles?: Array<{ fileName: string; base64: string; mimeType: string }>;
    hotel?: { name: string; roomNumber: string; location: string; phoneNumber?: string };
    cab?: { name: string; driverName: string; phoneNumber?: string; carModel?: string; carColor?: string; numberPlate?: string };
    driverPhoneNumber?: string;
    carModel?: string;
    carColor?: string;
    numberPlate?: string;
  }, files?: File[]): Observable<BookingWithDetails> {
    // Validate requestUuid
    if (!requestUuid || requestUuid.trim() === '') {
      throw new Error('requestUuid is required');
    }

    const payload: any = {
      requestUuid: requestUuid.trim(),
      itineraryHtml: bookingData?.itineraryHtml || ""
    };

    // Add optional booking details
    if (bookingData?.flightAirline || bookingData?.flightNumber) {
      payload.flightAirline = bookingData.flightAirline || "";
      payload.flightNumber = bookingData.flightNumber || "";
    }
    if (bookingData?.hotel) {
      // Use new hotel object format
      payload.hotelName = bookingData.hotel.name || "";
      payload.hotelLocation = bookingData.hotel.location || "";
      payload.hotelRoomNumber = bookingData.hotel.roomNumber || "";
    } else if (bookingData?.hotelName || bookingData?.hotelLocation) {
      // Legacy format support
      payload.hotelName = bookingData.hotelName || "";
      payload.hotelLocation = bookingData.hotelLocation || "";
    }
    if (bookingData?.cab) {
      // Use new cab object format
      payload.cabProvider = bookingData.cab.name || "";
      payload.cabDriverName = bookingData.cab.driverName || "";
      if (bookingData.cab.carModel) payload.carModel = bookingData.cab.carModel;
      if (bookingData.cab.carColor) payload.carColor = bookingData.cab.carColor;
      if (bookingData.cab.numberPlate) payload.numberPlate = bookingData.cab.numberPlate;
      if (bookingData.cab.phoneNumber) payload.driverPhoneNumber = bookingData.cab.phoneNumber;
    } else if (bookingData?.cabProvider) {
      // Legacy format support
      payload.cabProvider = bookingData.cabProvider;
    }
    // Add separate car fields if provided
    if (bookingData?.driverPhoneNumber) payload.driverPhoneNumber = bookingData.driverPhoneNumber;
    if (bookingData?.carModel) payload.carModel = bookingData.carModel;
    if (bookingData?.carColor) payload.carColor = bookingData.carColor;
    if (bookingData?.numberPlate) payload.numberPlate = bookingData.numberPlate;
    
    // Add confirmation files if provided
    if (bookingData?.confirmationFiles && bookingData.confirmationFiles.length > 0) {
      payload.confirmationFiles = bookingData.confirmationFiles;
    }

    console.log('Creating booking with payload:', { 
      requestUuid: payload.requestUuid, 
      hasItineraryHtml: !!payload.itineraryHtml,
      confirmationFilesCount: payload.confirmationFiles?.length || 0
    });

    // Send as JSON with confirmation files as base64
    return this.http.post<BookingWithDetails>(`${this.apiUrl}/bookings`, payload);
  }

  /**
   * @deprecated Use createBookingForRequest instead
   * This endpoint is kept for backward compatibility but may be removed
   */
  updateTravelRequestToBooked(requestUuid: string, files?: File[]): Observable<TravelRequest> {
    // Use the new booking creation endpoint instead
    return this.createBookingForRequest(requestUuid, {}, files).pipe(
      map((booking) => {
        // Helper function to convert Date or string to Date object
        const toDate = (date: Date | string | undefined): Date => {
          if (!date) return new Date();
          if (date instanceof Date) {
            return date;
          }
          return new Date(date);
        };

        // Helper function to convert string to TravelType enum
        const toTravelType = (type: string | undefined): TravelType => {
          if (type === 'INTERNATIONAL') return TravelType.INTERNATIONAL;
          return TravelType.DOMESTIC;
        };

        // Return a TravelRequest object with proper types
        const travelRequest: TravelRequest = {
          uuid: booking.requestUuid,
          employeeUuid: booking.travelRequest?.employeeId || "",
          employeeName: booking.travelRequest?.employeeName || "",
          from: booking.from || booking.travelRequest?.from || "",
          to: booking.to || booking.travelRequest?.to || "",
          travelType: toTravelType(booking.travelRequest?.travelType),
          startDate: toDate(booking.travelRequest?.startDate),
          endDate: toDate(booking.travelRequest?.endDate),
          purpose: booking.travelRequest?.purpose || "",
          status: RequestStatus.BOOKED,
          createdAt: toDate(booking.createdAt),
          updatedAt: toDate(booking.updatedAt)
        };
        return travelRequest;
      })
    );
  }

  createBooking(booking: BookingDetails): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/bookings`, booking);
  }

  getAnalytics(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/analytics`);
  }

  uploadConfirmation(type: string, file: File): Observable<{ url: string }> {
    const formData = new FormData();
    formData.append('type', type);
    formData.append('file', file);
    return this.http.post<{ url: string }>(`${this.apiUrl}/confirmations`, formData);
  }

  /**
   * Get bookings that require admin action (PENDING or IN_PROGRESS)
   * @param filters Optional filters for pagination and sorting
   */
  getProcessBookings(filters?: {
    status?: BookingStatus | BookingStatus[];
    limit?: number;
    page?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Observable<ProcessBookingsResponse> {
    let params = new HttpParams();
    
    if (filters) {
      if (filters.status) {
        const statusArray = Array.isArray(filters.status) ? filters.status : [filters.status];
        statusArray.forEach((status: BookingStatus) => {
          params = params.append('status', status);
        });
      }
      if (filters.limit) params = params.set('limit', filters.limit.toString());
      if (filters.page) params = params.set('page', filters.page.toString());
      if (filters.sortBy) params = params.set('sortBy', filters.sortBy);
      if (filters.sortOrder) params = params.set('sortOrder', filters.sortOrder);
    }

    return this.http.get<ProcessBookingsResponse>(`${this.apiUrl}/bookings/process`, { params });
  }

  /**
   * Get all bookings with optional filters
   * @param filters Optional filters for status, employee, dates, etc.
   */
  getAllBookings(filters?: BookingFilters): Observable<AllBookingsResponse> {
    let params = new HttpParams();
    
    if (filters) {
      if (filters.status) {
        const statusArray = Array.isArray(filters.status) ? filters.status : [filters.status];
        statusArray.forEach((status: BookingStatus) => {
          params = params.append('status', status);
        });
      }
      if (filters.employeeId) params = params.set('employeeId', filters.employeeId);
      if (filters.startDate) {
        const dateStr = filters.startDate instanceof Date 
          ? filters.startDate.toISOString().split('T')[0]
          : filters.startDate;
        params = params.set('startDate', dateStr);
      }
      if (filters.endDate) {
        const dateStr = filters.endDate instanceof Date
          ? filters.endDate.toISOString().split('T')[0]
          : filters.endDate;
        params = params.set('endDate', dateStr);
      }
      if (filters.travelType) params = params.set('travelType', filters.travelType);
      if (filters.limit) params = params.set('limit', filters.limit.toString());
      if (filters.page) params = params.set('page', filters.page.toString());
      if (filters.sortBy) params = params.set('sortBy', filters.sortBy);
      if (filters.sortOrder) params = params.set('sortOrder', filters.sortOrder);
    }

    return this.http.get<AllBookingsResponse>(`${this.apiUrl}/bookings`, { params });
  }

  /**
   * Update an existing booking
   * @param bookingUuid UUID of the booking to update
   * @param bookingData Updated booking data
   */
  updateBooking(bookingUuid: string, bookingData: UpdateBookingRequest): Observable<BookingWithDetails> {
    // Send as JSON (backend accepts JSON body)
    return this.http.put<BookingWithDetails>(`${this.apiUrl}/bookings/${bookingUuid}`, bookingData);
  }
}
