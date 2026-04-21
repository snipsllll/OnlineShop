import {Component, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {AuthService} from '../../services/auth.service';
import {DialogService} from '../../services/dialog.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  private authService = inject(AuthService);
  protected dialogService = inject(DialogService);

  protected email = '';
  protected password = '';
  protected passwordRepeat = '';
  protected vorname = '';
  protected nachname = '';
  protected loading = false;
  protected error = '';
  protected showPassword = false;
  protected showPasswordRepeat = false;

  async submit() {
    this.error = '';

    if (!this.vorname || !this.nachname || !this.email || !this.password || !this.passwordRepeat) {
      this.error = 'Bitte alle Felder ausfüllen.';
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email)) {
      this.error = 'Bitte eine gültige E-Mail-Adresse eingeben.';
      return;
    }

    if (this.password !== this.passwordRepeat) {
      this.error = 'Die Passwörter stimmen nicht überein.';
      return;
    }

    if (this.password.length < 6) {
      this.error = 'Das Passwort muss mindestens 6 Zeichen lang sein.';
      return;
    }

    this.loading = true;
    const result = await this.authService.register(this.email, this.password, this.vorname, this.nachname);
    this.loading = false;

    if (result.success) {
      this.dialogService.closeRegister();
    } else {
      this.error = result.message ?? 'Registrierung fehlgeschlagen.';
    }
  }

  switchToLogin() {
    this.dialogService.closeRegister();
    this.dialogService.openLogin();
  }

  onOverlayClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('overlay')) {
      this.dialogService.closeRegister();
    }
  }
}
