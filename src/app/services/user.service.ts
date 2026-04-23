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
  constructor() {
  }

  async createNewUser(documentId: string, email: string, vorname: string, nachname: string): Promise<string> {
    const userDocRef = doc(db as Firestore, 'users', documentId);

    const userData: any = {
      uid: documentId,
      email: email,
      vorname: vorname,
      nachname: nachname,
      displayName: `${vorname} ${nachname}`.trim(),
      rolle: Rolle.KUNDE.toString(),
    };

    try {
      await setDoc(userDocRef, userData); // setDoc erstellt das Dokument oder überschreibt es
      console.log(`Firestore user profile for UID ${documentId} (Email: ${email}, Name: ${vorname} ${nachname}) created/updated.`);
      return documentId; // Gibt die verwendete Dokument-ID zurück
    } catch (error: any) {
      console.error(`Error creating/updating Firestore user profile for UID ${documentId}:`, error);
      throw new Error(`Failed to create/update user profile: ${error.message}`);
    }
  }

  async getCurrentUser(): Promise<IUser> {
    const currentUserAuth = auth.currentUser;

    if (!currentUserAuth) {
      console.log("No user currently logged in.");
      throw new Error("No user currently logged in.");
    }

    const uid = currentUserAuth.uid;
    const userDocRef = doc(db as Firestore, 'users', uid);

    try {
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        console.log(`Firestore profile found for logged-in user: ${uid}`);
        return this.getIUserFromFireUser({id: userDocSnap.id, ...userDocSnap.data() as IFIreUser});
      } else {
        console.log(`No Firestore profile found for logged-in user with UID: ${uid}`);
        throw new Error("No user currently logged in.")
      }
    } catch (error: any) {
      console.error(`Error fetching Firestore profile for logged-in user ${uid}:`, error);
      throw error;
    }
  }

  async updateUser(user: IUser): Promise<void> {
    if (!user.uid) {
      console.error('Error updating user: User object must have a uid property.');
      throw new Error('User object must have a uid property to update.');
    }

    const userDocRef = doc(db as Firestore, 'users', user.uid);

    // NEU: Nur die Firestore-kompatiblen Felder extrahieren und eventuell konvertieren
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

    try {
      await updateDoc(userDocRef, firestoreCompatibleData); // Hier das vorbereitete Objekt übergeben
      console.log(`User with UID ${user.uid} updated successfully in Firestore.`);
    } catch (error: any) {
      console.error(`Error updating user with UID ${user.uid} in Firestore:`, error);
      throw error;
    }
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

  /**
   * Deletes a user from both Firebase Auth and Firestore.
   * Requires the caller to be an Owner — enforced server-side by the Cloud Function.
   */
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
