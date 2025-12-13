import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { LoginRequest, LoginResponse, UserRole } from '../../shared/models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly currentUserSubject = new BehaviorSubject<LoginResponse | null>(this.getUserFromStorage());
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private readonly http: HttpClient,
    private readonly router: Router
  ) {}

  private getUserFromStorage(): LoginResponse | null {
    const userUuid = localStorage.getItem('userUuid');
    const roleName = localStorage.getItem('roleName') as UserRole;
    const name = localStorage.getItem('name');
    const email = localStorage.getItem('email');

    if (userUuid && roleName && name && email) {
      return { userUuid, roleName, name, email };
    }
    return null;
  }

  login(email: string, password: string): Observable<LoginResponse> {
    const loginRequest: LoginRequest = { email, password };
    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, loginRequest).pipe(
      tap(response => {
        // Handle both 'uuid' and 'userUuid' field names for backward compatibility
        const userUuid = response.userUuid || (response as any).uuid;
        const roleName = response.roleName || (response as any).roleName;
        const name = response.name || (response as any).name || '';
        const email = response.email || (response as any).email || '';
        
        // Safety check: only store if values are defined and not null
        if (userUuid) {
          localStorage.setItem('userUuid', userUuid);
        }
        if (roleName) {
          localStorage.setItem('roleName', roleName);
        }
        if (name && name !== 'undefined') {
          localStorage.setItem('name', name);
        }
        if (email && email !== 'undefined') {
          localStorage.setItem('email', email);
        }
        
        this.currentUserSubject.next(response);
      })
    );
  }

  logout(): void {
    localStorage.removeItem('userUuid');
    localStorage.removeItem('roleName');
    localStorage.removeItem('name');
    localStorage.removeItem('email');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('userUuid');
  }

  getUserUuid(): string | null {
    return localStorage.getItem('userUuid');
  }

  getRole(): UserRole | null {
    return localStorage.getItem('roleName') as UserRole;
  }

  getUserName(): string | null {
    const name = localStorage.getItem('name');
    // Clean up if "undefined" string was stored
    if (name === 'undefined' || name === 'null' || !name) {
      localStorage.removeItem('name');
      return null;
    }
    return name;
  }

  getUserEmail(): string | null {
    return localStorage.getItem('email');
  }

  hasRole(role: UserRole): boolean {
    return this.getRole() === role;
  }
}
