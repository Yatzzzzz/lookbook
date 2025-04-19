const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Function to remove dark theme classes from a string
const removeDarkClasses = (content) => {
  // Remove dark: tailwind prefixes
  content = content.replace(/dark:[^"'`\s]+/g, '');

  // Remove className entries that have empty strings after removal
  content = content.replace(/className=["'`]\s+["'`]/g, 'className=""');
  content = content.replace(/className=["'`]\s*["'`]/g, 'className=""');

  // Clean up consecutive spaces
  content = content.replace(/\s{2,}/g, ' ');

  // Clean up empty className attributes
  content = content.replace(/className=""/g, '');

  return content;
};

// Function to process a file
const processFile = (filePath) => {
  try {
    console.log(`Processing ${filePath}...`);
    const content = fs.readFileSync(filePath, 'utf8');
    const updatedContent = removeDarkClasses(content);

    if (content !== updatedContent) {
      fs.writeFileSync(filePath, updatedContent, 'utf8');
      console.log(`Updated ${filePath}`);
    } else {
      console.log(`No changes needed for ${filePath}`);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
  }
};

// Find all TypeScript and TSX files in the project
const findFiles = () => {
  const srcPath = path.resolve(__dirname, '..');
  return glob.sync(`${srcPath}/**/*.{ts,tsx,js,jsx}`, {
    ignore: ['**/node_modules/**', '**/.next/**']
  });
};

// Main function
const main = () => {
  const files = findFiles();
  console.log(`Found ${files.length} files to process`);
  
  files.forEach(processFile);
  
  console.log('Done!');
};

main(); 