import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  userUuid: string;
  roleId: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly USER_UUID_KEY = 'userUuid';
  private readonly ROLE_KEY = 'roleId';

  constructor(private http: HttpClient, private router: Router) {}

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, credentials).pipe(
      tap(response => {
        localStorage.setItem(this.USER_UUID_KEY, response.userUuid);
        localStorage.setItem(this.ROLE_KEY, response.roleId);
        this.router.navigate(['/dashboard']);
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.USER_UUID_KEY);
    localStorage.removeItem(this.ROLE_KEY);
    this.router.navigate(['/login']);
  }

  getUserUuid(): string | null {
    return localStorage.getItem(this.USER_UUID_KEY);
  }

  getRole(): string | null {
    return localStorage.getItem(this.ROLE_KEY);
  }

  isLoggedIn(): boolean {
    return !!this.getUserUuid() && !!this.getRole();
  }
}
