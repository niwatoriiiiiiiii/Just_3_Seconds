import './styles/main.css';

// Game state
let startTime: number = 0;
let elapsedTime: number = 0;
let timerInterval: number | null = null;
let isRunning: boolean = false;

// DOM elements
const displayElement = document.getElementById('stopwatchDisplay') as HTMLDivElement;

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

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    console.log('Just 3 Seconds - Game Initialized');
    
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
});
