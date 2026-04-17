// src/app/services/produkt.service.ts
import {Injectable} from '@angular/core';
import {addDoc, collection, deleteDoc, doc, Firestore, getDoc, getDocs, updateDoc} from 'firebase/firestore';
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
      }))
    };

    try {
      await updateDoc(produktDocRef, firestoreCompatibleProdukt); // Das vorbereitete Objekt übergeben
      console.log(`Produkt mit ID ${id} erfolgreich in Firestore aktualisiert.`);
    } catch (error: any) {
      console.error(`Fehler beim Aktualisieren des Produkts mit ID ${id} in Firestore:`, error);
      throw error;
    }
  }

  async deleteProdukt(id: string): Promise<void> {
    const produktDocRef = doc(db as Firestore, 'products', id);
    await deleteDoc(produktDocRef);
  }
}
