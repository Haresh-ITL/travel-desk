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
  private currentUserSubject = new BehaviorSubject<LoginResponse | null>(this.getUserFromStorage());
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
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
        localStorage.setItem('userUuid', response.userUuid);
        localStorage.setItem('roleName', response.roleName);
        localStorage.setItem('name', response.name);
        localStorage.setItem('email', response.email);
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
    return localStorage.getItem('name');
  }

  getUserEmail(): string | null {
    return localStorage.getItem('email');
  }

  hasRole(role: UserRole): boolean {
    return this.getRole() === role;
  }
}
