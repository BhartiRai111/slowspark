import { getApp } from '@react-native-firebase/app';
import {
  getAuth, GoogleAuthProvider, signInWithCredential, signInWithPhoneNumber, signOut, getIdToken,
} from '@react-native-firebase/auth';
import { GoogleSignin, isSuccessResponse } from '@react-native-google-signin/google-signin';
import { config } from '../config';

/**
 * Firebase login. Both methods end with a Firebase ID token, which we send to our backend
 * (POST /api/auth/firebase) to get our own JWT.
 * Needs a development build (not Expo Go) because these are native modules.
 */

type Confirmation = Awaited<ReturnType<typeof signInWithPhoneNumber>>;

let pendingConfirmation: Confirmation | null = null;

/** Step 1 of phone login: Firebase sends an OTP SMS. phone must include +91. */
export async function sendOtp(phone: string) {
  pendingConfirmation = await signInWithPhoneNumber(getAuth(getApp()), phone);
}

/** Step 2 of phone login: check the OTP and return the Firebase ID token. */
export async function confirmOtp(code: string): Promise<string> {
  if (!pendingConfirmation) throw new Error('Pehle OTP bhejo');
  const credential = await pendingConfirmation.confirm(code);
  if (!credential?.user) throw new Error('OTP galat hai');
  pendingConfirmation = null;
  return getIdToken(credential.user);
}

let googleConfigured = false;

/** Google login → Firebase → Firebase ID token. */
export async function signInWithGoogle(): Promise<string | null> {
  if (!googleConfigured) {
    GoogleSignin.configure({ webClientId: config.googleWebClientId });
    googleConfigured = true;
  }
  await GoogleSignin.hasPlayServices();
  const response = await GoogleSignin.signIn();
  if (!isSuccessResponse(response) || !response.data.idToken) return null; // user cancelled
  const credential = GoogleAuthProvider.credential(response.data.idToken);
  const result = await signInWithCredential(getAuth(getApp()), credential);
  return getIdToken(result.user);
}

export async function firebaseSignOut() {
  try {
    const auth = getAuth(getApp());
    if (auth.currentUser) await signOut(auth);
    await GoogleSignin.signOut();
  } catch {
    // ignore — we are logging out anyway
  }
}
