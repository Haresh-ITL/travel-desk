import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User, ManagerAssignment } from '../../shared/models';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = `${environment.apiUrl}/admin`;

  constructor(private http: HttpClient) {}

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users`);
  }

  createUser(user: Partial<User>): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/users`, user);
  }

  updateUser(uuid: string, user: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/users/${uuid}`, user);
  }

  assignManagers(employeeUuid: string, managerUuids: string[]): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/users/${employeeUuid}/managers`, { managerUuids });
  }

  getManagers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users?role=MANAGER`);
  }
}
