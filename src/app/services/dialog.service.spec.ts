import { TestBed } from '@angular/core/testing';
import { DialogService } from './dialog.service';

describe('DialogService', () => {
  let service: DialogService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DialogService);
  });

  describe('initial state', () => {
    it('all open-signals start false', () => {
      expect(service.loginOpen()).toBe(false);
      expect(service.registerOpen()).toBe(false);
      expect(service.confirmOpen()).toBe(false);
      expect(service.messageOpen()).toBe(false);
      expect(service.contactOpen()).toBe(false);
    });

    it('message signals start empty', () => {
      expect(service.confirmTitle()).toBe('');
      expect(service.confirmMessage()).toBe('');
      expect(service.messageTitle()).toBe('');
      expect(service.messageText()).toBe('');
    });
  });

  describe('login dialog', () => {
    it('openLogin sets loginOpen to true', () => {
      service.openLogin();
      expect(service.loginOpen()).toBe(true);
    });

    it('closeLogin sets loginOpen to false', () => {
      service.openLogin();
      service.closeLogin();
      expect(service.loginOpen()).toBe(false);
    });
  });

  describe('register dialog', () => {
    it('openRegister sets registerOpen to true', () => {
      service.openRegister();
      expect(service.registerOpen()).toBe(true);
    });

    it('closeRegister sets registerOpen to false', () => {
      service.openRegister();
      service.closeRegister();
      expect(service.registerOpen()).toBe(false);
    });
  });

  describe('contact dialog', () => {
    it('openContact / closeContact toggle contactOpen', () => {
      service.openContact();
      expect(service.contactOpen()).toBe(true);
      service.closeContact();
      expect(service.contactOpen()).toBe(false);
    });
  });

  describe('openConfirm', () => {
    it('sets title, message and opens dialog', () => {
      service.openConfirm('Titel', 'Nachricht', vi.fn());
      expect(service.confirmTitle()).toBe('Titel');
      expect(service.confirmMessage()).toBe('Nachricht');
      expect(service.confirmOpen()).toBe(true);
    });
  });

  describe('executeConfirm', () => {
    it('calls the registered callback', () => {
      const cb = vi.fn();
      service.openConfirm('T', 'M', cb);
      service.executeConfirm();
      expect(cb).toHaveBeenCalledTimes(1);
    });

    it('closes the confirm dialog after execution', () => {
      service.openConfirm('T', 'M', vi.fn());
      service.executeConfirm();
      expect(service.confirmOpen()).toBe(false);
    });

    it('does nothing when no callback is registered', () => {
      expect(() => service.executeConfirm()).not.toThrow();
    });
  });

  describe('closeConfirm', () => {
    it('closes without calling callback', () => {
      const cb = vi.fn();
      service.openConfirm('T', 'M', cb);
      service.closeConfirm();
      expect(service.confirmOpen()).toBe(false);
      expect(cb).not.toHaveBeenCalled();
    });
  });

  describe('openMessage', () => {
    it('sets title, text and opens message dialog', () => {
      service.openMessage('Info', 'Details hier');
      expect(service.messageTitle()).toBe('Info');
      expect(service.messageText()).toBe('Details hier');
      expect(service.messageOpen()).toBe(true);
    });
  });

  describe('closeMessage', () => {
    it('closes message dialog', () => {
      service.openMessage('T', 'X');
      service.closeMessage();
      expect(service.messageOpen()).toBe(false);
    });
  });
});
