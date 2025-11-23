import { db } from './firebase-config';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';

export interface GameHistory {
    records: number[];
    updatedAt: number;
}

// Save game history and stats to Firestore
export async function saveGameHistory(uid: string, history: number[], totalGames: number, bestRecord: number | null): Promise<void> {
    try {
        const userRef = doc(db, 'users', uid);
        await setDoc(userRef, {
            gameHistory: history,
            totalGames: totalGames,
            bestRecord: bestRecord,
            lastUpdated: new Date()
        }, { merge: true });
    } catch (error) {
        console.error("Error saving game history:", error);
        throw error;
    }
}

// Load game history and stats from Firestore
export async function loadGameHistory(uid: string): Promise<{ history: number[], totalGames: number, bestRecord: number | null } | null> {
    try {
        const userRef = doc(db, 'users', uid);
        const docSnap = await getDoc(userRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            return {
                history: data.gameHistory || [],
                totalGames: data.totalGames || 0,
                bestRecord: data.bestRecord || null
            };
        } else {
            return null;
        }
    } catch (error) {
        console.error("Error loading game history:", error);
        throw error;
    }
}

// Clear game history in Firestore
export async function clearGameHistory(uid: string): Promise<void> {
    try {
        const userRef = doc(db, 'users', uid);
        await updateDoc(userRef, {
            gameHistory: [],
            totalGames: 0,
            bestRecord: null
        });
    } catch (error) {
        console.error("Error clearing game history:", error);
        throw error;
    }
}

// Save avatar image to Firestore
export async function saveAvatarImage(uid: string, base64Image: string): Promise<void> {
    try {
        const userRef = doc(db, 'users', uid);
        await setDoc(userRef, {
            avatarImage: base64Image
        }, { merge: true });
    } catch (error) {
        console.error("Error saving avatar:", error);
        throw error;
    }
}

// Load avatar image from Firestore
export async function loadAvatarImage(uid: string): Promise<string | null> {
    try {
        const userRef = doc(db, 'users', uid);
        const docSnap = await getDoc(userRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            return data.avatarImage || null;
        }
        return null;
    } catch (error) {
        console.error("Error loading avatar:", error);
        return null;
    }
}
