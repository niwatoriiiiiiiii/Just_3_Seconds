export interface Achievement {
    id: string;
    category: 'rating' | '3sec' | 'play' | 'expert';
    name: string;
    description: string;
    isSecret: boolean;
    checkUnlock: (stats: GameStats) => boolean;
}

export interface GameStats {
    history: number[];
    totalGames: number;
    bestRecord: number | null;
    rating: number;
    unlockedAchievementIds: string[];
}

export const ACHIEVEMENTS: Achievement[] = [
    // Rating Achievements
    {
        id: 'rating_3',
        category: 'rating',
        name: 'Beginner',
        description: 'Reach a rating of 3.000 or higher',
        isSecret: false,
        checkUnlock: (stats) => stats.rating >= 3.0
    },
    {
        id: 'rating_5',
        category: 'rating',
        name: 'Intermediate',
        description: 'Reach a rating of 5.000 or higher',
        isSecret: false,
        checkUnlock: (stats) => stats.rating >= 5.0
    },
    {
        id: 'rating_7',
        category: 'rating',
        name: 'On Fire',
        description: 'Reach a rating of 7.000 or higher',
        isSecret: false,
        checkUnlock: (stats) => stats.rating >= 7.0
    },
    {
        id: 'rating_8',
        category: 'rating',
        name: 'Expert',
        description: 'Reach a rating of 8.000 or higher',
        isSecret: false,
        checkUnlock: (stats) => stats.rating >= 8.0
    },
    {
        id: 'rating_9',
        category: 'rating',
        name: 'Divine',
        description: 'Reach a rating of 9.000 or higher',
        isSecret: false,
        checkUnlock: (stats) => stats.rating >= 9.0
    },
    {
        id: 'rating_10',
        category: 'rating',
        name: 'Cheater?',
        description: 'Reach a rating of 10.000 or higher',
        isSecret: false,
        checkUnlock: (stats) => stats.rating >= 10.0
    },
    
    // 3sec Achievements
    {
        id: '3sec_1',
        category: '3sec',
        name: 'Nice!',
        description: 'Get a 0ms record for the first time',
        isSecret: false,
        checkUnlock: (stats) => stats.history.filter(r => r === 0).length >= 1
    },
    {
        id: '3sec_2',
        category: '3sec',
        name: 'Fluke?',
        description: 'Get a 0ms record 2 times',
        isSecret: false,
        checkUnlock: (stats) => stats.history.filter(r => r === 0).length >= 2
    },
    {
        id: '3sec_10',
        category: '3sec',
        name: 'Skill',
        description: 'Get a 0ms record 10 times',
        isSecret: false,
        checkUnlock: (stats) => stats.history.filter(r => r === 0).length >= 10
    },
    {
        id: '3sec_100',
        category: '3sec',
        name: 'Practically 20.00 Rating',
        description: 'Get a 0ms record 100 times',
        isSecret: false,
        checkUnlock: (stats) => stats.history.filter(r => r === 0).length >= 100
    },
    
    // Play Achievements
    {
        id: 'play_1',
        category: 'play',
        name: 'First Step',
        description: 'Play 1 game',
        isSecret: false,
        checkUnlock: (stats) => stats.totalGames >= 1
    },
    {
        id: 'play_10',
        category: 'play',
        name: 'Warming Up',
        description: 'Play 10 games',
        isSecret: false,
        checkUnlock: (stats) => stats.totalGames >= 10
    },
    {
        id: 'play_100',
        category: 'play',
        name: 'Is This Fun?',
        description: 'Play 100 games',
        isSecret: false,
        checkUnlock: (stats) => stats.totalGames >= 100
    },
    {
        id: 'play_1000',
        category: 'play',
        name: '...I See',
        description: 'Play 1000 games',
        isSecret: false,
        checkUnlock: (stats) => stats.totalGames >= 1000
    },
    {
        id: 'play_10000',
        category: 'play',
        name: 'Server Storage Running Out!?',
        description: 'Play 10000 games',
        isSecret: false,
        checkUnlock: (stats) => stats.totalGames >= 10000
    },
    
    // Expert (Secret) Achievements
    {
        id: 'expert_1ms',
        category: 'expert',
        name: 'So Close',
        description: 'Get a 1ms record',
        isSecret: true,
        checkUnlock: (stats) => stats.history.some(r => r === 1)
    },
    {
        id: 'expert_777ms',
        category: 'expert',
        name: 'Lucky',
        description: 'Get a 777ms record',
        isSecret: true,
        checkUnlock: (stats) => stats.history.some(r => r === 777)
    },
    {
        id: 'expert_lazy',
        category: 'expert',
        name: 'Playing Casually?',
        description: 'Get 5 or more records with 2000ms+ error',
        isSecret: true,
        checkUnlock: (stats) => stats.history.filter(r => r >= 2000).length >= 5
    },
    {
        id: 'expert_complete',
        category: 'expert',
        name: 'Fully Understood',
        description: 'Unlock all other achievements',
        isSecret: true,
        checkUnlock: (stats) => {
            const allOtherIds = ACHIEVEMENTS.filter(a => a.id !== 'expert_complete').map(a => a.id);
            return allOtherIds.every(id => stats.unlockedAchievementIds.includes(id));
        }
    }
];

export function checkAchievements(stats: GameStats): string[] {
    const newlyUnlocked: string[] = [];
    
    for (const achievement of ACHIEVEMENTS) {
        // Skip if already unlocked
        if (stats.unlockedAchievementIds.includes(achievement.id)) {
            continue;
        }
        
        // Check if should be unlocked
        if (achievement.checkUnlock(stats)) {
            newlyUnlocked.push(achievement.id);
        }
    }
    
    return newlyUnlocked;
}

export function getAchievementsByCategory(category: string): Achievement[] {
    return ACHIEVEMENTS.filter(a => a.category === category);
}

export function getAchievementById(id: string): Achievement | undefined {
    return ACHIEVEMENTS.find(a => a.id === id);
}
