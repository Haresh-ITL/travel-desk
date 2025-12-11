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
    return this.http.get<TravelRequest[]>(`${this.apiUrl}/requests`);
  }

  getPendingRequests(): Observable<TravelRequest[]> {
    return this.http.get<TravelRequest[]>(`${this.apiUrl}/requests/pending`);
  }

  makeDecision(requestUuid: string, decision: ManagerDecision): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/requests/${requestUuid}/decision`, decision);
  }
}
