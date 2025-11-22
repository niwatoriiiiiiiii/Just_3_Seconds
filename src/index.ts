import './styles/main.css';

// Game state
let startTime: number = 0;
let elapsedTime: number = 0;
let timerInterval: number | null = null;
let isRunning: boolean = false;

// History tracking (last 20 attempts)
const MAX_HISTORY = 20;
let history: number[] = loadHistory();

// DOM elements
const displayElement = document.getElementById('stopwatchDisplay') as HTMLDivElement;
const chartCanvas = document.getElementById('historyChart') as HTMLCanvasElement;

// Load history from localStorage
function loadHistory(): number[] {
    const saved = localStorage.getItem('stopwatchHistory');
    return saved ? JSON.parse(saved) : [];
}

// Save history to localStorage
function saveHistory(): void {
    localStorage.setItem('stopwatchHistory', JSON.stringify(history));
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
    const padding = 60; // Increased padding for labels
    const graphWidth = width - padding * 2;
    const graphHeight = height - padding * 2;
    
    // Clear canvas
    ctx.fillStyle = '#141417';
    ctx.fillRect(0, 0, width, height);
    
    if (history.length === 0) return;
    
    // Fixed max value at 300ms
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
    
    // Draw line (connect all points, clamping values over 300ms to top)
    ctx.strokeStyle = '#0066FF';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    history.forEach((value, index) => {
        const x = padding + (graphWidth / (MAX_HISTORY - 1)) * index;
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
    history.forEach((value, index) => {
        const x = padding + (graphWidth / (MAX_HISTORY - 1)) * index;
        const clampedValue = Math.min(value, maxValue);
        const y = padding + graphHeight - (clampedValue / maxValue) * graphHeight;
        
        if (value <= maxValue) {
            // Normal point (filled circle)
            if (value === 0) {
                ctx.fillStyle = '#00F7FF'; // Perfect
                ctx.beginPath();
                ctx.arc(x, y, 4, 0, Math.PI * 2); // Make it slightly larger
                ctx.fill();
            } else {
                ctx.fillStyle = '#0066FF'; // Normal
                ctx.beginPath();
                ctx.arc(x, y, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        } else {
            // Out of range point (dashed circle at top)
            const topY = padding;
            ctx.strokeStyle = '#0066FF';
            ctx.lineWidth = 1;
            ctx.setLineDash([2, 2]);
            ctx.beginPath();
            ctx.arc(x, topY, 3, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
        }
    });
    
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
});
