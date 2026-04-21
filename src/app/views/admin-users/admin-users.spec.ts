import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { AdminUsers } from './admin-users';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { PermissionService } from '../../services/permission.service';
import { DialogService } from '../../services/dialog.service';
import { Rolle } from '../../models/enums/Rolle';

function build(opts: { uid?: string; rolle?: Rolle; canEditUsers?: boolean } = {}) {
  const uid = opts.uid ?? 'self';
  const rolle = opts.rolle ?? Rolle.OWNER;
  const canEditUsers = opts.canEditUsers ?? true;

  const authMock   = { currentUid: signal(uid), currentRolle: signal(rolle), isLoggedIn: signal(true) };
  const permsMock  = { canEditUsers: signal(canEditUsers), canViewUsers: signal(true) };
  const userMock   = { getAllUsers: vi.fn().mockResolvedValue([]), updateUser: vi.fn(), deleteUser: vi.fn() };
  const dialogMock = { openConfirm: vi.fn(), openMessage: vi.fn() };

  TestBed.configureTestingModule({
    providers: [
      AdminUsers,
      { provide: AuthService,      useValue: authMock },
      { provide: PermissionService, useValue: permsMock },
      { provide: UserService,      useValue: userMock },
      { provide: DialogService,    useValue: dialogMock },
    ],
  });

  return TestBed.inject(AdminUsers);
}

function makeUser(uid: string, rolle: Rolle, vorname = 'Max', nachname = 'Muster', email = 'x@x.de'): any {
  return { uid, rolle, vorname, nachname, email };
}

describe('AdminUsers – filteredUsers', () => {
  let comp: AdminUsers;
  beforeEach(() => { comp = build(); });

  const users = [
    makeUser('1', Rolle.KUNDE, 'Anna', 'Braun', 'anna@test.de'),
    makeUser('2', Rolle.ADMIN, 'Karl', 'Weiß', 'karl@test.de'),
    makeUser('uid-abc', Rolle.OWNER, 'Eve', 'Schmidt', 'eve@test.de'),
  ];

  beforeEach(() => { (comp as any).users.set(users); });

  it('returns all users when searchText is empty', () => {
    (comp as any).searchText = '';
    expect(comp.filteredUsers.length).toBe(3);
  });

  it('filters by vorname', () => {
    (comp as any).searchText = 'ann';
    expect(comp.filteredUsers.map(u => u.uid)).toEqual(['1']);
  });

  it('filters by nachname', () => {
    (comp as any).searchText = 'wei';
    expect(comp.filteredUsers.map(u => u.uid)).toEqual(['2']);
  });

  it('filters by email', () => {
    (comp as any).searchText = 'eve@';
    expect(comp.filteredUsers.map(u => u.uid)).toEqual(['uid-abc']);
  });

  it('filters by uid', () => {
    (comp as any).searchText = 'uid-abc';
    expect(comp.filteredUsers.map(u => u.uid)).toEqual(['uid-abc']);
  });

  it('is case-insensitive', () => {
    (comp as any).searchText = 'ANNA';
    expect(comp.filteredUsers.length).toBe(1);
  });
});

describe('AdminUsers – canEditThisUser', () => {
  it('returns false when canEditUsers perm is false', () => {
    const comp = build({ canEditUsers: false });
    expect(comp['canEditThisUser'](makeUser('other', Rolle.KUNDE))).toBe(false);
  });

  it('returns false for null user', () => {
    const comp = build();
    expect(comp['canEditThisUser'](null)).toBe(false);
  });

  it('ADMIN cannot edit OWNER', () => {
    const comp = build({ uid: 'admin-uid', rolle: Rolle.ADMIN, canEditUsers: true });
    expect(comp['canEditThisUser'](makeUser('other-uid', Rolle.OWNER))).toBe(false);
  });

  it('OWNER can edit OWNER', () => {
    const comp = build({ uid: 'owner-uid', rolle: Rolle.OWNER, canEditUsers: true });
    expect(comp['canEditThisUser'](makeUser('other-uid', Rolle.OWNER))).toBe(true);
  });

  it('ADMIN can edit non-owner users', () => {
    const comp = build({ uid: 'admin-uid', rolle: Rolle.ADMIN, canEditUsers: true });
    expect(comp['canEditThisUser'](makeUser('user-uid', Rolle.KUNDE))).toBe(true);
  });
});

describe('AdminUsers – canDeleteThisUser', () => {
  it('OWNER can delete non-self non-owner KUNDE', () => {
    const comp = build({ uid: 'owner', rolle: Rolle.OWNER });
    expect(comp['canDeleteThisUser'](makeUser('other', Rolle.KUNDE))).toBe(true);
  });

  it('OWNER cannot delete self', () => {
    const comp = build({ uid: 'owner', rolle: Rolle.OWNER });
    expect(comp['canDeleteThisUser'](makeUser('owner', Rolle.OWNER))).toBe(false);
  });

  it('OWNER cannot delete another OWNER', () => {
    const comp = build({ uid: 'owner', rolle: Rolle.OWNER });
    expect(comp['canDeleteThisUser'](makeUser('other-owner', Rolle.OWNER))).toBe(false);
  });

  it('ADMIN cannot delete anyone', () => {
    const comp = build({ uid: 'admin', rolle: Rolle.ADMIN });
    expect(comp['canDeleteThisUser'](makeUser('kunde', Rolle.KUNDE))).toBe(false);
  });
});

describe('AdminUsers – getRolleLabel', () => {
  let comp: AdminUsers;
  beforeEach(() => { comp = build(); });

  it('OWNER → "Owner"',             () => expect(comp.getRolleLabel(Rolle.OWNER)).toBe('Owner'));
  it('ADMIN → "Admin"',             () => expect(comp.getRolleLabel(Rolle.ADMIN)).toBe('Admin'));
  it('MITARBEITER → "Mitarbeiter"', () => expect(comp.getRolleLabel(Rolle.MITARBEITER)).toBe('Mitarbeiter'));
  it('KUNDE → "Kunde"',             () => expect(comp.getRolleLabel(Rolle.KUNDE)).toBe('Kunde'));
});

describe('AdminUsers – displayName', () => {
  let comp: AdminUsers;
  beforeEach(() => { comp = build(); });

  it('returns full name when both are set', () => {
    expect(comp.displayName(makeUser('1', Rolle.KUNDE, 'Max', 'Muster'))).toBe('Max Muster');
  });

  it('returns "—" when both are empty', () => {
    expect(comp.displayName({ uid: '1', rolle: Rolle.KUNDE, vorname: '', nachname: '' } as any)).toBe('—');
  });

  it('returns "—" for whitespace-only names', () => {
    expect(comp.displayName({ uid: '1', rolle: Rolle.KUNDE, vorname: '  ', nachname: '  ' } as any)).toBe('—');
  });

  it('handles missing vorname gracefully', () => {
    expect(comp.displayName({ uid: '1', rolle: Rolle.KUNDE, nachname: 'Muster' } as any)).toBe('Muster');
  });
});
