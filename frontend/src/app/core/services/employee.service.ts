import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TravelRequest, User, DashboardStats } from '../../shared/models';

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

  createTravelRequest(formData: FormData): Observable<TravelRequest> {
    return this.http.post<TravelRequest>(`${this.apiUrl}/requests`, formData);
  }

  getProfile(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/profile`);
  }

  updateProfile(profile: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/profile`, profile);
  }

  uploadDocument(type: string, file: File): Observable<{ url: string; data: string; mimeType: string; type: string; uploadedAt: Date; fileName?: string; message?: string }> {
    const formData = new FormData();
    formData.append('type', type);
    formData.append('file', file);
    
    console.log('Service: Uploading document');
    console.log('Type:', type);
    console.log('File:', file.name, file.size, 'bytes');
    console.log('File MIME type:', file.type);
    
    return this.http.post<{ url: string; data: string; mimeType: string; type: string; uploadedAt: Date; fileName?: string; message?: string }>(
      `${this.apiUrl}/profile/documents`, 
      formData,
      {
        reportProgress: true
      }
    );
  }

  getMappedManagers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/managers`);
  }

  getDashboardStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.apiUrl}/dashboard/stats`);
  }
}
