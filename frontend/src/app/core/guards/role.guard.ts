import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../auth/auth.service';

export const RoleGuard = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const userRole = authService.getRole();
  const requiredRoles = route.data?.['roles'] as string[];

  if (userRole && requiredRoles.includes(userRole)) {
    return true;
  } else {
    router.navigate(['/dashboard']);
    return false;
  }
};
