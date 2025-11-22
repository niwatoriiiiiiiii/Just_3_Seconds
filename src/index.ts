// メインエントリーポイント
import './styles/main.css';

// DOMの読み込み完了を待つ
document.addEventListener('DOMContentLoaded', () => {
    console.log('Just 3 Seconds - Game Initialized');
    
    // 基本的なDOM要素の取得
    const startButton = document.getElementById('startButton') as HTMLButtonElement;
    const stopwatchContainer = document.getElementById('stopwatchContainer');
    
    if (startButton && stopwatchContainer) {
        console.log('DOM elements successfully loaded');
        
        // 将来的にストップウォッチの機能をここに実装予定
        // 現時点では環境構築とデザインのみ
    }
});
