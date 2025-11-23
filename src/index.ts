import './styles/main.css';
import { login, signup, logout, updateUserProfile, updateUserEmail, subscribeToAuthChanges } from './auth';
import { saveGameHistory, loadGameHistory, clearGameHistory } from './firestore';
import { getDominantColor } from './utils';
import { User } from 'firebase/auth';

// Game state
let startTime: number = 0;
let elapsedTime: number = 0;
let timerInterval: number | null = null;
let isRunning: boolean = false;
let currentUser: User | null = null;
let isLoginMode: boolean = true;

// History tracking (last 50 attempts for rating, display last 20 in graph)
const MAX_HISTORY = 50;
let history: number[] = [];
let totalGames: number = 0;
let bestRecord: number | null = null;

// DOM elements
const displayElement = document.getElementById('stopwatchDisplay') as HTMLDivElement;
const chartCanvas = document.getElementById('historyChart') as HTMLCanvasElement;
const resetHistoryButton = document.getElementById('resetHistoryButton') as HTMLButtonElement;

// Auth DOM elements
const userSection = document.getElementById('userSection') as HTMLDivElement;
const authModal = document.getElementById('authModal') as HTMLDivElement;
const authForm = document.getElementById('authForm') as HTMLFormElement;
const emailInput = document.getElementById('email') as HTMLInputElement;
const passwordInput = document.getElementById('password') as HTMLInputElement;
const authError = document.getElementById('authError') as HTMLDivElement;
const authSubmitButton = document.getElementById('authSubmitButton') as HTMLButtonElement;
const authSwitchButton = document.getElementById('authSwitchButton') as HTMLButtonElement;
const authSwitchText = document.getElementById('authSwitchText') as HTMLSpanElement;
const authModalTitle = document.getElementById('authModalTitle') as HTMLHeadingElement;
const closeAuthButton = document.getElementById('closeAuthButton') as HTMLButtonElement;

// Profile DOM elements
const profileModal = document.getElementById('profileModal') as HTMLDivElement;
const profileForm = document.getElementById('profileForm') as HTMLFormElement;
const displayNameInput = document.getElementById('displayName') as HTMLInputElement;
const displayEmailInput = document.getElementById('displayEmail') as HTMLInputElement;
const profileError = document.getElementById('profileError') as HTMLDivElement;
const closeProfileButton = document.getElementById('closeProfileButton') as HTMLButtonElement;

// Profile Page DOM elements
const profilePage = document.getElementById('profilePage') as HTMLDivElement;
const backToGameButton = document.getElementById('backToGameButton') as HTMLButtonElement;
const profileAvatarLarge = document.getElementById('profileAvatarLarge') as HTMLDivElement;
const profileNameLarge = document.getElementById('profileNameLarge') as HTMLHeadingElement;
const profileRatingLarge = document.getElementById('profileRatingLarge') as HTMLSpanElement;
const totalGamesElement = document.getElementById('totalGames') as HTMLSpanElement;
const bestRecordElement = document.getElementById('bestRecord') as HTMLSpanElement;

// Avatar Upload DOM elements
const avatarPreview = document.getElementById('avatarPreview') as HTMLDivElement;
const avatarInput = document.getElementById('avatarInput') as HTMLInputElement;
const selectAvatarButton = document.getElementById('selectAvatarButton') as HTMLButtonElement;
const avatarError = document.getElementById('avatarError') as HTMLDivElement;


// Save history to Firestore
// Save history to Firestore
async function saveHistory(): Promise<void> {
    if (currentUser) {
        try {
            await saveGameHistory(currentUser.uid, history, totalGames, bestRecord);
        } catch (error) {
            console.error('Failed to save history:', error);
        }
    }
}

// Clear history from Firestore
async function clearHistory(): Promise<void> {
    if (!currentUser) return;
    
    if (confirm('Are you sure you want to clear your history?')) {
        try {
            await clearGameHistory(currentUser.uid);
            history = [];
            totalGames = 0;
            bestRecord = null;
            drawChart();
        } catch (error) {
            console.error('Failed to clear history:', error);
            alert('Failed to clear history. Please try again.');
        }
    }
}

// Load history from Firestore
async function loadHistoryFromFirestore(): Promise<void> {
    if (currentUser) {
        try {
            const data = await loadGameHistory(currentUser.uid);
            if (data) {
                history = data.history;
                totalGames = data.totalGames;
                bestRecord = data.bestRecord;
            } else {
                history = [];
                totalGames = 0;
                bestRecord = null;
            }
            drawChart();
        } catch (error) {
            console.error('Failed to load history:', error);
            history = [];
            totalGames = 0;
            bestRecord = null;
        }
    } else {
        history = [];
        totalGames = 0;
        bestRecord = null;
        drawChart();
    }
}

// Calculate score for a single record using square root formula
function calculateRecordScore(errorMs: number): number {
    if (errorMs > 500) return 0;
    const score = 0.2 * (1 - Math.sqrt(errorMs / 500));
    return Math.max(0, score);
}

// Calculate rating from history (last 50 records)
function calculateRating(): number {
    if (history.length === 0) return 0;
    const totalScore = history.reduce((sum, errorMs) => sum + calculateRecordScore(errorMs), 0);
    return Math.round(totalScore * 100) / 100; // Round to 2 decimal places
}

// Update User UI based on auth state
async function updateUserUI(user: User | null) {
    currentUser = user;
    
    // Load history when user changes
    await loadHistoryFromFirestore();
    
    if (user) {
        // Logged in
        const displayName = user.displayName || user.email?.split('@')[0] || 'User';
        const initial = displayName.charAt(0).toUpperCase();
        const rating = calculateRating();
        
        userSection.innerHTML = `
            <div class="user-profile">
                <div class="user-info">
                    <div class="user-avatar" id="menuUserAvatar">${initial}</div>
                    <div class="user-details">
                        <div class="user-name">${displayName}</div>
                        <button id="manageAccountButton" class="text-button small" style="text-align: left; padding: 0; color: var(--gray); font-size: 12px;">Manage Account</button>
                    </div>
                </div>
                <div class="user-rating">
                    <span class="rating-label">Rating</span>
                    <span class="rating-value">${rating.toFixed(2)}</span>
                </div>
            </div>
        `;

        // Load avatar for menu
        try {
            const { loadAvatarImage } = await import('./firestore');
            const avatarImage = await loadAvatarImage(user.uid);
            const menuAvatar = document.getElementById('menuUserAvatar');
            
            if (menuAvatar && avatarImage) {
                menuAvatar.style.backgroundImage = `url(${avatarImage})`;
                menuAvatar.textContent = '';
            }
        } catch (error) {
            console.error('Failed to load menu avatar:', error);
        }
        
        // Sidebar logout button removed
        
        const manageAccountBtn = document.getElementById('manageAccountButton');
        if (manageAccountBtn) {
            manageAccountBtn.addEventListener('click', () => {
                openProfileModal();
                // Close sidebar
                const sidebar = document.getElementById('menuModal');
                if (sidebar) {
                    sidebar.classList.remove('show');
                    setTimeout(() => {
                        sidebar.style.display = 'none';
                    }, 300);
                }
            });
        }
        
        // Show profile link in sidebar
        const profileLinkGroup = document.getElementById('profileLinkGroup');
        if (profileLinkGroup) {
            profileLinkGroup.style.display = 'block';
        }
        
        const sidebarProfileButton = document.getElementById('sidebarProfileButton');
        if (sidebarProfileButton) {
            sidebarProfileButton.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                e.stopPropagation();
                (async () => {
                    await openProfilePage();
                })();
                // Close sidebar
                const sidebar = document.getElementById('menuModal');
                if (sidebar) {
                    sidebar.classList.remove('show');
                    setTimeout(() => {
                        sidebar.style.display = 'none';
                    }, 300);
                }
            };
        }
    } else {
        // Logged out
        userSection.innerHTML = `
            <button id="sidebarLoginButton" class="action-button">Login / Sign Up</button>
        `;
        
        const profileLinkGroup = document.getElementById('profileLinkGroup');
        if (profileLinkGroup) {
            profileLinkGroup.style.display = 'none';
        }
        
        const loginBtn = document.getElementById('sidebarLoginButton');
        if (loginBtn) {
            loginBtn.addEventListener('click', () => {
                openAuthModal();
                // Close sidebar
                const sidebar = document.getElementById('menuModal');
                if (sidebar) {
                    sidebar.classList.remove('show');
                    setTimeout(() => {
                        sidebar.style.display = 'none';
                    }, 300);
                }
            });
        }
    }
}

// Profile Page Logic
async function openProfilePage() {
    if (profilePage && currentUser) {
        // Update data
        const displayName = currentUser.displayName || currentUser.email?.split('@')[0] || 'User';
        const initial = displayName.charAt(0).toUpperCase();
        const rating = calculateRating();
        
        if (profileAvatarLarge) {
            profileAvatarLarge.textContent = initial;
            profileAvatarLarge.style.backgroundImage = ''; // Reset
        }
        if (profileNameLarge) profileNameLarge.textContent = displayName;
        if (profileRatingLarge) profileRatingLarge.textContent = rating.toFixed(2);
        
        // Load avatar for profile page
        try {
            const { loadAvatarImage } = await import('./firestore');
            const avatarImage = await loadAvatarImage(currentUser.uid);
            
            if (profileAvatarLarge && avatarImage) {
                profileAvatarLarge.style.backgroundImage = `url(${avatarImage})`;
                profileAvatarLarge.textContent = '';
                
                // Dynamic glow
                const glowColor = await getDominantColor(avatarImage);
                profileAvatarLarge.style.boxShadow = `0 0 30px ${glowColor}`;
            } else if (profileAvatarLarge) {
                 profileAvatarLarge.style.boxShadow = ''; // Reset to default CSS
            }
        } catch (error) {
            console.error('Failed to load profile avatar:', error);
        }
        
        if (totalGamesElement) totalGamesElement.textContent = totalGames.toString();
        
        // Display best record
        let bestRecordText = '-';
        if (bestRecord !== null) {
            bestRecordText = `${bestRecord}ms`;
        }
        if (bestRecordElement) bestRecordElement.textContent = bestRecordText;

        profilePage.style.display = 'flex';
        profilePage.offsetHeight; // Force reflow
        profilePage.classList.add('show');
    }
}

function closeProfilePage() {
    if (profilePage) {
        profilePage.classList.remove('show');
        setTimeout(() => {
            profilePage.style.display = 'none';
        }, 300);
    }
}

// Auth Modal Logic
function openAuthModal() {
    if (authModal) {
        authModal.style.display = 'flex';
        authModal.offsetHeight; // Force reflow
        authModal.classList.add('show');
        resetAuthForm();
    }
}

function closeAuthModal() {
    if (authModal) {
        authModal.classList.remove('show');
        setTimeout(() => {
            authModal.style.display = 'none';
        }, 300);
    }
}

function resetAuthForm() {
    if (authForm) authForm.reset();
    if (authError) authError.textContent = '';
    isLoginMode = true;
    updateAuthModalState();
}

function updateAuthModalState() {
    if (isLoginMode) {
        authModalTitle.textContent = 'Login';
        authSubmitButton.textContent = 'Login';
        authSwitchText.textContent = "Don't have an account?";
        authSwitchButton.textContent = 'Sign Up';
    } else {
        authModalTitle.textContent = 'Create Account';
        authSubmitButton.textContent = 'Sign Up';
        authSwitchText.textContent = "Already have an account?";
        authSwitchButton.textContent = 'Login';
    }
}

// Profile Modal Logic
// Profile Modal Logic
async function openProfileModal() {
    if (profileModal) {
        profileModal.style.display = 'flex';
        profileModal.offsetHeight; // Force reflow
        profileModal.classList.add('show');
        if (currentUser) {
            displayNameInput.value = currentUser.displayName || '';
            displayEmailInput.value = currentUser.email || '';
            
            // Update avatar preview
            if (avatarPreview) {
                const displayName = currentUser.displayName || currentUser.email?.split('@')[0] || 'User';
                const initial = displayName.charAt(0).toUpperCase();
                
                // Load avatar from Firestore
                try {
                    const { loadAvatarImage } = await import('./firestore');
                    const avatarImage = await loadAvatarImage(currentUser.uid);
                    
                    if (avatarImage) {
                        avatarPreview.style.backgroundImage = `url(${avatarImage})`;
                        avatarPreview.textContent = '';
                        
                        // Dynamic glow
                        const glowColor = await getDominantColor(avatarImage);
                        avatarPreview.style.boxShadow = `0 0 20px ${glowColor}`;
                    } else {
                        avatarPreview.style.backgroundImage = '';
                        avatarPreview.textContent = initial;
                        avatarPreview.style.boxShadow = '';
                    }
                } catch (error) {
                    console.error('Failed to load avatar:', error);
                    avatarPreview.style.backgroundImage = '';
                    avatarPreview.textContent = initial;
                    avatarPreview.style.boxShadow = '';
                }
            }
        }
        if (profileError) profileError.textContent = '';
    }
}

function closeProfileModal() {
    if (profileModal) {
        profileModal.classList.remove('show');
        setTimeout(() => {
            profileModal.style.display = 'none';
        }, 300);
    }
}

// Format time to 3 decimal places
function formatTime(milliseconds: number): string {
    const seconds = milliseconds / 1000;
    return seconds.toFixed(3);
}

// Update display
function updateDisplay(time: number): void {
    if (displayElement) {
        displayElement.textContent = formatTime(time);
    }
}

// Start timer
function startTimer(): void {
    if (isRunning) return; // Prevent multiple starts
    
    startTime = Date.now() - elapsedTime;
    timerInterval = window.setInterval(() => {
        elapsedTime = Date.now() - startTime;
        updateDisplay(elapsedTime);
        
        // Fade out between 0.3s and 1.0s
        if (displayElement) {
            if (elapsedTime < 300) {
                // 0-0.3s: fully visible
                displayElement.style.opacity = '1';
            } else if (elapsedTime >= 300 && elapsedTime <= 1000) {
                // 0.3s-1.0s: fade out
                const fadeProgress = (elapsedTime - 300) / (1000 - 300); // 0 to 1
                displayElement.style.opacity = String(1 - fadeProgress);
            } else {
                // After 1.0s: fully transparent
                displayElement.style.opacity = '0';
            }
        }
    }, 10); // Update every 10ms for smooth animation
    isRunning = true;
}

// Stop timer
function stopTimer(): void {
    if (!isRunning) return; // Only stop if running
    
    if (timerInterval !== null) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    isRunning = false;
    
    // Reset opacity to fully visible
    if (displayElement) {
        displayElement.style.opacity = '1';
    }
    
    checkResult();
}

// Reset timer
function resetTimer(): void {
    if (timerInterval !== null) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    startTime = 0;
    elapsedTime = 0;
    isRunning = false;
    updateDisplay(0);
}

// Check if user stopped at exactly 3.000 seconds
function checkResult(): void {
    const targetTime = 3000; // 3 seconds in milliseconds
    const difference = Math.abs(elapsedTime - targetTime);
    
    // Update stats
    totalGames++;
    if (bestRecord === null || difference < bestRecord) {
        bestRecord = difference;
    }
    
    // Add to history
    history.push(difference);
    if (history.length > MAX_HISTORY) {
        history.shift(); // Remove oldest entry
    }
    saveHistory();
    drawChart();
    
    if (difference === 0) {
        // Perfect!
        showResult('Perfect! Exactly 3.000 seconds! 🎯', 'perfect');
    } else if (difference < 10) {
        // Very close
        showResult(`Amazing! Off by ${difference}ms! 🌟`, 'excellent');
    } else if (difference < 50) {
        // Close
        showResult(`Great! Off by ${difference}ms! 👍`, 'good');
    } else if (difference < 100) {
        // Not bad
        showResult(`Not bad! Off by ${difference}ms! 👌`, 'okay');
    } else {
        // Try again
        showResult(`Off by ${difference}ms. Try again! 🔄`, 'miss');
    }
}

// Show result message
function showResult(message: string, level: string): void {
    // Create result overlay if it doesn't exist
    let resultOverlay = document.getElementById('resultOverlay');
    if (!resultOverlay) {
        resultOverlay = document.createElement('div');
        resultOverlay.id = 'resultOverlay';
        resultOverlay.className = 'result-overlay';
        document.body.appendChild(resultOverlay);
    }
    
    resultOverlay.innerHTML = `
        <div class="result-content ${level}">
            <p class="result-message">${message}</p>
            <button class="result-button" id="tryAgainButton">Try Again</button>
        </div>
    `;
    resultOverlay.style.display = 'flex';
    
    // Add try again button listener
    const tryAgainButton = document.getElementById('tryAgainButton');
    if (tryAgainButton) {
        tryAgainButton.addEventListener('click', () => {
            resultOverlay!.style.display = 'none';
            resetTimer();
        });
    }
}

// Draw line chart
function drawChart(): void {
    if (!chartCanvas) return;
    
    const ctx = chartCanvas.getContext('2d');
    if (!ctx) return;
    
    const width = chartCanvas.width;
    const height = chartCanvas.height;
    const padding = 60;
    const graphWidth = width - padding * 2;
    const graphHeight = height - padding * 2;
    
    // Clear canvas
    ctx.fillStyle = '#141417';
    ctx.fillRect(0, 0, width, height);
    
    const maxValue = 300;
    
    // Draw grid lines
    ctx.strokeStyle = '#21262d';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
        const y = padding + (graphHeight / 4) * i;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(width - padding, y);
        ctx.stroke();
    }
    
    // Draw Y-axis labels
    ctx.fillStyle = '#666666';
    ctx.font = '12px Inter';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 4; i++) {
        const value = Math.round(maxValue * (1 - i / 4));
        const y = padding + (graphHeight / 4) * i;
        ctx.fillText(`${value}ms`, padding - 10, y + 4);
    }
    
    // Display only the last 20 records for the graph
    const displayHistory = history.slice(-20);
    if (displayHistory.length > 0) {
        ctx.strokeStyle = '#0066FF';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        displayHistory.forEach((value, index) => {
            const maxDisplayed = Math.min(displayHistory.length, 20);
            const x = padding + (graphWidth / (maxDisplayed - 1 || 1)) * index;
            const clampedValue = Math.min(value, maxValue);
            const y = padding + graphHeight - (clampedValue / maxValue) * graphHeight;
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        
        ctx.stroke();
        
        // Draw points
        displayHistory.forEach((value, index) => {
            const maxDisplayed = Math.min(displayHistory.length, 20);
            const x = padding + (graphWidth / (maxDisplayed - 1 || 1)) * index;
            const clampedValue = Math.min(value, maxValue);
            const y = padding + graphHeight - (clampedValue / maxValue) * graphHeight;
            
            ctx.beginPath();
            
            if (value === 0) {
                // Perfect score - cyan color
                ctx.fillStyle = '#00F7FF';
                ctx.arc(x, y, 5, 0, Math.PI * 2);
            } else if (value > maxValue) {
                // Over 300ms - draw hollow circle at top
                ctx.strokeStyle = '#979797';
                ctx.lineWidth = 2;
                ctx.arc(x, padding, 4, 0, Math.PI * 2);
                ctx.stroke();
                ctx.strokeStyle = '#0066FF';
                return;
            } else {
                ctx.fillStyle = '#0066FF';
                ctx.arc(x, y, 3, 0, Math.PI * 2);
            }
            
            ctx.fill();
        });
    }
    
    // Draw target line (0ms)
    ctx.strokeStyle = '#00C853';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    const targetY = padding + graphHeight;
    ctx.beginPath();
    ctx.moveTo(padding, targetY);
    ctx.lineTo(width - padding, targetY);
    ctx.stroke();
    ctx.setLineDash([]);
}


// Initialize
document.addEventListener('DOMContentLoaded', () => {
    console.log('Just 3 Seconds - Game Initialized');
    
    // Subscribe to auth changes
    subscribeToAuthChanges((user) => {
        updateUserUI(user);
    });
    
    // Auth Event Listeners
    if (authForm) {
        authForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = emailInput.value;
            const password = passwordInput.value;
            
            if (authError) authError.textContent = 'Processing...';
            
            let result;
            if (isLoginMode) {
                result = await login(email, password);
            } else {
                result = await signup(email, password);
            }
            
            if (result.error) {
                if (authError) authError.textContent = result.error;
            } else {
                closeAuthModal();
            }
        });
    }
    
    if (authSwitchButton) {
        authSwitchButton.addEventListener('click', (e) => {
            e.preventDefault();
            isLoginMode = !isLoginMode;
            updateAuthModalState();
        });
    }
    
    if (closeAuthButton) {
        closeAuthButton.addEventListener('click', closeAuthModal);
    }
    
    // Close auth modal when clicking outside
    if (authModal) {
        authModal.addEventListener('click', (e) => {
            if (e.target === authModal) {
                closeAuthModal();
            }
        });
    }
    
    // Profile Event Listeners
    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const newName = displayNameInput.value;
            const newEmail = displayEmailInput.value;
            
            if (profileError) profileError.textContent = 'Saving...';
            
            // Update profile name
            const nameResult = await updateUserProfile(newName);
            if (nameResult.error) {
                if (profileError) profileError.textContent = nameResult.error;
                return;
            }

            // Update email if changed
            if (currentUser && newEmail !== currentUser.email) {
                const emailResult = await updateUserEmail(newEmail);
                if (emailResult.error) {
                    if (profileError) profileError.textContent = "Name updated, but email update failed: " + emailResult.error;
                    return;
                } else {
                    alert(`Verification email sent to ${newEmail}.\nPlease check your inbox and click the link to verify your new email address.\nThe change will take effect after verification.`);
                }
            }
            
            closeProfileModal();
            // Force UI update
            if (currentUser) {
                window.location.reload();
            }
        });
    }
    
    if (closeProfileButton) {
        closeProfileButton.addEventListener('click', closeProfileModal);
    }
    
    if (profileModal) {
        profileModal.addEventListener('click', (e) => {
            if (e.target === profileModal) {
                closeProfileModal();
            }
        });
    }

    // Modal Logout Button
    const modalLogoutButton = document.getElementById('modalLogoutButton');
    if (modalLogoutButton) {
        modalLogoutButton.addEventListener('click', async (e) => {
            e.preventDefault(); // Prevent form submission if inside form (it's not, but good practice)
            if (confirm('Are you sure you want to logout?')) {
                await logout();
                closeProfileModal();
                // Close sidebar if open
                const sidebar = document.getElementById('menuModal');
                if (sidebar) {
                    sidebar.classList.remove('show');
                    setTimeout(() => {
                        sidebar.style.display = 'none';
                    }, 300);
                }
            }
        });
    }

    // Input Validation
    if (displayNameInput) {
        displayNameInput.addEventListener('input', (e) => {
            const target = e.target as HTMLInputElement;
            // Allow: a-z, A-Z, 0-9, _, Japanese, Full-width Alphanumeric
            target.value = target.value.replace(/[^a-zA-Z0-9_\u3040-\u30FF\u4E00-\u9FAF\u30FC\uFF10-\uFF19\uFF21-\uFF3A\uFF41-\uFF5A]/g, '');
        });
    }

    if (displayEmailInput) {
        displayEmailInput.addEventListener('input', (e) => {
            const target = e.target as HTMLInputElement;
            // Allow: a-z, A-Z, 0-9, @, ., _, -
            target.value = target.value.replace(/[^a-zA-Z0-9@._-]/g, '');
        });
    }
    
    if (displayElement) {
        // Mouse events
        displayElement.addEventListener('mousedown', startTimer);
        displayElement.addEventListener('mouseup', stopTimer);
        
        // Touch events for mobile
        displayElement.addEventListener('touchstart', (e) => {
            e.preventDefault();
            startTimer();
        });
        displayElement.addEventListener('touchend', (e) => {
            e.preventDefault();
            stopTimer();
        });
        
        // Add cursor pointer to show it's clickable
        displayElement.style.cursor = 'pointer';
        displayElement.style.userSelect = 'none'; // Prevent text selection
    }
    
    updateDisplay(0);
    drawChart(); // Draw initial chart
    
    if (resetHistoryButton) {
        resetHistoryButton.addEventListener('click', () => {
            clearHistory();
            // Close sidebar after clearing
            const sidebar = document.getElementById('menuModal');
            if (sidebar) {
                sidebar.classList.remove('show');
                setTimeout(() => {
                    sidebar.style.display = 'none';
                }, 300);
            }
        });
    }
    
    // Sidebar Menu Logic
    const menuButton = document.getElementById('menuButton');
    const menuSidebar = document.getElementById('menuModal');
    
    if (menuButton && menuSidebar) {
        menuButton.addEventListener('click', () => {
            menuSidebar.style.display = 'block';
            // Force reflow
            menuSidebar.offsetHeight;
            menuSidebar.classList.add('show');
        });
    }
    
    // Close sidebar when clicking outside
    if (menuSidebar) {
        menuSidebar.addEventListener('click', (e) => {
            if (e.target === menuSidebar) {
                menuSidebar.classList.remove('show');
                setTimeout(() => {
                    menuSidebar.style.display = 'none';
                }, 300);
            }
        });
    }

    // Profile Page Event Listeners
    if (backToGameButton) {
        backToGameButton.addEventListener('click', closeProfilePage);
    }

    // Avatar Upload Event Listeners
    if (selectAvatarButton && avatarInput) {
        selectAvatarButton.addEventListener('click', () => {
            avatarInput.click();
        });

        avatarInput.addEventListener('change', async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;

            // Clear previous error
            if (avatarError) avatarError.textContent = '';

            // Validate file type
            if (!file.type.startsWith('image/')) {
                if (avatarError) avatarError.textContent = 'Please select an image file';
                return;
            }

            // Validate file size (max 1MB)
            if (file.size > 1024 * 1024) {
                if (avatarError) avatarError.textContent = 'Image size must be less than 1MB';
                return;
            }

            // Create image to check dimensions
            const img = new Image();
            const reader = new FileReader();

            reader.onload = (event) => {
                img.src = event.target?.result as string;
            };

            img.onload = async () => {
                // Validate dimensions
                if (img.width > 256 || img.height > 256) {
                    if (avatarError) avatarError.textContent = 'Image must be 256x256 pixels or smaller';
                    return;
                }

                // Convert to base64 and save
                const base64 = reader.result as string;
                
                // Update preview
                if (avatarPreview) {
                    avatarPreview.style.backgroundImage = `url(${base64})`;
                    avatarPreview.textContent = '';
                }

                // Save to Firestore
                if (currentUser) {
                    try {
                        const { saveAvatarImage } = await import('./firestore');
                        await saveAvatarImage(currentUser.uid, base64);
                        
                        if (avatarError) {
                            avatarError.style.color = 'var(--green)';
                            avatarError.textContent = 'Avatar updated successfully!';
                            setTimeout(() => {
                                if (avatarError) avatarError.textContent = '';
                            }, 3000);
                        }
                    } catch (error) {
                        console.error('Failed to update avatar:', error);
                        if (avatarError) avatarError.textContent = 'Failed to update avatar. Please try again.';
                    }
                }
            };

            reader.readAsDataURL(file);
        });
    }
});
