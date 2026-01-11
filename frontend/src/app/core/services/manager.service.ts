import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TravelRequest, ManagerDecision } from '../../shared/models';

@Injectable({
  providedIn: 'root'
})
export class ManagerService {
  private apiUrl = `${environment.apiUrl}/manager`;

  constructor(private http: HttpClient) {}

  getRequests(): Observable<TravelRequest[]> {
    // Returns manager's own requests (where they are the employee)
    return this.http.get<TravelRequest[]>(`${this.apiUrl}/requests`);
  }

  getTeamRequests(): Observable<TravelRequest[]> {
    // Returns employee requests (where manager is the primary manager)
    return this.http.get<TravelRequest[]>(`${this.apiUrl}/team-requests`);
  }

  getPendingRequests(): Observable<TravelRequest[]> {
    return this.http.get<TravelRequest[]>(`${this.apiUrl}/requests/pending`);
  }

  createRequest(formData: FormData): Observable<TravelRequest> {
    return this.http.post<TravelRequest>(`${this.apiUrl}/requests`, formData);
  }

  makeDecision(requestUuid: string, decision: ManagerDecision): Observable<TravelRequest> {
    return this.http.put<TravelRequest>(`${this.apiUrl}/requests/${requestUuid}/decision`, decision);
  }

  /**
   * Get booking for a specific travel request (for viewing itinerary)
   * @param requestUuid UUID of the travel request
   */
  getBookingByRequestUuid(requestUuid: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/requests/${requestUuid}/booking`);
  }
}
