import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Router } from '@angular/router';
import { authGuard, adminGuard, ownerGuard } from './admin.guard';
import { AuthService } from '../services/auth.service';
import { PermissionService } from '../services/permission.service';
import { Rolle } from '../models/enums/Rolle';

function buildEnv(opts: {
  isLoggedIn?: boolean;
  initialized?: boolean;
  rolle?: Rolle;
  canAccessAdminPanel?: boolean;
} = {}) {
  const authMock = {
    isLoggedIn: signal(opts.isLoggedIn ?? true),
    authInitialized: signal(opts.initialized ?? true),
    currentRolle: signal(opts.rolle ?? Rolle.KUNDE),
    currentUid: signal('uid1'),
  };
  const permsMock = {
    canAccessAdminPanel: signal(opts.canAccessAdminPanel ?? true),
  };
  const routerMock = { navigate: vi.fn().mockResolvedValue(true) };

  TestBed.configureTestingModule({
    providers: [
      { provide: AuthService,       useValue: authMock },
      { provide: PermissionService, useValue: permsMock },
      { provide: Router,            useValue: routerMock },
    ],
  });

  return { authMock, permsMock, routerMock };
}

function runGuard(guard: any): Promise<boolean> {
  return TestBed.runInInjectionContext(() => guard({} as any, {} as any));
}

describe('authGuard', () => {
  it('returns true when user is logged in', async () => {
    buildEnv({ isLoggedIn: true });
    expect(await runGuard(authGuard)).toBe(true);
  });

  it('redirects to /home and returns false when not logged in', async () => {
    const { routerMock } = buildEnv({ isLoggedIn: false });
    const result = await runGuard(authGuard);
    expect(result).toBe(false);
    expect(routerMock.navigate).toHaveBeenCalledWith(['/home']);
  });
});

describe('adminGuard', () => {
  it('returns true when canAccessAdminPanel is true', async () => {
    buildEnv({ canAccessAdminPanel: true });
    expect(await runGuard(adminGuard)).toBe(true);
  });

  it('redirects to /home when canAccessAdminPanel is false', async () => {
    const { routerMock } = buildEnv({ canAccessAdminPanel: false });
    const result = await runGuard(adminGuard);
    expect(result).toBe(false);
    expect(routerMock.navigate).toHaveBeenCalledWith(['/home']);
  });
});

describe('ownerGuard', () => {
  it('returns true when currentRolle is OWNER', async () => {
    buildEnv({ rolle: Rolle.OWNER });
    expect(await runGuard(ownerGuard)).toBe(true);
  });

  it('redirects to /home when role is ADMIN', async () => {
    const { routerMock } = buildEnv({ rolle: Rolle.ADMIN });
    const result = await runGuard(ownerGuard);
    expect(result).toBe(false);
    expect(routerMock.navigate).toHaveBeenCalledWith(['/home']);
  });

  it('redirects to /home when role is KUNDE', async () => {
    const { routerMock } = buildEnv({ rolle: Rolle.KUNDE });
    const result = await runGuard(ownerGuard);
    expect(result).toBe(false);
    expect(routerMock.navigate).toHaveBeenCalledWith(['/home']);
  });

  it('redirects to /home when role is MITARBEITER', async () => {
    const { routerMock } = buildEnv({ rolle: Rolle.MITARBEITER });
    const result = await runGuard(ownerGuard);
    expect(result).toBe(false);
    expect(routerMock.navigate).toHaveBeenCalledWith(['/home']);
  });
});

describe('waitForAuth (via guards)', () => {
  it('authGuard waits until auth is initialized before checking', async () => {
    // Start uninitialized, then flip to initialized after a tick
    const { authMock } = buildEnv({ isLoggedIn: true, initialized: false });

    let resolved = false;
    const guardPromise = runGuard(authGuard).then(r => { resolved = r; return r; });

    // Auth is not yet initialized — guard should be waiting
    await new Promise(r => setTimeout(r, 60)); // one 50ms tick
    authMock.authInitialized.set(true);

    const result = await guardPromise;
    expect(result).toBe(true);
    expect(resolved).toBe(true);
  }, 5000);

  it('authGuard resolves after 3s timeout even when auth never initializes', async () => {
    buildEnv({ isLoggedIn: false, initialized: false });
    vi.useFakeTimers();
    const guardPromise = runGuard(authGuard);
    vi.advanceTimersByTime(3001);
    const result = await guardPromise;
    expect(result).toBe(false);
    vi.useRealTimers();
  });
});
