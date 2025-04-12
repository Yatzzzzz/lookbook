# Lookbook - Fashion Social Network

Lookbook is a mobile-first fashion social network application built with Next.js 15.2.4 and Supabase. It allows users to share their fashion looks, get AI-powered feedback, and engage with a fashion-focused community.

## Features

- **Gallery:** View and rate fashion looks in a masonry layout, participate in fashion battles, and give "Yay or Nay" opinions on outfits
- **Search:** Discover trending looks, get personalized recommendations, and use AI-powered fashion search
- **Look Upload:** 3-step look upload process with AI image analysis
- **Trends:** Stay updated with top looks, influencers, wardrobes, and rising fashion trends
- **Profile:** Manage your profile, settings, saved looks, uploads, and virtual wardrobe
- **AI Assistant:** Get fashion advice, outfit suggestions, and plan your weekly outfits with AI assistance

## Tech Stack

- **Frontend:** Next.js 15.2.4, React 19, Tailwind CSS 4
- **Backend:** Supabase (PostgreSQL, Authentication, Storage)
- **AI Integration:** (Simulated, would use Google AI Studio in production)
- **Deployment:** Azure Static Web Sites

## Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn
- Supabase account and project

### Installation

1. Clone the repository
   ```
   git clone https://github.com/yourusername/lookbook.git
   cd lookbook
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Set up environment variables
   Create a `.env.local` file in the root directory with the following variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Run the development server
   ```
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### Database Setup

1. Execute the SQL scripts in the `supabase` directory to set up the required tables and RLS policies:
   - `users-rls-setup.sql`
   - `looks-rls-setup.sql`
   - `storage-setup.sql`

## Deployment

The application is configured for deployment to Azure Static Web Sites. Follow these steps to deploy:

1. Build the production version
   ```
   npm run build
   ```

2. Deploy using the Azure CLI or GitHub Actions
   ```
   az staticwebapp create --name "lookbook" --resource-group "lookbook-rg" --source "." --location "eastus2" --branch "main"
   ```

## Project Structure

- `src/app/` - Next.js app router pages and API routes
- `src/components/` - Reusable React components
- `src/contexts/` - React contexts for state management
- `src/utils/` - Utility functions, including Supabase client
- `public/` - Static assets

## Mobile-First Design

This application follows a mobile-first approach with responsive design principles using Tailwind CSS. The interface is optimized for mobile devices with:

- Bottom navigation bar for easy access to main features
- Responsive layouts that adapt to different screen sizes
- Touch-friendly interface elements
- Compact views for mobile users

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- Supabase for backend services
- Next.js team for the framework
- Tailwind CSS for styling
- Vercel for inspiration and examples
