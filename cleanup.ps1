# Repository cleanup script for GitHub

# Remove .next build directory
Write-Host "Removing .next directory..." -ForegroundColor Green
if (Test-Path .\.next) {
    Remove-Item -Recurse -Force .\.next
}

# Create a .gitignore backup if it doesn't exist
if (-not (Test-Path .\.gitignore.bak)) {
    Copy-Item .\.gitignore .\.gitignore.bak
}

# Enhance .gitignore file
Write-Host "Updating .gitignore file..." -ForegroundColor Green
$gitignoreContent = @"
# See https://help.github.com/articles/ignoring-files/ for more about ignoring files.

# dependencies
/node_modules
/.pnp
.pnp.*
.yarn/*
!.yarn/patches
!.yarn/plugins
!.yarn/releases
!.yarn/versions

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*

# env files
.env
.env.*
!.env.example

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts

# large files and assets
*.zip
*.gz
*.tar
*.rar
*.7z
*.iso
*.mp4
*.mov
*.avi
*.wmv

# Docs large files
/Docs/zip files/

# Ignore service account credentials
noon/lookbook-454113-8d6d465493f4.json

# Image optimization
public/**/*.jpg
public/**/*.jpeg
public/**/*.png
public/**/*.gif
"@

Set-Content -Path .\.gitignore -Value $gitignoreContent

# Optional: Compress public/Background images
Write-Host "Would you like to optimize the background images? (y/n)" -ForegroundColor Yellow
$optimizeImages = Read-Host

if ($optimizeImages -eq "y") {
    Write-Host "Installing image optimization package..." -ForegroundColor Green
    npm install sharp --save-dev

    Write-Host "Creating image optimization script..." -ForegroundColor Green
    $optimizationScript = @"
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const backgroundDir = path.join(process.cwd(), 'public', 'Background');
const optimizedDir = path.join(process.cwd(), 'public', 'Background', 'optimized');

// Create optimized directory if it doesn't exist
if (!fs.existsSync(optimizedDir)) {
  fs.mkdirSync(optimizedDir, { recursive: true });
}

// Get all image files
const imageFiles = fs.readdirSync(backgroundDir)
  .filter(file => /\.(jpg|jpeg|png)$/i.test(file))
  .map(file => path.join(backgroundDir, file));

// Process each image
async function optimizeImages() {
  console.log(\`Optimizing \${imageFiles.length} images...\`);
  
  for (const filePath of imageFiles) {
    const fileName = path.basename(filePath);
    const outputPath = path.join(optimizedDir, fileName);
    
    try {
      await sharp(filePath)
        .resize({ width: 1200, height: 800, fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 80, progressive: true })
        .toFile(outputPath);
        
      console.log(\`Optimized: \${fileName}\`);
    } catch (err) {
      console.error(\`Error processing \${fileName}: \${err}\`);
    }
  }
  
  console.log('Image optimization complete!');
}

optimizeImages();
"@
    Set-Content -Path .\optimize-images.js -Value $optimizationScript
    
    Write-Host "Run the optimization script with: node optimize-images.js" -ForegroundColor Green
}

Write-Host "Repository clean-up configuration complete!" -ForegroundColor Green
Write-Host "NEXT STEPS:" -ForegroundColor Yellow
Write-Host "1. Run 'git rm -r --cached .' to unstage all files" -ForegroundColor Yellow
Write-Host "2. Run 'git add .' to stage files according to new .gitignore" -ForegroundColor Yellow
Write-Host "3. Run 'git commit -m \"Clean repository\"' to commit changes" -ForegroundColor Yellow
Write-Host "4. Run 'git push origin your-branch-name' to push changes" -ForegroundColor Yellow 