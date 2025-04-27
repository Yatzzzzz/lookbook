const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Directories to optimize
const directories = [
  path.join(process.cwd(), 'public', 'Background'),
  // Add more directories here if needed
];

// Target sizes for different image types
const imageSizes = {
  background: { width: 1200, height: 800 },
  thumbnail: { width: 300, height: 300 },
  profile: { width: 400, height: 400 },
};

// Process all directories
async function processDirectories() {
  for (const dir of directories) {
    if (!fs.existsSync(dir)) {
      console.log(`Directory does not exist: ${dir}`);
      continue;
    }

    const optimizedDir = path.join(dir, 'optimized');
    
    // Create optimized directory if it doesn't exist
    if (!fs.existsSync(optimizedDir)) {
      fs.mkdirSync(optimizedDir, { recursive: true });
    }

    // Get all image files
    const imageFiles = fs.readdirSync(dir)
      .filter(file => /\.(jpg|jpeg|png)$/i.test(file) && !file.includes('optimized'))
      .map(file => path.join(dir, file));

    console.log(`Found ${imageFiles.length} images in ${dir}`);
    
    // Process each image
    await optimizeImages(imageFiles, optimizedDir, dir.includes('Background') ? 'background' : 'thumbnail');
  }
}

// Optimize a group of images
async function optimizeImages(imageFiles, outputDir, sizeType = 'background') {
  const size = imageSizes[sizeType];
  
  for (const filePath of imageFiles) {
    const fileName = path.basename(filePath);
    const outputPath = path.join(outputDir, fileName);
    
    const stats = fs.statSync(filePath);
    const fileSizeMB = stats.size / (1024 * 1024);
    
    console.log(`Processing: ${fileName} (${fileSizeMB.toFixed(2)} MB)`);
    
    try {
      await sharp(filePath)
        .resize({ 
          width: size.width, 
          height: size.height, 
          fit: 'inside', 
          withoutEnlargement: true 
        })
        .jpeg({ 
          quality: 75, 
          progressive: true,
          mozjpeg: true
        })
        .toFile(outputPath);
        
      const newStats = fs.statSync(outputPath);
      const newSizeMB = newStats.size / (1024 * 1024);
      const reduction = ((fileSizeMB - newSizeMB) / fileSizeMB * 100).toFixed(2);
      
      console.log(`Optimized: ${fileName} - ${fileSizeMB.toFixed(2)} MB → ${newSizeMB.toFixed(2)} MB (${reduction}% reduction)`);
    } catch (err) {
      console.error(`Error processing ${fileName}: ${err}`);
    }
  }
}

// Create a summary of directory sizes
function printDirectorySizes() {
  console.log("\nDirectory Size Summary:");
  console.log("======================");
  
  directories.forEach(dir => {
    if (fs.existsSync(dir)) {
      let totalSize = 0;
      
      fs.readdirSync(dir)
        .filter(file => /\.(jpg|jpeg|png)$/i.test(file) && !file.includes('optimized'))
        .forEach(file => {
          const stats = fs.statSync(path.join(dir, file));
          totalSize += stats.size;
        });
      
      console.log(`${path.basename(dir)}: ${(totalSize / (1024 * 1024)).toFixed(2)} MB`);
    }
  });
  
  // Check optimized directories
  directories.forEach(dir => {
    const optimizedDir = path.join(dir, 'optimized');
    if (fs.existsSync(optimizedDir)) {
      let totalSize = 0;
      
      fs.readdirSync(optimizedDir)
        .filter(file => /\.(jpg|jpeg|png)$/i.test(file))
        .forEach(file => {
          const stats = fs.statSync(path.join(optimizedDir, file));
          totalSize += stats.size;
        });
      
      console.log(`${path.basename(dir)}/optimized: ${(totalSize / (1024 * 1024)).toFixed(2)} MB`);
    }
  });
}

// Main execution
async function main() {
  if (!fs.existsSync(path.join(process.cwd(), 'node_modules', 'sharp'))) {
    console.log('Sharp is not installed. Please run: npm install sharp --save-dev');
    return;
  }
  
  console.log('Starting image optimization...');
  printDirectorySizes();
  
  await processDirectories();
  
  console.log('\nOptimization complete!');
  printDirectorySizes();
  
  console.log('\nNext steps:');
  console.log('1. Review the optimized images in the "optimized" folders');
  console.log('2. If satisfied, replace the original images with the optimized versions');
  console.log('3. Update your code to reference the optimized images');
}

main().catch(console.error); 