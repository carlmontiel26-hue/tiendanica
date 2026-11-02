'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const DEFAULT_STORE = 'ileana-closed';

export default function AppPage() {
  const router = useRouter();
  useEffect(() => {
    const last = localStorage.getItem('last_tenant');
    if (last) {
      router.replace(`/app/${last}`);
    } else {
      localStorage.setItem('last_tenant', DEFAULT_STORE);
      router.replace(`/app/${DEFAULT_STORE}`);
    }
  }, [router]);
  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="font-black">Cargando TN Sistemas...</p>
    </div>
  );
}
