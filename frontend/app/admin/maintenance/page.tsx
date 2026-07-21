'use client';

export default function MaintenancePage() {
  return (
    <>
      <div className="mb-6 sm:mb-8">
        <h1 className="mb-2 text-balance text-2xl font-bold text-gray-900 sm:text-3xl">
          Mantenimiento
        </h1>
        <p className="text-pretty text-sm text-gray-600 sm:text-base">
          Herramientas de soporte y administración del sistema
        </p>
      </div>

      <div className="rounded-2xl border border-black/[0.04] bg-white p-6 shadow-[0_1px_3px_rgba(16,24,40,0.06)] sm:p-8">
        <p className="text-sm text-gray-500">
          Próximamente: opciones de mantenimiento del sistema.
        </p>
      </div>
    </>
  );
}
