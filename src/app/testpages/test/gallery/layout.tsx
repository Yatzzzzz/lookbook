export default function GalleryTestLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Gallery Layout Test</h1>
      <div className="flex-grow">
        {children}
      </div>
    </div>
  );
} 