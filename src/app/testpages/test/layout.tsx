export default function TestLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="container mx-auto p-4">
      <div className="mb-4">
        <a href="/testpages" className="text-blue-500 hover:text-blue-700">
          ← Back to Test Pages
        </a>
      </div>
      {children}
    </div>
  );
} 