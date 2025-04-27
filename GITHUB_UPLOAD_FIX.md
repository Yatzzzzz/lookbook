# GitHub Upload Fix Guide

## The Problem

Your GitHub upload is failing after 6 hours due to repository size issues. The repository is currently **1.53GB**, which is far too large for efficient GitHub operations. GitHub recommends keeping repositories under 1GB, with a hard limit of 100GB.

## Size Analysis

Major contributors to repository size:

| Directory/Component | Size (MB) |
|---------------------|-----------|
| node_modules        | 798.66    |
| .next               | 685.96    |
| public              | 51.11     |
| Docs                | 38.82     |

## Root Causes

1. **Build artifacts being tracked**: .next directory should be gitignored but may have been committed in the past
2. **Large image files**: Background images in the public directory (some over 4MB each)
3. **Documentation assets**: Large files in the Docs directory
4. **Cached build files**: Webpack cache files are very large

## Solution Steps

### 1. Run the Cleanup Script

We've created two scripts to help fix the issues:

```powershell
# Run the main cleanup script
.\cleanup.ps1
```

This script will:
- Remove the .next directory
- Update your .gitignore file to exclude large files
- Offer to optimize your large images

### 2. Optimize Images (Optional but Recommended)

```powershell
# Install Sharp for image optimization
npm install sharp --save-dev

# Run the optimization script
node optimize-images.js
```

This will create optimized versions of your background images that are much smaller while maintaining quality.

### 3. Reset Git History

**⚠️ Important:** This will remove large files from your Git history. Make sure you have a backup before proceeding.

```powershell
# Remove everything from the Git index
git rm -r --cached .

# Add everything back according to the new .gitignore
git add .

# Commit the changes
git commit -m "Clean repository and optimize assets"

# Push to your repository (force if needed)
git push origin your-branch-name
```

### 4. For Extremely Large Repositories (Optional)

If your repository history is still too large, consider using Git LFS (Large File Storage) or creating a new repository and migrating only the essential files.

## Best Practices Going Forward

1. **Image optimization**: Always optimize images before adding them to the repository
2. **Environment variables**: Keep .env.local out of Git
3. **Build artifacts**: Ensure .next and node_modules are never committed
4. **Large binary files**: Consider Git LFS for large files that must be tracked

## Additional Notes

- The cleanup process may take some time
- Force pushing may be required if the repository has already been pushed
- Consider using CI/CD for builds instead of committing build artifacts 