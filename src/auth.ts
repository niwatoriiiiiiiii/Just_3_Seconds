import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged, 
    updateProfile,
    verifyBeforeUpdateEmail,
    User 
} from 'firebase/auth';
import { auth } from './firebase-config';

export const login = async (email: string, password: string) => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return { user: userCredential.user, error: null };
    } catch (error: any) {
        return { user: null, error: error.message };
    }
};

export const signup = async (email: string, password: string) => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        return { user: userCredential.user, error: null };
    } catch (error: any) {
        return { user: null, error: error.message };
    }
};

export const logout = async () => {
    try {
        await signOut(auth);
        return { error: null };
    } catch (error: any) {
        return { error: error.message };
    }
};

export const updateUserProfile = async (displayName: string) => {
    try {
        if (auth.currentUser) {
            await updateProfile(auth.currentUser, {
                displayName: displayName
            });
            return { error: null };
        } else {
            return { error: "No user logged in" };
        }
    } catch (error: any) {
        return { error: error.message };
    }
};

export const updateUserEmail = async (email: string) => {
    try {
        if (auth.currentUser) {
            await verifyBeforeUpdateEmail(auth.currentUser, email);
            return { error: null, message: "Verification email sent" };
        } else {
            return { error: "No user logged in" };
        }
    } catch (error: any) {
        return { error: error.message };
    }
};

export const subscribeToAuthChanges = (callback: (user: User | null) => void) => {
    return onAuthStateChanged(auth, callback);
};
