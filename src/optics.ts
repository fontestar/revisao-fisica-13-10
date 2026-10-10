/* ============================================================================
   ÓPTICA GEOMÉTRICA — cálculos puros (sem interface)
   ============================================================================
   Toda a física usada pelos simuladores, pranchetas e diagramas fica aqui,
   separada do desenho. Assim ela pode ser testada sozinha com números.

   Convenção de sinais (a mesma das anotações do professor):
     d_o > 0  objeto real (na frente do espelho)
     d_i > 0  imagem real (na frente)   ·  d_i < 0  imagem virtual (atrás)
     f   > 0  espelho côncavo           ·  f   < 0  espelho convexo
     A   > 0  imagem direita            ·  A   < 0  imagem invertida

   Coordenadas físicas dos espelhos: s = distância ao vértice medida para
   a FRENTE do espelho (s > 0 na frente, s < 0 atrás); h = altura acima do
   eixo principal. O espelho é tratado no modelo de Gauss (pequena
   abertura): a reflexão acontece na reta vertical que passa por V.
   ============================================================================ */

const EPS = 1e-9;
export const rad = (d: number) => (d * Math.PI) / 180;
export const deg = (r: number) => (r * 180) / Math.PI;

/** Número com vírgula decimal (pt-BR), sem depender de locale do sistema. */
export function fmt(n: number, digits = 2): string {
  if (!Number.isFinite(n)) return "∞";
  const r = Number(n.toFixed(digits));
  return String(Object.is(r, -0) ? 0 : r).replace(".", ",");
}

/** Igual a fmt, mas pronto para LaTeX (a vírgula vira {,} no KaTeX). */
export const fmtTex = (n: number, digits = 2) => fmt(n, digits).replace(",", "{,}");

/** Inteiro com separador de milhar: 225564 → "225.564". */
export const fmtInt = (n: number) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");

/* ────────────────────────────────────────────────────────────
   ESPELHOS ESFÉRICOS
   ──────────────────────────────────────────────────────────── */

export interface SphericalImage {
  di: number;
  A: number;
  hi: number;
  /** Objeto sobre o foco: os raios refletidos saem paralelos. */
  atInfinity: boolean;
}

/** Equação de Gauss (1/f = 1/d_o + 1/d_i) e aumento (A = −d_i/d_o). */
export function sphericalImage(dO: number, f: number, hO: number): SphericalImage {
  if (Math.abs(dO - f) < EPS) return { di: Infinity, A: Infinity, hi: Infinity, atInfinity: true };
  const di = (dO * f) / (dO - f);
  const A = -di / dO;
  return { di, A, hi: A * hO, atInfinity: false };
}

export interface ImageTraits {
  nature: "real" | "virtual" | "impropria";
  orientation: "direita" | "invertida" | null;
  size: "maior" | "igual" | "menor" | null;
}

/** Lê as características da imagem a partir dos sinais de d_i e A. */
export function imageTraits(img: SphericalImage): ImageTraits {
  if (img.atInfinity) return { nature: "impropria", orientation: null, size: null };
  const a = Math.abs(img.A);
  return {
    nature: img.di > 0 ? "real" : "virtual",
    orientation: img.A > 0 ? "direita" : "invertida",
    size: Math.abs(a - 1) < 1e-6 ? "igual" : a > 1 ? "maior" : "menor",
  };
}

export type ConcaveCase = 1 | 2 | 3 | 4 | 5;

/** Qual dos cinco casos do côncavo, a partir da posição do objeto. */
export function concaveCase(dO: number, f: number): ConcaveCase {
  const R = 2 * f;
  if (dO > R + EPS) return 1;
  if (Math.abs(dO - R) < EPS) return 2;
  if (dO > f + EPS) return 3;
  if (Math.abs(dO - f) < EPS) return 4;
  return 5;
}

/** Tabela dos cinco casos, igual à das anotações. */
export const CASE_INFO: Record<ConcaveCase, { objeto: string; imagem: string; traits: string }> = {
  1: { objeto: "além de C", imagem: "entre C e F", traits: "real, invertida e menor" },
  2: { objeto: "em C", imagem: "em C", traits: "real, invertida e do mesmo tamanho" },
  3: { objeto: "entre C e F", imagem: "além de C", traits: "real, invertida e maior" },
  4: { objeto: "em F", imagem: "no infinito", traits: "não se forma imagem (raios refletidos paralelos)" },
  5: { objeto: "entre F e V", imagem: "atrás do espelho", traits: "virtual, direita e maior" },
};

/**
 * Onde a imagem caiu, calculado a partir de d_i (e não do caso).
 * Os testes conferem que isso bate com CASE_INFO — dois caminhos
 * independentes chegando à mesma resposta.
 */
export function imageRegion(di: number, f: number): string {
  if (f < 0) return "atrás do espelho, entre V e F";
  if (!Number.isFinite(di)) return "no infinito";
  if (di < 0) return "atrás do espelho";
  if (Math.abs(di - 2 * f) < 1e-6) return "em C";
  if (di > 2 * f) return "além de C";
  return "entre C e F";
}

export type RayId = 1 | 2 | 3 | 4;

/**
 * Um raio notável. Ele bate no espelho na altura `hit` (em s = 0) e sai
 * na direção `reflDir` (sempre para a frente, reflDir[0] > 0).
 * `aim` é o ponto do eixo que o raio incidente "mira" ou de onde "vem"
 * (F para o raio 2, C para o raio 3).
 *
 * Cada raio é calculado pela SUA regra (paralelo→foco, foco→paralelo,
 * centro→volta, vértice→simétrico). A imagem vem de Gauss, por outro
 * caminho. Os testes provam que todos se cruzam no ponto de Gauss.
 */
export interface NotableRay {
  id: RayId;
  hit: number;
  reflDir: [number, number];
  aim: [number, number] | null;
}

export function notableRay(id: RayId, dO: number, hO: number, f: number): NotableRay | null {
  switch (id) {
    case 1:
      // Chega paralelo (bate na altura do objeto); sai pela reta que passa por F.
      return { id, hit: hO, reflDir: [Math.abs(f), -hO * Math.sign(f)], aim: null };
    case 2: {
      // Reta que passa pela ponta do objeto e por F. Com o objeto sobre F ela
      // seria vertical e nunca chegaria ao espelho.
      if (Math.abs(dO - f) < EPS) return null;
      return { id, hit: (-hO * f) / (dO - f), reflDir: [1, 0], aim: [f, 0] };
    }
    case 3: {
      // Reta que passa pela ponta do objeto e por C; volta sobre si mesma.
      if (Math.abs(dO - 2 * f) < EPS) return null;
      const hit = (-2 * f * hO) / (dO - 2 * f);
      return { id, hit, reflDir: [dO, hO - hit], aim: [2 * f, 0] };
    }
    case 4:
      // Bate no vértice e sai simétrico em relação ao eixo.
      return { id, hit: 0, reflDir: [dO, -hO], aim: null };
  }
}

/** Altura do raio refletido numa posição s. */
export const reflectedHeight = (r: NotableRay, s: number) => r.hit + (r.reflDir[1] / r.reflDir[0]) * s;

/** Cruzamento de dois raios refletidos (ou de seus prolongamentos). */
export function intersectReflected(a: NotableRay, b: NotableRay): { s: number; h: number } | null {
  const ma = a.reflDir[1] / a.reflDir[0];
  const mb = b.reflDir[1] / b.reflDir[0];
  if (Math.abs(ma - mb) < 1e-12) return null; // paralelos
  const s = (b.hit - a.hit) / (ma - mb);
  return { s, h: a.hit + ma * s };
}

/* ────────────────────────────────────────────────────────────
   REFRAÇÃO
   ──────────────────────────────────────────────────────────── */

export interface Refraction {
  /** Ângulo de refração, ou null se houver reflexão total. */
  r: number | null;
  tir: boolean;
  /** Ângulo limite (só existe indo para o meio menos refringente). */
  L: number | null;
}

/** Lei de Snell-Descartes: n₁ · sen i = n₂ · sen r. Ângulos em graus. */
export function refract(n1: number, n2: number, iDeg: number): Refraction {
  const s = (n1 * Math.sin(rad(iDeg))) / n2;
  const L = n1 > n2 ? deg(Math.asin(n2 / n1)) : null;
  if (s > 1 + EPS) return { r: null, tir: true, L };
  return { r: deg(Math.asin(Math.min(1, s))), tir: false, L };
}

/** Profundidade aparente (observação quase perpendicular): p_ap/p_real = n_obs/n_obj. */
export const apparentDepth = (real: number, nObs: number, nObj: number) => (real * nObs) / nObj;

/* ────────────────────────────────────────────────────────────
   ESPELHOS PLANOS
   ──────────────────────────────────────────────────────────── */

/** Imagem de um ponto em um espelho plano vertical na posição x = xm. */
export const planeImage = (xm: number, p: { x: number; y: number }) => ({ x: 2 * xm - p.x, y: p.y });

/** Número de imagens entre dois espelhos e as condições de validade. */
export function mirrorsImageCount(alphaDeg: number) {
  const ratio = 360 / alphaDeg;
  const integer = Math.abs(ratio - Math.round(ratio)) < EPS;
  return { ratio, N: ratio - 1, integer, even: integer && Math.round(ratio) % 2 === 0 };
}
