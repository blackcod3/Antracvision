'use client';

import { ApiDocsExplorer } from '@/components/organisms/ApiDocsExplorer';

export default function ApiDocsPage() {
  return (
    <>
      <div className="mb-6 sm:mb-8">
        <h1 className="mb-2 text-balance text-2xl font-bold text-gray-900 sm:text-3xl">
          Documentación API
        </h1>
      </div>
      <ApiDocsExplorer />
    </>
  );
}
