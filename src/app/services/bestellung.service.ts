import {Injectable} from '@angular/core';
import {addDoc, collection, deleteDoc, doc, Firestore, getDoc, getDocs, updateDoc} from 'firebase/firestore';
import {db} from '../../environments/environment';
import {IBestellung} from '../models/interfaces/IBestellung';

@Injectable({
  providedIn: 'root',
})
export class BestellungService {
  private ordersCollection = collection(db as Firestore, 'orders');

  constructor() {
  }

  async getBestellungen(): Promise<IBestellung[]> {
    const querySnapshot = await getDocs(this.ordersCollection);
    return querySnapshot.docs.map(doc => ({...doc.data(), id: doc.id} as IBestellung));
  }

  async getBestellung(id: string): Promise<IBestellung | undefined> {
    const bestellungDocRef = doc(db as Firestore, 'orders', id);
    const bestellungDocSnap = await getDoc(bestellungDocRef);
    return bestellungDocSnap.exists() ? {...bestellungDocSnap.data(), id: bestellungDocSnap.id} as IBestellung : undefined;
  }

  async addBestellung(bestellung: IBestellung): Promise<string> {
    const docRef = await addDoc(this.ordersCollection, bestellung);
    return docRef.id;
  }

  async editBestellung(id: string, bestellung: IBestellung): Promise<void> {
    const bestellungDocRef = doc(db as Firestore, 'orders', id);

    const firestoreCompatibleBestellung: { [key: string]: any } = {
      bestellungsZustand: bestellung.bestellungsZustand,
      bestelldatum: bestellung.bestelldatum,
      produkte: bestellung.produkte,
      zahlungsZustand: bestellung.zahlungsZustand,
      lieferadresse: bestellung.lieferadresse,
    };

    try {
      await updateDoc(bestellungDocRef, firestoreCompatibleBestellung); // Das vorbereitete Objekt übergeben
      console.log(`Bestellung mit ID ${id} erfolgreich in Firestore aktualisiert.`);
    } catch (error: any) {
      console.error(`Fehler beim Aktualisieren der Bestellung mit ID ${id} in Firestore:`, error);
      throw error;
    }
  }

  async markAsViewed(id: string): Promise<void> {
    const ref = doc(db as Firestore, 'orders', id);
    await updateDoc(ref, {isNew: false});
  }

  async deleteBestellung(id: string): Promise<void> {
    const bestellungDocRef = doc(db as Firestore, 'orders', id);
    await deleteDoc(bestellungDocRef);
  }
}
