import { db } from './firebase-config';
import { doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';

export interface GameHistory {
    records: number[];
    updatedAt: number;
}

/**
 * Save game history to Firestore for a specific user
 */
export async function saveGameHistory(userId: string, records: number[]): Promise<void> {
    try {
        const historyRef = doc(db, 'users', userId, 'gameData', 'history');
        const data: GameHistory = {
            records: records.slice(-50), // Keep only last 50 records
            updatedAt: Date.now()
        };
        await setDoc(historyRef, data);
    } catch (error) {
        console.error('Error saving game history:', error);
        throw error;
    }
}

/**
 * Load game history from Firestore for a specific user
 */
export async function loadGameHistory(userId: string): Promise<number[]> {
    try {
        const historyRef = doc(db, 'users', userId, 'gameData', 'history');
        const docSnap = await getDoc(historyRef);
        
        if (docSnap.exists()) {
            const data = docSnap.data() as GameHistory;
            return data.records || [];
        }
        return [];
    } catch (error) {
        console.error('Error loading game history:', error);
        return [];
    }
}

/**
 * Clear game history from Firestore for a specific user
 */
export async function clearGameHistory(userId: string): Promise<void> {
    try {
        const historyRef = doc(db, 'users', userId, 'gameData', 'history');
        await deleteDoc(historyRef);
    } catch (error) {
        console.error('Error clearing game history:', error);
        throw error;
    }
}
