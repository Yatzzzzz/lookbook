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
            
            {/* Navigation Links */}
            <div className="flex space-x-6">
              {/* Your existing nav links */}
              <Link href="/feed" className="hover:text-blue-600 transition-colors">
                Feed
              </Link>
              <Link href="/upload" className="hover:text-blue-600 transition-colors">
                Upload
              </Link>
              <Link href="/profile" className="hover:text-blue-600 transition-colors">
                Profile
              </Link>
              
              {/* AI Features */}
              <Link href="/ai" className="hover:text-blue-600 transition-colors">
                AI Features
              </Link>
            </div>
          </div>
        </nav>
      </header>
      <div>{children}</div>
      <footer>{/* Your footer content */}</footer>
    </>
  );
} 