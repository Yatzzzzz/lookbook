# Test Pages Deployment Plan

## Overview
This document outlines the plan for implementing test pages from external projects into our fashion social network application. These pages will be deployed to the `/src/app/testpages/` route for evaluation before possible integration into the main application.

## Goal
Create functional test implementations of high-value pages and components discovered in external projects, using only Radix UI and Tailwind (not shadcn), while maintaining compatibility with our existing architecture and focusing on our rating-based social system.

## Phase 1: Setup Base Structure

1. **Create directory structure:**
   ```
   /src/app/testpages/
   ├── ai-assistant/
   │   └── page.tsx
   ├── lookbook/
   │   └── page.tsx
   ├── rating-showcase/
   │   └── page.tsx
   ├── battle/
   │   └── page.tsx
   ├── upload/
   │   └── page.tsx
   ├── layout.tsx
   └── page.tsx
   ```

2. **Implement shared layout:**
   - Create a layout.tsx file with navigation to all test pages
   - Include a warning banner indicating these are test features

3. **Install dependencies:**
   ```bash
   npm install @tanstack/react-query react-masonry-css
   ```

## Phase 2: Core Implementation (High Priority)

### 1. AI Assistant Page (Highest Value)

1. **Create base structure:**
   - Implement layout with card-based UI from FashionFuse
   - Copy core structure from `ai-assistant-page.tsx`

2. **Adapt API integration:**
   - Connect to existing Gemini endpoints in `/api/gemini/`
   - Modify API calls to use our Supabase authentication

3. **Implement UI components:**
   - Create the four card interfaces for different query types
   - Replace any shadcn components with our Radix UI equivalents
   - Implement response display area

### 2. Upload Page with Camera Integration

1. **Implement camera functionality:**
   - Copy core structure from `upload/page.tsx`
   - Implement camera access with getUserMedia API
   - Add file upload alternative

2. **Add AI analysis:**
   - Create endpoint for clothing detection using Gemini
   - Implement tagging system with AI suggestions
   - Add manual tag fallback option

3. **Integrate with storage:**
   - Modify localStorage calls to use Supabase storage
   - Implement image compression before upload
   - Connect to existing Looks database

### 3. Lookbook Page with Tabs

1. **Implement tab navigation:**
   - Copy core structure from `lookbook-page.tsx`
   - Implement tabs for different view modes
   - Adapt Wouter routing to Next.js

2. **Implement masonry layout:**
   - Configure react-masonry-css for responsive layout
   - Adapt our existing Look cards for the layout

3. **Add filtering and search:**
   - Implement filter logic for different view modes
   - Add search functionality for wardrobe items

## Phase 3: Rating-Based Features

### 1. Rating Showcase Page

1. **Implement rating-focused UI:**
   - Adapt structure from `crowd-page.tsx` but focus only on ratings
   - Remove any comment/messaging functionality
   - Highlight existing rating system

2. **Connect to existing looks and ratings:**
   - Modify query to use our existing looks and ratings data
   - Ensure proper user attribution for ratings
   - Display rating statistics and trends

### 2. Enhanced Battle Page

1. **Compare with existing implementation:**
   - Review our battle page implementation
   - Identify improvements from FashionFuse version

2. **Implement AI suggestions:**
   - Add the AI suggestion button
   - Connect to Gemini for intelligent comparisons

3. **Rating-based voting:**
   - Ensure battle voting uses existing rating system
   - Remove any comment/social features not related to ratings

## Phase 4: Component Integration

### 1. Utility Components

1. **Rating Slider:**
   - Create component based on `RatingSlider.tsx`
   - Adapt to use Radix UI Slider primitive
   - This is a critical component since ratings are our only social interaction

2. **Icon Actions Row:**
   - Implement based on `IconActionsRow.tsx`
   - Replace Heroicons with Lucide icons
   - Focus on rating, try-on, and save actions

3. **Storage Utilities:**
   - Create enhanced storage utilities
   - Implement fallback mechanisms for offline support

### 2. Product Components (if needed)

1. **Product Card:**
   - Implement without dinero.js dependency
   - Adapt for fashion items display

2. **Product Badges:**
   - Create best-seller and low-stock badges
   - Implement in product listing context

## Implementation Details

### API Endpoints Required

1. **AI Analysis:**
   ```
   /api/testpages/ai-assistant
   /api/testpages/clothes-finder
   /api/testpages/outfit-suggestion
   ```

2. **Rating Features:**
   ```
   /api/testpages/ratings
   /api/testpages/battle-votes
   ```

### Database Schema Extensions

1. **Enhanced Ratings Table:**
   ```sql
   CREATE TABLE enhanced_ratings (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     look_id UUID REFERENCES looks(id),
     user_id UUID REFERENCES users(id),
     rating INTEGER CHECK (rating BETWEEN 0 AND 5),
     context TEXT CHECK (context IN ('general', 'battle', 'trend')),
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   ```

### Technical Considerations

1. **Authentication:**
   - All pages must use existing Supabase authentication
   - Wrap components in auth check for protected content

2. **Radix UI Instead of shadcn:**
   - Use direct Radix UI primitives with Tailwind styling
   - Rebuild any shadcn components using base Radix components:
     - Card → Custom implementation with Tailwind
     - Dialog → Radix Dialog primitive
     - Select → Radix Select primitive

3. **WebSocket Optimization:**
   - Leverage Azure WebSocket support for real-time AI responses
   - Implement continuous conversation for AI assistant

4. **Performance:**
   - Implement image lazy loading and compression
   - Use React Query for data fetching with caching

5. **Rating System Focus:**
   - Ensure all social interactions are based on ratings
   - Implement rating analytics and visualization
   - Use ratings data to power recommendations

### Testing Approach

1. **Component Testing:**
   - Test each component in isolation
   - Verify mobile and desktop layouts

2. **Integration Testing:**
   - Test API integrations with mock data
   - Verify authentication flow

3. **WebSocket Testing:**
   - Test WebSocket connections to Azure
   - Verify real-time updates

## Timeline

1. **Phase 1 (1-2 days):**
   - Setup directory structure
   - Install dependencies
   - Create layout

2. **Phase 2 (3-4 days):**
   - Implement AI Assistant Page
   - Create Upload Page
   - Build Lookbook Page

3. **Phase 3 (1-2 days):**
   - Implement Rating Showcase
   - Enhance Battle Page with ratings focus

4. **Phase 4 (1-2 days):**
   - Create utility components
   - Integrate product components if needed

5. **Testing and Refinement (2 days):**
   - Test all pages
   - Fix any issues
   - Optimize performance

## Source Materials

This implementation is based on the following source materials:

1. **FashionFuse Pages**: `C:\demo\lookbook project\FashionFuse\client\src\pages\*`
   - ai-assistant-page.tsx
   - lookbook-page.tsx
   - battle-page.tsx
   - crowd-page.tsx (adapted for ratings only)

2. **Project App**: `C:\demo\project\app\*`
   - upload/page.tsx
   - gallery/page.tsx
   - utils/storage.ts

3. **UI Components**: `C:\MVP\lookbook-frontend-code\ui\*`
   - Various product-related components

## Next Steps

1. Create the base directory structure
2. Install required dependencies (TanStack Query, react-masonry-css)
3. Begin implementation with the AI Assistant Page (highest priority)
4. Implement the Rating Slider component as a foundational element
5. Set up the necessary API endpoints to support ratings-based features
6. Ensure all social interactions are handled through the rating system 

## Implementation Status

### Current Goal
Implement test pages from external projects into our fashion social network application. These pages will be deployed to the /src/app/testpages/ route for evaluation before integration into the main application. Once approved, successful implementations will be moved to production routes and added to the GitHub repository for deployment to Azure.

### Progress Tracking
This section documents progress made during implementation. Each entry should include:
- Date
- Phase/component implemented
- Issues encountered
- Solutions applied
- Status (In Progress/Complete)

### April 2024 Progress

#### 2024-04-25
- **Phase 1: Setup Base Structure** - COMPLETED
- Created plan and added status tracking section
- Created directory structure for all test pages
- Installed required dependencies (@tanstack/react-query, react-masonry-css)
- Implemented shared layout with navigation and warning banner
- Created main test pages index with cards linking to each feature
- Added placeholder pages for all features
- **Issues**: PowerShell on Windows 11 required separate commands for directory creation
- **Solutions**: Created directories one by one instead of with commas
- **Status**: Complete

#### 2024-04-25 (continued)
- **Phase 2: AI Assistant Page Implementation** - COMPLETED
- Created QueryCard component for interactive query forms
- Implemented ResponseDisplay component for showing AI responses
- Added four query templates (Fashion Advice, Outfit Recommendations, Trending Styles, Weekly Outfit Planner)
- Created dedicated API endpoint for AI Assistant at /api/testpages/ai-assistant
- Added speech synthesis for reading responses aloud
- Implemented API fallback mechanism for robustness
- **Issues**: Needed to handle text-only queries separately from image analysis
- **Solutions**: Created two processing functions in the API endpoint
- **Status**: Complete 

#### 2024-04-26
- **Phase 2: Upload Page with Camera Integration** - COMPLETED
- Created camera interface with environment (rear) camera preference
- Implemented file upload alternative
- Added image capturing and processing functionality
- Created dedicated API endpoint for clothes analysis at /api/testpages/clothes-finder
- Added manual tagging system as fallback
- Implemented three analysis modes: tag, detail, and style
- Created responsive UI with image preview and analysis results display
- Integrated with Gemini API for intelligent clothing detection
- Added tag management system (add/remove)
- **Issues**: TypeScript types for MediaStream and HTMLVideoElement references
- **Solutions**: Used proper TypeScript types and null checking
- **Status**: Complete 

#### 2024-04-27
- **Phase 2: Lookbook Page with Tabs Implementation** - COMPLETED
- Created comprehensive multi-tab interface with saved looks, my lookbook, virtual looks, and wardrobe sections
- Implemented masonry layout using react-masonry-css for responsive grid display
- Added category-based filtering with contextual filter options for each tab
- Implemented search functionality with real-time filtering
- Created responsive UI with appropriate loading, empty, and error states
- Added wardrobe view with items grouped by category
- Implemented mock API with TanStack Query for data fetching
- Added pagination with "Load More" functionality
- Created detailed look cards with user info, tags, and interaction buttons
- **Issues**: Needed to adjust masonry layout for different screen sizes
- **Solutions**: Implemented responsive breakpoints in the masonry configuration
- **Status**: Complete

#### 2024-04-28
- **Phase 3: Rating Showcase Page Implementation** - COMPLETED
- Created comprehensive rating-focused UI with statistics and trending sections
- Implemented rating system with Radix UI Slider primitive
- Added interactive star rating display component
- Created statistics cards for displaying rating metrics
- Implemented three main views: All Looks, Top Rated, and Trending
- Added featured sections for trending looks and highest rated look
- Created visual rating distribution graph
- Integrated with mock API and TanStack Query for data handling
- Implemented mobile-responsive design with appropriate breakpoints
- Created detailed look cards with rating information
- Added ability to rate any look with immediate visual feedback
- Saved ratings to localStorage for persistence
- **Issues**: Half-star display in the star rating component
- **Solutions**: Implemented custom half-star rendering with CSS layering
- **Next task**: Implement Enhanced Battle Page
- **Status**: Complete 