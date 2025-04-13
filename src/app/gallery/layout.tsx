import Link from 'next/link';

export default function GalleryLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <header className="bg-white shadow-md">
        <nav className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo/Brand */}
            <Link href="/" className="text-xl font-bold">
              Lookbook
            </Link>
            
            {/* Navigation Links - Removed as requested */}
            <div className="flex space-x-6">
              {/* Navigation links have been removed */}
            </div>
          </div>
        </nav>
      </header>
      <div>{children}</div>
      <footer>{/* Your footer content */}</footer>
    </>
  );
} 