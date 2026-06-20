const sharp = require('sharp');
const path = require('path');

const inputPath = path.join(__dirname, '../assets/images/AppLogo.png');
const outputPath = path.join(__dirname, '../assets/images/AppLogoPadded.png');

async function padImage() {
  try {
    const metadata = await sharp(inputPath).metadata();
    const size = Math.max(metadata.width, metadata.height);
    
    // To ensure the logo fits safely within Android's 72dp safe zone out of the 108dp icon,
    // the logo should be scaled down to roughly 66% (72/108) of the canvas size.
    // So we pad it by making the canvas 1.5x larger (1 / 0.66).
    const newSize = Math.round(size * 1.5);
    
    await sharp(inputPath)
      .resize(size, size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .extend({
        top: Math.round((newSize - size) / 2),
        bottom: Math.round((newSize - size) / 2),
        left: Math.round((newSize - size) / 2),
        right: Math.round((newSize - size) / 2),
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .toFile(outputPath);
      
    console.log('Image padded successfully!');
  } catch (error) {
    console.error('Error padding image:', error);
  }
}

padImage();
