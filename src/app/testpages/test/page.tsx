import Link from 'next/link';

export default function TestPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Test Pages</h1>
      
      <ul className="space-y-2">
        <li>
          <Link 
            href="/testpages/test/gallery" 
            className="text-blue-500 hover:text-blue-700 underline"
          >
            Gallery Masonry Grid Test
          </Link>
        </li>
        <li>
          <Link 
            href="/testpages/test/gemeni" 
            className="text-blue-500 hover:text-blue-700 underline"
          >
            ElevenLabs Convai Widget Test
          </Link>
        </li>
      </ul>
    </div>
  );
} 