import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TravelRequest, BookingDetails } from '../../shared/models';

@Injectable({
  providedIn: 'root'
})
export class TravelDeskService {
  private apiUrl = `${environment.apiUrl}/travel-desk`;

  constructor(private http: HttpClient) {}

  getApprovedRequests(): Observable<TravelRequest[]> {
    return this.http.get<TravelRequest[]>(`${this.apiUrl}/requests/approved`);
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
}
