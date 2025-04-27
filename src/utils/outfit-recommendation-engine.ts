/**
 * Outfit Recommendation Engine
 * 
 * This utility generates outfit recommendations based on a user's wardrobe items,
 * taking into account factors like occasion, weather, seasonality, and style preferences.
 */

import { WardrobeItem } from '@/app/context/WardrobeContext';

interface WeatherCondition {
  type: 'sunny' | 'rainy' | 'snowy' | 'cloudy' | 'windy';
  temperature: number; // in Celsius
  precipitation: number; // percentage chance
}

interface OutfitRecommendationParams {
  items: WardrobeItem[];
  occasion?: string;
  season?: string;
  weather?: WeatherCondition;
  stylePreference?: string[];
  colorScheme?: string[];
}

interface RecommendedOutfit {
  name: string;
  description: string;
  items: WardrobeItem[];
  occasion?: string;
  season?: string;
  weatherSuitability?: string[];
  reasoning: string;
  score: number;
}

/**
 * Generates outfit recommendations based on the given parameters
 * @param params - The parameters for generating recommendations
 * @returns A promise that resolves to an array of recommended outfits
 */
export async function getOutfitRecommendations(
  params: OutfitRecommendationParams
): Promise<RecommendedOutfit[]> {
  const { items, occasion, season, weather, stylePreference, colorScheme } = params;
  
  if (!items || items.length === 0) {
    return [];
  }
  
  // Filter items by season if specified
  const seasonalItems = season
    ? items.filter(item => 
        !item.season || 
        item.season.includes(season) || 
        item.season.length === 0
      )
    : items;
  
  // Filter by occasion if specified
  const occasionItems = occasion
    ? seasonalItems.filter(item => 
        !item.occasion || 
        item.occasion.includes(occasion) || 
        item.occasion.length === 0
      )
    : seasonalItems;
  
  // Filter by style if specified
  const styledItems = stylePreference
    ? occasionItems.filter(item => 
        !item.style || 
        stylePreference.some(style => item.style?.toLowerCase().includes(style.toLowerCase()))
      )
    : occasionItems;
  
  // Weather-appropriate filtering
  const weatherAppropriateItems = weather 
    ? filterByWeather(styledItems, weather) 
    : styledItems;
  
  // If we don't have enough items after filtering, gradually relax constraints
  let candidateItems = weatherAppropriateItems;
  if (candidateItems.length < 5) {
    candidateItems = occasionItems; // Relax weather and style constraints
    
    if (candidateItems.length < 5) {
      candidateItems = seasonalItems; // Relax occasion constraint
      
      if (candidateItems.length < 5) {
        candidateItems = items; // Use all items as a last resort
      }
    }
  }
  
  // Generate outfit combinations
  const outfits = generateOutfitCombinations(candidateItems, {
    occasion,
    season,
    weather,
    stylePreference,
    colorScheme
  });
  
  // Score and rank the outfits
  const scoredOutfits = outfits.map(outfit => ({
    ...outfit,
    score: scoreOutfit(outfit, {
      occasion,
      season,
      weather,
      stylePreference,
      colorScheme
    })
  }));
  
  // Sort by score in descending order
  const sortedOutfits = scoredOutfits.sort((a, b) => b.score - a.score);
  
  // Return the top 5 outfits
  return sortedOutfits.slice(0, 5);
}

/**
 * Filters items based on weather conditions
 * @param items - The wardrobe items to filter
 * @param weather - The weather condition to filter by
 * @returns An array of weather-appropriate items
 */
function filterByWeather(items: WardrobeItem[], weather: WeatherCondition): WardrobeItem[] {
  const { type, temperature, precipitation } = weather;
  
  // Basic weather-based filtering logic
  return items.filter(item => {
    // Category-based weather appropriateness
    switch (item.category) {
      case 'outerwear':
        // For cold temperatures, outerwear is appropriate
        if (temperature < 15) return true;
        // For rainy or snowy weather, certain outerwear is appropriate
        if ((type === 'rainy' || type === 'snowy') && precipitation > 30) return true;
        // For hot weather, outerwear is generally inappropriate
        if (temperature > 25) return false;
        break;
        
      case 'top':
        // All tops are generally okay, but filter out heavier tops in hot weather
        if (temperature > 25 && item.description?.toLowerCase().includes('heavy')) return false;
        if (temperature > 25 && item.description?.toLowerCase().includes('wool')) return false;
        if (temperature > 25 && item.description?.toLowerCase().includes('winter')) return false;
        break;
        
      case 'bottom':
        // For very cold weather, shorts might be inappropriate
        if (temperature < 10 && item.description?.toLowerCase().includes('short')) return false;
        // For very hot weather, prefer shorts and light bottoms
        if (temperature > 28 && 
            (item.description?.toLowerCase().includes('jeans') || 
             item.description?.toLowerCase().includes('thick'))) return false;
        break;
        
      case 'dress':
        // Similar to bottoms, adjust for temperature
        if (temperature < 10 && !item.description?.toLowerCase().includes('long')) return false;
        break;
        
      case 'shoes':
        // For rainy or snowy weather, open shoes might be inappropriate
        if ((type === 'rainy' || type === 'snowy') && precipitation > 50 && 
            (item.description?.toLowerCase().includes('sandal') || 
             item.description?.toLowerCase().includes('open'))) return false;
        break;
        
      default:
        // Accessories, bags, etc. are generally weather-independent
        return true;
    }
    
    // Default to including the item if no specific rule excluded it
    return true;
  });
}

/**
 * Generates potential outfit combinations from the available items
 * @param items - The wardrobe items to create outfits from
 * @param criteria - The criteria for generating outfits
 * @returns An array of recommended outfits
 */
function generateOutfitCombinations(
  items: WardrobeItem[], 
  criteria: Partial<OutfitRecommendationParams>
): RecommendedOutfit[] {
  const tops = items.filter(item => item.category === 'top');
  const bottoms = items.filter(item => item.category === 'bottom');
  const outerwear = items.filter(item => item.category === 'outerwear');
  const dresses = items.filter(item => item.category === 'dress');
  const shoes = items.filter(item => item.category === 'shoes');
  const accessories = items.filter(item => item.category === 'accessories');
  
  const outfits: RecommendedOutfit[] = [];
  
  // 1. Top + Bottom + Shoes combinations
  if (tops.length > 0 && bottoms.length > 0 && shoes.length > 0) {
    // Limit the number of combinations to avoid excessive processing
    const maxTops = Math.min(tops.length, 5);
    const maxBottoms = Math.min(bottoms.length, 5);
    const maxShoes = Math.min(shoes.length, 3);
    
    for (let i = 0; i < maxTops; i++) {
      for (let j = 0; j < maxBottoms; j++) {
        for (let k = 0; k < maxShoes; k++) {
          const outfit: RecommendedOutfit = {
            name: `${tops[i].name} with ${bottoms[j].name}`,
            description: `A casual outfit combining ${tops[i].name} with ${bottoms[j].name} and ${shoes[k].name}.`,
            items: [tops[i], bottoms[j], shoes[k]],
            occasion: criteria.occasion || 'casual',
            season: criteria.season,
            reasoning: 'Basic top and bottom combination with matching shoes.',
            score: 0 // Will be calculated later
          };
          
          outfits.push(outfit);
        }
      }
    }
  }
  
  // 2. Dress + Shoes combinations
  if (dresses.length > 0 && shoes.length > 0) {
    const maxDresses = Math.min(dresses.length, 5);
    const maxShoes = Math.min(shoes.length, 3);
    
    for (let i = 0; i < maxDresses; i++) {
      for (let j = 0; j < maxShoes; j++) {
        const outfit: RecommendedOutfit = {
          name: `${dresses[i].name} with ${shoes[j].name}`,
          description: `An elegant outfit with ${dresses[i].name} and ${shoes[j].name}.`,
          items: [dresses[i], shoes[j]],
          occasion: criteria.occasion || 'formal',
          season: criteria.season,
          reasoning: 'Dress and shoes combination for a put-together look.',
          score: 0 // Will be calculated later
        };
        
        outfits.push(outfit);
      }
    }
  }
  
  // 3. Top + Bottom + Outerwear + Shoes combinations (for colder weather)
  if (tops.length > 0 && bottoms.length > 0 && outerwear.length > 0 && shoes.length > 0) {
    // Using just one representative item from each category to limit combinations
    const outfit: RecommendedOutfit = {
      name: `${outerwear[0].name} over ${tops[0].name} with ${bottoms[0].name}`,
      description: `A layered outfit with ${outerwear[0].name} over ${tops[0].name}, paired with ${bottoms[0].name} and ${shoes[0].name}.`,
      items: [tops[0], bottoms[0], outerwear[0], shoes[0]],
      occasion: criteria.occasion || 'casual',
      season: criteria.season || 'fall',
      weatherSuitability: ['cold', 'cool', 'windy'],
      reasoning: 'Layered outfit suitable for cooler weather.',
      score: 0 // Will be calculated later
    };
    
    outfits.push(outfit);
  }
  
  // Add random accessories to some outfits if available
  if (accessories.length > 0) {
    for (let i = 0; i < outfits.length; i += 2) { // Add to every other outfit
      if (i < outfits.length) {
        const randomAccessory = accessories[Math.floor(Math.random() * accessories.length)];
        outfits[i].items.push(randomAccessory);
        outfits[i].description += ` Accessorized with ${randomAccessory.name}.`;
      }
    }
  }
  
  return outfits;
}

/**
 * Scores an outfit based on how well it matches the given criteria
 * @param outfit - The outfit to score
 * @param criteria - The criteria to score against
 * @returns A numerical score
 */
function scoreOutfit(
  outfit: RecommendedOutfit, 
  criteria: Partial<OutfitRecommendationParams>
): number {
  let score = 0;
  
  // Base score for having the right categories of items
  score += outfit.items.length * 5; // More complete outfits get higher scores
  
  // Occasion matching
  if (criteria.occasion && outfit.occasion === criteria.occasion) {
    score += 20;
  }
  
  // Season matching
  if (criteria.season && outfit.season === criteria.season) {
    score += 15;
  }
  
  // Weather suitability
  if (criteria.weather && outfit.weatherSuitability) {
    const { type, temperature } = criteria.weather;
    
    // Check if the outfit is suitable for the weather type
    if (type === 'rainy' && outfit.weatherSuitability.includes('rainy')) {
      score += 10;
    } else if (type === 'snowy' && outfit.weatherSuitability.includes('cold')) {
      score += 10;
    } else if (type === 'sunny' && temperature > 20 && outfit.weatherSuitability.includes('warm')) {
      score += 10;
    } else if (temperature < 15 && outfit.weatherSuitability.includes('cool')) {
      score += 10;
    }
  }
  
  // Style preference matching
  if (criteria.stylePreference && criteria.stylePreference.length > 0) {
    const styleMatchCount = outfit.items.filter(item => 
      criteria.stylePreference?.some(style => 
        item.style?.toLowerCase().includes(style.toLowerCase())
      )
    ).length;
    
    score += styleMatchCount * 5;
  }
  
  // Color scheme matching
  if (criteria.colorScheme && criteria.colorScheme.length > 0) {
    const colorMatchCount = outfit.items.filter(item => 
      criteria.colorScheme?.some(color => 
        item.color?.toLowerCase().includes(color.toLowerCase())
      )
    ).length;
    
    score += colorMatchCount * 5;
  }
  
  // Bonus for variety in categories
  const uniqueCategories = new Set(outfit.items.map(item => item.category)).size;
  score += uniqueCategories * 5;
  
  return score;
}

/**
 * Gets recommendations for the current weather
 * @param items - The wardrobe items
 * @param location - Optional location for weather data
 * @returns A promise that resolves to an array of weather-appropriate outfit recommendations
 */
export async function getWeatherBasedRecommendations(
  items: WardrobeItem[],
  location: string = 'London,UK'
): Promise<RecommendedOutfit[]> {
  try {
    // In a real app, this would call a weather API
    // For this implementation, we'll simulate weather data
    const weather = await simulateWeatherData(location);
    
    // Determine season based on temperature
    let season: string;
    if (weather.temperature < 5) {
      season = 'winter';
    } else if (weather.temperature < 15) {
      season = 'fall';
    } else if (weather.temperature < 25) {
      season = 'spring';
    } else {
      season = 'summer';
    }
    
    // Get recommendations based on the weather
    return getOutfitRecommendations({
      items,
      season,
      weather,
    });
  } catch (error) {
    console.error('Error getting weather-based recommendations:', error);
    // Fallback to basic recommendations without weather
    return getOutfitRecommendations({ items });
  }
}

/**
 * Simulates weather data (in a real app, this would be an API call)
 * @param location - The location to get weather for
 * @returns A promise that resolves to weather condition data
 */
async function simulateWeatherData(location: string): Promise<WeatherCondition> {
  // In a real app, this would call a weather API
  // For this demonstration, we'll return simulated data
  const date = new Date();
  const month = date.getMonth(); // 0-11
  
  let temperature: number;
  let type: WeatherCondition['type'];
  let precipitation: number;
  
  // Simulate seasonal variations
  if (month >= 11 || month <= 1) { // Winter (Dec-Feb)
    temperature = Math.floor(Math.random() * 10) - 5; // -5 to 5 degrees
    type = Math.random() > 0.5 ? 'snowy' : 'cloudy';
    precipitation = Math.floor(Math.random() * 60) + 40; // 40-100%
  } else if (month >= 2 && month <= 4) { // Spring (Mar-May)
    temperature = Math.floor(Math.random() * 10) + 10; // 10-20 degrees
    type = Math.random() > 0.7 ? 'rainy' : (Math.random() > 0.5 ? 'cloudy' : 'sunny');
    precipitation = Math.floor(Math.random() * 50) + 20; // 20-70%
  } else if (month >= 5 && month <= 8) { // Summer (Jun-Sep)
    temperature = Math.floor(Math.random() * 10) + 20; // 20-30 degrees
    type = Math.random() > 0.8 ? 'rainy' : 'sunny';
    precipitation = Math.floor(Math.random() * 30); // 0-30%
  } else { // Fall (Oct-Nov)
    temperature = Math.floor(Math.random() * 10) + 5; // 5-15 degrees
    type = Math.random() > 0.6 ? 'rainy' : (Math.random() > 0.5 ? 'cloudy' : 'windy');
    precipitation = Math.floor(Math.random() * 40) + 30; // 30-70%
  }
  
  return { type, temperature, precipitation };
} 