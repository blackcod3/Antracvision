import Link from 'next/link';

/** Naranja estilizada (decoración SVG) para el banner CTA */
function OrangeIllustration({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 140 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id="orangeSkin" cx="45%" cy="40%" r="65%">
          <stop offset="0%" stopColor="#ffc24a" />
          <stop offset="45%" stopColor="#ff7515" />
          <stop offset="100%" stopColor="#d63500" />
        </radialGradient>
        <linearGradient id="leafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4ade80" />
          <stop offset="100%" stopColor="#166534" />
        </linearGradient>
      </defs>
      {/* Hoja */}
      <path
        d="M92 28c12-10 26-14 38-11-4 14-13 26-26 34-11 7-26 11-43 11 2-12 11-26 31-34Z"
        fill="url(#leafGrad)"
        opacity={0.9}
      />
      <path
        d="M96 34c8-8 17-13 26-13"
        stroke="#14532d"
        strokeWidth={1.2}
        strokeLinecap="round"
        opacity={0.35}
      />
      {/* Tallito */}
      <path
        d="M74 42c6-14 22-36 42-42"
        stroke="#78350f"
        strokeWidth={3.5}
        strokeLinecap="round"
      />
      {/* Cuerpo (cítrico) */}
      <circle cx="72" cy="78" r="46" fill="url(#orangeSkin)" />
      {/* Luz / relieve */}
      <ellipse cx="58" cy="64" rx="14" ry="22" fill="#fff" opacity={0.12} transform="rotate(-18 58 64)" />
      {/* Segmentos (marcas sutiles del fruto) */}
      {Array.from({ length: 10 }, (_, i) => {
        const rad = ((-90 + i * 36) * Math.PI) / 180;
        return (
          <line
            key={i}
            x1={72}
            y1={78}
            x2={72 + Math.cos(rad) * 43}
            y2={78 + Math.sin(rad) * 43}
            stroke="#9a3412"
            strokeWidth={1.1}
            strokeLinecap="round"
            opacity={0.35}
          />
        );
      })}
      <circle cx="72" cy="78" r="46" stroke="#7c2d12" strokeWidth={2} opacity={0.45} />
    </svg>
  );
}

export function ProtectionCtaSection() {
  return (
    <section className="w-full px-4 py-12 sm:px-6 sm:py-16 md:py-20 lg:px-10 xl:px-14">
      <div className="relative overflow-hidden rounded-3xl bg-[#0f291e] px-6 py-14 text-center sm:px-10 sm:py-16 md:py-20">
        {/* Ilustración de naranja (fruto) decorativa — esquina superior derecha, ligero halo */}
        <div
          className="pointer-events-none absolute -right-2 top-4 w-[8.5rem] select-none opacity-[0.42] drop-shadow-[0_0_32px_rgba(255,120,42,0.42)] sm:-right-1 sm:top-6 sm:w-[11rem] md:w-[13rem]"
          aria-hidden
        >
          {/* Halo suave detrás del fruto */}
          <div className="absolute left-1/2 top-[55%] h-[85%] w-[85%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#ff7a28]/24 blur-xl" />
          <OrangeIllustration className="relative h-auto w-full" />
        </div>

        <div className="relative z-[1] mx-auto flex max-w-3xl flex-col items-center">
          <h2 className="text-balance text-3xl font-bold text-white sm:text-4xl">
            Protege tu Producción
          </h2>
          <p className="mt-4 max-w-2xl text-pretty text-base leading-relaxed text-gray-300 sm:mt-5 sm:text-lg">
            La detección temprana puede evitar pérdidas en tu cosecha. Utiliza nuestro sistema de
            forma gratuita y mantén tus cultivos saludables.
          </p>
          <Link
            href="/detect"
            className="mt-8 inline-flex items-center justify-center rounded-lg bg-[#ff731a] px-6 py-3 text-base font-semibold text-white transition hover:bg-[#ff5900] active:bg-[#e34e00] sm:mt-10 sm:px-8 sm:py-3.5"
          >
            <span aria-hidden className="mr-2">
              🚀
            </span>
            Comenzar Detección
          </Link>
        </div>
      </div>
    </section>
  );
}
