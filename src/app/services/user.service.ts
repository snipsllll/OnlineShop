import {Injectable} from '@angular/core';
import {deleteDoc, doc, Firestore, getDoc, setDoc, updateDoc} from 'firebase/firestore';
import {auth, db} from '../../environments/environment';
import {IFIreUser, IUser} from '../models/interfaces/IUser';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  constructor() {
  }

  async createNewUser(documentId: string, email: string, name?: string): Promise<string> {
    const userDocRef = doc(db as Firestore, 'users', documentId);

    const userData: IFIreUser = {
      uid: documentId,
      email: email,
    };

    if (name) {
      userData.displayName = name;
    }

    try {
      await setDoc(userDocRef, userData); // setDoc erstellt das Dokument oder überschreibt es
      console.log(`Firestore user profile for UID ${documentId} (Email: ${email}, Name: ${name || 'N/A'}) created/updated.`);
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
      email: user.email,
      displayName: user.displayName,
      rolle: user.rolle.toString(),
      adresse: {
        strasse: user.adresse.strasse,
        hausnummer: user.adresse.hausnummer,
        plz: user.adresse.plz,
        ort: user.adresse.ort,
      },
      vorname: user.vorname,
      nachname: user.nachname,
      telefonnummer: user.telefonnummer,
      favorisierteProduktIds: user.favorisierteProduktIds,
    };

    try {
      await updateDoc(userDocRef, firestoreCompatibleData); // Hier das vorbereitete Objekt übergeben
      console.log(`User with UID ${user.uid} updated successfully in Firestore.`);
    } catch (error: any) {
      console.error(`Error updating user with UID ${user.uid} in Firestore:`, error);
      throw error;
    }
  }

  async deleteUser(uid: string): Promise<void> {
    const userDocRef = doc(db as Firestore, 'users', uid);
    await deleteDoc(userDocRef);
  }

  private getIUserFromFireUser(user: IFIreUser): IUser {
    return user as IUser;
  }

}
