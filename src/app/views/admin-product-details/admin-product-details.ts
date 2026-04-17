import {Component, ElementRef, inject, OnInit, signal, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {ActivatedRoute} from '@angular/router';
import {IProdukt} from '../../models/interfaces/IProdukt';
import {IImgRef} from '../../models/interfaces/IImgRef';
import {ProduktService} from '../../services/produkt.service';
import {StorageService} from '../../services/storage.service';
import {RoutingService} from '../../services/routing.service';
import {MyRoutes} from '../../models/enums/MyRoutes';
import {RouteParams} from '../../models/enums/RouteParams';

@Component({
  selector: 'app-admin-product-details',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-product-details.html',
  styleUrl: './admin-product-details.css',
})
export class AdminProductDetails implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  private route = inject(ActivatedRoute);
  private produktService = inject(ProduktService);
  private storageService = inject(StorageService);
  private routingService = inject(RoutingService);

  protected loading = signal(true);
  protected saving = signal(false);
  protected uploading = signal(false);
  protected isDragOver = signal(false);
  protected isNew = false;
  protected productId = '';

  protected bezeichnung = '';
  protected beschreibung = '';
  protected preis = 0;
  protected lagerbestand = 0;
  protected verfuegbar = true;
  protected imgRefs: IImgRef[] = [];

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get(RouteParams.PRODUCT_ID);
    this.isNew = id === 'new';
    this.productId = id ?? '';
    this.loading.set(true);
    try {
      if (!this.isNew && id) {
        const p = await this.produktService.getProdukt(id);
        if (p) {
          this.bezeichnung = p.bezeichnung ?? '';
          this.beschreibung = p.beschreibung ?? '';
          this.preis = p.preis ?? 0;
          this.lagerbestand = p.lagerbestand ?? 0;
          this.verfuegbar = p.verfuegbar ?? true;
          this.imgRefs = (p.imgRefs ?? []).map((img, i) => ({
            id: img.id ?? '',
            path: img.path ?? '',
            position: img.position ?? i,
          }));
        }
      }
    } finally {
      this.loading.set(false);
    }
  }

  openFilePicker() {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event) {
    const files = (event.target as HTMLInputElement).files;
    if (files) this.uploadFiles(Array.from(files));
    (event.target as HTMLInputElement).value = '';
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(true);
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
    const files = event.dataTransfer?.files;
    if (files) this.uploadFiles(Array.from(files).filter(f => f.type.startsWith('image/')));
  }

  private async uploadFiles(files: File[]) {
    if (!files.length) return;
    this.uploading.set(true);
    try {
      for (const file of files) {
        const base64 = await this.storageService.imageToBase64(file);
        this.imgRefs = [...this.imgRefs, { id: '', path: base64, position: this.imgRefs.length }];
      }
    } finally {
      this.uploading.set(false);
    }
  }

  removeImage(index: number) {
    this.imgRefs = this.imgRefs.filter((_, i) => i !== index).map((img, i) => ({...img, position: i}));
  }

  async save() {
    this.saving.set(true);
    try {
      const produkt: IProdukt = {
        id: this.productId,
        bezeichnung: this.bezeichnung,
        beschreibung: this.beschreibung,
        preis: this.preis,
        lagerbestand: this.lagerbestand,
        verfuegbar: this.verfuegbar,
        imgRefs: this.imgRefs
      };
      if (this.isNew) {
        await this.produktService.addProdukt(produkt);
      } else {
        await this.produktService.editProdukt(this.productId, produkt);
      }
      this.routingService.route(MyRoutes.ADMIN_PRODUCTS_OVERVIEW);
    } finally {
      this.saving.set(false);
    }
  }

  goBack() { this.routingService.route(MyRoutes.ADMIN_PRODUCTS_OVERVIEW); }

  get isValid(): boolean {
    return !!((this.bezeichnung ?? '').trim() && (this.beschreibung ?? '').trim() && this.preis > 0 && this.lagerbestand >= 0);
  }
}
