/**
 * Componentes visuales reutilizables del sistema "Industrial Concrete UI".
 * Los estilos base (colores, texturas, sombras, animaciones) viven en
 * app/globals.css; aquí solo se arman las piezas.
 */
import Link from 'next/link';
import type { LucideIcon, LucideProps } from 'lucide-react';

/* ------------------------------------------------------------------ */
/* Iconos propios de la bloquera (mismo trazo que lucide)              */
/* ------------------------------------------------------------------ */

type IconProps = Omit<LucideProps, 'ref'>;

function svgProps({ size = 24, strokeWidth = 1.75, className = '', ...rest }: IconProps) {
  return {
    xmlns: 'http://www.w3.org/2000/svg',
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth,
    className: `lucide ${className}`,
    'aria-hidden': true,
    ...rest,
  };
}

/** Bloque de concreto hueco (vista isométrica). */
export function IconoBloque(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <path d="M2.5 9 12 4.5 21.5 9v7L12 20.5 2.5 16z" />
      <path d="M2.5 9 12 13.5 21.5 9" />
      <path d="M12 13.5v7" />
      <path d="M6.2 9.4 9.6 7.8l2.6 1.2-3.4 1.6z" />
      <path d="M12.4 9.6l3.4-1.6 2.6 1.2-3.4 1.6z" />
    </svg>
  );
}

/** Pila de bloques (producción / total fabricado). */
export function IconoPilaBloques(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <rect x="2.5" y="14" width="9" height="6" />
      <rect x="12.5" y="14" width="9" height="6" />
      <rect x="7.5" y="7" width="9" height="6" />
      <path d="M5 17h4M15 17h4M10 10h4" />
    </svg>
  );
}

/** Saco de cemento. */
export function IconoCemento(props: IconProps) {
  return (
    <svg {...svgProps(props)}>
      <path d="M6 3.5h12l1.5 3-1 13.5h-13L4.5 6.5z" />
      <path d="M4.5 6.5h15" />
      <path d="M9 11h6M9 14.5h6" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Indicador de carga: bloques que se apilan                            */
/* ------------------------------------------------------------------ */

export function Cargando({ texto = 'Cargando...' }: { texto?: string }) {
  return (
    <span className="inline-flex items-center gap-3 text-muted" role="status">
      <span className="relative inline-flex items-end gap-[3px] h-5" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="block w-[9px] rounded-[1.5px] bg-linear-to-b from-cement to-concrete-dark shadow-[inset_0_1px_0_rgba(255,255,255,.35)]"
            style={{
              height: `${8 + i * 4}px`,
              animation: `block-drop 1.2s cubic-bezier(.2,.8,.2,1) ${i * 0.15}s infinite`,
            }}
          />
        ))}
      </span>
      <span className="text-sm tracking-wide">{texto}</span>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Encabezado de pantalla                                              */
/* ------------------------------------------------------------------ */

export function EncabezadoPagina({
  etiqueta,
  titulo,
  icono: Icono,
  children,
}: {
  etiqueta: string;
  titulo: string;
  icono?: LucideIcon | ((p: IconProps) => React.ReactElement);
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-8">
      <div className="flex items-center gap-4">
        {Icono && (
          <span className="icon-plate w-12 h-12">
            <Icono size={24} strokeWidth={1.75} />
          </span>
        )}
        <div>
          <p className="text-[11px] font-semibold text-safety-deep uppercase tracking-[0.2em] mb-0.5">{etiqueta}</p>
          <h1 className="font-display text-3xl sm:text-4xl text-ink leading-none">{titulo}</h1>
        </div>
      </div>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Panel con encabezado de placa metálica                              */
/* ------------------------------------------------------------------ */

export function Panel({
  titulo,
  icono: Icono,
  accion,
  children,
  className = '',
  cuerpo = 'p-5 sm:p-6',
}: {
  titulo: string;
  icono?: LucideIcon | ((p: IconProps) => React.ReactElement);
  accion?: { href: string; texto: string };
  children: React.ReactNode;
  className?: string;
  cuerpo?: string;
}) {
  return (
    <section className={`panel ${className}`}>
      <header className="panel-header">
        <div className="flex items-center gap-2.5 min-w-0">
          {Icono && (
            <span className="icon-plate w-7 h-7 rounded-[5px]">
              <Icono size={15} strokeWidth={1.9} />
            </span>
          )}
          <h3 className="font-display text-lg text-ink truncate">{titulo}</h3>
        </div>
        {accion && (
          <Link
            href={accion.href}
            className="text-[11px] font-semibold text-muted hover:text-safety-deep uppercase tracking-[0.12em] transition-colors whitespace-nowrap"
          >
            {accion.texto} →
          </Link>
        )}
      </header>
      <div className={cuerpo}>{children}</div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Indicador de consola (tarjeta de panel de control de la fábrica)   */
/* ------------------------------------------------------------------ */

const TONOS = {
  safety: { led: 'bg-safety', glow: 'shadow-[0_0_10px_#f28c28]', valor: 'text-[#ffb25e]' },
  machine: { led: 'bg-machine', glow: 'shadow-[0_0_10px_#e5b43c]', valor: 'text-[#f3cf6d]' },
  ok: { led: 'bg-ok', glow: 'shadow-[0_0_10px_#36966a]', valor: 'text-[#6fd3a2]' },
  alert: { led: 'bg-alert', glow: 'shadow-[0_0_10px_#d9534f]', valor: 'text-[#ff8a85]' },
  steel: { led: 'bg-cement', glow: 'shadow-[0_0_8px_#858b8d]', valor: 'text-[#f1f0eb]' },
} as const;

export type TonoConsola = keyof typeof TONOS;

export function IndicadorConsola({
  etiqueta,
  valor,
  detalle,
  icono: Icono,
  tono = 'steel',
  href,
  progreso,
  retraso = 0,
}: {
  etiqueta: string;
  valor: string;
  detalle?: string;
  icono: LucideIcon | ((p: IconProps) => React.ReactElement);
  tono?: TonoConsola;
  href?: string;
  /** 0–100: muestra una barra de nivel debajo del valor */
  progreso?: number;
  retraso?: number;
}) {
  const t = TONOS[tono];
  const contenido = (
    <>
      {/* tornillos */}
      <span className="absolute top-2 left-2 w-1.5 h-1.5 rounded-full bg-[radial-gradient(circle_at_35%_35%,#9aa0a2,#2c3336)]" />
      <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-[radial-gradient(circle_at_35%_35%,#9aa0a2,#2c3336)]" />
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`w-2 h-2 rounded-full shrink-0 ${t.led} ${t.glow} animate-[led-pulse_2.4s_ease-in-out_infinite]`} />
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#aeb3b3] truncate">{etiqueta}</span>
        </div>
        <span className="icon-plate w-9 h-9 bg-none! bg-[#0f1213]! border-[#3a4245]!">
          <Icono size={18} strokeWidth={1.75} />
        </span>
      </div>
      <p className={`font-display text-[2rem] leading-none mt-3 tabular-nums ${t.valor}`}>{valor}</p>
      {progreso !== undefined && (
        <div className="mt-3 h-1.5 rounded-full bg-[#0c0f10] shadow-[inset_0_1px_2px_rgba(0,0,0,.6)] overflow-hidden">
          <div className={`progress-fill ${t.led}`} style={{ width: `${Math.max(0, Math.min(100, progreso))}%` }} />
        </div>
      )}
      {detalle && <p className="text-xs text-[#8f9596] mt-2 truncate">{detalle}</p>}
    </>
  );

  const clase =
    'group relative block steel-surface rounded-[10px] border border-[#0b0d0e] p-5 pt-6 overflow-hidden ' +
    'shadow-[inset_0_1px_0_rgba(255,255,255,.08),0_10px_24px_-12px_rgba(10,12,13,.7)] ' +
    'animate-[rise-in_.45s_cubic-bezier(.2,.8,.2,1)_backwards] transition-[transform,box-shadow] duration-200 ' +
    'hover:-translate-y-0.5 hover:shadow-[inset_0_1px_0_rgba(255,255,255,.1),0_0_0_1px_rgba(242,140,40,.35),0_16px_30px_-12px_rgba(10,12,13,.8)]';

  const estilo = { animationDelay: `${retraso}s` };

  return href ? (
    <Link href={href} className={clase} style={estilo}>
      {contenido}
    </Link>
  ) : (
    <div className={clase} style={estilo}>
      {contenido}
    </div>
  );
}
