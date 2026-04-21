// src/app/services/produkt.service.ts
import {Injectable} from '@angular/core';
import {addDoc, collection, deleteDoc, deleteField, doc, Firestore, getCountFromServer, getDoc, getDocs, limit, orderBy, query, QueryDocumentSnapshot, setDoc, startAfter, updateDoc, writeBatch} from 'firebase/firestore';
import {db} from '../../environments/environment';
import {IProdukt} from '../models/interfaces/IProdukt';

@Injectable({
  providedIn: 'root',
})
export class ProduktService {
  private productsCollection = collection(db as Firestore, 'products');

  constructor() {
  }

  async getProdukte(): Promise<IProdukt[]> {
    const querySnapshot = await getDocs(this.productsCollection);
    return querySnapshot.docs.map(doc => ({...doc.data(), id: doc.id} as IProdukt));
  }

  async getProdukt(id: string): Promise<IProdukt | undefined> {
    const produktDocRef = doc(db as Firestore, 'products', id);
    const produktDocSnap = await getDoc(produktDocRef);
    return produktDocSnap.exists() ? {...produktDocSnap.data(), id: produktDocSnap.id} as IProdukt : undefined;
  }

  async addProdukt(produkt: IProdukt): Promise<string> {
    const docRef = await addDoc(this.productsCollection, produkt);
    return docRef.id;
  }

  async editProdukt(id: string, produkt: IProdukt): Promise<void> {
    const produktDocRef = doc(db as Firestore, 'products', id);

    const firestoreCompatibleProdukt: { [key: string]: any } = {
      bezeichnung: produkt.bezeichnung ?? '',
      beschreibung: produkt.beschreibung ?? '',
      preis: produkt.preis ?? 0,
      verfuegbar: produkt.verfuegbar ?? true,
      lagerbestand: produkt.lagerbestand ?? 0,
      imgRefs: (produkt.imgRefs ?? []).map(img => ({
        path: img.path ?? '',
        position: img.position ?? 0
      })),
      kategorieId: produkt.kategorieId || deleteField(),
    };

    try {
      await updateDoc(produktDocRef, firestoreCompatibleProdukt); // Das vorbereitete Objekt übergeben
      console.log(`Produkt mit ID ${id} erfolgreich in Firestore aktualisiert.`);
    } catch (error: any) {
      console.error(`Fehler beim Aktualisieren des Produkts mit ID ${id} in Firestore:`, error);
      throw error;
    }
  }

  async upsertProdukt(id: string, produkt: IProdukt): Promise<void> {
    const produktDocRef = doc(db as Firestore, 'products', id);
    await setDoc(produktDocRef, {
      bezeichnung: produkt.bezeichnung ?? '',
      beschreibung: produkt.beschreibung ?? '',
      preis: produkt.preis ?? 0,
      verfuegbar: produkt.verfuegbar ?? true,
      lagerbestand: produkt.lagerbestand ?? 0,
      imgRefs: (produkt.imgRefs ?? []).map(img => ({
        path: img.path ?? '',
        position: img.position ?? 0,
      })),
    });
  }

  async getProduktCount(): Promise<number> {
    const snap = await getCountFromServer(this.productsCollection);
    return snap.data().count;
  }

  async getProduktePage(pageSize: number, afterDoc?: QueryDocumentSnapshot): Promise<{ items: IProdukt[], lastDoc: QueryDocumentSnapshot | null }> {
    const q = afterDoc
      ? query(this.productsCollection, orderBy('bezeichnung'), startAfter(afterDoc), limit(pageSize))
      : query(this.productsCollection, orderBy('bezeichnung'), limit(pageSize));
    const snap = await getDocs(q);
    return {
      items: snap.docs.map(d => ({ ...d.data(), id: d.id } as IProdukt)),
      lastDoc: snap.docs[snap.docs.length - 1] ?? null,
    };
  }

  async bulkSetKategorie(ids: string[], kategorieId: string | undefined): Promise<void> {
    const batch = writeBatch(db as Firestore);
    for (const id of ids) {
      batch.update(doc(db as Firestore, 'products', id), {
        kategorieId: kategorieId || deleteField(),
      });
    }
    await batch.commit();
  }

  async deleteProdukt(id: string): Promise<void> {
    const produktDocRef = doc(db as Firestore, 'products', id);
    await deleteDoc(produktDocRef);
  }
}
