import {Injectable, signal} from '@angular/core';
import {createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut, User, UserCredential} from 'firebase/auth';
import {UserService} from './user.service';
import {auth} from '../../environments/environment';

export interface IActionResult {
  success: boolean;
  message?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  public currentUser: UserCredential | null = null;
  public isLoggedIn = signal(false);
  public displayName = signal<string | null>(null);

  constructor(private userService: UserService) {
    onAuthStateChanged(auth, (user: User | null) => {
      this.isLoggedIn.set(!!user);
      if (user) {
        this.userService.getCurrentUser().then(u => {
          this.displayName.set(u.displayName ?? u.vorname ?? null);
        }).catch(() => {});
      } else {
        this.displayName.set(null);
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
      this.currentUser = await signInWithEmailAndPassword(auth, email, password);
      return {success: true};
    } catch (error: any) {
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
