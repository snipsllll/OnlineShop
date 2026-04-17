import {inject, Injectable, signal} from '@angular/core';
import {createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut, User, UserCredential} from 'firebase/auth';
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
  public isLoggedIn = signal(false);
  public displayName = signal<string | null>(null);
  public currentRolle = signal<Rolle | null>(null);
  /** true sobald onAuthStateChanged das erste Mal gefeuert hat (Session bekannt) */
  public authInitialized = signal(false);

  private justLoggedIn = false;

  constructor(private userService: UserService, private warenkorbService: WarenkorbService) {
    onAuthStateChanged(auth, async (user: User | null) => {
      this.isLoggedIn.set(!!user);
      this.authInitialized.set(true); // Auth-Zustand ist jetzt bekannt
      if (user) {
        // Merge guest cart into Firestore, then load display name + role
        await this.warenkorbService.mergeGuestCart().catch(() => {});
        this.userService.getCurrentUser().then(u => {
          this.displayName.set(u.displayName ?? u.vorname ?? null);
          const rolle = u.rolle ?? Rolle.KUNDE;
          this.currentRolle.set(rolle);
          if (this.justLoggedIn) {
            this.justLoggedIn = false;
            if (rolle === Rolle.OWNER || rolle === Rolle.ADMIN || rolle === Rolle.MITARBEITER) {
              this.router.navigate([MyRoutes.ADMIN_DASHBOARD]);
            }
          }
        }).catch(() => { this.justLoggedIn = false; });
      } else {
        this.displayName.set(null);
        this.currentRolle.set(null);
      }
    });
  }

  async register(email: string, password: string, vorname: string, nachname: string): Promise<IActionResult> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await this.userService.createNewUser(userCredential.user.uid, userCredential.user.email!, vorname, nachname);
      return {success: true};
    } catch (error: any) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  async login(email: string, password: string): Promise<IActionResult> {
    try {
      this.justLoggedIn = true;
      this.currentUser = await signInWithEmailAndPassword(auth, email, password);
      return {success: true};
    } catch (error: any) {
      this.justLoggedIn = false;
      return {
        success: false,
        message: error.message
      };
    }
  }

  async logout(): Promise<IActionResult> {
    try {
      await signOut(auth);
      this.currentUser = null;
      return {success: true};
    } catch (error: any) {
      return {
        success: false,
        message: error.message
      };
    }
  }
}
