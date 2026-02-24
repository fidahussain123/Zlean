import { Platform } from 'react-native';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { supabase } from './supabase';

const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '';

export function configureGoogleSignIn() {
  if (!WEB_CLIENT_ID) {
    console.warn('Google Sign-In: EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID not set');
    return;
  }
  
  GoogleSignin.configure({
    webClientId: WEB_CLIENT_ID,
    offlineAccess: true,
    scopes: ['profile', 'email'],
  });
}

export async function signInWithGoogle(): Promise<{ success: boolean; error?: string }> {
  try {
    await GoogleSignin.hasPlayServices();
    const userInfo = await GoogleSignin.signIn();
    
    if (!userInfo.data?.idToken) {
      return { success: false, error: 'No ID token received from Google' };
    }

    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: userInfo.data.idToken,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string };
    
    if (err.code === statusCodes.SIGN_IN_CANCELLED) {
      return { success: false, error: 'Sign in cancelled' };
    } else if (err.code === statusCodes.IN_PROGRESS) {
      return { success: false, error: 'Sign in already in progress' };
    } else if (err.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      return { success: false, error: 'Play services not available' };
    } else {
      return { success: false, error: err.message || 'Unknown error occurred' };
    }
  }
}

export async function signOutGoogle(): Promise<void> {
  try {
    await GoogleSignin.signOut();
  } catch {
    // Ignore sign out errors
  }
}

export function isGoogleSignInAvailable(): boolean {
  return Platform.OS !== 'web' && !!WEB_CLIENT_ID;
}
