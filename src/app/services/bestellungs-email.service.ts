import {inject, Injectable} from '@angular/core';
import {IBestellung} from '../models/interfaces/IBestellung';
import {EmailService} from './email.service';
import {UserService} from './user.service';

@Injectable({providedIn: 'root'})
export class BestellungsEmailService {
  private emailService = inject(EmailService);
  private userService = inject(UserService);

  sendBestellungsbestaetigung(bestellung: IBestellung): void {
    this.send(bestellung, (name, email) =>
      this.emailService.sendBestellungsbestaetigung(name, email, bestellung.id)
    );
  }

  sendVersandbestaetigung(bestellung: IBestellung): void {
    this.send(bestellung, (name, email) =>
      this.emailService.sendVersandbestaetigung(name, email, bestellung.id)
    );
  }

  private send(bestellung: IBestellung, fn: (name: string, email: string) => Promise<void>): void {
    if (!bestellung.userId) return;
    const name = `${bestellung.lieferadresse?.vorname ?? ''} ${bestellung.lieferadresse?.nachname ?? ''}`.trim();
    this.userService.getUserById(bestellung.userId)
      .then(user => { if (user?.email) fn(name, user.email).catch(() => {}); })
      .catch(() => {});
  }
}
