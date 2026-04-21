import {Injectable} from '@angular/core';
import {addDoc, collection, deleteField, doc, Firestore, getDocs, updateDoc, writeBatch} from 'firebase/firestore';
import {db} from '../../environments/environment';
import {IKategorie} from '../models/interfaces/IKategorie';

@Injectable({providedIn: 'root'})
export class KategorieService {
  private kategorienCollection = collection(db as Firestore, 'kategorien');

  async getKategorien(): Promise<IKategorie[]> {
    const snap = await getDocs(this.kategorienCollection);
    return snap.docs.map(d => ({...d.data(), id: d.id} as IKategorie));
  }

  async addKategorie(k: Omit<IKategorie, 'id'>): Promise<string> {
    const data: any = {name: k.name};
    if (k.beschreibung) data.beschreibung = k.beschreibung;
    const ref = await addDoc(this.kategorienCollection, data);
    return ref.id;
  }

  async updateKategorie(id: string, k: IKategorie): Promise<void> {
    const ref = doc(db as Firestore, 'kategorien', id);
    await updateDoc(ref, {
      name: k.name,
      beschreibung: k.beschreibung || deleteField(),
    });
  }

  async deleteKategorie(id: string): Promise<void> {
    const batch = writeBatch(db as Firestore);
    const productsSnap = await getDocs(collection(db as Firestore, 'products'));
    for (const productDoc of productsSnap.docs) {
      if (productDoc.data()['kategorieId'] === id) {
        batch.update(productDoc.ref, {kategorieId: deleteField()});
      }
    }
    batch.delete(doc(db as Firestore, 'kategorien', id));
    await batch.commit();
  }
}
