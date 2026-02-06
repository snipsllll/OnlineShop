// src/app/app.component.ts
import {ChangeDetectionStrategy, Component} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';

import {AuthService} from './services/auth';
import {UserService} from './services/user';
import {ProduktService} from './services/produkt.service';
import {EmailService} from './services/email-service';
import {IEmailWrapper} from './models/interfaces/IEmailWrapper';
import {PaypalButton} from './paypal-button/paypal-button';
import {RouterOutlet} from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, PaypalButton, RouterOutlet],
  changeDetection: ChangeDetectionStrategy.Default,
  templateUrl: './app.html',
  styles: [`
    .error { color: red !important; }
  `]
})
export class App {
  constructor(private authService: AuthService,
              private userService: UserService,
              private produktService: ProduktService,
              private emailService: EmailService
  ) {

  }

  async sendTestMail() {
    const contents: IEmailWrapper = {
      content: "Ich schreibe gerade eine Nachricht",
      fromMail: "ich@gmail.com",
      header: "Test-Mail: die zweite"
    }

    this.emailService.sendContactUsMail(contents);
  }
}
