import {Injectable, signal} from '@angular/core';

@Injectable({ providedIn: 'root' })
export class DialogService {
  loginOpen = signal(false);
  registerOpen = signal(false);
  confirmOpen = signal(false);
  messageOpen = signal(false);
  contactOpen = signal(false);

  confirmMessage = signal('');
  confirmTitle = signal('');
  private confirmCallback: (() => void) | null = null;

  messageTitle = signal('');
  messageText = signal('');

  openLogin() { this.loginOpen.set(true); }
  closeLogin() { this.loginOpen.set(false); }

  openRegister() { this.registerOpen.set(true); }
  closeRegister() { this.registerOpen.set(false); }

  openConfirm(title: string, message: string, callback: () => void) {
    this.confirmTitle.set(title);
    this.confirmMessage.set(message);
    this.confirmCallback = callback;
    this.confirmOpen.set(true);
  }
  closeConfirm() { this.confirmOpen.set(false); }
  executeConfirm() {
    if (this.confirmCallback) this.confirmCallback();
    this.closeConfirm();
  }

  openContact() { this.contactOpen.set(true); }
  closeContact() { this.contactOpen.set(false); }

  openMessage(title: string, text: string) {
    this.messageTitle.set(title);
    this.messageText.set(text);
    this.messageOpen.set(true);
  }
  closeMessage() { this.messageOpen.set(false); }
}
