import {inject, Injectable, signal} from '@angular/core';
import {createUserWithEmailAndPassword, onAuthStateChanged, sendPasswordResetEmail, signInWithEmailAndPassword, signOut, User, UserCredential} from 'firebase/auth';
import {UserService} from './user.service';
import {WarenkorbService} from './warenkorb.service';
import {Rolle} from '../models/enums/Rolle';
import {auth} from '../../environments/environment';
import {Router} from '@angular/router';
import {MyRoutes} from '../models/enums/MyRoutes';

export interface IActionResult {
  success: boolean;
  message?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private router = inject(Router);

  public currentUser: UserCredential | null = null;
  public currentUid = signal<string | null>(null);
  public isLoggedIn = signal(false);
  public displayName = signal<string | null>(null);
  public currentRolle = signal<Rolle | null>(null);
  /** true sobald onAuthStateChanged das erste Mal gefeuert hat (Session bekannt) */
  public authInitialized = signal(false);

  private justLoggedIn = false;

  constructor(private userService: UserService, private warenkorbService: WarenkorbService) {
    onAuthStateChanged(auth, async (user: User | null) => {
      this.isLoggedIn.set(!!user);
      this.currentUid.set(user?.uid ?? null);
      if (user) {
        // Merge guest cart into Firestore, then load display name + role
        await this.warenkorbService.mergeGuestCart().catch(() => {});
        try {
          const u = await this.userService.getCurrentUser();
          this.displayName.set(u.displayName ?? u.vorname ?? null);
          const rolle = u.rolle ?? Rolle.KUNDE;
          this.currentRolle.set(rolle);
          if (this.justLoggedIn) {
            this.justLoggedIn = false;
            if (rolle === Rolle.OWNER || rolle === Rolle.ADMIN || rolle === Rolle.MITARBEITER) {
              this.router.navigate([MyRoutes.ADMIN_DASHBOARD]);
            }
          }
        } catch {
          this.justLoggedIn = false;
        }
      } else {
        this.displayName.set(null);
        this.currentRolle.set(null);
        this.currentUid.set(null);
      }
      // Set only after role is fully resolved so guards don't check too early
      this.authInitialized.set(true);
    });
  }

  async register(email: string, password: string, vorname: string, nachname: string): Promise<IActionResult> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await this.userService.createNewUser(userCredential.user.uid, userCredential.user.email!, vorname, nachname);
      return {success: true};
    } catch (error: any) {
      return {success: false, message: translateFirebaseError(error.message)};
    }
  }

  async login(email: string, password: string): Promise<IActionResult> {
    try {
      this.justLoggedIn = true;
      this.currentUser = await signInWithEmailAndPassword(auth, email, password);
      return {success: true};
    } catch (error: any) {
      this.justLoggedIn = false;
      return {success: false, message: translateFirebaseError(error.message)};
    }
  }

  async logout(): Promise<IActionResult> {
    try {
      await signOut(auth);
      this.currentUser = null;
      return {success: true};
    } catch (error: any) {
      return {success: false, message: translateFirebaseError(error.message)};
    }
  }

  async sendPasswordReset(email: string): Promise<IActionResult> {
    try {
      await sendPasswordResetEmail(auth, email);
      return {success: true};
    } catch (error: any) {
      return {success: false, message: translateFirebaseError(error.message)};
    }
  }
}

function translateFirebaseError(raw: string): string {
  if (raw.includes('auth/invalid-credential') || raw.includes('auth/wrong-password') || raw.includes('auth/user-not-found'))
    return 'E-Mail-Adresse oder Passwort ist falsch.';
  if (raw.includes('auth/email-already-in-use'))
    return 'Diese E-Mail-Adresse wird bereits verwendet.';
  if (raw.includes('auth/weak-password'))
    return 'Das Passwort ist zu schwach. Mindestens 6 Zeichen erforderlich.';
  if (raw.includes('auth/invalid-email'))
    return 'Die E-Mail-Adresse ist ungültig.';
  if (raw.includes('auth/too-many-requests'))
    return 'Zu viele Versuche. Bitte versuche es später erneut.';
  if (raw.includes('auth/network-request-failed'))
    return 'Netzwerkfehler. Bitte überprüfe deine Verbindung.';
  return 'Ein Fehler ist aufgetreten. Bitte versuche es erneut.';
}
