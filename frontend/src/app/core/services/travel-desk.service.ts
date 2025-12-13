import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TravelRequest, BookingDetails, ProcessBookingsResponse, AllBookingsResponse, BookingFilters, BookingStatus, BookingWithDetails, UpdateBookingRequest } from '../../shared/models';

@Injectable({
  providedIn: 'root'
})
export class TravelDeskService {
  private apiUrl = `${environment.apiUrl}/travel-desk`;

  constructor(private http: HttpClient) {}

  getApprovedRequests(): Observable<TravelRequest[]> {
    return this.http.get<TravelRequest[]>(`${this.apiUrl}/requests/approved`);
  }

  updateTravelRequestToBooked(requestUuid: string, files?: File[]): Observable<TravelRequest> {
    const formData = new FormData();
    
    // Add files if provided
    if (files && files.length > 0) {
      files.forEach((file) => {
        formData.append('files', file);
      });
    }
    
    return this.http.put<TravelRequest>(`${this.apiUrl}/requests/${requestUuid}/book`, formData);
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
