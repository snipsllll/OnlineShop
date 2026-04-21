import {Component, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {KategorieService} from '../../services/kategorie.service';
import {IKategorie} from '../../models/interfaces/IKategorie';
import {AdminNav} from '../../components/admin-nav/admin-nav';

@Component({
  selector: 'app-admin-kategorien',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminNav],
  templateUrl: './admin-kategorien.html',
  styleUrl: './admin-kategorien.css',
})
export class AdminKategorien implements OnInit {
  private kategorieService = inject(KategorieService);

  protected kategorien = signal<IKategorie[]>([]);
  protected loading = signal(true);
  protected creating = signal(false);
  protected saving = signal(false);
  protected deleting = signal<string | null>(null);
  protected editingId = signal<string | null>(null);

  protected newName = '';
  protected newBeschreibung = '';
  protected editName = '';
  protected editBeschreibung = '';

  async ngOnInit() {
    this.loading.set(true);
    try {
      this.kategorien.set(await this.kategorieService.getKategorien());
    } finally {
      this.loading.set(false);
    }
  }

  async create() {
    if (!this.newName.trim()) return;
    this.creating.set(true);
    try {
      const id = await this.kategorieService.addKategorie({
        name: this.newName.trim(),
        beschreibung: this.newBeschreibung.trim() || undefined,
      });
      this.kategorien.update(list => [
        ...list,
        {id, name: this.newName.trim(), beschreibung: this.newBeschreibung.trim() || undefined},
      ]);
      this.newName = '';
      this.newBeschreibung = '';
    } finally {
      this.creating.set(false);
    }
  }

  startEdit(k: IKategorie) {
    this.editingId.set(k.id);
    this.editName = k.name;
    this.editBeschreibung = k.beschreibung ?? '';
  }

  cancelEdit() {
    this.editingId.set(null);
  }

  async saveEdit(k: IKategorie) {
    if (!this.editName.trim()) return;
    this.saving.set(true);
    try {
      const updated: IKategorie = {
        ...k,
        name: this.editName.trim(),
        beschreibung: this.editBeschreibung.trim() || undefined,
      };
      await this.kategorieService.updateKategorie(k.id, updated);
      this.kategorien.update(list => list.map(x => x.id === k.id ? updated : x));
      this.editingId.set(null);
    } finally {
      this.saving.set(false);
    }
  }

  async deleteKategorie(k: IKategorie) {
    if (!confirm(`Kategorie "${k.name}" löschen? Alle Produkte dieser Kategorie werden keiner Kategorie mehr zugeordnet.`)) return;
    this.deleting.set(k.id);
    try {
      await this.kategorieService.deleteKategorie(k.id);
      this.kategorien.update(list => list.filter(x => x.id !== k.id));
    } finally {
      this.deleting.set(null);
    }
  }
}
