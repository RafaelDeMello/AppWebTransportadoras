'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Truck } from 'lucide-react';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push('/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <Truck className="h-16 w-16 text-blue-600 animate-pulse" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">TransApp</h1>
        <p className="text-gray-600">Carregando aplicação...</p>
      </div>
    </div>
  );
}
