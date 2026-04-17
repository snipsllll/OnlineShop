import {Component, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {IUser} from '../../models/interfaces/IUser';
import {UserService} from '../../services/user.service';
import {DialogService} from '../../services/dialog.service';
import {Rolle} from '../../models/enums/Rolle';
import {AdminNav} from '../../components/admin-nav/admin-nav';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminNav],
  templateUrl: './admin-users.html',
  styleUrl: './admin-users.css',
})
export class AdminUsers implements OnInit {
  private userService = inject(UserService);
  private dialogService = inject(DialogService);

  protected users = signal<IUser[]>([]);
  protected loading = signal(true);
  protected saving = signal(false);
  protected saveSuccess = signal(false);
  protected searchText = '';
  protected selectedUser = signal<IUser | null>(null);

  // edit fields
  protected editVorname = '';
  protected editNachname = '';
  protected editTelefon = '';
  protected editRolle: Rolle = Rolle.KUNDE;
  protected editStrasse = '';
  protected editHausnummer = '';
  protected editPlz = '';
  protected editOrt = '';
  protected editLand = '';

  protected readonly Rolle = Rolle;

  async ngOnInit() {
    this.loading.set(true);
    try {
      const all = await this.userService.getAllUsers();
      this.users.set(all.sort((a, b) => (a.email ?? '').localeCompare(b.email ?? '')));
    } finally {
      this.loading.set(false);
    }
  }

  get filteredUsers(): IUser[] {
    const q = this.searchText.trim().toLowerCase();
    if (!q) return this.users();
    return this.users().filter(u =>
      (u.vorname ?? '').toLowerCase().includes(q) ||
      (u.nachname ?? '').toLowerCase().includes(q) ||
      (u.email ?? '').toLowerCase().includes(q) ||
      (u.uid ?? '').toLowerCase().includes(q)
    );
  }

  selectUser(u: IUser) {
    this.selectedUser.set(u);
    this.saveSuccess.set(false);
    this.editVorname = u.vorname ?? '';
    this.editNachname = u.nachname ?? '';
    this.editTelefon = u.telefonnummer ?? '';
    this.editRolle = u.rolle ?? Rolle.KUNDE;
    this.editStrasse = u.adresse?.strasse ?? '';
    this.editHausnummer = u.adresse?.hausnummer ?? '';
    this.editPlz = u.adresse?.plz ?? '';
    this.editOrt = u.adresse?.ort ?? '';
    this.editLand = u.adresse?.land ?? 'Deutschland';
  }

  closeEdit() { this.selectedUser.set(null); }

  async saveUser() {
    const u = this.selectedUser();
    if (!u) return;
    this.saving.set(true);
    this.saveSuccess.set(false);
    try {
      const updated: IUser = {
        ...u,
        vorname: this.editVorname,
        nachname: this.editNachname,
        displayName: `${this.editVorname} ${this.editNachname}`.trim(),
        telefonnummer: this.editTelefon,
        rolle: this.editRolle,
        adresse: {
          id: u.adresse?.id ?? '',
          strasse: this.editStrasse,
          hausnummer: this.editHausnummer,
          plz: this.editPlz,
          ort: this.editOrt,
          land: this.editLand,
        },
      };
      await this.userService.updateUser(updated);
      this.users.update(list => list.map(x => x.uid === updated.uid ? updated : x));
      this.selectedUser.set(updated);
      this.saveSuccess.set(true);
      setTimeout(() => this.saveSuccess.set(false), 3000);
    } finally {
      this.saving.set(false);
    }
  }

  getRolleLabel(r: Rolle): string {
    return r === Rolle.ADMIN ? 'Admin' : 'Kunde';
  }

  getRolleClass(r: Rolle): string {
    return r === Rolle.ADMIN ? 'badge--error' : 'badge--neutral';
  }

  displayName(u: IUser): string {
    const name = `${u.vorname ?? ''} ${u.nachname ?? ''}`.trim();
    return name || '—';
  }
}
