"use client";

/* ============================================================================
   FERRAMENTAS INTERATIVAS E DIAGRAMAS
   ============================================================================
   1. MirrorSimulator      — espelho esférico (côncavo/convexo)
   2. RefractionSimulator  — refração entre dois meios
   3. DrawingBoard         — prancheta com tarefa, conferência e modelo
   4. Diagram              — desenhos fixos dos capítulos (com geometria real)

   Toda conta vem de src/optics.ts (testado à parte). Aqui só se desenha.
   ============================================================================ */

import { useId, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { Check, Eraser, Eye, EyeOff, Redo2, Undo2, X as XIcon } from "lucide-react";
import { cn, type DiagramName } from "@/content";
import { MathExpr, MathText } from "./ui";
import {
  CASE_INFO,
  concaveCase,
  deg,
  fmt,
  fmtInt,
  fmtTex,
  imageRegion,
  imageTraits,
  notableRay,
  planeImage,
  rad,
  reflectedHeight,
  refract,
  sphericalImage,
  type ImageTraits,
  type NotableRay,
  type RayId,
} from "@/optics";

/* ──────────────────────────────
   Peças de desenho
   ────────────────────────────── */

type P = { x: number; y: number };
const W = 720;
const H = 340;
const AX = 170;

const INK = "var(--color-ink-faint)";
const INK2 = "var(--color-ink-soft)";
const BRAND = "var(--color-brand)";
const ACCENT = "var(--color-accent)";
const ERR = "var(--color-error)";
const RAY_COLOR: Record<RayId, string> = { 1: "#1f7a8c", 2: "#b4541f", 3: "#6b4fa3", 4: "#2f7d5e" };

const dist = (a: P, b: P) => Math.hypot(a.x - b.x, a.y - b.y);
const pt = (c: P, r: number, aDeg: number): P => ({ x: c.x + r * Math.cos(rad(aDeg)), y: c.y + r * Math.sin(rad(aDeg)) });

function distToSeg(p: P, a: P, b: P) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const L = dx * dx + dy * dy;
  if (L === 0) return dist(p, a);
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / L));
  return dist(p, { x: a.x + t * dx, y: a.y + t * dy });
}

/** Ponta de seta no ponto a fração `t` do segmento, apontando de a para b. */
function headPath(a: P, b: P, t = 0.6, size = 9) {
  const x = a.x + (b.x - a.x) * t;
  const y = a.y + (b.y - a.y) * t;
  const ang = Math.atan2(b.y - a.y, b.x - a.x);
  const p1 = pt({ x, y }, size, deg(ang) + 151);
  const p2 = pt({ x, y }, size, deg(ang) - 151);
  return `M ${p1.x} ${p1.y} L ${x} ${y} L ${p2.x} ${p2.y}`;
}

function Seg({
  a,
  b,
  color,
  dashed = false,
  width = 2.2,
  arrow,
  opacity = 1,
}: {
  a: P;
  b: P;
  color: string;
  dashed?: boolean;
  width?: number;
  arrow?: number;
  opacity?: number;
}) {
  return (
    <g opacity={opacity}>
      <line
        x1={a.x}
        y1={a.y}
        x2={b.x}
        y2={b.y}
        stroke={color}
        strokeWidth={width}
        strokeDasharray={dashed ? "6 5" : undefined}
        strokeLinecap="round"
      />
      {arrow !== undefined ? (
        <path d={headPath(a, b, arrow)} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />
      ) : null}
    </g>
  );
}

/** Seta vertical (objeto/imagem) com a base em `base` e a ponta em `tip`. */
function VArrow({ x, base, tip, color, dashed = false }: { x: number; base: number; tip: number; color: string; dashed?: boolean }) {
  const d = tip < base ? 9 : -9;
  return (
    <g>
      <line x1={x} y1={base} x2={x} y2={tip} stroke={color} strokeWidth={3} strokeDasharray={dashed ? "5 4" : undefined} />
      <path
        d={`M ${x - 5} ${tip + d} L ${x} ${tip} L ${x + 5} ${tip + d}`}
        fill="none"
        stroke={color}
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  );
}

function Txt({
  x,
  y,
  children,
  color = INK2,
  anchor = "middle",
  size = 13,
  bold = false,
}: {
  x: number;
  y: number;
  children: ReactNode;
  color?: string;
  anchor?: "start" | "middle" | "end";
  size?: number;
  bold?: boolean;
}) {
  return (
    <text x={x} y={y} textAnchor={anchor} fontSize={size} fill={color} fontWeight={bold ? 600 : 400}>
      {children}
    </text>
  );
}

function Tick({ x, label, color = INK2, dx = 0 }: { x: number; label: string; color?: string; dx?: number }) {
  return (
    <g>
      <line x1={x} y1={AX - 6} x2={x} y2={AX + 6} stroke={color} strokeWidth={2} />
      <Txt x={x + dx} y={AX + 22} color={color} bold>
        {label}
      </Txt>
    </g>
  );
}

/** Tracinhos que indicam o lado de trás (não refletor) de um espelho reto. */
function Hatch({ a, b, off, step = 14 }: { a: P; b: P; off: P; step?: number }) {
  const n = Math.floor(dist(a, b) / step);
  return (
    <g stroke={INK} strokeWidth={1.4}>
      {Array.from({ length: n + 1 }, (_, i) => {
        const t = n === 0 ? 0 : i / n;
        const q = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
        return <line key={i} x1={q.x} y1={q.y} x2={q.x + off.x} y2={q.y + off.y} />;
      })}
    </g>
  );
}

/** Arco de ângulo (graus de tela: 0 = direita, 90 = baixo, −90 = cima). */
function arcPath(c: P, r: number, a0: number, a1: number) {
  const p0 = pt(c, r, a0);
  const p1 = pt(c, r, a1);
  return `M ${p0.x} ${p0.y} A ${r} ${r} 0 0 ${a1 > a0 ? 1 : 0} ${p1.x} ${p1.y}`;
}

function Arc({ c, r, a0, a1, color = INK2, label }: { c: P; r: number; a0: number; a1: number; color?: string; label?: string }) {
  const m = pt(c, r + 16, (a0 + a1) / 2);
  return (
    <g>
      <path d={arcPath(c, r, a0, a1)} fill="none" stroke={color} strokeWidth={1.6} />
      {label ? (
        <Txt x={m.x} y={m.y + 4} color={color} size={13} bold>
          {label}
        </Txt>
      ) : null}
    </g>
  );
}

function Eyeball({ c, flip = false, dashed = false }: { c: P; flip?: boolean; dashed?: boolean }) {
  const s = flip ? -1 : 1;
  return (
    <g stroke={INK2} strokeWidth={1.6} fill="none" strokeDasharray={dashed ? "3 3" : undefined}>
      <path d={`M ${c.x - 13 * s} ${c.y} Q ${c.x} ${c.y - 10} ${c.x + 13 * s} ${c.y} Q ${c.x} ${c.y + 10} ${c.x - 13 * s} ${c.y}`} />
      <circle cx={c.x + 3 * s} cy={c.y} r={3.5} fill={dashed ? "none" : INK2} />
    </g>
  );
}

function Panel({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mt-5 rounded-card border border-border bg-surface p-4 sm:p-5">
      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-ink-faint">{label}</p>
      {children}
    </div>
  );
}

function Toggle({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-control border px-3 py-2 text-sm font-medium transition-colors",
        on ? "border-brand bg-brand text-brand-contrast" : "border-border text-ink-soft hover:border-border-strong",
      )}
    >
      {children}
    </button>
  );
}

/* ════════════════════════════════════════════════════════════
   1. SIMULADOR DE ESPELHO ESFÉRICO
   ════════════════════════════════════════════════════════════ */

const VX = 480;
const LEFT = 16;
const RIGHT = 708;
const HALF = 140; // meia-altura do espelho desenhado (px)
const F_ABS = 20; // |f| em cm (R = 40 cm)
const H_O = 8; // altura do objeto em cm

const PRESETS: { c: 1 | 2 | 3 | 4 | 5; dO: number }[] = [
  { c: 1, dO: 50 },
  { c: 2, dO: 40 },
  { c: 3, dO: 30 },
  { c: 4, dO: 20 },
  { c: 5, dO: 12 },
];

const RAY_NAME: Record<RayId, string> = { 1: "Paralelo", 2: "Pelo foco", 3: "Pelo centro", 4: "No vértice" };

function rayRule(id: RayId, concave: boolean) {
  if (id === 1)
    return concave ? "chega paralelo ao eixo e reflete passando por F." : "chega paralelo ao eixo e reflete como se viesse de F (atrás).";
  if (id === 2)
    return concave ? "passa por F e reflete paralelo ao eixo." : "chega apontando para F (atrás) e reflete paralelo ao eixo.";
  if (id === 3) return concave ? "segue a direção de C e volta sobre si mesmo." : "chega apontando para C (atrás) e volta sobre si mesmo.";
  return "bate em V e reflete simétrico ao eixo (i = r).";
}

type Guess = { nature?: ImageTraits["nature"]; orientation?: "direita" | "invertida"; size?: "maior" | "igual" | "menor" };

export function MirrorSimulator() {
  const clip = `m${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const [concave, setConcave] = useState(true);
  const [dO, setDO] = useState(30);
  const [rays, setRays] = useState<Record<RayId, boolean>>({ 1: true, 2: true, 3: false, 4: false });
  const [predict, setPredict] = useState(false);
  const [guess, setGuess] = useState<Guess>({});
  const [checked, setChecked] = useState(false);

  // Qualquer mudança no cenário reinicia a previsão (sem useEffect).
  const resetPrediction = () => {
    setGuess({});
    setChecked(false);
  };
  const changeDO = (v: number) => {
    setDO(v);
    resetPrediction();
  };
  const changeType = (c: boolean) => {
    setConcave(c);
    resetPrediction();
  };

  const f = concave ? F_ABS : -F_ABS;
  const img = sphericalImage(dO, f, H_O);
  const traits = imageTraits(img);
  const caseN = concave ? concaveCase(dO, f) : null;
  const region = imageRegion(img.di, f);
  const reveal = !predict || checked;

  // Escala ÚNICA nos dois eixos: o desenho é uma figura semelhante à
  // situação real, então ângulos e proporções são preservados.
  const front = Math.max(dO, concave ? 2 * F_ABS : 0, !img.atInfinity && img.di > 0 ? img.di : 0);
  const behind = Math.max(concave ? 0 : 2 * F_ABS, !img.atInfinity && img.di < 0 ? -img.di : 0);
  const tall = Math.max(H_O, img.atInfinity ? 0 : Math.abs(img.hi));
  const kIdeal = Math.min((VX - LEFT - 30) / front, behind > 0 ? (RIGHT - VX - 30) / behind : Infinity, (HALF - 12) / tall);
  const K_MIN = 2.2;
  const k = Math.max(K_MIN, Math.min(kIdeal, 9));
  const outOfView = kIdeal < K_MIN;

  const X = (s: number) => VX - k * s;
  const Y = (h: number) => AX - k * h;
  const tip: P = { x: X(dO), y: Y(H_O) };
  const sEdge = (VX - LEFT) / k;

  const notes: string[] = [];
  const drawn: { r: NotableRay; M: P }[] = [];
  ([1, 2, 3, 4] as RayId[]).forEach((id) => {
    if (!rays[id]) return;
    const r = notableRay(id, dO, H_O, f);
    if (!r) notes.push(`Raio ${RAY_NAME[id].toLowerCase()}: nesta posição ele seria vertical e não chega ao espelho.`);
    else if (Math.abs(r.hit * k) > HALF) notes.push(`Raio ${RAY_NAME[id].toLowerCase()}: bateria fora da parte desenhada do espelho.`);
    else drawn.push({ r, M: { x: VX, y: Y(r.hit) } });
  });

  // ponto x da curva do espelho em cada altura (só para os tracinhos)
  const sag = 8;
  const curveX = (t: number) => {
    const x0 = concave ? VX - sag : VX + sag;
    const xc = concave ? VX + sag : VX - sag;
    return x0 + 2 * t * (1 - t) * (xc - x0);
  };

  const traitsText = (t: ImageTraits) =>
    t.nature === "impropria"
      ? "Os raios refletidos saem paralelos e nunca se cruzam: não se forma imagem (imagem imprópria, “no infinito”)."
      : `Imagem ${t.nature}, ${t.orientation} e ${t.size === "igual" ? "do mesmo tamanho" : t.size} que o objeto.`;

  const steps = img.atInfinity
    ? [`d_o = f \\;\\Rightarrow\\; \\dfrac{1}{d_i} = \\dfrac{1}{f} - \\dfrac{1}{d_o} = 0 \\;\\Rightarrow\\; \\text{imagem no infinito}`]
    : [
        `\\dfrac{1}{d_i} = \\dfrac{1}{f} - \\dfrac{1}{d_o} = \\dfrac{1}{${fmtTex(f)}} - \\dfrac{1}{${fmtTex(dO)}}`,
        `d_i = \\dfrac{d_o \\cdot f}{d_o - f} = \\dfrac{${fmtTex(dO)} \\cdot (${fmtTex(f)})}{${fmtTex(dO)} - (${fmtTex(f)})} \\approx ${fmtTex(img.di)}\\ \\text{cm}`,
        `A = -\\dfrac{d_i}{d_o} \\approx ${fmtTex(img.A)} \\qquad h_i = A \\cdot h_o \\approx ${fmtTex(img.hi)}\\ \\text{cm}`,
      ];

  const canCheck = guess.nature === "impropria" || (guess.nature && guess.orientation && guess.size);
  const verdict = {
    nature: guess.nature === traits.nature,
    orientation: traits.nature === "impropria" || guess.orientation === traits.orientation,
    size: traits.nature === "impropria" || guess.size === traits.size,
  };

  return (
    <Panel label="Simulador · espelho esférico">
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Toggle on={concave} onClick={() => changeType(true)}>
          Côncavo
        </Toggle>
        <Toggle on={!concave} onClick={() => changeType(false)}>
          Convexo
        </Toggle>
        <span className="text-xs text-ink-faint">
          R = {2 * F_ABS} cm · f = {fmt(f)} cm · objeto de {H_O} cm
        </span>
      </div>

      {concave ? (
        <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label="Ir para um dos cinco casos">
          {PRESETS.map((p) => (
            <button
              key={p.c}
              type="button"
              onClick={() => changeDO(p.dO)}
              aria-pressed={dO === p.dO}
              className={cn(
                "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                dO === p.dO ? "border-accent bg-accent-soft text-accent" : "border-border text-ink-soft hover:border-border-strong",
              )}
            >
              Caso {p.c} · {CASE_INFO[p.c].objeto}
            </button>
          ))}
        </div>
      ) : null}

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="mt-3 h-auto w-full rounded-control bg-bg"
        role="img"
        aria-label={
          reveal
            ? `Objeto a ${fmt(dO)} cm de um espelho ${concave ? "côncavo" : "convexo"}. ${traitsText(traits)}`
            : "Modo previsão: a imagem está oculta."
        }
      >
        <defs>
          <clipPath id={clip}>
            <rect x={0} y={0} width={W} height={H} />
          </clipPath>
        </defs>
        <g clipPath={`url(#${clip})`}>
          <line x1={LEFT} y1={AX} x2={RIGHT} y2={AX} stroke={INK} strokeWidth={1.4} />
          <Txt x={RIGHT - 4} y={AX - 8} anchor="end" color={INK} size={11}>
            eixo principal
          </Txt>

          {/* espelho + lado de trás */}
          <path
            d={`M ${curveX(0)} ${AX - HALF} Q ${concave ? VX + sag : VX - sag} ${AX} ${curveX(1)} ${AX + HALF}`}
            fill="none"
            stroke={BRAND}
            strokeWidth={3.5}
            strokeLinecap="round"
          />
          <g stroke={INK} strokeWidth={1.3}>
            {Array.from({ length: 21 }, (_, i) => {
              const t = i / 20;
              const y = AX - HALF + 2 * HALF * t;
              const x = curveX(t);
              return <line key={i} x1={x + 2} y1={y} x2={x + 10} y2={y - 7} />;
            })}
          </g>

          <Tick x={X(0)} label="V" dx={-16} />
          <Tick x={X(f)} label="F" color={BRAND} />
          <Tick x={X(2 * f)} label="C" color={BRAND} />

          {/* objeto */}
          <VArrow x={tip.x} base={AX} tip={tip.y} color={INK2} />
          <Txt x={tip.x} y={AX + 40} size={12}>
            objeto
          </Txt>

          {/* raios */}
          {drawn.map(({ r, M }) => {
            const c = RAY_COLOR[r.id];
            const end: P = { x: X(sEdge), y: Y(reflectedHeight(r, sEdge)) };
            const els: ReactNode[] = [<Seg key="in" a={tip} b={M} color={c} arrow={0.55} />];
            if (r.aim) {
              const aimP: P = { x: X(r.aim[0]), y: Y(r.aim[1]) };
              if (!concave) els.push(<Seg key="aim" a={M} b={aimP} color={c} dashed width={1.6} />);
              else if (r.aim[0] > dO) els.push(<Seg key="aim" a={aimP} b={tip} color={c} dashed width={1.6} />);
            }
            if (reveal) {
              els.push(<Seg key="out" a={M} b={end} color={c} arrow={0.45} />);
              if (!img.atInfinity && img.di < 0) {
                const sBack = !concave && r.id === 1 ? Math.min(img.di, f) : img.di;
                els.push(<Seg key="back" a={M} b={{ x: X(sBack), y: Y(reflectedHeight(r, sBack)) }} color={c} dashed width={1.6} />);
              }
            }
            return <g key={r.id}>{els}</g>;
          })}

          {/* imagem */}
          {reveal && !img.atInfinity ? (
            <g>
              <VArrow x={X(img.di)} base={AX} tip={Y(img.hi)} color={ACCENT} dashed={img.di < 0} />
              <Txt x={X(img.di)} y={img.hi > 0 ? AX + 40 : AX - 12} color={ACCENT} size={12}>
                imagem
              </Txt>
            </g>
          ) : null}
        </g>
      </svg>

      {reveal && outOfView ? (
        <p className="mt-2 rounded-control bg-warning-soft px-3 py-2 text-sm text-warning">
          Com o objeto tão perto do foco a imagem fica muito longe ou muito grande para caber no desenho. Os números abaixo continuam
          exatos.
        </p>
      ) : null}
      {notes.map((n) => (
        <p key={n} className="mt-2 text-xs text-ink-faint">
          {n}
        </p>
      ))}

      <div className="mt-4">
        <label htmlFor={`${clip}-d`} className="block text-sm font-medium text-ink">
          Distância do objeto ao espelho: d<sub>o</sub> = {fmt(dO)} cm
        </label>
        <input
          id={`${clip}-d`}
          type="range"
          min={4}
          max={70}
          step={1}
          value={dO}
          onChange={(e) => changeDO(Number(e.target.value))}
          className="mt-2 w-full accent-[var(--color-brand)]"
        />
      </div>

      <div className="mt-4">
        <p className="text-xs font-medium text-ink-soft">Raios notáveis</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {([1, 2, 3, 4] as RayId[]).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setRays((r) => ({ ...r, [id]: !r[id] }))}
              aria-pressed={rays[id]}
              title={rayRule(id, concave)}
              className={cn(
                "inline-flex items-center gap-2 rounded-control border px-3 py-2 text-sm transition-colors",
                rays[id] ? "border-border-strong bg-surface-muted text-ink" : "border-border text-ink-faint",
              )}
            >
              <span aria-hidden className="h-0.5 w-5 rounded" style={{ background: RAY_COLOR[id], opacity: rays[id] ? 1 : 0.35 }} />
              {RAY_NAME[id]}
            </button>
          ))}
        </div>
        <ul className="mt-2 space-y-0.5 text-xs text-ink-faint">
          {([1, 2, 3, 4] as RayId[])
            .filter((id) => rays[id])
            .map((id) => (
              <li key={id}>
                <span style={{ color: RAY_COLOR[id] }}>●</span> {RAY_NAME[id]}: {rayRule(id, concave)}
              </li>
            ))}
        </ul>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4">
        <Toggle
          on={predict}
          onClick={() => {
            setPredict((v) => !v);
            resetPrediction();
          }}
        >
          {predict ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
          Modo previsão
        </Toggle>
        <span className="text-xs text-ink-faint">Esconde a imagem para você prever antes de conferir.</span>
      </div>

      {predict && !checked ? (
        <div className="mt-3 space-y-3 rounded-control bg-surface-muted p-3">
          {(
            [
              ["nature", "Natureza", [["real", "Real"], ["virtual", "Virtual"], ["impropria", "Não se forma"]]],
              ["orientation", "Orientação", [["direita", "Direita"], ["invertida", "Invertida"]]],
              ["size", "Tamanho", [["maior", "Maior"], ["igual", "Igual"], ["menor", "Menor"]]],
            ] as const
          ).map(([key, label, opts]) =>
            key !== "nature" && guess.nature === "impropria" ? null : (
              <div key={key}>
                <p className="text-xs font-medium text-ink-soft">{label}</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {opts.map(([v, l]) => (
                    <Toggle key={v} on={guess[key] === v} onClick={() => setGuess((g) => ({ ...g, [key]: v }))}>
                      {l}
                    </Toggle>
                  ))}
                </div>
              </div>
            ),
          )}
          <button
            type="button"
            disabled={!canCheck}
            onClick={() => setChecked(true)}
            className="rounded-control bg-brand px-4 py-2 text-sm font-medium text-brand-contrast disabled:opacity-40"
          >
            Conferir previsão
          </button>
        </div>
      ) : null}

      {predict && checked ? (
        <ul className="mt-3 space-y-1 rounded-control bg-surface-muted p-3 text-sm">
          {(["nature", "orientation", "size"] as const)
            .filter((key) => key === "nature" || traits.nature !== "impropria")
            .map((key) => (
              <li key={key} className={cn("flex items-center gap-2", verdict[key] ? "text-success" : "text-error")}>
                {verdict[key] ? <Check className="h-4 w-4" aria-hidden /> : <XIcon className="h-4 w-4" aria-hidden />}
                {key === "nature" ? "Natureza" : key === "orientation" ? "Orientação" : "Tamanho"}:{" "}
                {verdict[key] ? "acertou" : "não é essa"}
              </li>
            ))}
        </ul>
      ) : null}

      {reveal ? (
        <div className="mt-4 space-y-3 border-t border-border pt-4">
          <p className="text-sm text-ink">
            <strong>{caseN ? `Caso ${caseN}: objeto ${CASE_INFO[caseN].objeto}` : "Espelho convexo"}</strong>
            {img.atInfinity ? "" : ` · imagem ${region}`}
          </p>
          <p className="text-sm text-ink-soft">{traitsText(traits)}</p>
          <div className="space-y-1.5 overflow-x-auto rounded-control bg-surface-muted px-3 py-2.5 text-[0.95rem]">
            {steps.map((s) => (
              <div key={s}>
                <MathExpr latex={s} />
              </div>
            ))}
          </div>
          <p className="text-xs leading-relaxed text-ink-faint">
            Modelo de Gauss (espelho de pequena abertura): os raios refletem na reta vertical que passa por V, e a curvatura do espelho foi
            desenhada só para indicar o tipo. O desenho mantém a mesma escala na horizontal e na vertical. Valores arredondados.
          </p>
        </div>
      ) : null}
    </Panel>
  );
}

/* ════════════════════════════════════════════════════════════
   2. SIMULADOR DE REFRAÇÃO
   ════════════════════════════════════════════════════════════ */

const MEIOS = [
  { nome: "Ar", n: 1.0 },
  { nome: "Água", n: 1.33 },
  { nome: "Vidro", n: 1.5 },
  { nome: "Diamante", n: 2.42 },
];

export function RefractionSimulator() {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const [m1, setM1] = useState(0);
  const [m2, setM2] = useState(2);
  const [i, setI] = useState(40);

  const n1 = MEIOS[m1].n;
  const n2 = MEIOS[m2].n;
  const R = refract(n1, n2, i);
  const O: P = { x: 360, y: AX };
  const Lr = 150;
  const start = pt(O, Lr, -90 - i);
  const reflected = pt(O, Lr, -90 + i);
  const refracted = R.r === null ? null : pt(O, Lr, 90 - R.r);

  return (
    <Panel label="Simulador · refração da luz">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="mt-3 h-auto w-full rounded-control"
        role="img"
        aria-label={
          R.tir
            ? `Reflexão total: com i = ${i}°, de ${MEIOS[m1].nome} para ${MEIOS[m2].nome}, a luz não atravessa.`
            : `Raio incidindo a ${i}° refrata a ${fmt(R.r ?? 0, 1)}°.`
        }
      >
        <rect x={0} y={0} width={W} height={AX} fill="var(--color-brand-soft)" opacity={0.45} />
        <rect x={0} y={AX} width={W} height={H - AX} fill="var(--color-surface-sunken)" />
        <line x1={0} y1={AX} x2={W} y2={AX} stroke="var(--color-border-strong)" strokeWidth={2.5} />
        <Txt x={16} y={26} anchor="start">
          meio 1: {MEIOS[m1].nome} (n₁ = {fmt(n1)})
        </Txt>
        <Txt x={16} y={H - 14} anchor="start">
          meio 2: {MEIOS[m2].nome} (n₂ = {fmt(n2)})
        </Txt>
        <Txt x={W - 16} y={AX - 8} anchor="end" size={11} color={INK}>
          superfície S
        </Txt>

        <line x1={O.x} y1={16} x2={O.x} y2={H - 16} stroke={INK} strokeWidth={1.5} strokeDasharray="6 5" />
        <Txt x={O.x + 8} y={30} anchor="start" size={12} color={INK}>
          N (normal)
        </Txt>

        <Seg a={start} b={O} color={BRAND} width={2.6} arrow={0.55} />
        <Arc c={O} r={46} a0={-90} a1={-90 - i} color={BRAND} label="i" />

        {R.tir ? (
          <Seg a={O} b={reflected} color={ERR} width={2.6} arrow={0.6} />
        ) : (
          <>
            <Seg a={O} b={reflected} color={BRAND} width={1.8} arrow={0.6} opacity={0.35} />
            {refracted ? (
              <>
                <Seg a={O} b={refracted} color={ACCENT} width={2.6} arrow={0.6} />
                {R.r! > 0.5 ? <Arc c={O} r={46} a0={90} a1={90 - R.r!} color={ACCENT} label="r" /> : null}
              </>
            ) : null}
          </>
        )}
        {R.tir ? (
          <Txt x={reflected.x + 6} y={reflected.y} anchor="start" color={ERR} size={12} bold>
            reflexão total
          </Txt>
        ) : (
          <Txt x={reflected.x + 6} y={reflected.y} anchor="start" color={INK} size={11}>
            parte refletida
          </Txt>
        )}
      </svg>

      {R.tir ? (
        <p className="mt-2 rounded-control bg-error-soft px-3 py-2 text-sm text-error">
          Reflexão total: i = {i}° passou do ângulo limite (L ≈ {fmt(R.L ?? 0, 1)}°). Nenhuma luz atravessa: toda ela volta para o meio
          1.
        </p>
      ) : null}

      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label htmlFor={`${id}-i`} className="block text-sm font-medium text-ink">
            Ângulo de incidência: i = {i}°
          </label>
          <input
            id={`${id}-i`}
            type="range"
            min={0}
            max={89}
            step={1}
            value={i}
            onChange={(e) => setI(Number(e.target.value))}
            className="mt-2 w-full accent-[var(--color-brand)]"
          />
        </div>
        <div className="flex gap-3">
          {[
            { label: "Meio 1", v: m1, set: setM1 },
            { label: "Meio 2", v: m2, set: setM2 },
          ].map((s) => (
            <div key={s.label}>
              <label htmlFor={`${id}-${s.label}`} className="block text-xs text-ink-faint">
                {s.label}
              </label>
              <select
                id={`${id}-${s.label}`}
                value={s.v}
                onChange={(e) => s.set(Number(e.target.value))}
                className="mt-1 rounded-control border border-border bg-surface px-2 py-2 text-sm text-ink"
              >
                {MEIOS.map((m, idx) => (
                  <option key={m.nome} value={idx}>
                    {m.nome}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-border pt-4 sm:grid-cols-3">
        {[
          ["n₁ · sen i", fmt(n1 * Math.sin(rad(i)), 3)],
          ["n₂ · sen r", R.tir ? "não existe" : fmt(n2 * Math.sin(rad(R.r!)), 3)],
          ["r", R.tir ? "não existe" : `${fmt(R.r!, 1)}°`],
          ["Ângulo limite L", R.L === null ? "não há" : `${fmt(R.L, 1)}°`],
          ["v₁ = c/n₁", `${fmtInt(300000 / n1)} km/s`],
          ["v₂ = c/n₂", `${fmtInt(300000 / n2)} km/s`],
        ].map(([k, v]) => (
          <div key={k}>
            <dt className="text-[0.68rem] uppercase tracking-[0.1em] text-ink-faint">{k}</dt>
            <dd className="text-sm font-medium text-ink">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-sm text-ink-soft">
        {n1 === n2
          ? "Os dois meios têm o mesmo índice: a luz segue reto, sem desvio."
          : i === 0
            ? "Incidência perpendicular: não há desvio, mas a velocidade muda."
            : n1 < n2
              ? "A luz entra num meio onde é mais lenta: o raio se aproxima da normal (r < i)."
              : "A luz entra num meio onde é mais rápida: o raio se afasta da normal (r > i), e pode haver reflexão total."}
      </p>
    </Panel>
  );
}

/* ════════════════════════════════════════════════════════════
   3. PRANCHETA DE CONSTRUÇÃO
   ════════════════════════════════════════════════════════════ */

export type BoardTemplate = "plano" | "esferico" | "refracao" | "limpo";
type Kind = "ray" | "line" | "dashed" | "point";
type Tool = Kind | "erase";
interface Shape {
  kind: Kind;
  a: P;
  b: P;
}
interface Crit {
  ok: boolean;
  text: string;
}
interface BoardTask {
  label: string;
  prompt: string;
  anchors: P[];
  background: ReactNode;
  solution: ReactNode | null;
  check: ((shapes: Shape[]) => Crit[]) | null;
}

const endpoints = (shapes: Shape[]) => shapes.flatMap((s) => [s.a, s.b]);
const nearAny = (shapes: Shape[], q: P, tol: number) => endpoints(shapes).some((p) => dist(p, q) <= tol);
const isStroke = (s: Shape) => s.kind !== "point";

/* — espelho plano — */
const PL = (() => {
  const mx = 380;
  const objBase = { x: 230, y: 260 };
  const objTip = { x: 230, y: 150 };
  const imgTip = planeImage(mx, objTip);
  const imgBase = planeImage(mx, objBase);
  // dois raios saindo da ponta: refletidos alinhados com a imagem (i = r)
  const Ms = [{ x: mx, y: 112 }, { x: mx, y: 196 }];
  const outs = Ms.map((M) => {
    const t = (M.x - 250) / (imgTip.x - M.x);
    return { x: 250, y: M.y + (M.y - imgTip.y) * t };
  });
  return { mx, objBase, objTip, imgTip, imgBase, Ms, outs };
})();

/* — espelho esférico (côncavo, caso 1) — */
const SP = (() => {
  const f = 20;
  const dO = 50;
  const hO = 8;
  const k = 8;
  const X = (s: number) => VX - k * s;
  const Y = (h: number) => AX - k * h;
  const img = sphericalImage(dO, f, hO);
  const rays = ([1, 2] as RayId[]).map((id) => notableRay(id, dO, hO, f)!);
  const tip = { x: X(dO), y: Y(hO) };
  const sEdge = (VX - LEFT) / k;
  return {
    f,
    X,
    Y,
    tip,
    F: { x: X(f), y: AX },
    imgTip: { x: X(img.di), y: Y(img.hi) },
    imgBase: { x: X(img.di), y: AX },
    rays: rays.map((r) => ({ M: { x: VX, y: Y(r.hit) }, end: { x: X(sEdge), y: Y(reflectedHeight(r, sEdge)) } })),
  };
})();

/* — refração (ar → vidro, i = 40°) — */
const RF = (() => {
  const O = { x: 360, y: AX };
  const i = 40;
  const r = refract(1, 1.5, i).r!;
  return { O, i, r, start: pt(O, 150, -90 - i), end: pt(O, 150, 90 - r), refl: pt(O, 150, -90 + i) };
})();

function MirrorLine({ x }: { x: number }) {
  return (
    <g>
      <line x1={x} y1={36} x2={x} y2={304} stroke={BRAND} strokeWidth={3.5} />
      <Hatch a={{ x, y: 40 }} b={{ x, y: 300 }} off={{ x: 10, y: -8 }} />
      <Txt x={x - 8} y={30} anchor="end" color={BRAND} size={12}>
        espelho
      </Txt>
    </g>
  );
}

function ConcaveBackground() {
  return (
    <g>
      <line x1={LEFT} y1={AX} x2={RIGHT} y2={AX} stroke={INK} strokeWidth={1.4} />
      <path d={`M ${VX - 8} ${AX - HALF} Q ${VX + 8} ${AX} ${VX - 8} ${AX + HALF}`} fill="none" stroke={BRAND} strokeWidth={3.5} />
      <Tick x={VX} label="V" dx={-16} />
      <Tick x={SP.X(SP.f)} label="F" color={BRAND} />
      <Tick x={SP.X(2 * SP.f)} label="C" color={BRAND} />
      <VArrow x={SP.tip.x} base={AX} tip={SP.tip.y} color={INK2} />
      <Txt x={SP.tip.x} y={AX + 40} size={12}>
        objeto
      </Txt>
    </g>
  );
}

const TASKS: Record<BoardTemplate, BoardTask> = {
  plano: {
    label: "espelho plano",
    prompt:
      "Construa a imagem da seta. Depois trace um raio que sai da ponta da seta, bate no espelho e volta, e prolongue o refletido (tracejado) até a imagem.",
    anchors: [PL.objTip, PL.objBase],
    background: (
      <g>
        <MirrorLine x={PL.mx} />
        <VArrow x={PL.objTip.x} base={PL.objBase.y} tip={PL.objTip.y} color={INK2} />
        <Txt x={PL.objTip.x} y={PL.objBase.y + 22} size={12}>
          objeto
        </Txt>
      </g>
    ),
    solution: (
      <g>
        <Seg a={PL.objTip} b={PL.imgTip} color={INK} dashed width={1.2} />
        <Seg a={PL.objBase} b={PL.imgBase} color={INK} dashed width={1.2} />
        {PL.Ms.map((M, idx) => (
          <g key={idx}>
            <Seg a={PL.objTip} b={M} color={ACCENT} arrow={0.55} />
            <Seg a={M} b={PL.outs[idx]} color={ACCENT} arrow={0.55} />
            <Seg a={M} b={PL.imgTip} color={ACCENT} dashed width={1.6} />
          </g>
        ))}
        <VArrow x={PL.imgTip.x} base={PL.imgBase.y} tip={PL.imgTip.y} color={ACCENT} dashed />
        <Txt x={PL.imgTip.x} y={PL.imgBase.y + 22} color={ACCENT} size={12}>
          imagem
        </Txt>
      </g>
    ),
    check: (shapes) => [
      { ok: nearAny(shapes, PL.imgTip, 18), text: "A ponta da imagem está atrás do espelho, à mesma distância e na mesma altura da ponta do objeto." },
      { ok: nearAny(shapes, PL.imgBase, 18), text: "A base da imagem fica alinhada com a base do objeto, à mesma distância do espelho." },
      {
        ok: shapes.some((s) => s.kind === "dashed" && Math.max(s.a.x, s.b.x) > PL.mx + 6),
        text: "Há traço tracejado atrás do espelho (imagem virtual e prolongamentos).",
      },
      {
        ok: shapes.some(
          (s) =>
            (s.kind === "ray" || s.kind === "line") &&
            Math.min(Math.abs(s.a.x - PL.mx), Math.abs(s.b.x - PL.mx)) <= 12 &&
            Math.min(s.a.x, s.b.x) < PL.mx - 20 &&
            Math.max(s.a.x, s.b.x) <= PL.mx + 12,
        ),
        text: "Pelo menos um raio real chega ao espelho pela frente, sem atravessá-lo.",
      },
    ],
  },
  esferico: {
    label: "espelho côncavo",
    prompt:
      "O objeto está além de C. Trace o raio paralelo ao eixo e o raio que passa por F, ache onde os refletidos se cruzam e desenhe a imagem.",
    anchors: [SP.tip, { x: VX, y: AX }, SP.F, { x: SP.X(2 * SP.f), y: AX }],
    background: <ConcaveBackground />,
    solution: (
      <g>
        {SP.rays.map((r, idx) => (
          <g key={idx}>
            <Seg a={SP.tip} b={r.M} color={ACCENT} arrow={0.55} />
            <Seg a={r.M} b={r.end} color={ACCENT} arrow={0.5} />
          </g>
        ))}
        <VArrow x={SP.imgTip.x} base={AX} tip={SP.imgTip.y} color={ACCENT} />
        <Txt x={SP.imgTip.x} y={AX - 12} color={ACCENT} size={12}>
          imagem
        </Txt>
      </g>
    ),
    check: (shapes) => [
      { ok: nearAny(shapes, SP.imgTip, 20), text: "A ponta da imagem está no cruzamento dos raios refletidos (abaixo do eixo, entre C e F)." },
      {
        ok: shapes.some((s) => isStroke(s) && distToSeg(SP.F, s.a, s.b) <= 10),
        text: "Um dos raios passa pelo foco F.",
      },
      {
        ok: shapes.filter((s) => (s.kind === "ray" || s.kind === "line") && Math.min(Math.abs(s.a.x - VX), Math.abs(s.b.x - VX)) <= 14).length >= 2,
        text: "Pelo menos dois raios chegam ao espelho.",
      },
      { ok: nearAny(shapes, SP.imgBase, 20), text: "A imagem começa no eixo principal, logo acima/abaixo do ponto encontrado." },
    ],
  },
  refracao: {
    label: "refração ar → vidro",
    prompt: `A luz vai do ar (n₁ = 1) para o vidro (n₂ = 1,5) com i = ${RF.i}°. Desenhe o raio refratado saindo do ponto de incidência.`,
    anchors: [RF.O],
    background: (
      <g>
        <rect x={0} y={0} width={W} height={AX} fill="var(--color-brand-soft)" opacity={0.4} />
        <rect x={0} y={AX} width={W} height={H - AX} fill="var(--color-surface-sunken)" opacity={0.7} />
        <line x1={0} y1={AX} x2={W} y2={AX} stroke="var(--color-border-strong)" strokeWidth={2.5} />
        <line x1={RF.O.x} y1={16} x2={RF.O.x} y2={H - 16} stroke={INK} strokeWidth={1.5} strokeDasharray="6 5" />
        <Txt x={16} y={24} anchor="start">
          ar · n₁ = 1
        </Txt>
        <Txt x={16} y={H - 12} anchor="start">
          vidro · n₂ = 1,5
        </Txt>
        <Seg a={RF.start} b={RF.O} color={BRAND} width={2.6} arrow={0.55} />
        <Arc c={RF.O} r={46} a0={-90} a1={-90 - RF.i} color={BRAND} label={`${RF.i}°`} />
      </g>
    ),
    solution: (
      <g>
        <Seg a={RF.O} b={RF.end} color={ACCENT} width={2.6} arrow={0.6} />
        <Arc c={RF.O} r={46} a0={90} a1={90 - RF.r} color={ACCENT} label={`${fmt(RF.r, 1)}°`} />
        <Seg a={RF.O} b={RF.refl} color={BRAND} width={1.6} arrow={0.6} opacity={0.35} />
      </g>
    ),
    check: (shapes) => {
      const cands = shapes
        .filter(isStroke)
        .map((s) => (dist(s.a, RF.O) <= dist(s.b, RF.O) ? { s0: s.a, s1: s.b } : { s0: s.b, s1: s.a }))
        .filter((c) => dist(c.s0, RF.O) <= 16 && c.s1.y > AX + 15)
        .map((c) => ({ side: c.s1.x > RF.O.x, ang: deg(Math.atan2(Math.abs(c.s1.x - RF.O.x), c.s1.y - RF.O.y)) }))
        .sort((p, q) => Math.abs(p.ang - RF.r) - Math.abs(q.ang - RF.r));
      const best = cands[0];
      return [
        { ok: cands.length > 0, text: "Há um raio saindo do ponto de incidência para dentro do vidro." },
        { ok: !!best && best.side, text: "O raio refratado está do outro lado da normal em relação ao incidente." },
        {
          ok: !!best && Math.abs(best.ang - RF.r) <= 4,
          text: best
            ? `Seu raio faz ${fmt(best.ang, 0)}° com a normal; o esperado é r ≈ ${fmt(RF.r, 1)}° (aceito ± 4°).`
            : `O ângulo esperado é r ≈ ${fmt(RF.r, 1)}°, medido a partir da normal.`,
        },
        { ok: !!best && best.ang < RF.i, text: "O raio se aproximou da normal (r < i), porque no vidro a luz é mais lenta." },
      ];
    },
  },
  limpo: {
    label: "folha livre",
    prompt: "Folha livre para treinar qualquer construção.",
    anchors: [],
    background: null,
    solution: null,
    check: null,
  },
};

export function DrawingBoard({ template = "limpo" }: { template?: BoardTemplate }) {
  const task = TASKS[template];
  const [tool, setTool] = useState<Tool>("ray");
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [past, setPast] = useState<Shape[][]>([]);
  const [future, setFuture] = useState<Shape[][]>([]);
  const [draft, setDraft] = useState<Shape | null>(null);
  const [pending, setPending] = useState<P | null>(null);
  const [showSolution, setShowSolution] = useState(false);
  const [results, setResults] = useState<Crit[] | null>(null);

  function commit(next: Shape[]) {
    setPast((p) => [...p, shapes]);
    setFuture([]);
    setShapes(next);
    setResults(null);
  }

  /** Converte o toque/clique para coordenadas do desenho. Lido NA HORA,
   *  dentro do evento — depois ele já não existe. */
  function toSvg(e: ReactPointerEvent<SVGSVGElement>): P {
    const r = e.currentTarget.getBoundingClientRect();
    const p = { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
    for (const a of task.anchors) if (dist(a, p) <= 14) return a; // ímã nos pontos dados
    return p;
  }

  function onDown(e: ReactPointerEvent<SVGSVGElement>) {
    e.preventDefault();
    const p = toSvg(e);
    if (tool === "erase") {
      let best = -1;
      let bestD = 16;
      shapes.forEach((s, idx) => {
        const d = s.kind === "point" ? dist(p, s.a) : distToSeg(p, s.a, s.b);
        if (d < bestD) {
          bestD = d;
          best = idx;
        }
      });
      if (best >= 0) commit(shapes.filter((_, idx) => idx !== best));
      return;
    }
    if (tool === "point") {
      commit([...shapes, { kind: "point", a: p, b: p }]);
      return;
    }
    if (pending) {
      if (dist(pending, p) > 4) commit([...shapes, { kind: tool, a: pending, b: p }]);
      setPending(null);
      return;
    }
    e.currentTarget.setPointerCapture(e.pointerId);
    setDraft({ kind: tool, a: p, b: p });
  }

  function onMove(e: ReactPointerEvent<SVGSVGElement>) {
    if (!draft) return;
    const p = toSvg(e);
    setDraft({ ...draft, b: p });
  }

  function onUp() {
    if (!draft) return;
    if (dist(draft.a, draft.b) > 8) commit([...shapes, draft]);
    else setPending(draft.a); // foi um toque: o próximo toque fecha a linha
    setDraft(null);
  }

  function undo() {
    if (pending) return setPending(null);
    if (past.length === 0) return;
    setFuture((f) => [shapes, ...f]);
    setShapes(past[past.length - 1]);
    setPast((p) => p.slice(0, -1));
    setResults(null);
  }

  function redo() {
    if (future.length === 0) return;
    setPast((p) => [...p, shapes]);
    setShapes(future[0]);
    setFuture((f) => f.slice(1));
    setResults(null);
  }

  function clearAll() {
    if (shapes.length === 0 && !pending) return;
    commit([]);
    setPending(null);
  }

  const renderShape = (s: Shape, key: string, faded = false) => {
    if (s.kind === "point") return <circle key={key} cx={s.a.x} cy={s.a.y} r={5} fill={ACCENT} opacity={faded ? 0.5 : 1} />;
    return (
      <Seg
        key={key}
        a={s.a}
        b={s.b}
        color={s.kind === "dashed" ? INK2 : BRAND}
        dashed={s.kind === "dashed"}
        width={2.6}
        arrow={s.kind === "ray" ? 0.6 : undefined}
        opacity={faded ? 0.5 : 1}
      />
    );
  };

  const tools: { id: Tool; label: string }[] = [
    { id: "ray", label: "Raio →" },
    { id: "line", label: "Linha" },
    { id: "dashed", label: "Tracejado" },
    { id: "point", label: "Ponto" },
    { id: "erase", label: "Borracha" },
  ];

  return (
    <Panel label={`Prancheta · ${task.label}`}>
      <p className="mt-1.5 text-sm leading-relaxed text-ink">{task.prompt}</p>
      <p className="mt-1 text-xs text-ink-faint">
        Arraste para traçar, ou toque no começo e depois no fim. As linhas grudam nos pontos já marcados no desenho.
      </p>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className={cn("mt-3 h-auto w-full select-none rounded-control border border-border bg-bg", tool === "erase" ? "cursor-pointer" : "cursor-crosshair")}
        style={{ touchAction: "none" }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={() => setDraft(null)}
        role="application"
        aria-label={`Prancheta de construção: ${task.label}. ${task.prompt}`}
      >
        {task.background}
        {task.anchors.map((a, idx) => (
          <circle key={idx} cx={a.x} cy={a.y} r={4} fill="none" stroke={ACCENT} strokeWidth={1.5} opacity={0.7} />
        ))}
        {showSolution && task.solution ? <g opacity={0.85}>{task.solution}</g> : null}
        {shapes.map((s, idx) => renderShape(s, `s${idx}`))}
        {draft ? renderShape(draft, "draft", true) : null}
        {pending ? <circle cx={pending.x} cy={pending.y} r={6} fill="none" stroke={ACCENT} strokeWidth={2.5} /> : null}
      </svg>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {tools.map((t) => (
          <Toggle
            key={t.id}
            on={tool === t.id}
            onClick={() => {
              setTool(t.id);
              setPending(null);
            }}
          >
            {t.id === "erase" ? <Eraser className="h-3.5 w-3.5" aria-hidden /> : null}
            {t.label}
          </Toggle>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={undo}
          disabled={past.length === 0 && !pending}
          className="inline-flex items-center gap-1.5 rounded-control border border-border px-3 py-2 text-sm text-ink-soft disabled:opacity-40"
        >
          <Undo2 className="h-3.5 w-3.5" aria-hidden />
          Desfazer
        </button>
        <button
          type="button"
          onClick={redo}
          disabled={future.length === 0}
          className="inline-flex items-center gap-1.5 rounded-control border border-border px-3 py-2 text-sm text-ink-soft disabled:opacity-40"
        >
          <Redo2 className="h-3.5 w-3.5" aria-hidden />
          Refazer
        </button>
        <button
          type="button"
          onClick={clearAll}
          disabled={shapes.length === 0 && !pending}
          className="rounded-control border border-border px-3 py-2 text-sm text-ink-soft disabled:opacity-40"
        >
          Limpar
        </button>
        {task.check ? (
          <button
            type="button"
            onClick={() => setResults(task.check!(shapes))}
            disabled={shapes.length === 0}
            className="rounded-control bg-brand px-3 py-2 text-sm font-medium text-brand-contrast disabled:opacity-40"
          >
            Conferir construção
          </button>
        ) : null}
        {task.solution ? (
          <button
            type="button"
            onClick={() => setShowSolution((v) => !v)}
            aria-pressed={showSolution}
            className="inline-flex items-center gap-1.5 rounded-control border border-border px-3 py-2 text-sm text-ink-soft"
          >
            {showSolution ? <EyeOff className="h-3.5 w-3.5" aria-hidden /> : <Eye className="h-3.5 w-3.5" aria-hidden />}
            {showSolution ? "Esconder modelo" : "Ver construção correta"}
          </button>
        ) : null}
      </div>

      {results ? (
        <ul className="mt-3 space-y-1.5 rounded-control bg-surface-muted p-3 text-sm" aria-live="polite">
          {results.map((r) => (
            <li key={r.text} className={cn("flex gap-2", r.ok ? "text-success" : "text-error")}>
              {r.ok ? <Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> : <XIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />}
              <span>{r.text}</span>
            </li>
          ))}
          <li className="pt-1 text-xs text-ink-faint">
            {results.every((r) => r.ok)
              ? "Tudo certo nos pontos conferidos."
              : "A conferência verifica posições e ângulos com tolerância, então não precisa ser perfeito. Ajuste e confira de novo."}
          </li>
        </ul>
      ) : null}
    </Panel>
  );
}

/* ════════════════════════════════════════════════════════════
   4. DIAGRAMAS DOS CAPÍTULOS
   ════════════════════════════════════════════════════════════ */

function Fig({ h = H, label, children }: { h?: number; label: string; children: ReactNode }) {
  return (
    <svg viewBox={`0 0 ${W} ${h}`} className="h-auto w-full rounded-control border border-border bg-surface" role="img" aria-label={label}>
      {children}
    </svg>
  );
}

function DReflexaoTipos() {
  const lisa = [120, 180, 240].map((x) => ({ x, y: 200 }));
  const rough = Array.from({ length: 15 }, (_, i) => ({ x: 400 + i * 20, y: i % 2 ? 188 : 200 }));
  const hits = [
    { p: { x: 480, y: 200 }, a: -150 },
    { p: { x: 540, y: 194 }, a: -80 },
    { p: { x: 600, y: 200 }, a: -35 },
  ];
  return (
    <Fig h={260} label="Reflexão especular em superfície lisa e reflexão difusa em superfície irregular">
      <line x1={40} y1={200} x2={320} y2={200} stroke={BRAND} strokeWidth={3} />
      <Hatch a={{ x: 40, y: 200 }} b={{ x: 320, y: 200 }} off={{ x: -8, y: 9 }} />
      {lisa.map((q, i) => (
        <g key={i}>
          <Seg a={{ x: q.x - 100, y: 100 }} b={q} color={BRAND} arrow={0.55} />
          <Seg a={q} b={{ x: q.x + 100, y: 100 }} color={ACCENT} arrow={0.55} />
        </g>
      ))}
      <Txt x={180} y={235} bold>
        Reflexão especular
      </Txt>
      <Txt x={180} y={252} size={11} color={INK}>
        superfície lisa · refletidos paralelos
      </Txt>

      <polyline points={rough.map((p) => `${p.x},${p.y}`).join(" ")} fill="none" stroke={BRAND} strokeWidth={3} />
      {hits.map((h, i) => (
        <g key={i}>
          <Seg a={{ x: h.p.x - 100, y: h.p.y - 100 }} b={h.p} color={BRAND} arrow={0.55} />
          <Seg a={h.p} b={pt(h.p, 95, h.a)} color={ACCENT} arrow={0.55} />
        </g>
      ))}
      <Txt x={540} y={235} bold>
        Reflexão difusa
      </Txt>
      <Txt x={540} y={252} size={11} color={INK}>
        superfície irregular · refletidos espalhados
      </Txt>
    </Fig>
  );
}

function DLeisReflexao() {
  const P0 = { x: 360, y: 230 };
  const i = 40;
  return (
    <Fig h={280} label="Leis da reflexão: raio incidente, normal e raio refletido com ângulos iguais">
      <line x1={140} y1={230} x2={580} y2={230} stroke={BRAND} strokeWidth={3.5} />
      <Hatch a={{ x: 140, y: 230 }} b={{ x: 580, y: 230 }} off={{ x: -8, y: 9 }} />
      <line x1={360} y1={230} x2={360} y2={44} stroke={INK} strokeWidth={1.5} strokeDasharray="6 5" />
      <Seg a={pt(P0, 180, -90 - i)} b={P0} color={BRAND} width={2.6} arrow={0.55} />
      <Seg a={P0} b={pt(P0, 180, -90 + i)} color={ACCENT} width={2.6} arrow={0.55} />
      <Arc c={P0} r={58} a0={-90} a1={-90 - i} label="i" />
      <Arc c={P0} r={58} a0={-90} a1={-90 + i} label="r" />
      <Txt x={360} y={36} bold>
        N
      </Txt>
      <Txt x={pt(P0, 190, -90 - i).x - 8} y={pt(P0, 190, -90 - i).y} anchor="end" color={BRAND} bold>
        RI
      </Txt>
      <Txt x={pt(P0, 190, -90 + i).x + 8} y={pt(P0, 190, -90 + i).y} anchor="start" color={ACCENT} bold>
        RR
      </Txt>
      <Txt x={590} y={226} anchor="start" size={12} color={BRAND}>
        espelho
      </Txt>
      <Txt x={360} y={266} size={12}>
        i = r · ângulos medidos a partir da normal
      </Txt>
    </Fig>
  );
}

function DImagemPlano() {
  const mx = 360;
  const O = { x: 210, y: 140 };
  const Ob = { x: 210, y: 250 };
  const I = planeImage(mx, O);
  const Ib = planeImage(mx, Ob);
  const E = { x: 130, y: 90 };
  const t = (I.x - mx) / (I.x - E.x);
  const M = { x: mx, y: I.y + t * (E.y - I.y) };
  return (
    <Fig h={300} label="Imagem em espelho plano: virtual, direita, do mesmo tamanho e simétrica">
      <line x1={mx} y1={40} x2={mx} y2={280} stroke={BRAND} strokeWidth={3.5} />
      <Hatch a={{ x: mx, y: 44 }} b={{ x: mx, y: 276 }} off={{ x: 10, y: -8 }} />
      <VArrow x={O.x} base={Ob.y} tip={O.y} color={INK2} />
      <VArrow x={I.x} base={Ib.y} tip={I.y} color={ACCENT} dashed />
      <Seg a={O} b={I} color={INK} dashed width={1.1} />
      <Seg a={Ob} b={Ib} color={INK} dashed width={1.1} />
      <Seg a={O} b={M} color={BRAND} arrow={0.55} />
      <Seg a={M} b={E} color={BRAND} arrow={0.6} />
      <Seg a={M} b={I} color={BRAND} dashed width={1.6} />
      <Eyeball c={E} />
      <Txt x={E.x} y={E.y - 16} size={12}>
        observador
      </Txt>
      <Txt x={O.x - 12} y={200} anchor="end" size={12}>
        objeto
      </Txt>
      <Txt x={I.x + 12} y={200} anchor="start" size={12} color={ACCENT}>
        imagem (virtual)
      </Txt>
      <line x1={O.x} y1={272} x2={mx} y2={272} stroke={INK2} strokeWidth={1} />
      <line x1={mx} y1={272} x2={I.x} y2={272} stroke={INK2} strokeWidth={1} />
      <Txt x={(O.x + mx) / 2} y={292} bold>
        d
      </Txt>
      <Txt x={(mx + I.x) / 2} y={292} bold>
        d
      </Txt>
    </Fig>
  );
}

function DCampoVisual() {
  const mx = 380;
  const top = 120;
  const bot = 220;
  const O = { x: 250, y: 170 };
  const Oi = planeImage(mx, O);
  const ext = (y: number) => {
    const t = (Oi.x - 30) / (Oi.x - mx);
    return { x: 30, y: Oi.y + t * (y - Oi.y) };
  };
  const A = { x: 200, y: 205 };
  const Ai = planeImage(mx, A);
  const tA = (mx - O.x) / (Ai.x - O.x);
  const MA = { x: mx, y: O.y + tA * (Ai.y - O.y) };
  const B = { x: 300, y: 70 };
  return (
    <Fig label="Campo visual de um espelho plano a partir da imagem do observador">
      <defs>
        <clipPath id="cv-clip">
          <rect x={0} y={0} width={W} height={H} />
        </clipPath>
      </defs>
      <g clipPath="url(#cv-clip)">
        <polygon
          points={`${mx},${top} ${ext(top).x},${ext(top).y} ${ext(bot).x},${ext(bot).y} ${mx},${bot}`}
          fill="var(--color-brand-soft)"
          opacity={0.7}
        />
        <Seg a={Oi} b={ext(top)} color={INK} dashed width={1.2} />
        <Seg a={Oi} b={ext(bot)} color={INK} dashed width={1.2} />
      </g>
      <line x1={mx} y1={top} x2={mx} y2={bot} stroke={BRAND} strokeWidth={4} />
      <Hatch a={{ x: mx, y: top }} b={{ x: mx, y: bot }} off={{ x: 10, y: -8 }} />
      <Eyeball c={O} />
      <Eyeball c={Oi} flip dashed />
      <Txt x={O.x} y={O.y + 26} size={12}>
        observador
      </Txt>
      <Txt x={Oi.x} y={Oi.y + 26} size={12} color={INK}>
        imagem do observador
      </Txt>
      <Seg a={A} b={MA} color={ACCENT} arrow={0.55} />
      <Seg a={MA} b={O} color={ACCENT} arrow={0.55} />
      <circle cx={A.x} cy={A.y} r={6} fill={ACCENT} />
      <Txt x={A.x} y={A.y + 24} size={12} color={ACCENT} bold>
        A · visível
      </Txt>
      <circle cx={B.x} cy={B.y} r={6} fill={ERR} />
      <Txt x={B.x} y={B.y - 12} size={12} color={ERR} bold>
        B · não visível
      </Txt>
      <Txt x={110} y={318} size={12} color={BRAND}>
        campo visual
      </Txt>
    </Fig>
  );
}

function DEspelhos90() {
  const Oc = { x: 330, y: 230 };
  const Pp = { x: 420, y: 110 };
  const I1 = { x: 2 * Oc.x - Pp.x, y: Pp.y };
  const I2 = { x: Pp.x, y: 2 * Oc.y - Pp.y };
  const I3 = { x: I1.x, y: I2.y };
  const dot = (p: P, label: string, filled: boolean) => (
    <g>
      <circle cx={p.x} cy={p.y} r={7} fill={filled ? INK2 : "var(--color-surface)"} stroke={filled ? INK2 : ACCENT} strokeWidth={2} />
      <Txt x={p.x + 12} y={p.y - 10} anchor="start" color={filled ? INK2 : ACCENT} bold>
        {label}
      </Txt>
    </g>
  );
  return (
    <Fig h={420} label="Dois espelhos perpendiculares formam três imagens; a do canto vem da dupla reflexão">
      <line x1={Oc.x} y1={Oc.y} x2={Oc.x} y2={410} stroke={INK} strokeWidth={1} strokeDasharray="2 5" />
      <line x1={Oc.x} y1={Oc.y} x2={20} y2={Oc.y} stroke={INK} strokeWidth={1} strokeDasharray="2 5" />
      <line x1={Oc.x} y1={Oc.y} x2={Oc.x} y2={20} stroke={BRAND} strokeWidth={4} />
      <line x1={Oc.x} y1={Oc.y} x2={700} y2={Oc.y} stroke={BRAND} strokeWidth={4} />
      <Hatch a={{ x: Oc.x, y: 24 }} b={{ x: Oc.x, y: Oc.y }} off={{ x: -10, y: 8 }} />
      <Hatch a={{ x: Oc.x, y: Oc.y }} b={{ x: 696, y: Oc.y }} off={{ x: 8, y: 10 }} />
      <Txt x={Oc.x - 8} y={36} anchor="end" color={BRAND} bold>
        E₂
      </Txt>
      <Txt x={690} y={Oc.y - 10} anchor="end" color={BRAND} bold>
        E₁
      </Txt>
      <Seg a={Pp} b={I1} color={INK} dashed width={1.2} />
      <Seg a={Pp} b={I2} color={INK} dashed width={1.2} />
      <Seg a={Pp} b={I3} color={INK} dashed width={1.2} />
      <Txt x={(Pp.x + I1.x) / 2} y={Pp.y - 10} size={12}>
        12 cm
      </Txt>
      <Txt x={Pp.x + 10} y={(Pp.y + I2.y) / 2} anchor="start" size={12}>
        16 cm
      </Txt>
      <Txt x={(Pp.x + I3.x) / 2 - 24} y={(Pp.y + I3.y) / 2} anchor="end" size={12}>
        20 cm
      </Txt>
      {dot(Pp, "objeto", true)}
      {dot(I1, "I₁", false)}
      {dot(I2, "I₂", false)}
      {dot(I3, "I₃", false)}
      <Txt x={560} y={150} size={12} color={INK}>
        objeto a 6 cm de E₂ e 8 cm de E₁
      </Txt>
    </Fig>
  );
}

function DRefracao() {
  const O = { x: 360, y: 150 };
  const i = 50;
  const r = refract(1, 1.5, i).r!;
  return (
    <Fig h={300} label="Elementos do desenho de refração: superfície, normal, raio incidente e raio refratado">
      <rect x={0} y={0} width={W} height={150} fill="var(--color-brand-soft)" opacity={0.45} />
      <rect x={0} y={150} width={W} height={150} fill="var(--color-surface-sunken)" />
      <line x1={0} y1={150} x2={W} y2={150} stroke="var(--color-border-strong)" strokeWidth={2.5} />
      <line x1={360} y1={16} x2={360} y2={284} stroke={INK} strokeWidth={1.5} strokeDasharray="6 5" />
      <Seg a={pt(O, 140, -90 - i)} b={O} color={BRAND} width={2.6} arrow={0.55} />
      <Seg a={O} b={pt(O, 140, 90 - r)} color={ACCENT} width={2.6} arrow={0.6} />
      <Arc c={O} r={50} a0={-90} a1={-90 - i} color={BRAND} label="i" />
      <Arc c={O} r={50} a0={90} a1={90 - r} color={ACCENT} label="r" />
      <Txt x={366} y={30} anchor="start" bold>
        N
      </Txt>
      <Txt x={W - 14} y={144} anchor="end" bold>
        S
      </Txt>
      <Txt x={pt(O, 150, -90 - i).x - 6} y={pt(O, 150, -90 - i).y} anchor="end" color={BRAND} bold>
        RI
      </Txt>
      <Txt x={pt(O, 150, 90 - r).x + 8} y={pt(O, 150, 90 - r).y} anchor="start" color={ACCENT} bold>
        RR
      </Txt>
      <Txt x={16} y={28} anchor="start">
        meio 1 · n₁, v₁
      </Txt>
      <Txt x={16} y={286} anchor="start">
        meio 2 · n₂ maior, v₂ menor
      </Txt>
    </Fig>
  );
}

function DAnguloLimite() {
  const n = 1.5;
  const L = deg(Math.asin(1 / n));
  const cases = [
    { cx: 120, i: 30, title: "i < L · refrata" },
    { cx: 360, i: L, title: "i = L · rasante" },
    { cx: 600, i: 62, title: "i > L · reflexão total" },
  ];
  return (
    <Fig h={270} label="Três situações: abaixo do ângulo limite, no ângulo limite e acima dele (reflexão total)">
      <rect x={0} y={0} width={W} height={130} fill="var(--color-brand-soft)" opacity={0.45} />
      <rect x={0} y={130} width={W} height={140} fill="var(--color-surface-sunken)" />
      <line x1={0} y1={130} x2={W} y2={130} stroke="var(--color-border-strong)" strokeWidth={2.5} />
      <line x1={240} y1={0} x2={240} y2={270} stroke="var(--color-border)" strokeWidth={1} />
      <line x1={480} y1={0} x2={480} y2={270} stroke="var(--color-border)" strokeWidth={1} />
      {cases.map((c, idx) => {
        const O = { x: c.cx, y: 130 };
        const R = refract(n, 1, c.i);
        return (
          <g key={idx}>
            <line x1={c.cx} y1={30} x2={c.cx} y2={250} stroke={INK} strokeWidth={1.3} strokeDasharray="5 4" />
            <Seg a={pt(O, 105, 90 + c.i)} b={O} color={BRAND} width={2.4} arrow={0.55} />
            <Arc c={O} r={34} a0={90} a1={90 + c.i} color={BRAND} label="i" />
            {R.tir ? (
              <Seg a={O} b={pt(O, 105, 90 - c.i)} color={ERR} width={2.4} arrow={0.6} />
            ) : (
              <>
                <Seg a={O} b={pt(O, 105, -90 + R.r!)} color={ACCENT} width={2.4} arrow={0.6} />
                <Seg a={O} b={pt(O, 90, 90 - c.i)} color={BRAND} width={1.5} arrow={0.6} opacity={0.3} />
              </>
            )}
            <Txt x={c.cx} y={22} bold size={12}>
              {c.title}
            </Txt>
          </g>
        );
      })}
      <Txt x={8} y={120} anchor="start" size={11} color={INK}>
        ar · n = 1
      </Txt>
      <Txt x={8} y={262} anchor="start" size={11} color={INK}>
        vidro · n = 1,5 · L ≈ {fmt(L, 1)}°
      </Txt>
    </Fig>
  );
}

function DFibra() {
  const pts: P[] = [{ x: 30, y: 100 }];
  let up = false;
  for (let x = 70; x <= 690; x += 80) {
    pts.push({ x, y: up ? 72 : 128 });
    up = !up;
  }
  return (
    <Fig h={210} label="Fibra óptica: a luz percorre o núcleo por reflexões totais sucessivas">
      <rect x={20} y={40} width={680} height={120} rx={10} fill="var(--color-surface-sunken)" />
      <rect x={20} y={72} width={680} height={56} fill="var(--color-brand-soft)" />
      <line x1={20} y1={72} x2={700} y2={72} stroke="var(--color-border-strong)" strokeWidth={1.5} />
      <line x1={20} y1={128} x2={700} y2={128} stroke="var(--color-border-strong)" strokeWidth={1.5} />
      {pts.slice(0, -1).map((p, idx) => (
        <Seg key={idx} a={p} b={pts[idx + 1]} color={ACCENT} width={2.2} arrow={idx % 2 === 0 ? 0.55 : undefined} />
      ))}
      <Txt x={360} y={58} size={12}>
        casca (n menor)
      </Txt>
      <Txt x={360} y={150} size={12}>
        casca (n menor)
      </Txt>
      <Txt x={360} y={192} bold>
        núcleo com n maior que a casca · reflexão total em cada batida
      </Txt>
    </Fig>
  );
}

function DProfundidade() {
  const sy = 110;
  const Pobj = { x: 360, y: 270 };
  const off = 30;
  const iW = deg(Math.atan(off / (Pobj.y - sy)));
  const r = refract(4 / 3, 1, iW).r!;
  const Q1 = { x: Pobj.x - off, y: sy };
  const Q2 = { x: Pobj.x + off, y: sy };
  const appY = sy + off / Math.tan(rad(r));
  return (
    <Fig h={310} label="Profundidade aparente: o objeto submerso parece mais próximo da superfície">
      <rect x={0} y={sy} width={W} height={310 - sy} fill="var(--color-brand-soft)" opacity={0.6} />
      <line x1={0} y1={sy} x2={W} y2={sy} stroke="var(--color-border-strong)" strokeWidth={2.5} />
      <Seg a={Pobj} b={Q1} color={BRAND} arrow={0.55} />
      <Seg a={Pobj} b={Q2} color={BRAND} arrow={0.55} />
      <Seg a={Q1} b={pt(Q1, 95, -90 - r)} color={ACCENT} arrow={0.6} />
      <Seg a={Q2} b={pt(Q2, 95, -90 + r)} color={ACCENT} arrow={0.6} />
      <Seg a={Q1} b={{ x: Pobj.x, y: appY }} color={ACCENT} dashed width={1.5} />
      <Seg a={Q2} b={{ x: Pobj.x, y: appY }} color={ACCENT} dashed width={1.5} />
      <circle cx={Pobj.x} cy={Pobj.y} r={7} fill={INK2} />
      <circle cx={Pobj.x} cy={appY} r={7} fill="var(--color-surface)" stroke={ACCENT} strokeWidth={2} />
      <Txt x={Pobj.x + 14} y={Pobj.y + 5} anchor="start" size={12}>
        posição real
      </Txt>
      <Txt x={Pobj.x + 14} y={appY + 5} anchor="start" size={12} color={ACCENT}>
        posição aparente
      </Txt>
      <line x1={540} y1={sy} x2={540} y2={Pobj.y} stroke={INK2} strokeWidth={1} />
      <line x1={600} y1={sy} x2={600} y2={appY} stroke={ACCENT} strokeWidth={1} />
      <Txt x={534} y={(sy + Pobj.y) / 2} anchor="end" size={12}>
        real
      </Txt>
      <Txt x={606} y={(sy + appY) / 2} anchor="start" size={12} color={ACCENT}>
        aparente
      </Txt>
      <Txt x={16} y={sy - 10} anchor="start" size={12}>
        ar · n = 1
      </Txt>
      <Txt x={16} y={sy + 24} anchor="start" size={12}>
        água · n = 4/3
      </Txt>
    </Fig>
  );
}

const DIAGRAMS: Record<DiagramName, () => ReactNode> = {
  "reflexao-tipos": DReflexaoTipos,
  "leis-reflexao": DLeisReflexao,
  "imagem-plano": DImagemPlano,
  "campo-visual": DCampoVisual,
  "espelhos-90": DEspelhos90,
  refracao: DRefracao,
  "angulo-limite": DAnguloLimite,
  "fibra-optica": DFibra,
  "profundidade-aparente": DProfundidade,
};

export function Diagram({ name }: { name: DiagramName }) {
  const Comp = DIAGRAMS[name];
  return <Comp />;
}

/* ──────────────────────────────
   Ponte usada pela teoria e lista de conferência
   ────────────────────────────── */

export function InteractiveTool({ tool, template }: { tool: "mirror" | "refraction" | "draw"; template?: BoardTemplate }) {
  if (tool === "mirror") return <MirrorSimulator />;
  if (tool === "refraction") return <RefractionSimulator />;
  return <DrawingBoard template={template} />;
}

export function ConstructionChecklist({ items }: { items: string[] }) {
  const [done, setDone] = useState<Record<number, boolean>>({});
  return (
    <div className="mt-4 rounded-card border border-border bg-surface-muted/60 p-4">
      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-ink-faint">Confira sua construção</p>
      <ul className="mt-3 flex flex-col gap-2">
        {items.map((it, i) => (
          <li key={i}>
            <button
              type="button"
              onClick={() => setDone((d) => ({ ...d, [i]: !d[i] }))}
              aria-pressed={Boolean(done[i])}
              className="flex w-full items-start gap-2.5 text-left text-sm leading-relaxed text-ink-soft"
            >
              <span
                aria-hidden
                className={cn(
                  "mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded border",
                  done[i] ? "border-transparent bg-success text-white" : "border-border-strong",
                )}
              >
                {done[i] ? <Check className="h-3 w-3" /> : null}
              </span>
              <span className={done[i] ? "text-ink-faint line-through" : undefined}><MathText text={it} /></span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
