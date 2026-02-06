import {Injectable} from '@angular/core';
import {createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, UserCredential} from 'firebase/auth';
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

  constructor(private userService: UserService) {
  }

  async register(email: string, password: string): Promise<IActionResult> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await this.userService.createNewUser(userCredential.user.uid, userCredential.user.email!, userCredential.user.displayName || '');
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
      signInWithEmailAndPassword(auth, email, password).then(uc => {
        this.currentUser = uc;
        return {success: true};
      });
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
      return {success: true};
    } catch (error: any) {
      return {
        success: false,
        message: error.message
      };
    }
  }
}
