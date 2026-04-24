import { TestBed } from '@angular/core/testing';
import { Register } from './register';
import { AuthService } from '../../services/auth.service';
import { DialogService } from '../../services/dialog.service';

function buildComponent(authResult = { success: true, message: undefined as string | undefined }) {
  const authMock = { register: vi.fn().mockResolvedValue(authResult) };
  const dialogMock = { closeRegister: vi.fn(), openLogin: vi.fn() };

  TestBed.configureTestingModule({
    providers: [
      Register,
      { provide: AuthService, useValue: authMock },
      { provide: DialogService, useValue: dialogMock },
    ],
  });

  return { comp: TestBed.inject(Register), authMock, dialogMock };
}

function fill(comp: any, overrides: Partial<{ vorname: string; nachname: string; email: string; password: string; passwordRepeat: string }> = {}) {
  comp['vorname'] = overrides.vorname ?? 'Max';
  comp['nachname'] = overrides.nachname ?? 'Muster';
  comp['email'] = overrides.email ?? 'max@example.com';
  comp['password'] = overrides.password ?? 'sicher123';
  comp['passwordRepeat'] = overrides.passwordRepeat ?? 'sicher123';
}

describe('Register – validation', () => {
  it('shows error when vorname is empty', async () => {
    const { comp } = buildComponent();
    fill(comp, { vorname: '' });
    await comp.submit();
    expect((comp as any).error).toBe('Bitte alle Felder ausfüllen.');
  });

  it('shows error when nachname is empty', async () => {
    const { comp } = buildComponent();
    fill(comp, { nachname: '' });
    await comp.submit();
    expect((comp as any).error).toBe('Bitte alle Felder ausfüllen.');
  });

  it('shows error when email is empty', async () => {
    const { comp } = buildComponent();
    fill(comp, { email: '' });
    await comp.submit();
    expect((comp as any).error).toBe('Bitte alle Felder ausfüllen.');
  });

  it('shows error when password is empty', async () => {
    const { comp } = buildComponent();
    fill(comp, { password: '', passwordRepeat: '' });
    await comp.submit();
    expect((comp as any).error).toBe('Bitte alle Felder ausfüllen.');
  });

  it('shows error when passwords do not match', async () => {
    const { comp } = buildComponent();
    fill(comp, { password: 'abc123', passwordRepeat: 'xyz789' });
    await comp.submit();
    expect((comp as any).error).toBe('Die Passwörter stimmen nicht überein.');
  });

  it('shows error when password is too short (< 6 chars)', async () => {
    const { comp } = buildComponent();
    fill(comp, { password: 'abc', passwordRepeat: 'abc' });
    await comp.submit();
    expect((comp as any).error).toBe('Das Passwort muss mindestens 6 Zeichen lang sein.');
  });

  it('shows error when email format is invalid', async () => {
    const { comp, authMock } = buildComponent();
    fill(comp, { email: 'not-an-email' });
    await comp.submit();
    expect((comp as any).error).toBe('Bitte eine gültige E-Mail-Adresse eingeben.');
    expect(authMock.register).not.toHaveBeenCalled();
  });
});

describe('Register – successful registration', () => {
  it('calls authService.register with correct args', async () => {
    const { comp, authMock } = buildComponent();
    fill(comp);
    await comp.submit();
    expect(authMock.register).toHaveBeenCalledWith('max@example.com', 'sicher123', 'Max', 'Muster');
  });

  it('closes dialog on success', async () => {
    const { comp, dialogMock } = buildComponent();
    fill(comp);
    await comp.submit();
    expect(dialogMock.closeRegister).toHaveBeenCalled();
  });

  it('shows server error message on failure', async () => {
    const { comp } = buildComponent({ success: false, message: 'E-Mail bereits vergeben.' });
    fill(comp);
    await comp.submit();
    expect((comp as any).error).toBe('E-Mail bereits vergeben.');
  });

  it('shows fallback message when server returns no message', async () => {
    const { comp } = buildComponent({ success: false, message: undefined });
    fill(comp);
    await comp.submit();
    expect((comp as any).error).toBe('Registrierung fehlgeschlagen.');
  });
});

describe('Register – switchToLogin', () => {
  it('closes register and opens login dialog', () => {
    const { comp, dialogMock } = buildComponent();
    comp.switchToLogin();
    expect(dialogMock.closeRegister).toHaveBeenCalled();
    expect(dialogMock.openLogin).toHaveBeenCalled();
  });
});
