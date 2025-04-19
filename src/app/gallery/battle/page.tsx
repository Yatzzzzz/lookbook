'use client';

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, QueryClientProvider } from "@tanstack/react-query";
import type { Look } from "@/types/look";
import { Loader2, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useState, useEffect } from "react";
import BottomNav from "@/components/BottomNav";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Image } from "@/components/ui/image";
import Link from "next/link";
import { Heart } from "lucide-react";
import BattleGrid from "@/components/gallery/BattleGrid/BattleGrid";

interface BattleItem {
  id: string;
  user: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
  image_url: string;
  description: string;
  created_at: string;
  look_id?: string;
  caption?: string;
  username?: string;
  avatar_url?: string;
  option1_url?: string;
  option2_url?: string;
}

// Interface for the formatted items that are passed to BattleGrid
interface FormattedBattleItem {
  look_id: string;
  id?: string;
  image_url: string;
  caption: string;
  username: string;
  avatar_url?: string;
}

function BattlePageContent() {
  const { toast } = useToast();
  const [battles, setBattles] = useState<Record<string, BattleItem>>({});
  const [battleItems, setBattleItems] = useState<BattleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function fetchBattleItems() {
      try {
        setIsLoading(true);
        
        console.log('========= DEBUG: STARTING BATTLE ITEMS FETCH =========');
        
        // Direct check - what folders exist?
        console.log('Performing direct folder scan...');
        const { data: dirContents, error: dirError } = await supabase
          .storage
          .from('battle')
          .list('', {
            limit: 100,
            offset: 0,
          });
          
        if (dirError) {
          console.error('Error scanning directories:', dirError);
        } else {
          console.log('Root directory contents:', dirContents);
          
          // Find folders that might contain battle images
          const possibleFolders = dirContents?.filter(item => !item.name.includes('.')) || [];
          let battleSets: Array<{
            username: string;
            timestamp: string;
            main?: string;
            option1?: string;
            option2?: string;
          }> = [];
          
          if (possibleFolders.length > 0) {
            console.log(`Found ${possibleFolders.length} potential user folders:`, possibleFolders.map(f => f.name));
            
            // Try a direct approach to fetch battle images from folders
            battleSets = [];
            
            // Process each folder to find battle images
            for (const folder of possibleFolders) {
              const username = folder.name;
              console.log(`Examining folder for user: ${username}`);
              
              // Get all files in this folder
              const { data: folderFiles, error: folderError } = await supabase
                .storage
                .from('battle')
                .list(username);
                
              if (folderError) {
                console.error(`Error listing files in folder ${username}:`, folderError);
                continue;
              }
              
              console.log(`Found ${folderFiles?.length || 0} files in folder ${username}:`, folderFiles);
              
              if (!folderFiles || folderFiles.length === 0) {
                console.log(`No files found in folder ${username}`);
                continue;
              }
              
              // Group files by timestamp to find related images (main, option1, option2)
              const fileGroups: Record<string, {
                timestamp: string;
                files: Array<{name: string, type: string, url: string}>
              }> = {};
              
              // Process each file in the folder
              for (const file of folderFiles) {
                // Skip non-image files
                if (!file.name.endsWith('.jpg') && !file.name.endsWith('.jpeg') && 
                    !file.name.endsWith('.png') && !file.name.endsWith('.gif')) {
                  continue;
                }
                
                console.log(`Processing file: ${file.name}`);
                
                // Extract timestamp and type from filename
                // Expected format: timestamp-type.extension (e.g., 1745016812247-main.jpg)
                const filenameParts = file.name.split('-');
                let timestamp = '';
                let type = '';
                
                if (filenameParts.length >= 2) {
                  // First part should be timestamp
                  timestamp = filenameParts[0];
                  
                  // Second part should include the type (main, option1, option2)
                  const typePart = filenameParts[1].split('.')[0].toLowerCase();
                  
                  if (typePart.includes('main')) {
                    type = 'main';
                  } else if (typePart.includes('option1')) {
                    type = 'option1';
                  } else if (typePart.includes('option2')) {
                    type = 'option2';
                  } else {
                    console.log(`Could not determine type from filename part: ${typePart}`);
                    continue;
                  }
                  
                  console.log(`Successfully parsed filename: timestamp=${timestamp}, type=${type}`);
                } else {
                  console.log(`Filename does not match expected pattern: ${file.name}`);
                  continue;
                }
                
                // Get public URL for this file
                const { data: urlData } = await supabase.storage
                  .from('battle')
                  .getPublicUrl(`${username}/${file.name}`);
                
                // Add to or create group based on timestamp
                if (!fileGroups[timestamp]) {
                  fileGroups[timestamp] = { timestamp, files: [] };
                }
                
                fileGroups[timestamp].files.push({
                  name: file.name,
                  type: type,
                  url: urlData.publicUrl
                });
                
                console.log(`Added ${type} image to timestamp ${timestamp}: ${urlData.publicUrl.substring(0, 40)}...`);
              }
              
              // Look for complete sets (main + at least one option)
              let foundCompleteSets = false;
              
              // Create battle sets from grouped files
              for (const [timestamp, group] of Object.entries(fileGroups)) {
                // Extract URLs by type
                const mainFile = group.files.find(f => f.type === 'main');
                const option1File = group.files.find(f => f.type === 'option1');
                const option2File = group.files.find(f => f.type === 'option2');
                
                // Only create sets that have at least main + one option
                if (mainFile && (option1File || option2File)) {
                  battleSets.push({
                    username,
                    timestamp,
                    main: mainFile.url,
                    option1: option1File?.url,
                    option2: option2File?.url
                  });
                  
                  console.log(`Created battle set for ${username} with timestamp ${timestamp}`);
                  foundCompleteSets = true;
                } else {
                  console.log(`Incomplete set for timestamp ${timestamp}: main=${!!mainFile}, option1=${!!option1File}, option2=${!!option2File}`);
                }
              }
              
              if (!foundCompleteSets) {
                console.log(`No complete battle sets found in folder ${username}. Make sure you have files with main, option1, and option2 in their names.`);
                
                // Log all files for debugging
                const imageFiles = folderFiles.filter(f => 
                  f.name.endsWith('.jpg') || f.name.endsWith('.jpeg') || 
                  f.name.endsWith('.png') || f.name.endsWith('.gif')
                );
                
                if (imageFiles.length > 0) {
                  console.log(`Found these image files in folder ${username}:`, imageFiles.map(f => f.name));
                  console.log(`Check that your filenames follow the pattern: timestamp-type.jpg (e.g., 1745016812247-main.jpg)`);
                }
              }
            }
            
            // If we found battle sets, convert them to battle items
            if (battleSets.length > 0) {
              console.log(`Found ${battleSets.length} battle sets from folders`);
              
              const directItems: BattleItem[] = battleSets.map(set => ({
                id: `${set.username}-${set.timestamp}`,
                user: {
                  id: set.username,
                  username: set.username,
                  avatar_url: null
                },
                image_url: set.main!,
                option1_url: set.option1,
                option2_url: set.option2,
                description: `Fashion Battle by ${set.username}`,
                created_at: new Date(parseInt(set.timestamp) || Date.now()).toISOString()
              }));
              
              // If we found items this way, use them directly
              if (directItems.length > 0) {
                console.log('Successfully created battle items directly:', directItems);
                setBattleItems(directItems);
                setIsLoading(false);
                return;
              }
            } else {
              console.log('No valid battle sets found in user folders');
              
              // If no complete battle sets were found but we have some images, use them directly as a fallback
              console.log('Attempting to use individual images as fallback...');
              
              // Collect all images found in all folders
              const allFoundImages: Array<{
                username: string;
                name: string;
                url: string;
                type: string;
                timestamp: string;
              }> = [];
              
              // Process each folder again to collect all images
              for (const folder of possibleFolders) {
                const username = folder.name;
                
                // Get files in the folder
                const { data: folderFiles } = await supabase
                  .storage
                  .from('battle')
                  .list(username);
                  
                if (!folderFiles || folderFiles.length === 0) continue;
                
                // Process each image file
                for (const file of folderFiles) {
                  // Skip non-image files
                  if (!file.name.endsWith('.jpg') && !file.name.endsWith('.jpeg') && 
                      !file.name.endsWith('.png') && !file.name.endsWith('.gif')) {
                    continue;
                  }
                  
                  // Get URL for this file
                  const { data: urlData } = await supabase.storage
                    .from('battle')
                    .getPublicUrl(`${username}/${file.name}`);
                    
                  // Try to determine type and timestamp from filename
                  let type = 'unknown';
                  let timestamp = Date.now().toString();
                  
                  if (file.name.includes('main')) {
                    type = 'main';
                  } else if (file.name.includes('option1')) {
                    type = 'option1';
                  } else if (file.name.includes('option2')) {
                    type = 'option2';
                  }
                  
                  // Try to extract timestamp
                  const timeMatch = file.name.match(/(\d{10,13})/);
                  if (timeMatch) {
                    timestamp = timeMatch[1];
                  }
                  
                  allFoundImages.push({
                    username,
                    name: file.name,
                    url: urlData.publicUrl,
                    type,
                    timestamp
                  });
                }
              }
              
              console.log(`Found ${allFoundImages.length} individual images across all folders`);
              
              // If we have at least one image, create a battle item with it
              if (allFoundImages.length > 0) {
                // Sort by timestamp
                allFoundImages.sort((a, b) => parseInt(b.timestamp) - parseInt(a.timestamp));
                
                // Find main, option1, and option2 images if possible
                const mainImage = allFoundImages.find(img => img.type === 'main') || allFoundImages[0];
                const option1Image = allFoundImages.find(img => img.type === 'option1');
                const option2Image = allFoundImages.find(img => img.type === 'option2');
                
                // Create a battle item
                const directItems: BattleItem[] = [{
                  id: `direct-${Date.now()}`,
                  user: {
                    id: mainImage.username,
                    username: mainImage.username,
                    avatar_url: null
                  },
                  image_url: mainImage.url,
                  option1_url: option1Image?.url,
                  option2_url: option2Image?.url,
                  description: `Fashion Battle`,
                  created_at: new Date().toISOString()
                }];
                
                console.log('Created battle item directly from individual images:', directItems);
                setBattleItems(directItems);
                setIsLoading(false);
                return;
              }
            }
          } else {
            console.log('No user folders found in battle bucket');
          }
        }
        
        console.log('Fetching battle items...');
        
        // 1. First, query the battle storage bucket for all images
        const { data: battleStorageData, error: storageError } = await supabase
          .storage
          .from('battle')
          .list('', {
            limit: 100,
            offset: 0,
            sortBy: { column: 'created_at', order: 'desc' }
          });
          
        console.log('Raw response from Supabase battle bucket:', battleStorageData);
        
        if (storageError) {
          console.error('Error fetching from battle storage:', storageError);
          throw new Error('Error accessing battle storage: ' + storageError.message);
        } else {
          console.log('Retrieved battle storage data:', battleStorageData);
          
          // Print a summary of what we found
          const files = battleStorageData.filter(item => 
            item.name.endsWith('.jpg') || 
            item.name.endsWith('.png') || 
            item.name.endsWith('.jpeg') || 
            item.name.endsWith('.gif')
          );
          
          const folders = battleStorageData.filter(item => 
            !item.name.includes('.') && (item.id?.includes('/') || item.metadata?.mimetype === null)
          );
          
          console.log(`Summary of storage contents: ${files.length} files, ${folders.length} folders`);
          console.log('Files:', files.map(f => f.name));
          console.log('Folders:', folders.map(f => f.name));
        }
        
        if (!battleStorageData || battleStorageData.length === 0) {
          console.log('No items found in battle storage bucket');
          setBattleItems([]);
          setIsLoading(false);
          return;
        }

        // Check if we have folders or direct files
        const hasDirectFiles = battleStorageData.some(item => 
          item.name.endsWith('.jpg') || 
          item.name.endsWith('.png') || 
          item.name.endsWith('.jpeg') || 
          item.name.endsWith('.gif')
        );

        let hasUserFolders = battleStorageData.some(item => 
          !item.name.includes('.') && item.id && item.id.includes('/')
        );
        
        console.log('Storage structure - has direct files:', hasDirectFiles, 'has user folders:', hasUserFolders);
        
        // Let's try a different approach to find all files regardless of structure
        console.log('Checking for files with slashes in their names to detect folder structure...');
        const filesWithSlashes = battleStorageData.filter(item => 
          item.name.includes('/') || (item.id && item.id.includes('/'))
        );
        
        if (filesWithSlashes.length > 0) {
          console.log('Found files with slashes indicating folder structure:', filesWithSlashes);
          
          // Extract unique folder paths
          const folderPaths = Array.from(new Set(
            filesWithSlashes.map(item => {
              const pathParts = item.name.split('/');
              return pathParts[0]; // First part is folder name
            })
          ));
          
          console.log('Detected folders from file paths:', folderPaths);
          
          // Manual override if we found folders this way but not through the regular method
          if (folderPaths.length > 0 && !hasUserFolders) {
            console.log('Manually setting hasUserFolders to true based on file path analysis');
            hasUserFolders = true;
          }
        }
        
        // Collection of all image files, regardless of structure
        const allImageFiles: {
          path: string;
          name: string;
          username: string;
          lastModified: number;
          publicUrl: string;
        }[] = [];

        // Handle flat structure (direct files)
        if (hasDirectFiles) {
          for (const item of battleStorageData) {
            if (item.name.endsWith('.jpg') || item.name.endsWith('.png') || item.name.endsWith('.jpeg') || item.name.endsWith('.gif')) {
              const { data: publicUrlData } = supabase.storage
                .from('battle')
                .getPublicUrl(item.name);
                
              allImageFiles.push({
                path: item.name,
                name: item.name,
                username: 'Anonymous',
                lastModified: item.metadata?.lastModified || Date.now(),
                publicUrl: publicUrlData.publicUrl
              });
            }
          }
        }
        
        // Handle folder structure
        if (hasUserFolders) {
          // Extract user folders
          const userFolders = battleStorageData.filter(item => 
            !item.name.includes('.') && (item.id?.includes('/') || item.metadata?.mimetype === null)
          );
          
          console.log('Found user folders:', userFolders.map(f => f.name));
          console.log('User folders detailed data:', userFolders);
          
          // For each user folder, get the images
          for (const folder of userFolders) {
            const username = folder.name;
            
            console.log(`Attempting to list contents of folder "${username}" in battle bucket...`);
            
            // Get user images in their folder
            const { data: userImages, error: userImagesError } = await supabase
              .storage
              .from('battle')
              .list(username, {
                limit: 100,
                offset: 0,
                sortBy: { column: 'created_at', order: 'desc' }
              });
              
            if (userImagesError) {
              console.error(`Error fetching images for user ${username}:`, userImagesError);
              continue;
            }
            
            console.log(`Found ${userImages?.length || 0} images for user ${username}:`, userImages);
            
            // If no images were found, let's try a different approach
            if (!userImages || userImages.length === 0) {
              console.log(`No images found in folder "${username}" using standard list. Trying alternative methods...`);
              
              // Let's try directly listing all files and filtering by prefix
              const { data: allFiles, error: allFilesError } = await supabase
                .storage
                .from('battle')
                .list('', {
                  limit: 1000,
                  offset: 0,
                });
                
              if (allFilesError) {
                console.error('Error fetching all files:', allFilesError);
              } else {
                // Filter files that start with the username/
                const userFiles = allFiles.filter(file => 
                  file.name.startsWith(`${username}/`) || 
                  file.id?.includes(`${username}/`)
                );
                console.log(`Alternative method: Found ${userFiles.length} files for user ${username}:`, userFiles);
              }
            }
            
            // Process each image
            for (const image of userImages || []) {
              if (image.name.endsWith('.jpg') || image.name.endsWith('.png') || image.name.endsWith('.jpeg') || image.name.endsWith('.gif')) {
                const { data: publicUrlData } = supabase.storage
                  .from('battle')
                  .getPublicUrl(`${username}/${image.name}`);
                
                allImageFiles.push({
                  path: `${username}/${image.name}`,
                  name: image.name,
                  username: username,
                  lastModified: image.metadata?.lastModified || Date.now(),
                  publicUrl: publicUrlData.publicUrl
                });
              }
            }
          }
        }
        
        // If no images were found through either direct files or folders,
        // try one more approach - directly search the entire bucket recursively
        if (allImageFiles.length === 0) {
          console.log('No images found through standard methods. Trying recursive search...');
          
          try {
            // Try a recursive search (may not be supported by all Supabase instances)
            const { data: recursiveData, error: recursiveError } = await supabase
              .storage
              .from('battle')
              .list('', {
                limit: 1000,
                offset: 0,
                search: '.jpg,.jpeg,.png,.gif',
              });
              
            if (recursiveError) {
              console.error('Error in recursive search:', recursiveError);
            } else if (recursiveData) {
              console.log('Recursive search results:', recursiveData);
              
              // Process all image files found
              for (const item of recursiveData) {
                if (item.name.endsWith('.jpg') || item.name.endsWith('.png') || 
                    item.name.endsWith('.jpeg') || item.name.endsWith('.gif')) {
                  // Extract username from file path if it contains a slash
                  const username = item.name.includes('/') ? item.name.split('/')[0] : 'Anonymous';
                  
                  const { data: publicUrlData } = supabase.storage
                    .from('battle')
                    .getPublicUrl(item.name);
                    
                  allImageFiles.push({
                    path: item.name,
                    name: item.name.includes('/') ? item.name.split('/').pop() || item.name : item.name,
                    username,
                    lastModified: item.metadata?.lastModified || Date.now(),
                    publicUrl: publicUrlData.publicUrl
                  });
                  
                  console.log(`Added file from recursive search: ${item.name}`);
                }
              }
            }
          } catch (e) {
            console.error('Error during recursive search:', e);
          }
        }
        
        console.log('All image files found:', allImageFiles);
        
        // As a last resort, if we still have no images, let's try direct URLs
        if (allImageFiles.length === 0) {
          console.log('CRITICAL: Still no images found. Trying direct URL construction as last resort...');
          
          // Extract user folders again
          const folders = battleStorageData.filter(item => 
            !item.name.includes('.') && (item.id?.includes('/') || item.metadata?.mimetype === null)
          );
          const folderNames = folders.map((f: any) => f.name) || [];
          
          if (folderNames.length > 0) {
            for (const folderName of folderNames) {
              // Create synthetic entries for testing
              const testFiles = ['main', 'option1', 'option2'].map(type => {
                const fileName = `${Date.now()}-${type}.jpg`;
                const path = `${folderName}/${fileName}`;
                
                // Construct URL directly (this is a guess but often works)
                const baseUrl = supabase.storage.from('battle').getPublicUrl('').data.publicUrl;
                const publicUrl = `${baseUrl}/${path}`;
                
                return {
                  path,
                  name: fileName,
                  username: folderName,
                  lastModified: Date.now(),
                  publicUrl
                };
              });
              
              console.log(`Created test files for folder ${folderName}:`, testFiles);
              allImageFiles.push(...testFiles);
            }
          }
        }
        
        // Group images by battle (using timestamp to identify related images)
        // Each battle typically has 3 images: main, option1, option2
        const groupedByTimestamp = allImageFiles.reduce((groups, image) => {
          // Dump the full image info for debugging
          console.log('Processing image:', {
            path: image.path,
            name: image.name,
            username: image.username,
            lastModified: image.lastModified,
            publicUrl: image.publicUrl.substring(0, 50) + '...' // Truncate URL for readability
          });

          // Get username from the path
          const username = image.username;
          
          // Get timestamp from filename
          let timestamp = '';
          let type = '';
          
          // Check filename for specific patterns
          if (image.name.includes('main')) {
            type = 'main';
          } else if (image.name.includes('option1')) {
            type = 'option1';
          } else if (image.name.includes('option2')) {
            type = 'option2';
          } else {
            // Can't determine type from filename
            console.log(`Can't determine type from filename ${image.name}`);
            return groups;
          }
          
          // Extract timestamp from filename
          // Common pattern: 1682345678-main.jpg or main-1682345678.jpg
          const matches = image.name.match(/(\d{10,13})/);
          if (matches && matches[1]) {
            timestamp = matches[1];
            console.log(`Extracted timestamp ${timestamp} from filename ${image.name}`);
          } else {
            // Use time-based grouping instead (rounded to nearest 10 seconds)
            timestamp = Math.floor(image.lastModified / 10000).toString();
            console.log(`Using lastModified as timestamp: ${timestamp}`);
          }
          
          // Create a group ID based on username and timestamp
          const groupId = `${username}-${timestamp}`;
          console.log(`Using group ID: ${groupId} for image: ${image.name}`);
          
          // Create group if it doesn't exist
          if (!groups[groupId]) {
            console.log(`Creating new group ${groupId}`);
            groups[groupId] = {
              id: groupId,
              user: {
                id: username,
                username: username,
                avatar_url: null
              },
              created_at: new Date(parseInt(timestamp) || image.lastModified).toISOString(),
              images: {}
            };
          }
          
          // Add image to group by type
          groups[groupId].images[type] = image.publicUrl;
          console.log(`Added ${image.name} as ${type} to group ${groupId}`);
          
          return groups;
        }, {} as Record<string, any>);
        
        console.log('Grouped by timestamp:', groupedByTimestamp);
        
        // Validate each group has the necessary images
        Object.entries(groupedByTimestamp).forEach(([groupId, group]) => {
          const missingImages = [];
          if (!group.images.main) missingImages.push('main');
          if (!group.images.option1) missingImages.push('option1');
          if (!group.images.option2) missingImages.push('option2');
          
          if (missingImages.length > 0) {
            console.warn(`Group ${groupId} is missing images: ${missingImages.join(', ')}`);
          } else {
            console.log(`Group ${groupId} has all required images`);
          }
        });
        
        // Convert groups to battle items format
        const battleItems: BattleItem[] = Object.values(groupedByTimestamp)
          .filter(group => {
            // A valid battle should have at least main + one option
            const isValid = group.images.main && (group.images.option1 || group.images.option2);
            if (!isValid) {
              console.warn(`Skipping incomplete battle group ${group.id}. Has main: ${!!group.images.main}, option1: ${!!group.images.option1}, option2: ${!!group.images.option2}`);
            }
            return isValid;
          })
          .map(group => ({
            id: group.id,
            user: group.user,
            image_url: group.images.main, // Main image
            description: 'Fashion Battle Look',
            created_at: group.created_at,
            option1_url: group.images.option1, // Add option URLs
            option2_url: group.images.option2
          }));
        
        console.log('Final battle items:', battleItems);
        
        if (battleItems.length > 0) {
          // Sort by creation date (newest first)
          battleItems.sort((a, b) => {
            const dateA = new Date(a.created_at);
            const dateB = new Date(b.created_at);
            return dateB.getTime() - dateA.getTime();
          });
          
          console.log('Successfully created battle items:', battleItems.length);
          setBattleItems(battleItems);
        } else {
          console.log('No battle items found. Battle gallery will be empty.');
          const allFiles = allImageFiles.map(img => img.path);
          if (allFiles.length > 0) {
            console.log('Files were found but could not be grouped properly:', allFiles);
            setError(`Found ${allFiles.length} individual files but couldn't group them into complete battles. Each battle needs main + option1 + option2 images.`);
          } else {
            // Check if we found folders but no images
            const { data: folders } = await supabase
              .storage
              .from('battle')
              .list('', { limit: 100 });
              
            const userFolders = folders?.filter(item => !item.name.includes('.')) || [];
            
            if (userFolders.length > 0) {
              setError(`Found ${userFolders.length} user folders in the battle storage, but no complete battle image sets. Make sure each folder contains files with "main", "option1", and "option2" in their names.`);
            } else {
              setError('No battle images found. Please upload a battle look first by going to the upload page and selecting "Battle" as the upload type.');
            }
          }
          setBattleItems([]);
        }
      } catch (error) {
        console.error('Error in fetchBattleItems:', error);
        setError('Failed to load battle items. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchBattleItems();
  }, [supabase]);

  const handleSelection = (battleId: string, optionNumber: number) => {
    setBattles(prev => ({
      ...prev,
      [battleId]: {
        ...prev[battleId],
        selectedOption: optionNumber
      }
    }));

    toast({
      title: "Selection recorded!",
      description: `You selected option ${optionNumber}. Thanks for your input!`,
    });
    
    // In a real app, you would save this vote to the database
    // For example:
    // supabase.from('battle_votes').insert({
    //   battle_id: battleId,
    //   option: optionNumber,
    //   user_id: currentUserId
    // })
  };

  // Function to transform data into BattleGrid format
  const formatBattleItems = (): BattleItem[] => {
    console.log('Formatting battle items:', battleItems);
    // No need to transform - pass the items directly with their option URLs intact
    console.log('Items will be sent directly to BattleGrid with option URLs');
    return battleItems;
  };

  const renderBattles = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center p-6 min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="p-4 my-4 text-center text-red-500 border border-red-200 rounded-md">
          <p className="mb-2">Error loading battle items</p>
          <p className="text-sm text-red-400">{error}</p>
        </div>
      );
    }

    if (!battleItems || battleItems.length === 0) {
      return (
        <div className="p-4 my-4 text-center">
          <p className="mb-2 text-lg">No battle items found</p>
          <p className="text-sm text-gray-500">Try uploading a battle image with option 1 and option 2</p>
        </div>
      );
    }

    // Render the battles with BattleGrid component
    return <BattleGrid items={battleItems} />;
  };

  return (
    <div className="w-full max-w-full px-2 sm:px-4 mx-auto">
      {renderBattles()}
    </div>
  );
}

export default function BattlePage() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-white">
        <div className="container max-w-full mx-auto pb-16">
          <BattlePageContent />
        </div>
        <BottomNav activeTab="/gallery/battle" />
      </div>
    </QueryClientProvider>
  );
} 