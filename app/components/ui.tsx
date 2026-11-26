/**
 * Componentes visuales reutilizables del sistema "Glass UI".
 * Los estilos base (colores, vidrio, sombras, animaciones) viven en
 * app/globals.css; aquí solo se arman las piezas.
 */
import Link from 'next/link';
import type { LucideIcon, LucideProps } from 'lucide-react';

/* ------------------------------------------------------------------ */
/* Iconos propios de la bloquera (mismo trazo que lucide)              */
/* ------------------------------------------------------------------ */

type IconProps = Omit<LucideProps, 'ref'>;
type Icono = LucideIcon | ((p: IconProps) => React.ReactElement);

function svgProps({ size = 24, strokeWidth = 1.75, className = '', ...rest }: IconProps) {
  return {
    xmlns: 'http://www.w3.org/2000/svg',
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
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
      <rect x="2.5" y="14" width="9" height="6" rx="1" />
      <rect x="12.5" y="14" width="9" height="6" rx="1" />
      <rect x="7.5" y="7" width="9" height="6" rx="1" />
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
            className="block w-[9px] rounded-[3px] bg-linear-to-b from-[#ffb066] to-[#e0631c] shadow-[0_4px_10px_-3px_rgba(242,118,43,.6)]"
            style={{
              height: `${8 + i * 4}px`,
              animation: `block-drop 1.2s cubic-bezier(.2,.8,.2,1) ${i * 0.15}s infinite`,
            }}
          />
        ))}
      </span>
      <span className="text-sm">{texto}</span>
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
  icono?: Icono;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-8">
      <div className="flex items-center gap-4">
        {Icono && (
          <span className="icon-plate icon-plate-accent w-12 h-12 rounded-2xl">
            <Icono size={22} strokeWidth={1.9} />
          </span>
        )}
        <div>
          <p className="text-xs font-semibold text-safety-deep mb-1">{etiqueta}</p>
          <h1 className="font-display text-3xl sm:text-[2.1rem] text-ink leading-none">{titulo}</h1>
        </div>
      </div>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Panel de vidrio con encabezado                                       */
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
  icono?: Icono;
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
            <span className="icon-plate w-8 h-8 rounded-xl">
              <Icono size={16} strokeWidth={1.9} />
            </span>
          )}
          <h3 className="font-display text-base text-ink truncate">{titulo}</h3>
        </div>
        {accion && (
          <Link
            href={accion.href}
            className="text-xs font-semibold text-muted hover:text-safety-deep transition-colors whitespace-nowrap px-3 py-1.5 rounded-full hover:bg-white/60"
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
/* Mini gráfica de línea (sparkline)                                    */
/* ------------------------------------------------------------------ */

export function MiniGrafica({ serie, color = '#f28c28', className = '' }: { serie: number[]; color?: string; className?: string }) {
  if (serie.length < 2) return null;
  const w = 100;
  const h = 32;
  const max = Math.max(...serie);
  const min = Math.min(...serie);
  const rango = max - min || 1;
  const pts = serie.map((v, i) => [(i / (serie.length - 1)) * w, h - 3 - ((v - min) / rango) * (h - 6)] as const);
  const linea = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const id = `mg-${color.replace('#', '')}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${linea} L${w},${h} L0,${h} Z`} fill={`url(#${id})`} />
      <path d={linea} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Anillo de progreso                                                   */
/* ------------------------------------------------------------------ */

export function AnilloProgreso({
  porcentaje,
  tamano = 120,
  grosor = 10,
  claro = false,
  children,
}: {
  porcentaje: number;
  tamano?: number;
  grosor?: number;
  /** true sobre fondos de color (anillo blanco) */
  claro?: boolean;
  children?: React.ReactNode;
}) {
  const p = Math.max(0, Math.min(100, porcentaje || 0));
  const r = (tamano - grosor) / 2;
  const largo = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: tamano, height: tamano }}>
      <svg width={tamano} height={tamano} className="-rotate-90">
        <circle cx={tamano / 2} cy={tamano / 2} r={r} fill="none" strokeWidth={grosor} stroke={claro ? 'rgba(255,255,255,.28)' : 'rgba(31,35,40,.08)'} />
        <circle
          cx={tamano / 2}
          cy={tamano / 2}
          r={r}
          fill="none"
          strokeWidth={grosor}
          strokeLinecap="round"
          stroke={claro ? '#fff' : '#f28c28'}
          strokeDasharray={largo}
          strokeDashoffset={largo * (1 - p / 100)}
          style={{
            transition: 'stroke-dashoffset 1.2s cubic-bezier(.2,.8,.2,1)',
            filter: claro ? 'drop-shadow(0 0 6px rgba(255,255,255,.7))' : 'drop-shadow(0 0 6px rgba(242,140,40,.5))',
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Tarjeta de indicador (vidrio)                                        */
/* ------------------------------------------------------------------ */

const TONOS = {
  safety: { icono: 'text-safety-deep', chip: 'badge-progress', linea: '#f28c28', barra: 'bg-safety' },
  machine: { icono: 'text-[#a3760a]', chip: 'badge-pending', linea: '#e5b43c', barra: 'bg-machine' },
  ok: { icono: 'text-ok-deep', chip: 'badge-ok', linea: '#2f9e6a', barra: 'bg-ok' },
  alert: { icono: 'text-alert-deep', chip: 'badge-alert', linea: '#e0574f', barra: 'bg-alert' },
  steel: { icono: 'text-ink-soft', chip: 'badge-neutral', linea: '#5f6670', barra: 'bg-concrete-dark' },
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
  serie,
  chip,
  retraso = 0,
}: {
  etiqueta: string;
  valor: string;
  detalle?: string;
  icono: Icono;
  tono?: TonoConsola;
  href?: string;
  /** 0–100: muestra una barra de nivel debajo del valor */
  progreso?: number;
  /** valores para la mini gráfica */
  serie?: number[];
  /** etiqueta corta arriba a la derecha (ej. "Hoy") */
  chip?: string;
  retraso?: number;
}) {
  const t = TONOS[tono];
  const contenido = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span className={`icon-plate w-10 h-10 rounded-full ${t.icono}`}>
          <Icono size={18} strokeWidth={1.9} />
        </span>
        {chip && <span className={`badge ${t.chip}`}>{chip}</span>}
      </div>
      <div className="mt-4 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display text-[1.75rem] leading-none text-ink tabular-nums truncate">{valor}</p>
          <p className="text-sm font-medium text-muted mt-1.5">{etiqueta}</p>
        </div>
        {serie && serie.length > 1 && <MiniGrafica serie={serie} color={t.linea} className="w-24 h-9 shrink-0" />}
      </div>
      {progreso !== undefined && (
        <div className="mt-3 progress-track h-1.5">
          <div className={`progress-fill ${t.barra}`} style={{ width: `${Math.max(0, Math.min(100, progreso))}%` }} />
        </div>
      )}
      {detalle && <p className="text-xs text-faint mt-2 truncate">{detalle}</p>}
    </>
  );

  const clase =
    'group relative block glass rounded-[20px] p-5 animate-[rise-in_.5s_cubic-bezier(.2,.8,.2,1)_backwards] ' +
    'transition-[transform,box-shadow,background] duration-300 hover:-translate-y-1 hover:bg-white/80 hover:shadow-[var(--shadow-2)]';
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
