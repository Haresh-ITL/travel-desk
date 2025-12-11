import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TravelRequest, User } from '../../shared/models';

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private apiUrl = `${environment.apiUrl}/employee`;

  constructor(private http: HttpClient) {}

  getRequests(): Observable<TravelRequest[]> {
    return this.http.get<TravelRequest[]>(`${this.apiUrl}/requests`);
  }

  createRequest(request: Partial<TravelRequest>): Observable<TravelRequest> {
    return this.http.post<TravelRequest>(`${this.apiUrl}/requests`, request);
  }

  getProfile(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/profile`);
  }

  updateProfile(profile: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/profile`, profile);
  }

  uploadDocument(type: string, file: File): Observable<{ url: string }> {
    const formData = new FormData();
    formData.append('type', type);
    formData.append('file', file);
    return this.http.post<{ url: string }>(`${this.apiUrl}/profile/documents`, formData);
  }

  getMappedManagers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/managers`);
  }
}
