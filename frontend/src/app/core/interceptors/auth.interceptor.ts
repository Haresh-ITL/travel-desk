import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../auth/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const userUuid = authService.getUserUuid();

  if (userUuid) {
    const clonedReq = req.clone({
      setHeaders: {
        'x-user-uuid': userUuid
      }
    });
    return next(clonedReq);
  }

  return next(req);
};
