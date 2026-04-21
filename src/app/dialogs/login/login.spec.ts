import { TestBed } from '@angular/core/testing';
import { Login } from './login';
import { AuthService } from '../../services/auth.service';
import { DialogService } from '../../services/dialog.service';

function buildComponent(
  loginResult = { success: true, message: undefined as string | undefined },
  resetResult = { success: true, message: undefined as string | undefined },
) {
  const authMock = {
    login: vi.fn().mockResolvedValue(loginResult),
    sendPasswordReset: vi.fn().mockResolvedValue(resetResult),
  };
  const dialogMock = { closeLogin: vi.fn(), openRegister: vi.fn() };

  TestBed.configureTestingModule({
    providers: [
      Login,
      { provide: AuthService, useValue: authMock },
      { provide: DialogService, useValue: dialogMock },
    ],
  });

  return { comp: TestBed.inject(Login), authMock, dialogMock };
}

describe('Login – submit validation', () => {
  it('shows error when email is empty', async () => {
    const { comp } = buildComponent();
    (comp as any).email = '';
    (comp as any).password = 'secret';
    await comp.submit();
    expect((comp as any).error).toBe('Bitte alle Felder ausfüllen.');
  });

  it('shows error when password is empty', async () => {
    const { comp } = buildComponent();
    (comp as any).email = 'a@b.de';
    (comp as any).password = '';
    await comp.submit();
    expect((comp as any).error).toBe('Bitte alle Felder ausfüllen.');
  });

  it('calls authService.login with correct args', async () => {
    const { comp, authMock } = buildComponent();
    (comp as any).email = 'a@b.de';
    (comp as any).password = 'pw';
    await comp.submit();
    expect(authMock.login).toHaveBeenCalledWith('a@b.de', 'pw');
  });

  it('closes dialog on success', async () => {
    const { comp, dialogMock } = buildComponent();
    (comp as any).email = 'a@b.de';
    (comp as any).password = 'pw';
    await comp.submit();
    expect(dialogMock.closeLogin).toHaveBeenCalled();
  });

  it('shows server error on login failure', async () => {
    const { comp } = buildComponent({ success: false, message: 'Ungültige Zugangsdaten.' });
    (comp as any).email = 'a@b.de';
    (comp as any).password = 'wrong';
    await comp.submit();
    expect((comp as any).error).toBe('Ungültige Zugangsdaten.');
  });

  it('shows fallback error message when server sends none', async () => {
    const { comp } = buildComponent({ success: false, message: undefined });
    (comp as any).email = 'a@b.de';
    (comp as any).password = 'wrong';
    await comp.submit();
    expect((comp as any).error).toBe('Anmeldung fehlgeschlagen.');
  });
});

describe('Login – reset mode', () => {
  it('openReset switches mode and pre-fills resetEmail', () => {
    const { comp } = buildComponent();
    (comp as any).email = 'pre@fill.de';
    comp.openReset();
    expect((comp as any).mode).toBe('reset');
    expect((comp as any).resetEmail).toBe('pre@fill.de');
  });

  it('backToLogin switches mode back to login', () => {
    const { comp } = buildComponent();
    comp.openReset();
    comp.backToLogin();
    expect((comp as any).mode).toBe('login');
  });

  it('sendReset shows error when resetEmail is empty', async () => {
    const { comp } = buildComponent();
    (comp as any).resetEmail = '';
    await comp.sendReset();
    expect((comp as any).resetError).toBe('Bitte gib deine E-Mail-Adresse ein.');
  });

  it('sendReset calls authService.sendPasswordReset', async () => {
    const { comp, authMock } = buildComponent();
    (comp as any).resetEmail = 'user@test.de';
    await comp.sendReset();
    expect(authMock.sendPasswordReset).toHaveBeenCalledWith('user@test.de');
  });

  it('sets resetSent on success', async () => {
    const { comp } = buildComponent();
    (comp as any).resetEmail = 'user@test.de';
    await comp.sendReset();
    expect((comp as any).resetSent).toBe(true);
  });

  it('sets resetError on failure', async () => {
    const { comp } = buildComponent(
      { success: true, message: undefined },
      { success: false, message: 'E-Mail nicht gefunden.' },
    );
    (comp as any).resetEmail = 'user@test.de';
    await comp.sendReset();
    expect((comp as any).resetError).toBe('E-Mail nicht gefunden.');
  });
});

describe('Login – switchToRegister', () => {
  it('closes login and opens register dialog', () => {
    const { comp, dialogMock } = buildComponent();
    comp.switchToRegister();
    expect(dialogMock.closeLogin).toHaveBeenCalled();
    expect(dialogMock.openRegister).toHaveBeenCalled();
  });
});
