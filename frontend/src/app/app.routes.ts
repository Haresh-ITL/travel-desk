import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { RoleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent) },
  {
    path: '',
    loadComponent: () => import('./core/layout/layout.component').then(m => m.LayoutComponent),
    canActivate: [AuthGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'org-admin/users',
        loadComponent: () => import('./features/org-admin/users/users.component').then(m => m.UsersComponent),
        canActivate: [RoleGuard],
        data: { roles: ['ORG_ADMIN'] }
      },
      {
        path: 'employee/requests',
        loadComponent: () => import('./features/employee/requests/requests.component').then(m => m.RequestsComponent),
        canActivate: [RoleGuard],
        data: { roles: ['EMPLOYEE'] }
      },
      {
        path: 'employee/profile',
        loadComponent: () => import('./features/employee/profile/profile.component').then(m => m.ProfileComponent),
        canActivate: [RoleGuard],
        data: { roles: ['EMPLOYEE'] }
      },
      {
        path: 'manager/approvals',
        loadComponent: () => import('./features/manager/approvals/approvals.component').then(m => m.ApprovalsComponent),
        canActivate: [RoleGuard],
        data: { roles: ['MANAGER'] }
      },
      {
        path: 'travel-desk/bookings',
        loadComponent: () => import('./features/travel-desk/bookings/bookings.component').then(m => m.BookingsComponent),
        canActivate: [RoleGuard],
        data: { roles: ['TRAVEL_DESK_ADMIN'] }
      },
      { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
      { path: '**', redirectTo: '/dashboard' }
    ]
  },
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' }
];
