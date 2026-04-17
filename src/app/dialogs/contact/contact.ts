import {Component, inject, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {DialogService} from '../../services/dialog.service';
import {EmailService} from '../../services/email.service';
import {AuthService} from '../../services/auth.service';
import {UserService} from '../../services/user.service';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contact.html',
  styleUrl: './contact.css',
})
export class Contact implements OnInit {
  protected dialogService = inject(DialogService);
  private emailService = inject(EmailService);
  private authService = inject(AuthService);
  private userService = inject(UserService);

  protected name = '';
  protected email = '';
  protected betreff = '';
  protected nachricht = '';
  protected loading = false;
  protected error = '';
  protected success = false;

  async ngOnInit() {
    if (this.authService.isLoggedIn()) {
      try {
        const user = await this.userService.getCurrentUser();
        this.name = `${user.vorname ?? ''} ${user.nachname ?? ''}`.trim();
        this.email = user.email ?? '';
      } catch {}
    }
  }

  async submit() {
    if (!this.name || !this.email || !this.betreff || !this.nachricht) {
      this.error = 'Bitte alle Felder ausfüllen.';
      return;
    }
    this.loading = true;
    this.error = '';
    try {
      await this.emailService.sendSupportMail({
        name: this.name,
        email: this.email,
        betreff: this.betreff,
        nachricht: this.nachricht,
      });
      this.success = true;
    } catch {
      this.error = 'Nachricht konnte nicht gesendet werden. Bitte versuche es später erneut.';
    } finally {
      this.loading = false;
    }
  }

  close() {
    this.dialogService.closeContact();
  }

  onOverlayClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('overlay')) {
      this.close();
    }
  }
}
