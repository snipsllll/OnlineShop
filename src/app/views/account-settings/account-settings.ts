import {Component, effect, inject, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {IUser} from '../../models/interfaces/IUser';
import {UserService} from '../../services/user.service';
import {AuthService} from '../../services/auth.service';
import {RoutingService} from '../../services/routing.service';
import {DialogService} from '../../services/dialog.service';
import {MyRoutes} from '../../models/enums/MyRoutes';
import {Rolle} from '../../models/enums/Rolle';

@Component({
  selector: 'app-account-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './account-settings.html',
  styleUrl: './account-settings.css',
})
export class AccountSettings {
  private userService = inject(UserService);
  protected authService = inject(AuthService);
  private routingService = inject(RoutingService);
  protected dialogService = inject(DialogService);

  protected user = signal<IUser | null>(null);
  protected loading = signal(true);
  protected saving = signal(false);
  protected saveSuccess = signal(false);

  protected vorname = '';
  protected nachname = '';
  protected telefonnummer = '';
  protected strasse = '';
  protected hausnummer = '';
  protected plz = '';
  protected ort = '';
  protected land = '';

  constructor() {
    effect(() => {
      if (!this.authService.authInitialized()) return;
      if (this.authService.isLoggedIn()) {
        this.loadUser();
      } else {
        this.user.set(null);
        this.loading.set(false);
      }
    }, { allowSignalWrites: true });
  }

  private async loadUser() {
    this.loading.set(true);
    try {
      const user = await this.userService.getCurrentUser();
      this.user.set(user);
      this.vorname = user.vorname ?? '';
      this.nachname = user.nachname ?? '';
      this.telefonnummer = user.telefonnummer ?? '';
      const adr = user.adresse ?? {};
      this.strasse = adr.strasse ?? '';
      this.hausnummer = adr.hausnummer ?? '';
      this.plz = adr.plz ?? '';
      this.ort = adr.ort ?? '';
      this.land = adr.land ?? 'Deutschland';
    } catch {
      this.user.set(null);
    } finally {
      this.loading.set(false);
    }
  }

  async save() {
    const u = this.user();
    if (!u) return;
    this.saving.set(true);
    try {
      u.vorname = this.vorname;
      u.nachname = this.nachname;
      u.telefonnummer = this.telefonnummer;
      u.adresse = { id: u.adresse?.id ?? '', strasse: this.strasse, hausnummer: this.hausnummer, plz: this.plz, ort: this.ort, land: this.land };
      await this.userService.updateUser(u);
      this.saveSuccess.set(true);
      setTimeout(() => this.saveSuccess.set(false), 3000);
    } finally {
      this.saving.set(false);
    }
  }

  async logout() {
    await this.authService.logout();
    this.routingService.route(MyRoutes.PRODUKTE_OVERVIEW);
  }

  deleteAccount() {
    this.dialogService.openConfirm(
      'Konto löschen',
      'Möchtest du dein Konto wirklich dauerhaft löschen? Diese Aktion kann nicht rückgängig gemacht werden.',
      async () => {
        const u = this.user();
        if (!u) return;
        await this.userService.deleteUser(u.uid);
        await this.authService.logout();
        this.routingService.route(MyRoutes.PRODUKTE_OVERVIEW);
      }
    );
  }

  get isKunde(): boolean {
    return this.authService.currentRolle() === Rolle.KUNDE;
  }

  goToOrders() { this.routingService.route(MyRoutes.BESTELLUNGEN_OVERVIEW); }
}
