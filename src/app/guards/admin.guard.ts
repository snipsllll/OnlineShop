import {inject} from '@angular/core';
import {CanActivateFn, Router} from '@angular/router';
import {AuthService} from '../services/auth.service';
import {PermissionService} from '../services/permission.service';
import {Rolle} from '../models/enums/Rolle';

/** Waits until Firebase resolves the current auth state (max 3 s). */
async function waitForAuth(auth: AuthService): Promise<void> {
  if (auth.authInitialized()) return;
  return new Promise<void>(resolve => {
    const id = setInterval(() => {
      if (auth.authInitialized()) { clearInterval(id); resolve(); }
    }, 50);
    setTimeout(() => { clearInterval(id); resolve(); }, 3000);
  });
}

/** Protects all admin routes — requires canAccessAdminPanel permission. */
export const adminGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const perms = inject(PermissionService);
  const router = inject(Router);

  await waitForAuth(auth);

  if (!perms.canAccessAdminPanel()) {
    await router.navigate(['/home']);
    return false;
  }
  return true;
};

/** Protects owner-only routes — requires OWNER role. */
export const ownerGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  await waitForAuth(auth);

  if (auth.currentRolle() !== Rolle.OWNER) {
    await router.navigate(['/home']);
    return false;
  }
  return true;
};

/** Protects customer routes that require authentication. */
export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  await waitForAuth(auth);

  if (!auth.isLoggedIn()) {
    await router.navigate(['/home']);
    return false;
  }
  return true;
};
