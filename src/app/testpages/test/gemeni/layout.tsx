export default function GemeniTestLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="mb-4 p-4">
        <a href="/testpages/test" className="text-blue-500 hover:text-blue-700">
          ← Back to Test Pages
        </a>
      </div>
      {children}
    </div>
  );
} 