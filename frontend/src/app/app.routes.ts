import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { LayoutComponent } from './core/layout/layout.component';
import { LoginComponent } from './features/auth/login.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { UserRole } from './shared/models';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        component: DashboardComponent
      },
      {
        path: 'org-admin/users',
        loadComponent: () => import('./features/org-admin/users/users.component').then(m => m.UsersComponent),
        canActivate: [roleGuard],
        data: { role: UserRole.ORG_ADMIN }
      },
      {
        path: 'employee/requests',
        loadComponent: () => import('./features/employee/requests/requests.component').then(m => m.RequestsComponent),
        canActivate: [roleGuard],
        data: { role: UserRole.EMPLOYEE }
      },
      {
        path: 'employee/profile',
        loadComponent: () => import('./features/employee/profile/profile.component').then(m => m.ProfileComponent),
        canActivate: [roleGuard],
        data: { role: UserRole.EMPLOYEE }
      },
      {
        path: 'manager/approvals',
        loadComponent: () => import('./features/manager/approvals/approvals.component').then(m => m.ApprovalsComponent),
        canActivate: [roleGuard],
        data: { role: UserRole.MANAGER }
      },
      {
        path: 'travel-desk/bookings',
        loadComponent: () => import('./features/travel-desk/bookings/bookings.component').then(m => m.BookingsComponent),
        canActivate: [roleGuard],
        data: { role: UserRole.TRAVEL_DESK_ADMIN }
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];
