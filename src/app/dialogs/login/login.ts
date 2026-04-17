import {Component, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {AuthService} from '../../services/auth.service';
import {DialogService} from '../../services/dialog.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private authService = inject(AuthService);
  protected dialogService = inject(DialogService);

  protected email = '';
  protected password = '';
  protected loading = false;
  protected error = '';
  protected showPassword = false;

  // Forgot-password mode
  protected mode: 'login' | 'reset' = 'login';
  protected resetEmail = '';
  protected resetLoading = false;
  protected resetSent = false;
  protected resetError = '';

  async submit() {
    if (!this.email || !this.password) {
      this.error = 'Bitte alle Felder ausfüllen.';
      return;
    }
    this.loading = true;
    this.error = '';
    const result = await this.authService.login(this.email, this.password);
    this.loading = false;
    if (result.success) {
      this.dialogService.closeLogin();
    } else {
      this.error = result.message ?? 'Anmeldung fehlgeschlagen.';
    }
  }

  openReset() {
    this.resetEmail = this.email; // pre-fill with what was typed
    this.resetSent = false;
    this.resetError = '';
    this.mode = 'reset';
  }

  backToLogin() {
    this.mode = 'login';
    this.resetSent = false;
    this.resetError = '';
  }

  async sendReset() {
    if (!this.resetEmail) {
      this.resetError = 'Bitte gib deine E-Mail-Adresse ein.';
      return;
    }
    this.resetLoading = true;
    this.resetError = '';
    const result = await this.authService.sendPasswordReset(this.resetEmail);
    this.resetLoading = false;
    if (result.success) {
      this.resetSent = true;
    } else {
      this.resetError = result.message ?? 'Fehler beim Senden der E-Mail.';
    }
  }

  switchToRegister() {
    this.dialogService.closeLogin();
    this.dialogService.openRegister();
  }

  onOverlayClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('overlay')) {
      this.dialogService.closeLogin();
    }
  }
}
