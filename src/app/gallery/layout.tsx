import Link from 'next/link';

export default function GalleryLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {/* Header section with duplicated "Lookbook" title removed */}
      <div>{children}</div>
      <footer>{/* Your footer content */}</footer>
    </>
  );
} 