
/**
 * Extracts the dominant color from an image URL.
 * Returns a Promise that resolves to an rgba string.
 */
export function getDominantColor(imageUrl: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = imageUrl;

        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            if (!ctx) {
                resolve('rgba(0, 102, 255, 0.3)'); // Default blue
                return;
            }

            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            try {
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;
                let r = 0, g = 0, b = 0;
                let count = 0;

                // Sample every 10th pixel to improve performance
                for (let i = 0; i < data.length; i += 4 * 10) {
                    r += data[i];
                    g += data[i + 1];
                    b += data[i + 2];
                    count++;
                }

                r = Math.floor(r / count);
                g = Math.floor(g / count);
                b = Math.floor(b / count);

                resolve(`rgba(${r}, ${g}, ${b}, 0.6)`);
            } catch (e) {
                console.error("Error getting image data", e);
                resolve('rgba(0, 102, 255, 0.3)'); // Default blue
            }
        };

        img.onerror = (e) => {
            console.error("Error loading image for color extraction", e);
            resolve('rgba(0, 102, 255, 0.3)'); // Default blue
        };
    });
}
