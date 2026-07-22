'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MaintenancePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/maintenance/users');
  }, [router]);

  return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-b-2 border-green-600" />
        <p className="text-sm text-gray-600">Cargando mantenimiento…</p>
      </div>
    </div>
  );
}
