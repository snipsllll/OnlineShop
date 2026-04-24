import {Injectable} from '@angular/core';
import {collection, deleteDoc, doc, Firestore, getDoc, getDocs, setDoc, updateDoc} from 'firebase/firestore';
import {httpsCallable} from 'firebase/functions';
import {auth, db, functions} from '../../environments/environment';
import {IFIreUser, IUser} from '../models/interfaces/IUser';
import {Rolle} from '../models/enums/Rolle';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  async createNewUser(documentId: string, email: string, vorname: string, nachname: string): Promise<string> {
    const userDocRef = doc(db as Firestore, 'users', documentId);

    await setDoc(userDocRef, {
      uid: documentId,
      email,
      vorname,
      nachname,
      displayName: `${vorname} ${nachname}`.trim(),
      rolle: Rolle.KUNDE.toString(),
    });
    return documentId;
  }

  async getCurrentUser(): Promise<IUser> {
    const currentUserAuth = auth.currentUser;

    if (!currentUserAuth) throw new Error('No user currently logged in.');
    const userDocRef = doc(db as Firestore, 'users', currentUserAuth.uid);
    const userDocSnap = await getDoc(userDocRef);
    if (!userDocSnap.exists()) throw new Error('No user currently logged in.');
    return this.getIUserFromFireUser({id: userDocSnap.id, ...userDocSnap.data() as IFIreUser});
  }

  async updateUser(user: IUser): Promise<void> {
    if (!user.uid) throw new Error('User object must have a uid property to update.');
    const userDocRef = doc(db as Firestore, 'users', user.uid);
    const firestoreCompatibleData: { [key: string]: any } = {
      email: user.email ?? '',
      displayName: user.displayName ?? `${user.vorname ?? ''} ${user.nachname ?? ''}`.trim(),
      rolle: (user.rolle ?? Rolle.KUNDE).toString(),
      adresse: {
        strasse: user.adresse?.strasse ?? '',
        hausnummer: user.adresse?.hausnummer ?? '',
        plz: user.adresse?.plz ?? '',
        ort: user.adresse?.ort ?? '',
      },
      vorname: user.vorname ?? '',
      nachname: user.nachname ?? '',
      telefonnummer: user.telefonnummer ?? '',
      favorisierteProduktIds: user.favorisierteProduktIds ?? [],
      warenkorb: {
        id: user.warenkorb?.id ?? '',
        gesamtPreis: user.warenkorb?.gesamtPreis ?? 0,
        produkteMitAnzahl: (user.warenkorb?.produkteMitAnzahl ?? []).map(p => ({
          produktId: p.produktId ?? '',
          anzahl: p.anzahl ?? 0,
        })),
      },
    };

    await updateDoc(userDocRef, firestoreCompatibleData);
  }

  async getUserById(uid: string): Promise<IUser | null> {
    const userDocRef = doc(db as Firestore, 'users', uid);
    const snap = await getDoc(userDocRef);
    return snap.exists() ? this.getIUserFromFireUser({id: snap.id, ...snap.data() as IFIreUser}) : null;
  }

  async getAllUsers(): Promise<IUser[]> {
    const snap = await getDocs(collection(db as Firestore, 'users'));
    return snap.docs.map(d => this.getIUserFromFireUser({id: d.id, ...d.data() as IFIreUser}));
  }

  async deleteUser(uid: string): Promise<void> {
    const fn = httpsCallable<{ uid: string }, { success: boolean }>(functions, 'deleteUserAccount');
    await fn({ uid });
  }

  private getIUserFromFireUser(user: IFIreUser): IUser {
    const u = user as any;
    return {
      ...u,
      rolle: parseInt(u.rolle ?? Rolle.KUNDE),
    } as IUser;
  }

}
