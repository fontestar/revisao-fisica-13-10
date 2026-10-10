/* ============================================================================
   CONTEÚDO DA REVISÃO — ARQUIVO PRINCIPAL DE EDIÇÃO
   ============================================================================

   É AQUI que você edita TUDO do conteúdo acadêmico:
   título, descrição, partes, teoria, flashcards, questões,
   gabarito (derivado), questões discursivas e vídeos.

   O arquivo está dividido em 4 blocos, nesta ordem:

     1. TIPOS          — o "formato" de cada conteúdo (raramente muda)
     2. CONTEÚDO       — os dados da revisão  ← EDITE AQUI
     3. CÁLCULOS       — contagens e gabarito derivados automaticamente
     4. UTILITÁRIOS    — dois auxiliares minúsculos usados pela interface

   NOTAÇÃO MATEMÁTICA
   ------------------
   Em qualquer texto você pode escrever matemática entre cifrões:
     $...$    → matemática na linha,  ex: "a velocidade $v$ em $m/s$"
     $$...$$  → matemática destacada
   A interface converte isso em notação real (KaTeX) automaticamente.
   Nunca escreva a_ij, x^2 ou sqrt(x) soltos no texto.
   ============================================================================ */


/* ──────────
   1. TIPOS
   ────────── */

// O "formato" de cada conteúdo. A interface só sabe desenhar estes
// tipos na tela — o conteúdo em si fica no bloco 2, logo abaixo.

/** Nome de um ícone (lucide-react) usado para identificar uma parte. */
export type PartIconName =
  | "atom"          // física moderna, estrutura da matéria
  | "rocket"        // cinemática, movimento
  | "move"          // vetores, forças
  | "orbit"         // gravitação, movimento circular
  | "zap"           // eletricidade, circuitos
  | "magnet"        // magnetismo
  | "waves"         // ondas, acústica
  | "sun"           // óptica, luz
  | "thermometer"   // termologia, calor
  | "flame"         // termodinâmica
  | "gauge"         // pressão, hidrostática
  | "battery"       // energia, circuitos
  | "scale"         // equilíbrio, estática
  | "ruler"         // medidas e unidades
  | "timer"         // tempo, período
  | "radiation"     // física nuclear
  | "flask-conical" // experimentos, laboratório
  | "book-open";    // uso geral

export interface Objective {
  id: string;
  text: string;
}

/**
 * Estado de uma parte/conteúdo. Fica aqui (e não em progress.tsx)
 * para que componentes de servidor possam usá-lo sem precisar
 * importar do módulo de progresso, que é só do navegador.
 */
export type PartStatus = "not-started" | "in-progress" | "completed";

/** Blocos de teoria — permitem montar uma página de leitura rica e modular. */
export type TheoryBlock =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; style?: "bullet" | "number"; items: string[] }
  | { type: "definition"; term: string; text: string }
  | {
      type: "callout";
      variant?: "info" | "warning" | "success";
      title?: string;
      text: string;
    }
  | { type: "example"; title?: string; text: string }
  | { type: "formula"; text: string; caption?: string }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "quote"; text: string; source?: string }
  /**
   * Legenda de uma fórmula: o que cada símbolo significa e em qual
   * unidade ele é medido. Use logo depois de um bloco "formula".
   *   { type: "quantities", items: [
   *       { symbol: "v", name: "velocidade", unit: "m/s" },
   *   ]}
   */
  | {
      type: "quantities";
      title?: string;
      items: { symbol: string; name: string; unit?: string }[];
    }
  /**
   * Exemplo resolvido passo a passo (enunciado → passos → resposta).
   * Para um exemplo curto, sem passos, use o bloco "example".
   */
  | {
      type: "solved-example";
      title?: string;
      statement: string;
      steps: string[];
      answer: string;
    }
  /**
   * Imagem, diagrama ou gráfico. Coloque o arquivo na pasta
   * `public/` do projeto e use o caminho a partir dela:
   *   { type: "image", src: "/diagrama.png", alt: "descrição" }
   * O `alt` é obrigatório por acessibilidade.
   */
  | {
      type: "image";
      src: string;
      alt: string;
      caption?: string;
      width?: number;
      height?: number;
    }
  /**
   * Ferramenta interativa embutida na teoria (ver components/interactive.tsx):
   *   "mirror"     → simulador de espelho esférico
   *   "refraction" → simulador de refração
   *   "draw"       → prancheta para o aluno construir o diagrama
   * Em "draw", `template` escolhe o fundo já desenhado.
   */
  | {
      type: "interactive";
      tool: "mirror" | "refraction" | "draw";
      template?: "plano" | "esferico" | "refracao" | "limpo";
      title?: string;
      note?: string;
    }
  /** Lista de conferência para o aluno checar a própria construção. */
  | { type: "checklist"; title?: string; items: string[] }
  /** Desenho fixo do capítulo (ver Diagram em components/interactive.tsx). */
  | { type: "diagram"; name: DiagramName; caption?: string };

/** Desenhos prontos disponíveis para o bloco "diagram". */
export type DiagramName =
  | "reflexao-tipos"
  | "leis-reflexao"
  | "imagem-plano"
  | "campo-visual"
  | "espelhos-90"
  | "refracao"
  | "angulo-limite"
  | "fibra-optica"
  | "profundidade-aparente";

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
}

export interface Alternative {
  id: string;
  text: string;
}

/**
 * Nível de dificuldade declarado do exercício.
 *   1 compreender o conceito · 2 aplicar a fórmula direto
 *   3 interpretar e resolver em etapas · 4 combinar conceitos e desenho
 *   5 desafio no nível da prova
 */
export type ExerciseLevel = 1 | 2 | 3 | 4 | 5;

/**
 * De onde veio o exercício. "professor" = veio do material original da prova;
 * "pratica" = criado para treinar. Fica visível para o aluno não confundir.
 */
export type ExerciseOrigin = "professor" | "pratica";

export interface Question {
  id: string;
  statement: string;
  alternatives: Alternative[];
  /** Id da alternativa correta — fonte única de verdade para gabarito. */
  correctAlternativeId: string;
  explanation?: string;
  level?: ExerciseLevel;
  origin?: ExerciseOrigin;
}

/**
 * Para que serve o vídeo no estudo. Define a seção em que ele aparece
 * na página de videoaulas:
 *   "aulao"      → uma aula única que passa por todo o conteúdo
 *   "teoria"     → playlist com a teoria explicada em várias aulas
 *   "exercicios" → resolução de exercícios
 */
export type VideoKind = "aulao" | "teoria" | "exercicios";

export interface Video {
  id: string;
  title: string;
  description?: string;
  url: string;
  thumbnail?: string;
  durationLabel?: string;
  author?: string;
  kind?: VideoKind;
  /** true quando o link é uma playlist (várias aulas), e não um vídeo único. */
  playlist?: boolean;
}

/**
 * Questão discursiva (aberta). Diferente das objetivas, não tem
 * alternativas: o estudante resolve no papel e depois compara com
 * o roteiro de resolução passo a passo.
 */
export interface DiscursiveQuestion {
  id: string;
  /** Rótulo do tema, usado para agrupar as questões na página. */
  topic: string;
  /** Parte da revisão em que o conteúdo foi estudado. */
  relatedPartId?: string;
  statement: string;
  level?: ExerciseLevel;
  origin?: ExerciseOrigin;
  /** Itens que o aluno deve conferir no próprio desenho, quando a questão pedir construção. */
  checklist?: string[];
  /** Passos comentados da resolução, exibidos ao expandir. */
  solutionSteps: string[];
  /** Resposta final resumida. */
  finalAnswer: string;
}

export interface Part {
  id: string;
  number: number;
  title: string;
  description: string;
  icon?: PartIconName;
  objectives: Objective[];
  theory: TheoryBlock[];
  flashcards: Flashcard[];
  questions: Question[];
  videos: Video[];
}

export interface Review {
  /** Nome curto da plataforma/etiqueta, ex: "SISTEMA DE REVISÃO" */
  kicker: string;
  /** Título principal da revisão. */
  title: string;
  /** Frase de apoio, ex: "Revisão para A.O de Biologia" */
  subtitle: string;
  /** Data ou identificação da avaliação (opcional). */
  identifier?: string;
  /** Descrição livre da revisão. */
  description: string;
  /** Dicas curtas de estudo, exibidas em vários pontos da plataforma. */
  studyTips: string[];
  /** Partes da revisão — quantidade totalmente dinâmica. */
  parts: Part[];
  /** Vídeos gerais, não amarrados a uma parte específica. */
  generalVideos: Video[];
  /**
   * Área geral de questões discursivas — reúne conteúdo de várias
   * partes, como um simulado aberto. Aparece em /discursivas.
   */
  discursiveQuestions: DiscursiveQuestion[];
  /** Catálogo da aula de exercícios do professor (aparece em /gabaritos). */
  professorExercises: ProfessorExercise[];
}

/**
 * Uma questão da lista do professor. O enunciado completo está no PDF da
 * aula; aqui ficam o assunto, o que estudar e o gabarito transcrito.
 */
export interface ProfessorExercise {
  number: number;
  topic: string;
  partId: string;
  asks: string;
  study: string[];
  answer: string;
  /** Conferência de coerência feita sem o enunciado (opcional). */
  check?: string;
}


/* ──────────────────────────────────────
   2. CONTEÚDO DA REVISÃO  ← EDITE AQUI
   ────────────────────────────────────── */

/*
 * VIDEOAULAS
 * Cada vídeo é escrito UMA vez aqui e depois listado nas partes que ele
 * cobre. Para trocar um link, basta mudar uma linha.
 * Títulos e canais conferidos no próprio YouTube.
 */
const AULAO_OPTICA: Video = {
  id: "aulao-optica-pedro-assaad",
  title: "Aulão de óptica geométrica",
  description:
    "Uma aula única que passa pelos três capítulos. Boa para ter a visão geral antes de estudar cada parte, ou para revisar tudo de uma vez na véspera.",
  url: "https://youtu.be/oRPwxS88kZE?si=kVYY8ZGC-NvRKDqH",
  author: "Prof. Pedro Assaad",
  kind: "aulao",
};

const PLAYLIST_OPTICA: Video = {
  id: "playlist-optica-boaro",
  title: "Óptica geométrica, playlist completa",
  description:
    "A teoria explicada em várias aulas curtas. Use para aprofundar o assunto em que você sentiu mais dificuldade.",
  url: "https://youtube.com/playlist?list=PLzjR7HXQnrcejt6bCK57Wxnwa6K9rqt3X&si=Dj9gxDwrj_ANsN4P",
  author: "Prof. Boaro",
  kind: "teoria",
  playlist: true,
};

const EXERCICIOS_PLANOS: Video = {
  id: "exercicios-espelhos-planos",
  title: "Exercícios de espelhos planos",
  description:
    "Playlist de exercícios de espelhos planos. Tente resolver cada questão antes de ver a resolução.",
  url: "https://www.youtube.com/playlist?list=PLWRcGWlXe8V-YMg49og0Xwt4_IhzpCp56",
  author: "Harpa Horta e Educação",
  kind: "exercicios",
  playlist: true,
};

const EXERCICIOS_ESFERICOS: Video = {
  id: "exercicios-espelhos-esfericos",
  title: "Exercícios de espelhos esféricos",
  description:
    "Questões de vestibular sobre espelhos esféricos resolvidas. Ótimas para treinar a equação de Gauss e o aumento linear.",
  url: "https://www.youtube.com/playlist?list=PLaoxD-bOS_uHjN_LzVIUjlJ8-4Ux-z5-z",
  author: "Eureka, física e matemática",
  kind: "exercicios",
  playlist: true,
};

/*
 * ─────────────────────────────────────────────────────────────
 * COMO ADICIONAR UMA PARTE
 * ─────────────────────────────────────────────────────────────
 * Copie o modelo abaixo para dentro do array `parts`. Só
 * id/number/title/description são obrigatórios — uma parte pode
 * começar com teoria e receber flashcards e questões depois.
 *
 * {
 *   id: "cinematica",            // vira a URL: /partes/cinematica
 *   number: 1,
 *   title: "Cinemática",
 *   description: "Resumo curto do que será estudado.",
 *   icon: "rocket",              // ver PartIconName no bloco 1
 *
 *   objectives: [
 *     { id: "obj-1", text: "Diferenciar velocidade média e instantânea" },
 *   ],
 *
 *   theory: [
 *     { type: "heading", text: "Título da seção" },
 *     { type: "paragraph", text: "Explicação curta e direta." },
 *     { type: "definition", term: "Velocidade", text: "..." },
 *     { type: "list", items: ["Ponto 1", "Ponto 2"] },
 *
 *     // fórmula + legenda dos símbolos e unidades
 *     { type: "formula", text: "v = \\dfrac{\\Delta s}{\\Delta t}" },
 *     { type: "quantities", items: [
 *         { symbol: "v", name: "velocidade média", unit: "m/s" },
 *         { symbol: "\\Delta s", name: "deslocamento", unit: "m" },
 *         { symbol: "\\Delta t", name: "intervalo de tempo", unit: "s" },
 *     ]},
 *
 *     // exemplo resolvido passo a passo
 *     { type: "solved-example",
 *       statement: "Enunciado do exemplo...",
 *       steps: ["Primeiro passo...", "Segundo passo..."],
 *       answer: "Resposta final." },
 *
 *     { type: "callout", variant: "warning", title: "Atenção", text: "..." },
 *     { type: "table", headers: ["Grandeza", "Unidade"], rows: [["...", "..."]] },
 *     { type: "image", src: "/diagrama.png", alt: "Descrição da imagem" },
 *   ],
 *
 *   flashcards: [
 *     { id: "fc-1", question: "Pergunta?", answer: "Resposta curta." },
 *   ],
 *
 *   questions: [
 *     { id: "q-1",
 *       statement: "Enunciado...",
 *       alternatives: [
 *         { id: "a", text: "..." },
 *         { id: "b", text: "..." },
 *       ],
 *       correctAlternativeId: "b",
 *       explanation: "Por que a B está correta." },
 *   ],
 *
 *   videos: [],
 * }
 *
 * O gabarito, as contagens e as barras de progresso saem sozinhos
 * desses dados — não há nada para atualizar à mão depois.
 * ─────────────────────────────────────────────────────────────
 */

export const review: Review = {
  kicker: "Física",
  title: "Revisão de Física",
  subtitle: "Teoria, flashcards, questões e videoaulas organizados por parte.",

  // Preencha quando a data da prova for definida, ex:
  // "A.D de Física — 00/00". Deixe undefined para não exibir a tarja.
  identifier: undefined,

  description:
    "Esta revisão está organizada em partes. Cada parte reúne a teoria resumida, os objetivos de aprendizagem, flashcards para memorização e questões no estilo prova. Há ainda áreas gerais com questões discursivas, gabarito e videoaulas.",

  // Dicas de método de estudo exibidas na página inicial.
  studyTips: [
    "Confira as unidades antes de fechar a conta: se elas não baterem, a fórmula aplicada provavelmente não é a certa.",
    "Antes de calcular, desenhe a situação (espelho ou superfície, normal e raios com seta). Boa parte dos erros aparece nessa etapa.",
    "Depois de errar uma questão, volte à teoria da mesma parte antes de tentar de novo.",
  ],

  // ← As partes da revisão entram aqui (veja o modelo acima).
  parts: [
    /* ══════════════════════════════════════════════════════════
       PARTE 1 — ESPELHOS PLANOS
       ══════════════════════════════════════════════════════════ */
    {
      id: "espelhos-planos",
      number: 1,
      title: "Espelhos planos",
      description:
        "Capítulo 14 · Como a luz reflete, por que a imagem no espelho parece estar atrás dele e como descobrir quantas imagens aparecem quando juntamos dois espelhos.",
      icon: "sun",
      objectives: [
        { id: "obj-1", text: "Diferenciar reflexão especular de reflexão difusa" },
        { id: "obj-2", text: "Aplicar as duas leis da reflexão medindo os ângulos a partir da normal" },
        { id: "obj-3", text: "Construir a imagem de um ponto e de um objeto em um espelho plano" },
        { id: "obj-4", text: "Usar a simetria para calcular distâncias entre objeto, espelho e imagem" },
        { id: "obj-5", text: "Calcular o número de imagens em dois espelhos que formam um ângulo" },
      ],
      theory: [
        { type: "heading", text: "1. Começando do começo: o que é refletir" },
        {
          type: "paragraph",
          text: "Você só enxerga um objeto quando a luz sai dele e chega aos seus olhos. Alguns corpos produzem luz própria (o Sol, uma lâmpada). A maioria, não: eles apenas devolvem a luz que recebem. Essa devolução é o que chamamos de reflexão.",
        },
        {
          type: "paragraph",
          text: "Agora repare numa coisa curiosa do dia a dia: você vê a parede do seu quarto, mas não vê o seu rosto nela. Já no espelho do banheiro você vê o seu rosto. Nos dois casos a luz está sendo refletida. A diferença está em como a superfície devolve essa luz.",
        },
        {
          type: "table",
          headers: ["", "Reflexão difusa", "Reflexão especular"],
          rows: [
            ["Superfície", "Irregular (parede, papel, roupa)", "Lisa e polida (espelho, água parada)"],
            ["O que acontece", "Os raios saem espalhados para todos os lados", "Raios paralelos continuam paralelos depois de refletir"],
            ["Resultado", "Você vê o objeto, mas não forma imagem", "Forma imagem nítida"],
          ],
        },
        {
          type: "diagram",
          name: "reflexao-tipos",
          caption:
            "Como desenhar: na especular, superfície lisa com raios incidentes paralelos e refletidos também paralelos. Na difusa, superfície irregular com os mesmos incidentes paralelos, mas refletidos saindo em direções diferentes.",
        },
        {
          type: "callout",
          variant: "info",
          title: "Guarde esta ideia",
          text: "É a reflexão difusa que permite enxergar as coisas ao redor; é a especular que forma imagem. O espelho plano é o caso mais simples de reflexão especular.",
        },

        { type: "heading", text: "2. O vocabulário que a prova usa" },
        {
          type: "paragraph",
          text: "Antes das leis, precisamos nomear os elementos do desenho. Sem esses nomes, o enunciado fica impossível de entender.",
        },
        {
          type: "list",
          items: [
            "**Raio incidente**: o raio de luz que chega à superfície.",
            "**Ponto de incidência**: o ponto exato onde o raio bate no espelho.",
            "**Normal**: uma reta imaginária perpendicular (a 90°) à superfície, traçada no ponto de incidência. Ela não é um raio de luz, é só uma linha de referência, e por isso costuma ser desenhada tracejada.",
            "**Raio refletido**: o raio que volta depois de bater no espelho.",
            "**Ângulo de incidência ($i$)**: ângulo entre o raio incidente e a normal.",
            "**Ângulo de reflexão ($r$)**: ângulo entre o raio refletido e a normal.",
          ],
        },
        {
          type: "callout",
          variant: "warning",
          title: "O erro número 1 dessa matéria",
          text: "Os ângulos são sempre medidos a partir da NORMAL, nunca a partir da superfície do espelho. Se o enunciado disser que o raio faz 30° com o espelho, o ângulo de incidência é $90° - 30° = 60°$.",
        },

        { type: "heading", text: "3. As duas leis da reflexão" },
        {
          type: "paragraph",
          text: "Toda a óptica dos espelhos sai destas duas regras. Elas valem para qualquer espelho, plano ou curvo.",
        },
        {
          type: "definition",
          term: "1ª lei",
          text: "O raio incidente, a normal e o raio refletido estão todos no mesmo plano. Na prática: a luz não 'foge para o lado', então o desenho pode ser feito numa folha plana.",
        },
        {
          type: "definition",
          term: "2ª lei",
          text: "O ângulo de reflexão é igual ao ângulo de incidência.",
        },
        { type: "formula", text: "i = r" },
        {
          type: "quantities",
          items: [
            { symbol: "i", name: "ângulo de incidência (entre raio incidente e normal)", unit: "graus" },
            { symbol: "r", name: "ângulo de reflexão (entre raio refletido e normal)", unit: "graus" },
          ],
        },
        { type: "diagram", name: "leis-reflexao", caption: "RI = raio incidente · RR = raio refletido · N = normal. Os três ficam no mesmo plano (1ª lei) e $i = r$ (2ª lei)." },
        { type: "paragraph", text: "**Como desenhar:**" },
        {
          type: "list",
          style: "number",
          items: [
            "Trace o espelho.",
            "Marque o ponto de incidência.",
            "Desenhe a normal, perpendicular ao espelho, tracejada.",
            "Trace o raio incidente chegando ao ponto, com seta.",
            "Trace o raio refletido saindo do ponto, do outro lado da normal.",
            "Marque os ângulos $i$ e $r$ entre cada raio e a normal.",
            "Identifique RI, RR e N.",
          ],
        },
        {
          type: "solved-example",
          title: "Exemplo resolvido 1: cuidado com o ângulo",
          statement:
            "Um raio de luz atinge um espelho plano formando $20°$ com a superfície do espelho. Determine o ângulo de reflexão e o ângulo entre o raio incidente e o raio refletido.",
          steps: [
            "O enunciado deu o ângulo com a SUPERFÍCIE, mas a lei trabalha com a normal. Como a normal é perpendicular à superfície, os dois ângulos somam $90°$.",
            "Ângulo de incidência: $i = 90° - 20° = 70°$.",
            "Pela 2ª lei, $r = i = 70°$.",
            "O raio incidente está $70°$ de um lado da normal e o refletido $70°$ do outro lado. O ângulo entre eles é a soma: $70° + 70° = 140°$.",
          ],
          answer: "$r = 70°$ e o ângulo entre os dois raios vale $140°$.",
        },

        { type: "heading", text: "4. Por que a imagem parece estar atrás do espelho" },
        {
          type: "paragraph",
          text: "Pegue um ponto qualquer do seu rosto. Dele saem raios em várias direções; alguns batem no espelho e voltam para o seu olho. Esses raios que voltam são divergentes, ou seja, se afastam uns dos outros.",
        },
        {
          type: "paragraph",
          text: "O seu cérebro, porém, supõe que a luz sempre andou em linha reta. Ele então prolonga os raios para trás do espelho (linhas tracejadas no desenho) e conclui que eles saíram de um ponto lá atrás. Esse ponto é a imagem.",
        },
        {
          type: "definition",
          term: "Imagem virtual",
          text: "Imagem formada pelo cruzamento dos PROLONGAMENTOS dos raios, e não dos raios de verdade. Como não há luz de fato naquele ponto, ela não pode ser projetada em uma folha de papel. No espelho plano a imagem é sempre virtual.",
        },
        {
          type: "paragraph",
          text: "Juntando tudo, a imagem num espelho plano tem sempre as mesmas quatro características:",
        },
        {
          type: "list",
          style: "number",
          items: [
            "**Virtual**: está atrás do espelho e não pode ser projetada.",
            "**Direita**: não fica de cabeça para baixo.",
            "**Do mesmo tamanho** do objeto.",
            "**Simétrica**: fica à mesma distância do espelho que o objeto, do outro lado.",
          ],
        },
        {
          type: "diagram",
          name: "imagem-plano",
          caption:
            "O raio sai da ponta do objeto, reflete obedecendo $i = r$ e chega ao olho. O prolongamento tracejado do refletido, atrás do espelho, passa pela ponta da imagem.",
        },
        {
          type: "callout",
          variant: "info",
          title: "E a inversão entre esquerda e direita?",
          text: "Quando você levanta a mão direita, a imagem parece levantar a esquerda. O espelho não troca esquerda com direita de verdade: ele inverte a frente com o fundo (profundidade). Essa troca é chamada de inversão enantiomorfa. A imagem continua sendo 'direita' no sentido da Física, porque não está de cabeça para baixo.",
        },

        { type: "heading", text: "5. A conta de distância" },
        {
          type: "paragraph",
          text: "A simetria dá a relação mais usada em exercício: a distância do objeto ao espelho é igual à distância da imagem ao espelho.",
        },
        { type: "formula", text: "d_{\\text{objeto}} = d_{\\text{imagem}}" },
        {
          type: "paragraph",
          text: "E, como objeto e imagem ficam em lados opostos, a distância entre eles é o dobro:",
        },
        { type: "formula", text: "D_{\\text{objeto-imagem}} = 2d" },
        {
          type: "quantities",
          items: [
            { symbol: "d", name: "distância do objeto até o espelho", unit: "m" },
            { symbol: "D", name: "distância do objeto até a sua imagem", unit: "m" },
          ],
        },
        {
          type: "callout",
          variant: "warning",
          title: "Consequência que cai muito",
          text: "Se você anda $1\\ m$ na direção do espelho, sua imagem também anda $1\\ m$ na sua direção. A distância entre vocês diminui $2\\ m$. Por isso se diz que a imagem se aproxima com o dobro da sua velocidade em relação a você. Mas a velocidade dela em relação ao chão é igual à sua.",
        },
        {
          type: "solved-example",
          title: "Exemplo resolvido 2: objeto em movimento",
          statement:
            "Uma pessoa está a $2{,}5\\ m$ de um espelho plano fixo e caminha $0{,}8\\ m$ em direção a ele. De quanto diminuiu a distância entre a pessoa e a sua imagem?",
          steps: [
            "Situação inicial: a pessoa está a $2{,}5\\ m$, então a imagem está a $2{,}5\\ m$ do outro lado. Distância entre as duas: $D_i = 2 \\times 2{,}5 = 5{,}0\\ m$.",
            "Depois de andar $0{,}8\\ m$, a pessoa fica a $2{,}5 - 0{,}8 = 1{,}7\\ m$ do espelho.",
            "A imagem acompanha e também fica a $1{,}7\\ m$: $D_f = 2 \\times 1{,}7 = 3{,}4\\ m$.",
            "Variação: $5{,}0 - 3{,}4 = 1{,}6\\ m$.",
            "Conferindo pelo atalho: a distância varia o dobro do deslocamento, $2 \\times 0{,}8 = 1{,}6\\ m$. Bate.",
          ],
          answer: "A distância diminuiu $1{,}6\\ m$ (o dobro dos $0{,}8\\ m$ caminhados).",
        },

        { type: "heading", text: "6. Como desenhar a construção" },
        {
          type: "paragraph",
          text: "A prova pede desenho, então vale decorar o procedimento. Para achar a imagem de um ponto:",
        },
        {
          type: "list",
          style: "number",
          items: [
            "Trace do ponto uma reta perpendicular ao espelho (uma linha auxiliar).",
            "Meça a distância do ponto até o espelho sobre essa perpendicular.",
            "Marque, do outro lado do espelho e sobre a mesma reta, um ponto à mesma distância. Pronto, essa é a imagem.",
            "Para um objeto extenso (uma seta, por exemplo), repita isso para as duas pontas e ligue os pontos encontrados.",
            "Desenhe a imagem sempre em linha tracejada: ela é virtual.",
          ],
        },
        {
          type: "paragraph",
          text: "E para mostrar um raio chegando ao olho: saia do objeto, bata no espelho, aplique $i = r$ e siga até o olho. Depois, tracejando, prolongue o raio refletido para trás até a imagem.",
        },
        {
          type: "interactive",
          tool: "draw",
          template: "plano",
          title: "Pratique a construção",
          note: "A seta e o espelho já estão desenhados. Construa a imagem e um raio, depois toque em **Conferir construção**. Se travar, use **Ver construção correta**.",
        },
        {
          type: "checklist",
          title: "Confira sua construção",
          items: [
            "A imagem está do outro lado do espelho, à mesma distância do objeto.",
            "A linha que liga objeto e imagem é perpendicular ao espelho.",
            "A imagem e os prolongamentos estão tracejados (são virtuais).",
            "Nos raios refletidos, o ângulo com a normal é igual ao do raio incidente.",
            "Os raios refletidos de verdade só existem na frente do espelho.",
          ],
        },

        { type: "heading", text: "7. Campo visual" },
        {
          type: "paragraph",
          text: "Um espelho não mostra tudo: ele tem um campo visual, que é a região do espaço que o observador consegue enxergar por ele. Para achar esse campo, pegue a imagem do olho do observador e trace retas dela até as duas bordas do espelho. A região entre essas retas, na frente do espelho, é o que ele vê.",
        },
        {
          type: "diagram",
          name: "campo-visual",
          caption:
            "Retas da imagem do observador até as bordas do espelho delimitam o campo visual (região sombreada). A está dentro dele e é vista; B está fora e não é.",
        },
        { type: "paragraph", text: "**Como desenhar:** espelho como um segmento; marque as extremidades; desenhe o observador e a imagem virtual dele (simétrica, atrás do espelho); trace retas dessa imagem até as extremidades e prolongue para a frente. A região entre essas retas é a visível: teste cada objeto vendo se ele cai dentro dela." },
        {
          type: "paragraph",
          text: "Daí sai um resultado famoso: para uma pessoa se ver de corpo inteiro, basta um espelho com METADE da sua altura, e isso não depende da distância em que ela está.",
        },
        {
          type: "solved-example",
          title: "Exemplo resolvido 3: o espelho de corpo inteiro",
          statement:
            "Uma pessoa de $1{,}70\\ m$ quer um espelho vertical no qual se veja dos pés à cabeça. Qual a altura mínima do espelho?",
          steps: [
            "Para ver o topo da cabeça, o raio sai da cabeça, bate no espelho e chega ao olho. Como $i = r$, o ponto onde ele bate fica exatamente na metade da altura entre a cabeça e o olho.",
            "Para ver os pés, pelo mesmo motivo, o raio bate no espelho na metade da altura entre o olho e o chão.",
            "Chamando a altura da pessoa de $H$ e a altura dos olhos de $E$: o ponto de cima está em $\\dfrac{H+E}{2}$ e o de baixo em $\\dfrac{E}{2}$.",
            "O espelho precisa ir de um ponto ao outro: $\\dfrac{H+E}{2} - \\dfrac{E}{2} = \\dfrac{H}{2}$.",
            "Repare que o $E$ sumiu da conta: não importa a altura dos olhos nem a distância até o espelho.",
            "Logo, $\\dfrac{1{,}70}{2} = 0{,}85\\ m$.",
          ],
          answer: "$0{,}85\\ m$, metade da altura da pessoa, independente da distância.",
        },

        { type: "heading", text: "8. Associação de espelhos" },
        {
          type: "paragraph",
          text: "Quando dois espelhos se enfrentam, a imagem de um vira objeto para o outro, e aparecem várias imagens.",
        },
        {
          type: "paragraph",
          text: "**Espelhos paralelos** (um de frente para o outro): a imagem de um reflete no outro, que reflete de volta, e assim por diante. Em teoria formam-se infinitas imagens. Na prática, elas vão ficando mais escuras porque cada reflexão perde um pouco de luz.",
        },
        {
          type: "paragraph",
          text: "**Espelhos formando um ângulo $\\alpha$**: o número de imagens é finito e dado pela fórmula abaixo.",
        },
        { type: "formula", text: "N = \\dfrac{360°}{\\alpha} - 1" },
        {
          type: "quantities",
          items: [
            { symbol: "N", name: "número de imagens formadas" },
            { symbol: "\\alpha", name: "ângulo entre os dois espelhos", unit: "graus" },
          ],
        },
        {
          type: "callout",
          variant: "warning",
          title: "Quando a fórmula vale",
          text: "As anotações registram o uso direto quando $360°/\\alpha$ é inteiro e o objeto está na **bissetriz** (a reta que divide o ângulo ao meio), e nessa situação a fórmula sempre vale. Quando a razão é inteira e **par** (90°, 60°, 45°...), ela vale em qualquer posição do objeto. Se a razão for ímpar e o objeto estiver fora da bissetriz, o número de imagens muda.",
        },
        {
          type: "solved-example",
          title: "Exemplo resolvido 4: espelhos angulares",
          statement:
            "Dois espelhos planos formam entre si um ângulo de $60°$. Quantas imagens de um objeto colocado entre eles são formadas?",
          steps: [
            "Primeiro, teste a validade: $\\dfrac{360°}{60°} = 6$, que é inteiro e par. A fórmula se aplica sem restrição.",
            "Aplicando: $N = 6 - 1 = 5$.",
            "Interpretação: as cinco imagens se distribuem ao redor do vértice onde os espelhos se encontram, junto com o objeto, completando a volta de $360°$ em 6 posições igualmente espaçadas.",
          ],
          answer: "$N = 5$ imagens.",
        },
        {
          type: "paragraph",
          text: "Caso especial que aparece bastante: **espelhos perpendiculares** ($\\alpha = 90°$). Aí $N = \\dfrac{360°}{90°} - 1 = 4 - 1 = 3$ imagens. Duas vêm da reflexão em cada espelho e a terceira, no canto, vem da dupla reflexão.",
        },
        { type: "diagram", name: "espelhos-90", caption: "Espelhos perpendiculares: duas imagens por reflexão simples (I₁ e I₂) e uma terceira, no canto, por dupla reflexão (I₃)." },
        {
          type: "solved-example",
          title: "Exemplo resolvido 5: distâncias às três imagens",
          statement:
            "Dois espelhos planos $E_1$ e $E_2$ são perpendiculares. Um objeto está a $6\\ cm$ de $E_2$ e a $8\\ cm$ de $E_1$. Calcule a distância do objeto a cada uma das três imagens.",
          steps: [
            "Imagem em $E_2$ ($I_1$): fica do outro lado de $E_2$, à mesma distância. Distância objeto-imagem $= 2 \\times 6 = 12\\ cm$.",
            "Imagem em $E_1$ ($I_2$): pelo mesmo motivo, $2 \\times 8 = 16\\ cm$.",
            "Imagem do canto ($I_3$): vem da dupla reflexão e fica no vértice oposto de um retângulo de lados $12$ e $16\\ cm$. A distância até ela é a diagonal.",
            "Pitágoras: $d^2 = 12^2 + 16^2 = 144 + 256 = 400$, então $d = 20\\ cm$.",
            "Conferência: $N = 360°/90° - 1 = 3$, exatamente as três imagens encontradas.",
          ],
          answer: "$12\\ cm$, $16\\ cm$ e $20\\ cm$.",
        },
        { type: "paragraph", text: "**Como desenhar:** os dois espelhos formando o ângulo; marque $\\alpha$ e trace a bissetriz; coloque o objeto entre eles; ache cada imagem por simetria em relação a cada espelho (e a do canto pela simetria da simetria); conte as imagens e indique as posições." },

        { type: "heading", text: "9. Erros frequentes" },
        {
          type: "list",
          items: [
            "Medir os ângulos a partir do espelho em vez da normal. Sempre converta: ângulo com a superfície $= 90° -$ ângulo com a normal.",
            "Dizer que a imagem do espelho plano é real. Ela é sempre virtual: não dá para projetá-la numa folha.",
            "Esquecer o fator 2: andar $1\\ m$ aproxima você da imagem em $2\\ m$, não em $1\\ m$.",
            "Achar que o espelho de corpo inteiro precisa ter a altura da pessoa. Precisa só da metade.",
            "Usar $N = 360/\\alpha - 1$ sem checar se $360/\\alpha$ é inteiro par.",
            "Desenhar os raios refletidos atrás do espelho como linha cheia. Atrás do espelho, só prolongamento tracejado.",
          ],
        },

        { type: "heading", text: "10. Resumo da parte" },
        {
          type: "table",
          headers: ["Assunto", "O que guardar"],
          rows: [
            ["Leis da reflexão", "$i = r$, medidos a partir da normal; tudo no mesmo plano"],
            ["Imagem no espelho plano", "Virtual, direita, mesmo tamanho, simétrica"],
            ["Distâncias", "$d_{obj} = d_{img}$ e $D = 2d$"],
            ["Deslocamento", "Objeto anda $x$ → distância objeto-imagem muda $2x$"],
            ["Corpo inteiro", "Altura mínima do espelho $= H/2$"],
            ["Espelhos paralelos", "Infinitas imagens"],
            ["Espelhos em ângulo", "$N = 360°/\\alpha - 1$ (checar se é inteiro par)"],
            ["Perpendiculares", "$3$ imagens"],
          ],
        },
      ],
      flashcards: [
        { id: "fc-1", question: "Qual é a diferença entre reflexão especular e difusa?", answer: "Na especular a superfície é polida e raios paralelos continuam paralelos, formando imagem. Na difusa a superfície é irregular e espalha a luz, permitindo ver o objeto mas sem formar imagem." },
        { id: "fc-2", question: "O que é a normal, em óptica?", answer: "Uma reta imaginária perpendicular à superfície, traçada no ponto de incidência. É a referência para medir os ângulos, e não um raio de luz." },
        { id: "fc-3", question: "Enuncie a 2ª lei da reflexão.", answer: "O ângulo de reflexão é igual ao ângulo de incidência: $i = r$ (ambos medidos a partir da normal)." },
        { id: "fc-4", question: "Quais são as quatro características da imagem em um espelho plano?", answer: "Virtual, direita, do mesmo tamanho do objeto e simétrica em relação ao espelho." },
        { id: "fc-5", question: "Por que a imagem do espelho plano é chamada de virtual?", answer: "Porque é formada pelo cruzamento dos prolongamentos dos raios refletidos, e não pelos raios de verdade. Por isso não pode ser projetada em um anteparo." },
        { id: "fc-6", question: "Se um objeto está a $3\\ m$ de um espelho plano, qual é a distância entre ele e sua imagem?", answer: "$6\\ m$, pois a imagem fica a $3\\ m$ do outro lado, então a distância total é $2d$." },
        { id: "fc-7", question: "Qual é a altura mínima de um espelho para uma pessoa se ver de corpo inteiro?", answer: "Metade da altura da pessoa ($H/2$), e isso não depende da distância até o espelho." },
        { id: "fc-8", question: "Qual é a fórmula do número de imagens em dois espelhos que formam ângulo $\\alpha$?", answer: "$N = \\dfrac{360°}{\\alpha} - 1$, garantida quando $360°/\\alpha$ é inteiro e par." },
        { id: "fc-9", question: "Quantas imagens se formam em dois espelhos perpendiculares?", answer: "Três ($N = 360°/90° - 1 = 3$)." },
      ],
      questions: [
        {
          id: "q-1",
          level: 1,
          origin: "pratica",
          statement: "Você consegue ver a parede do seu quarto, mas não enxerga seu rosto refletido nela. Isso acontece porque na parede ocorre predominantemente:",
          alternatives: [
            { id: "a", text: "refração da luz" },
            { id: "b", text: "reflexão difusa" },
            { id: "c", text: "reflexão especular" },
            { id: "d", text: "absorção total da luz" },
          ],
          correctAlternativeId: "b",
          explanation:
            "A parede tem superfície irregular: ela devolve a luz espalhada em todas as direções (reflexão difusa). É isso que permite enxergá-la de qualquer ponto do quarto, mas impede a formação de imagem. Se houvesse absorção total, a parede seria invisível (preta).",
        },
        {
          id: "q-2",
          level: 1,
          origin: "pratica",
          statement: "A imagem de uma pessoa em um espelho plano é sempre:",
          alternatives: [
            { id: "a", text: "real, invertida e do mesmo tamanho" },
            { id: "b", text: "real, direita e menor" },
            { id: "c", text: "virtual, invertida e maior" },
            { id: "d", text: "virtual, direita e do mesmo tamanho" },
          ],
          correctAlternativeId: "d",
          explanation:
            "No espelho plano a imagem é formada pelos prolongamentos dos raios (virtual), não fica de cabeça para baixo (direita) e tem exatamente o tamanho do objeto. A troca aparente entre mão direita e esquerda não torna a imagem 'invertida' no sentido da Física.",
        },
        {
          id: "q-3",
          level: 2,
          origin: "pratica",
          statement: "Um objeto está a $45\\ cm$ de um espelho plano. Qual é a distância entre o objeto e sua imagem?",
          alternatives: [
            { id: "a", text: "$90\\ cm$" },
            { id: "b", text: "$45\\ cm$" },
            { id: "c", text: "$22{,}5\\ cm$" },
            { id: "d", text: "$135\\ cm$" },
          ],
          correctAlternativeId: "a",
          explanation:
            "A imagem é simétrica: fica a $45\\ cm$ do outro lado do espelho. Como objeto e imagem estão em lados opostos, somam-se as duas distâncias: $D = 2d = 2 \\times 45 = 90\\ cm$.",
        },
        {
          id: "q-4",
          level: 2,
          origin: "pratica",
          statement: "Um raio de luz incide sobre um espelho plano formando um ângulo de $25°$ com a SUPERFÍCIE do espelho. O ângulo de reflexão vale:",
          alternatives: [
            { id: "a", text: "$25°$" },
            { id: "b", text: "$50°$" },
            { id: "c", text: "$65°$" },
            { id: "d", text: "$130°$" },
          ],
          correctAlternativeId: "c",
          explanation:
            "Cuidado com a pegadinha: o enunciado deu o ângulo com a superfície, mas os ângulos da reflexão são medidos a partir da normal. Como a normal é perpendicular à superfície, $i = 90° - 25° = 65°$. Pela 2ª lei, $r = i = 65°$. (A alternativa $130°$ é o ângulo entre o raio incidente e o refletido, não o de reflexão.)",
        },
        {
          id: "q-5",
          level: 3,
          origin: "pratica",
          statement: "Uma pessoa está a $3{,}0\\ m$ de um espelho plano fixo e caminha $1{,}2\\ m$ em direção ao espelho. A distância entre a pessoa e sua imagem passou a ser:",
          alternatives: [
            { id: "a", text: "$1{,}8\\ m$" },
            { id: "b", text: "$6{,}0\\ m$" },
            { id: "c", text: "$4{,}8\\ m$" },
            { id: "d", text: "$3{,}6\\ m$" },
          ],
          correctAlternativeId: "d",
          explanation:
            "Depois de caminhar, a pessoa fica a $3{,}0 - 1{,}2 = 1{,}8\\ m$ do espelho. A imagem acompanha e fica a $1{,}8\\ m$ do outro lado, então $D = 2 \\times 1{,}8 = 3{,}6\\ m$. Conferindo: antes era $6{,}0\\ m$ e a distância diminui o dobro do deslocamento ($2 \\times 1{,}2 = 2{,}4$), ou seja, $6{,}0 - 2{,}4 = 3{,}6\\ m$.",
        },
        {
          id: "q-6",
          level: 3,
          origin: "pratica",
          statement: "Dois espelhos planos formam entre si um ângulo de $45°$. O número de imagens formadas de um objeto colocado entre eles é:",
          alternatives: [
            { id: "a", text: "$5$" },
            { id: "b", text: "$6$" },
            { id: "c", text: "$8$" },
            { id: "d", text: "$7$" },
          ],
          correctAlternativeId: "d",
          explanation:
            "Primeiro confira a validade: $360°/45° = 8$, inteiro e par, então a fórmula vale sem restrição. Aplicando: $N = 8 - 1 = 7$ imagens. O erro comum é esquecer de subtrair 1 e responder 8.",
        },
        {
          id: "q-7",
          level: 4,
          origin: "pratica",
          statement: "Uma pessoa de $1{,}80\\ m$ de altura quer instalar um espelho plano vertical para se ver de corpo inteiro, de pé a $2\\ m$ de distância. A altura mínima do espelho deve ser:",
          alternatives: [
            { id: "a", text: "$0{,}45\\ m$" },
            { id: "b", text: "$0{,}90\\ m$" },
            { id: "c", text: "$1{,}80\\ m$" },
            { id: "d", text: "Depende da distância de $2\\ m$ informada." },
          ],
          correctAlternativeId: "b",
          explanation:
            "Aplicando $i = r$, o raio que vem da cabeça atinge o espelho na metade da altura entre a cabeça e o olho, e o raio que vem dos pés o atinge na metade da altura entre o olho e o chão. A diferença entre esses dois pontos é sempre $H/2$, e a altura dos olhos se cancela na conta. Logo, $1{,}80/2 = 0{,}90\\ m$. A distância de $2\\ m$ é informação irrelevante: ela muda a posição do espelho na parede, não a altura necessária.",
        },
        {
          id: "q-8",
          level: 3,
          origin: "pratica",
          statement: "Um objeto permanece parado diante de um espelho plano. O espelho é então afastado $0{,}5\\ m$ do objeto, mantendo-se paralelo à posição inicial. A imagem do objeto:",
          alternatives: [
            { id: "a", text: "desloca-se $1{,}0\\ m$, afastando-se do objeto" },
            { id: "b", text: "desloca-se $0{,}5\\ m$, afastando-se do objeto" },
            { id: "c", text: "não se desloca" },
            { id: "d", text: "desloca-se $1{,}0\\ m$, aproximando-se do objeto" },
          ],
          correctAlternativeId: "a",
          explanation:
            "Chame de $d$ a distância inicial objeto-espelho; a imagem está a $d$ do outro lado, ou seja, a $2d$ do objeto. Afastando o espelho $0{,}5\\ m$, a nova distância objeto-espelho é $d + 0{,}5$, e a imagem passa a estar a $2(d+0{,}5) = 2d + 1{,}0$ do objeto. Ela se afastou $1{,}0\\ m$, o dobro do deslocamento do espelho.",
        },
      ],
      videos: [EXERCICIOS_PLANOS, AULAO_OPTICA, PLAYLIST_OPTICA],
    },

    /* ══════════════════════════════════════════════════════════
       PARTE 2 — ESPELHOS ESFÉRICOS
       ══════════════════════════════════════════════════════════ */
    {
      id: "espelhos-esfericos",
      number: 2,
      title: "Espelhos esféricos",
      description:
        "Capítulo 15 · Côncavos e convexos: os elementos do espelho, os raios notáveis, os cinco casos de imagem e as contas da equação de Gauss e do aumento.",
      icon: "orbit",
      objectives: [
        { id: "obj-1", text: "Distinguir espelho côncavo (convergente) de convexo (divergente)" },
        { id: "obj-2", text: "Identificar vértice, centro de curvatura, foco, eixo principal, $R$ e $f$" },
        { id: "obj-3", text: "Usar os raios notáveis para construir a imagem geometricamente" },
        { id: "obj-4", text: "Reconhecer os cinco casos de imagem no espelho côncavo" },
        { id: "obj-5", text: "Aplicar a equação de Gauss e o aumento linear com a convenção de sinais correta" },
        { id: "obj-6", text: "Interpretar o sinal de $d_i$ e de $A$ para classificar a imagem" },
      ],
      theory: [
        { type: "heading", text: "1. O que muda em relação ao espelho plano" },
        {
          type: "paragraph",
          text: "Um espelho esférico é um pedaço (uma calota) de uma esfera com a parte de dentro ou de fora espelhada. Você já usou dois: o espelho de maquiagem, que aumenta o rosto, e o espelho de segurança de loja, que mostra o corredor inteiro bem pequeno.",
        },
        {
          type: "paragraph",
          text: "A diferença para o espelho plano é grande: aqui a imagem muda conforme a distância do objeto. Ela pode ser maior, menor, direita, invertida, real ou virtual. Por isso precisamos de ferramentas novas: os raios notáveis (desenho) e a equação de Gauss (conta).",
        },
        {
          type: "table",
          headers: ["Tipo", "Superfície espelhada", "Comportamento", "Apelido"],
          rows: [
            ["Côncavo", "A parte de dentro da calota (o 'fundo da panela')", "Faz raios paralelos CONVERGIREM para um ponto", "Convergente"],
            ["Convexo", "A parte de fora da calota", "Faz raios paralelos se ESPALHAREM (divergirem)", "Divergente"],
          ],
        },

        { type: "heading", text: "2. Os elementos do espelho" },
        {
          type: "paragraph",
          text: "Todo exercício começa por marcar estes pontos no desenho. Decore os nomes, porque o enunciado vai usá-los sem explicar.",
        },
        {
          type: "list",
          items: [
            "**Vértice (V)**: o centro do espelho, o ponto do meio da calota.",
            "**Centro de curvatura (C)**: o centro da esfera da qual o espelho foi recortado.",
            "**Raio de curvatura (R)**: a distância de V até C. É o raio daquela esfera.",
            "**Eixo principal**: a reta que passa por V e por C.",
            "**Foco (F)**: o ponto onde os raios paralelos ao eixo se cruzam (ou de onde parecem sair) depois de refletir. Fica sempre no meio do caminho entre V e C.",
            "**Distância focal (f)**: a distância de V até F.",
          ],
        },
        { type: "formula", text: "f = \\dfrac{R}{2}" },
        {
          type: "quantities",
          items: [
            { symbol: "f", name: "distância focal (do vértice ao foco)", unit: "cm ou m" },
            { symbol: "R", name: "raio de curvatura (do vértice ao centro de curvatura)", unit: "cm ou m" },
          ],
        },
        {
          type: "paragraph",
          text: "No modelo escolar, F fica exatamente no meio do caminho entre V e C: a distância de F até V é igual à de F até C. No **côncavo**, F e C ficam na frente do espelho, com C mais longe de V do que F. No **convexo**, F e C ficam atrás do espelho e são virtuais.",
        },
        {
          type: "callout",
          variant: "warning",
          title: "Condições de nitidez de Gauss",
          text: "A relação $f = R/2$ e tudo o que vem a seguir só valem para espelhos com abertura pequena e raios próximos do eixo principal, pouco inclinados. São as condições de Gauss. Num espelho muito aberto, os raios das bordas cruzam em pontos diferentes e a imagem sai borrada. Esse defeito se chama aberração esférica. Em prova, assume-se sempre que as condições de Gauss valem.",
        },

        { type: "heading", text: "3. A convenção de sinais (leia com atenção)" },
        {
          type: "paragraph",
          text: "Essa é a parte onde mais se erra. Todo o resto depende de acertar os sinais. Vamos adotar a convenção de Gauss, que é a usada no Ensino Médio brasileiro, e mantê-la do início ao fim do site.",
        },
        {
          type: "table",
          headers: ["Grandeza", "Positiva quando...", "Negativa quando..."],
          rows: [
            ["$f$ e $R$", "espelho côncavo (convergente)", "espelho convexo (divergente)"],
            ["$d_o$ (objeto)", "objeto real, na frente do espelho (caso normal)", "objeto virtual (raro no Ensino Médio)"],
            ["$d_i$ (imagem)", "imagem real, na frente do espelho", "imagem virtual, atrás do espelho"],
            ["$A$ (aumento)", "imagem direita", "imagem invertida"],
          ],
        },
        {
          type: "callout",
          variant: "info",
          title: "O jeito rápido de ler o resultado",
          text: "Depois de fazer a conta, o próprio sinal te conta tudo: $d_i$ positivo → imagem real; $d_i$ negativo → virtual. $A$ positivo → direita; $A$ negativo → invertida. $|A| > 1$ → maior; $|A| < 1$ → menor.",
        },

        { type: "heading", text: "4. Os raios notáveis" },
        {
          type: "paragraph",
          text: "Para construir a imagem no desenho não precisamos traçar todos os raios: bastam dois destes quatro, que têm comportamento conhecido. Onde eles se cruzarem estará a imagem.",
        },
        {
          type: "list",
          style: "number",
          items: [
            "Raio que chega **paralelo ao eixo principal** → reflete passando pelo **foco** (no convexo, o prolongamento é que passa pelo foco atrás).",
            "Raio que chega **passando pelo foco** → reflete **paralelo ao eixo principal**. (É o de cima ao contrário.)",
            "Raio que chega **na direção do centro de curvatura C** → reflete **sobre si mesmo**, voltando pelo mesmo caminho, porque incide perpendicular ao espelho.",
            "Raio que chega **no vértice V** → reflete **simetricamente** em relação ao eixo principal, com $i = r$.",
          ],
        },
        {
          type: "paragraph",
          text: "Na prática, o par mais prático é o 1 com o 2. Desenhe os dois saindo da ponta do objeto; o ponto onde os refletidos se encontram é a ponta da imagem.",
        },
        {
          type: "callout",
          variant: "warning",
          title: "Linha cheia ou tracejada?",
          text: "Raio de luz que existe de verdade: linha cheia, sempre na frente do espelho. Prolongamento (aquilo que os raios 'parecem' ter feito): linha tracejada, normalmente atrás do espelho. Se os refletidos só se cruzam quando prolongados para trás, a imagem é virtual.",
        },
        {
          type: "interactive",
          tool: "mirror",
          title: "Veja acontecer",
          note: "Use os botões de caso para ir direto a cada uma das cinco situações, ou arraste o objeto. Ligue os quatro raios notáveis e repare que todos passam pelo mesmo ponto da imagem: a posição sai da equação de Gauss e cada raio segue a sua própria regra. Ative o **modo previsão** para tentar acertar as características antes de ver.",
        },

        { type: "heading", text: "5. Os cinco casos do espelho côncavo" },
        {
          type: "paragraph",
          text: "No côncavo a imagem muda bastante conforme onde está o objeto. São cinco situações, e a prova costuma pedir exatamente estas. Use o simulador acima para conferir cada uma.",
        },
        {
          type: "table",
          headers: ["Posição do objeto", "Posição da imagem", "Natureza", "Orientação", "Tamanho"],
          rows: [
            ["Além de C ($d_o > R$)", "Entre F e C", "Real", "Invertida", "Menor"],
            ["Sobre C ($d_o = R$)", "Sobre C", "Real", "Invertida", "Igual"],
            ["Entre C e F ($f < d_o < R$)", "Além de C", "Real", "Invertida", "Maior"],
            ["Sobre F ($d_o = f$)", "Não se forma (no infinito)", "Imprópria", "Não se define", "Não se define"],
            ["Entre F e V ($d_o < f$)", "Atrás do espelho", "Virtual", "Direita", "Maior"],
          ],
        },
        {
          type: "callout",
          variant: "info",
          title: "Dois casos do dia a dia",
          text: "O espelho de maquiagem é o 5º caso: você fica perto dele (dentro do foco) e vê o rosto ampliado e direito. Já a 1ª linha explica por que, ao se afastar muito de uma colher polida, você se vê pequeno e de cabeça para baixo.",
        },
        {
          type: "paragraph",
          text: "**E o espelho convexo?** Ele é mais simples: não importa onde o objeto esteja, a imagem é sempre **virtual, direita e menor**, e fica entre o vértice e o foco, atrás do espelho. É por isso que ele é usado em saída de garagem e em loja: abre muito o campo de visão, ao custo de mostrar tudo reduzido.",
        },

        { type: "heading", text: "6. A equação de Gauss" },
        {
          type: "paragraph",
          text: "O desenho mostra o que acontece; a equação de Gauss diz exatamente onde. Ela liga três distâncias: a focal, a do objeto e a da imagem.",
        },
        { type: "formula", text: "\\dfrac{1}{f} = \\dfrac{1}{p} + \\dfrac{1}{p'}" },
        {
          type: "quantities",
          items: [
            { symbol: "f", name: "distância focal ($f = R/2$; positiva no côncavo, negativa no convexo)", unit: "cm" },
            { symbol: "d_o", name: "distância do objeto ao vértice (positiva para objeto real)", unit: "cm" },
            { symbol: "d_i", name: "distância da imagem ao vértice (positiva = real; negativa = virtual)", unit: "cm" },
          ],
        },
        {
          type: "callout",
          variant: "warning",
          title: "Unidades",
          text: "As três grandezas precisam estar na MESMA unidade. Se $f$ está em cm e $d_o$ em metros, converta antes de somar. E atenção: a equação soma os INVERSOS: não existe $f = d_o + d_i$.",
        },
        {
          type: "paragraph",
          text: "Para isolar a incógnita, o caminho mais seguro é trabalhar com os inversos e só inverter no final. Por exemplo, para achar $d_i$:",
        },
        { type: "formula", text: "\\dfrac{1}{p'} = \\dfrac{1}{f} - \\dfrac{1}{p} \\quad \\Longrightarrow \\quad p' = \\dfrac{p \\cdot f}{p - f}" },
        {
          type: "callout",
          variant: "info",
          title: "Erro clássico",
          text: "Muita gente calcula $\\dfrac{1}{d_i}$ e esquece de inverter, entregando o inverso como resposta. Depois de achar $1/d_i$, vire a fração.",
        },

        { type: "heading", text: "7. O aumento linear transversal" },
        {
          type: "paragraph",
          text: "O aumento $A$ compara o tamanho da imagem com o do objeto. Ele pode ser calculado de duas formas, e as duas dão o mesmo número:",
        },
        { type: "formula", text: "A = \\dfrac{i}{o} = -\\,\\dfrac{p'}{p}" },
        {
          type: "quantities",
          items: [
            { symbol: "A", name: "aumento linear transversal (número puro, sem unidade)" },
            { symbol: "h_i", name: "altura da imagem (negativa se invertida)", unit: "cm" },
            { symbol: "h_o", name: "altura do objeto", unit: "cm" },
            { symbol: "d_i", name: "distância da imagem", unit: "cm" },
            { symbol: "d_o", name: "distância do objeto", unit: "cm" },
          ],
        },
        {
          type: "callout",
          variant: "warning",
          title: "Aumento algébrico × tamanho físico",
          text: "O sinal de menos na fórmula não é enfeite. $A = -2$ significa 'duas vezes maior E invertida'. Se a questão perguntar só o TAMANHO da imagem, use o módulo: $|A| = 2$, então a imagem mede o dobro. Se perguntar a orientação, olhe o sinal.",
        },
        {
          type: "solved-example",
          title: "Exemplo resolvido 1: côncavo, objeto além de C",
          statement:
            "Um objeto de $4\\ cm$ de altura está a $30\\ cm$ de um espelho côncavo de raio de curvatura $20\\ cm$. Determine a posição, a natureza e a altura da imagem.",
          steps: [
            "**O que sabemos:** $h_o = 4\\ cm$, $d_o = 30\\ cm$, $R = 20\\ cm$. Espelho côncavo, então $f$ é positivo.",
            "**Distância focal:** $f = \\dfrac{R}{2} = \\dfrac{20}{2} = 10\\ cm$.",
            "**Onde está o objeto?** Como $C$ está a $20\\ cm$ e o objeto a $30\\ cm$, ele está além de C. Pela tabela, esperamos imagem real, invertida e menor. Vamos confirmar na conta.",
            "**Gauss:** $\\dfrac{1}{10} = \\dfrac{1}{30} + \\dfrac{1}{d_i}$, logo $\\dfrac{1}{d_i} = \\dfrac{1}{10} - \\dfrac{1}{30}$.",
            "Tirando o MMC (30): $\\dfrac{1}{d_i} = \\dfrac{3}{30} - \\dfrac{1}{30} = \\dfrac{2}{30} = \\dfrac{1}{15}$.",
            "Invertendo: $d_i = 15\\ cm$. Como é positivo, a imagem é **real** e está a $15\\ cm$ na frente do espelho (entre F e C, como previsto).",
            "**Aumento:** $A = -\\dfrac{d_i}{d_o} = -\\dfrac{15}{30} = -0{,}5$. Negativo → invertida; módulo menor que 1 → menor.",
            "**Altura:** $h_i = A \\cdot h_o = -0{,}5 \\times 4 = -2\\ cm$. O sinal negativo indica a inversão; o tamanho é $2\\ cm$.",
            "**Conferência:** tudo bate com a 1ª linha da tabela dos cinco casos.",
          ],
          answer: "Imagem real, invertida, a $15\\ cm$ do espelho, medindo $2\\ cm$ ($A = -0{,}5$).",
        },
        {
          type: "solved-example",
          title: "Exemplo resolvido 2: côncavo, objeto dentro do foco",
          statement:
            "Um objeto é colocado a $6\\ cm$ de um espelho côncavo de distância focal $10\\ cm$. Calcule $d_i$ e $A$ e classifique a imagem.",
          steps: [
            "**Dados:** $d_o = 6\\ cm$, $f = +10\\ cm$ (côncavo). Note que $d_o < f$: o objeto está entre o foco e o vértice, o 5º caso.",
            "**Gauss:** $\\dfrac{1}{d_i} = \\dfrac{1}{10} - \\dfrac{1}{6}$.",
            "MMC de 10 e 6 é 30: $\\dfrac{1}{d_i} = \\dfrac{3}{30} - \\dfrac{5}{30} = -\\dfrac{2}{30} = -\\dfrac{1}{15}$.",
            "Invertendo: $d_i = -15\\ cm$. O sinal negativo é informação, não erro: significa imagem **virtual**, a $15\\ cm$ ATRÁS do espelho.",
            "**Aumento:** $A = -\\dfrac{d_i}{d_o} = -\\dfrac{(-15)}{6} = +2{,}5$. Positivo → direita; maior que 1 → ampliada.",
            "**Interpretação:** é exatamente o espelho de maquiagem: rosto perto, imagem direita e $2{,}5$ vezes maior.",
          ],
          answer: "$d_i = -15\\ cm$ e $A = +2{,}5$: imagem virtual, direita e $2{,}5$ vezes maior.",
        },
        {
          type: "solved-example",
          title: "Exemplo resolvido 3: convexo e o caminho de volta",
          statement:
            "Um espelho convexo tem raio de curvatura de $40\\ cm$. Um objeto é colocado a $30\\ cm$ dele. Onde se forma a imagem e qual o aumento?",
          steps: [
            "**Atenção ao sinal:** o espelho é convexo, então $R$ e $f$ são NEGATIVOS. $f = \\dfrac{R}{2} = \\dfrac{-40}{2} = -20\\ cm$.",
            "**Gauss:** $\\dfrac{1}{d_i} = \\dfrac{1}{-20} - \\dfrac{1}{30}$.",
            "MMC de 20 e 30 é 60: $\\dfrac{1}{d_i} = -\\dfrac{3}{60} - \\dfrac{2}{60} = -\\dfrac{5}{60} = -\\dfrac{1}{12}$.",
            "Invertendo: $d_i = -12\\ cm$ → imagem virtual, $12\\ cm$ atrás do espelho.",
            "**Aumento:** $A = -\\dfrac{-12}{30} = +0{,}4$ → direita e com $40\\%$ do tamanho do objeto.",
            "**Conferência:** no convexo a imagem é SEMPRE virtual, direita e menor, e fica entre V e F (aqui, $12\\ cm < 20\\ cm$). Tudo coerente. Se tivesse dado imagem real ou maior, haveria erro de sinal.",
          ],
          answer: "$d_i = -12\\ cm$ (virtual) e $A = +0{,}4$: imagem direita e menor.",
        },

        { type: "heading", text: "8. Como montar o desenho na prova" },
        {
          type: "list",
          style: "number",
          items: [
            "Trace o eixo principal (uma reta horizontal) e desenhe o espelho cortando-o.",
            "Marque V no encontro do espelho com o eixo.",
            "Marque F e C sobre o eixo, lembrando que $VC = 2 \\cdot VF$. No côncavo eles ficam na frente; no convexo, atrás (e tracejados).",
            "Desenhe o objeto como uma seta em pé sobre o eixo, na posição dada.",
            "Trace o raio paralelo ao eixo saindo da ponta da seta; depois do espelho, mande-o pelo foco.",
            "Trace o segundo raio passando pelo foco; depois do espelho, mande-o paralelo ao eixo.",
            "Veja onde os dois refletidos se cruzam: ali está a ponta da imagem. Se só se cruzarem nos prolongamentos tracejados atrás do espelho, a imagem é virtual.",
            "Desenhe a seta da imagem do eixo até esse ponto e confira: ela está para cima (direita) ou para baixo (invertida)?",
          ],
        },
        {
          type: "interactive",
          tool: "draw",
          template: "esferico",
          title: "Construa você",
          note: "Eixo, espelho, V, F, C e o objeto já estão marcados. Trace os dois raios notáveis, ache a imagem e toque em **Conferir construção**.",
        },
        {
          type: "checklist",
          title: "Confira sua construção",
          items: [
            "O raio que chegou paralelo ao eixo saiu passando pelo foco F.",
            "O raio que chegou pelo foco F saiu paralelo ao eixo.",
            "Os dois raios refletidos se cruzam em um único ponto: a ponta da imagem.",
            "Raios reais estão em linha cheia e só na frente do espelho.",
            "Prolongamentos (se houver) estão tracejados.",
            "A seta da imagem foi desenhada do eixo até o cruzamento, com a orientação correta.",
          ],
        },

        { type: "heading", text: "9. Objeto extenso inclinado" },
        {
          type: "paragraph",
          text: "Até aqui o objeto era uma seta em pé, perpendicular ao eixo. Quando o objeto está **inclinado** (ou deitado ao longo do eixo), cada ponto dele está a uma distância diferente do espelho, e cada ponto tem o seu próprio aumento. Por isso **não dá para usar um único A para o objeto inteiro**.",
        },
        {
          type: "list",
          style: "number",
          items: [
            "Escolha as duas pontas do objeto.",
            "Para cada ponta, use Gauss com a distância dela e ache $d_i$.",
            "Para cada ponta, ache a altura da imagem com $h_i = A \\cdot h_o$, usando o $A$ daquela ponta.",
            "Com as duas pontas da imagem localizadas, calcule o comprimento com Pitágoras.",
          ],
        },
        {
          type: "solved-example",
          title: "Exemplo resolvido 4: imagem de um objeto inclinado",
          statement:
            "Um espelho côncavo tem $f = 20\\ cm$. Um objeto reto vai do ponto P, sobre o eixo e a $30\\ cm$ do espelho, até o ponto Q, a $60\\ cm$ do espelho e $10\\ cm$ acima do eixo. Qual é o comprimento da imagem?",
          steps: [
            "**Ponta P** ($d_o = 30\\ cm$, sobre o eixo): $\\dfrac{1}{d_i} = \\dfrac{1}{20} - \\dfrac{1}{30} = \\dfrac{3}{60} - \\dfrac{2}{60} = \\dfrac{1}{60}$, então $d_i = 60\\ cm$. P está no eixo, então sua imagem P′ também está (altura $0$).",
            "**Ponta Q** ($d_o = 60\\ cm$, $h_o = 10\\ cm$): $\\dfrac{1}{d_i} = \\dfrac{1}{20} - \\dfrac{1}{60} = \\dfrac{2}{60}$, então $d_i = 30\\ cm$.",
            "Aumento em Q: $A = -\\dfrac{30}{60} = -0{,}5$, logo $h_i = -0{,}5 \\times 10 = -5\\ cm$ (5 cm abaixo do eixo).",
            "Repare: na posição de P o aumento seria $A = -\\dfrac{60}{30} = -2$, e em Q é $-0{,}5$. Cada ponto aumenta diferente, por isso a imagem sai esticada e girada.",
            "A imagem vai de P′ ($60\\ cm$ do espelho, no eixo) a Q′ ($30\\ cm$ do espelho, $5\\ cm$ abaixo). Pitágoras: $\\ell = \\sqrt{(60-30)^2 + 5^2} = \\sqrt{900 + 25} = \\sqrt{925} \\approx 30{,}4\\ cm$.",
          ],
          answer: "$\\ell = \\sqrt{925} \\approx 30{,}4\\ cm$.",
        },
        { type: "heading", text: "10. Erros frequentes" },
        {
          type: "list",
          items: [
            "Esquecer que no convexo $f$ e $R$ são negativos. Esse é de longe o erro mais comum.",
            "Somar $f = d_o + d_i$. A equação soma os INVERSOS das distâncias.",
            "Calcular $1/d_i$ e esquecer de inverter para achar $d_i$.",
            "Ignorar o sinal de $d_i$ e dizer que a imagem é real quando deu negativo.",
            "Confundir $A = -2$ (invertida e duas vezes maior) com 'imagem de tamanho $-2\\ cm$'.",
            "Misturar unidades: $f$ em cm com $d_o$ em metros.",
            "Usar $f = R/2$ com o $R$ em vez do $f$ direto na equação de Gauss. Calcule $f$ primeiro.",
          ],
        },

        { type: "heading", text: "11. Resumo da parte" },
        {
          type: "table",
          headers: ["Item", "O que guardar"],
          rows: [
            ["Côncavo", "$f > 0$, convergente; imagem varia conforme a posição (5 casos)"],
            ["Convexo", "$f < 0$, divergente; imagem SEMPRE virtual, direita e menor"],
            ["Foco", "$f = R/2$"],
            ["Equação de Gauss", "$\\dfrac{1}{f} = \\dfrac{1}{d_o} + \\dfrac{1}{d_i}$"],
            ["Isolando a imagem", "$d_i = \\dfrac{d_o f}{d_o - f}$"],
            ["Aumento", "$A = \\dfrac{i}{o} = -\\dfrac{d_i}{d_o}$"],
            ["Ler o resultado", "$d_i > 0$ real · $d_i < 0$ virtual · $A > 0$ direita · $A < 0$ invertida"],
            ["Validade", "Condições de Gauss (espelhos pouco abertos, raios próximos do eixo)"],
          ],
        },
      ],
      flashcards: [
        { id: "fc-1", question: "Qual espelho é convergente e qual é divergente?", answer: "O côncavo é convergente (faz raios paralelos se encontrarem no foco); o convexo é divergente (espalha os raios)." },
        { id: "fc-2", question: "Qual é a relação entre distância focal e raio de curvatura?", answer: "$f = \\dfrac{R}{2}$, ou seja, o foco fica no meio do caminho entre o vértice e o centro de curvatura." },
        { id: "fc-3", question: "Qual é o sinal de $f$ no espelho côncavo e no convexo?", answer: "Côncavo: $f > 0$. Convexo: $f < 0$. Esquecer isso é o erro mais comum da matéria." },
        { id: "fc-4", question: "Escreva a equação de Gauss dos espelhos esféricos.", answer: "$\\dfrac{1}{f} = \\dfrac{1}{d_o} + \\dfrac{1}{d_i}$ (soma dos inversos, nunca das distâncias)." },
        { id: "fc-5", question: "O que significa $d_i$ negativo?", answer: "Que a imagem é virtual e está atrás do espelho." },
        { id: "fc-6", question: "Como se calcula o aumento linear transversal?", answer: "$A = \\dfrac{i}{o} = -\\dfrac{d_i}{d_o}$." },
        { id: "fc-7", question: "O que o sinal de $A$ informa?", answer: "$A > 0$ imagem direita; $A < 0$ imagem invertida. E $|A| > 1$ maior, $|A| < 1$ menor." },
        { id: "fc-8", question: "Como é SEMPRE a imagem em um espelho convexo?", answer: "Virtual, direita e menor, situada entre o vértice e o foco, atrás do espelho." },
        { id: "fc-9", question: "O que acontece quando o objeto está exatamente sobre o foco de um espelho côncavo?", answer: "Os raios refletidos saem paralelos e não se cruzam: não se forma imagem (imagem imprópria, 'no infinito')." },
        { id: "fc-10", question: "Cite dois raios notáveis.", answer: "Raio paralelo ao eixo reflete passando pelo foco; raio que passa pelo foco reflete paralelo ao eixo. (Também: raio na direção de C volta sobre si mesmo.)" },
        { id: "fc-11", question: "O que são as condições de nitidez de Gauss?", answer: "O espelho deve ter abertura pequena e os raios devem ser próximos do eixo principal e pouco inclinados. Fora disso aparece aberração esférica e a imagem borra." },
        { id: "fc-12", question: "Como se acha a imagem de um objeto inclinado diante de um espelho esférico?", answer: "Aplicando Gauss e o aumento a cada ponta separadamente (cada ponto tem o seu próprio $A$) e ligando as imagens das pontas. O comprimento sai por Pitágoras." },
      ],
      questions: [
        {
          id: "q-1",
          level: 1,
          origin: "pratica",
          statement: "Um espelho usado em saídas de garagem mostra uma área muito ampla, com todos os objetos reduzidos e direitos. Trata-se de um espelho:",
          alternatives: [
            { id: "a", text: "plano" },
            { id: "b", text: "côncavo, com o objeto além do centro de curvatura" },
            { id: "c", text: "côncavo, com o objeto entre o foco e o vértice" },
            { id: "d", text: "convexo" },
          ],
          correctAlternativeId: "d",
          explanation:
            "Imagem sempre direita E menor, com campo de visão ampliado, é a assinatura do espelho convexo (divergente). O côncavo além de C também dá imagem menor, mas invertida; o côncavo dentro do foco dá maior e direita; o plano dá mesmo tamanho.",
        },
        {
          id: "q-2",
          level: 2,
          origin: "pratica",
          statement: "Um espelho côncavo tem raio de curvatura igual a $50\\ cm$. Sua distância focal vale:",
          alternatives: [
            { id: "a", text: "$-25\\ cm$" },
            { id: "b", text: "$25\\ cm$" },
            { id: "c", text: "$50\\ cm$" },
            { id: "d", text: "$100\\ cm$" },
          ],
          correctAlternativeId: "b",
          explanation:
            "$f = R/2 = 50/2 = 25\\ cm$. O sinal é positivo porque o espelho é côncavo (convergente). Seria $-25\\ cm$ apenas se fosse convexo.",
        },
        {
          id: "q-3",
          level: 2,
          origin: "pratica",
          statement: "Um objeto está a $60\\ cm$ de um espelho côncavo de distância focal $20\\ cm$. A que distância do espelho se forma a imagem?",
          alternatives: [
            { id: "a", text: "$30\\ cm$" },
            { id: "b", text: "$15\\ cm$" },
            { id: "c", text: "$40\\ cm$" },
            { id: "d", text: "$80\\ cm$" },
          ],
          correctAlternativeId: "a",
          explanation:
            "$\\dfrac{1}{d_i} = \\dfrac{1}{20} - \\dfrac{1}{60} = \\dfrac{3}{60} - \\dfrac{1}{60} = \\dfrac{2}{60} = \\dfrac{1}{30}$, logo $d_i = 30\\ cm$. Positivo, então imagem real. Confere com a teoria: o objeto está além de C ($R = 40$), então a imagem deve cair entre F e C, isto é, entre $20$ e $40\\ cm$. E $30\\ cm$ está nesse intervalo.",
        },
        {
          id: "q-4",
          level: 3,
          origin: "pratica",
          statement: "Um objeto de $5\\ cm$ está a $15\\ cm$ de um espelho côncavo de distância focal $10\\ cm$. Qual é a altura da imagem?",
          alternatives: [
            { id: "a", text: "$2{,}5\\ cm$" },
            { id: "b", text: "$5\\ cm$" },
            { id: "c", text: "$10\\ cm$" },
            { id: "d", text: "$15\\ cm$" },
          ],
          correctAlternativeId: "c",
          explanation:
            "Primeiro a posição: $\\dfrac{1}{d_i} = \\dfrac{1}{10} - \\dfrac{1}{15} = \\dfrac{3}{30} - \\dfrac{2}{30} = \\dfrac{1}{30}$, então $d_i = 30\\ cm$. Aumento: $A = -30/15 = -2$. Altura: $|h_i| = |A| \\cdot h_o = 2 \\times 5 = 10\\ cm$. O sinal negativo de $A$ diz que ela está invertida, mas o tamanho perguntado é $10\\ cm$. (O objeto está entre C e F, então imagem real, invertida e maior, o que bate com a tabela.)",
        },
        {
          id: "q-5",
          level: 3,
          origin: "pratica",
          statement: "Um objeto é colocado a $10\\ cm$ de um espelho convexo cuja distância focal tem módulo $15\\ cm$. A posição da imagem é:",
          alternatives: [
            { id: "a", text: "$d_i = +6\\ cm$ (real)" },
            { id: "b", text: "$d_i = -30\\ cm$ (virtual)" },
            { id: "c", text: "$d_i = +30\\ cm$ (real)" },
            { id: "d", text: "$d_i = -6\\ cm$ (virtual)" },
          ],
          correctAlternativeId: "d",
          explanation:
            "Convexo: $f = -15\\ cm$. Então $\\dfrac{1}{d_i} = \\dfrac{1}{-15} - \\dfrac{1}{10} = -\\dfrac{2}{30} - \\dfrac{3}{30} = -\\dfrac{5}{30} = -\\dfrac{1}{6}$, logo $d_i = -6\\ cm$. Virtual, como tem de ser no convexo. Conferência: o módulo $6\\ cm$ é menor que $|f| = 15\\ cm$, ou seja, a imagem caiu entre V e F, exatamente o esperado.",
        },
        {
          id: "q-6",
          level: 1,
          origin: "pratica",
          statement: "Em um espelho côncavo, um objeto colocado exatamente sobre o centro de curvatura C produz uma imagem:",
          alternatives: [
            { id: "a", text: "virtual, direita e maior" },
            { id: "b", text: "real, invertida e menor" },
            { id: "c", text: "real, invertida e do mesmo tamanho" },
            { id: "d", text: "no infinito (não se forma imagem)" },
          ],
          correctAlternativeId: "c",
          explanation:
            "É o 2º dos cinco casos: com $d_o = R = 2f$, a imagem se forma sobre o próprio C, real, invertida e do mesmo tamanho. Pela conta, com $f = 10$ e $d_o = 20$: $1/d_i = 1/10 - 1/20 = 1/20$, então $d_i = 20\\ cm$ e $A = -20/20 = -1$ (invertida, tamanho igual). A alternativa (d) descreveria o objeto sobre o foco.",
        },
        {
          id: "q-7",
          level: 4,
          origin: "pratica",
          statement: "Um espelho côncavo de distância focal $12\\ cm$ produz de certo objeto uma imagem virtual e três vezes maior. A que distância do espelho está o objeto?",
          alternatives: [
            { id: "a", text: "$4\\ cm$" },
            { id: "b", text: "$8\\ cm$" },
            { id: "c", text: "$16\\ cm$" },
            { id: "d", text: "$36\\ cm$" },
          ],
          correctAlternativeId: "b",
          explanation:
            "Imagem virtual e maior, em espelho côncavo, significa objeto dentro do foco e aumento POSITIVO: $A = +3$. De $A = -d_i/d_o$ vem $3 = -d_i/d_o$, ou seja, $d_i = -3d_o$. Substituindo em Gauss: $\\dfrac{1}{12} = \\dfrac{1}{d_o} + \\dfrac{1}{-3d_o} = \\dfrac{3}{3d_o} - \\dfrac{1}{3d_o} = \\dfrac{2}{3d_o}$. Então $3d_o = 24$ e $d_o = 8\\ cm$. Conferindo: $d_o = 8 < f = 12$, objeto dentro do foco, e $d_i = -24\\ cm$ (virtual). Coerente. O erro comum é usar $A = -3$ e achar $d_o = 16\\ cm$, que daria imagem real e invertida.",
        },
        {
          id: "q-8",
          level: 4,
          origin: "pratica",
          statement: "Sobre a formação de imagens em espelhos esféricos, analise: (I) No espelho convexo a imagem pode ser real se o objeto estiver muito próximo. (II) Em um espelho côncavo, se o objeto está entre o foco e o vértice, a imagem é virtual e maior. (III) A relação $f = R/2$ vale nas condições de nitidez de Gauss. Está(ão) correta(s):",
          alternatives: [
            { id: "a", text: "apenas I e II" },
            { id: "b", text: "apenas I e III" },
            { id: "c", text: "apenas II e III" },
            { id: "d", text: "I, II e III" },
          ],
          correctAlternativeId: "c",
          explanation:
            "(I) é FALSA: no espelho convexo a imagem é sempre virtual, direita e menor, qualquer que seja a posição do objeto, e $d_i$ nunca dá positivo. (II) é verdadeira: é o 5º caso, o do espelho de maquiagem. (III) é verdadeira: $f = R/2$ é uma aproximação válida para espelhos de pequena abertura com raios próximos do eixo; fora disso aparece aberração esférica.",
        },
        {
          id: "q-9",
          level: 5,
          origin: "pratica",
          statement: "Um objeto está a $30\\ cm$ de um espelho côncavo de foco $10\\ cm$. Ele é então afastado mais $30\\ cm$ do espelho. O deslocamento da imagem foi de aproximadamente:",
          alternatives: [
            { id: "a", text: "$3{,}0\\ cm$, aproximando-se do espelho" },
            { id: "b", text: "$3{,}0\\ cm$, afastando-se do espelho" },
            { id: "c", text: "$15{,}0\\ cm$, aproximando-se do espelho" },
            { id: "d", text: "$30{,}0\\ cm$, afastando-se do espelho" },
          ],
          correctAlternativeId: "a",
          explanation:
            "Posição inicial: $1/d_i = 1/10 - 1/30 = 2/30$, então $d_{i1} = 15\\ cm$. Posição final ($d_o = 60$): $1/d_i = 1/10 - 1/60 = 6/60 - 1/60 = 5/60$, então $d_{i2} = 12\\ cm$. A imagem foi de $15$ para $12\\ cm$: deslocou-se $3\\ cm$ APROXIMANDO-se do espelho. Faz sentido fisicamente: afastando o objeto cada vez mais, a imagem tende ao foco ($10\\ cm$), nunca passando dele. Note que objeto e imagem se movem em sentidos opostos aqui.",
        },
        {
          id: "q-10",
          level: 4,
          origin: "pratica",
          statement: "Um espelho convexo tem raio de curvatura de $60\\ cm$ e forma de um objeto uma imagem dez vezes menor. A que distância do espelho está o objeto?",
          alternatives: [
            { id: "a", text: "$27\\ cm$" },
            { id: "b", text: "$270\\ cm$" },
            { id: "c", text: "$300\\ cm$" },
            { id: "d", text: "$330\\ cm$" },
          ],
          correctAlternativeId: "b",
          explanation:
            "Convexo: $f = -\\dfrac{60}{2} = -30\\ cm$. A imagem do convexo é sempre direita, então o aumento é positivo: $A = +\\dfrac{1}{10}$. De $A = -\\dfrac{d_i}{d_o}$ vem $d_i = -\\dfrac{d_o}{10}$. Em Gauss: $\\dfrac{1}{-30} = \\dfrac{1}{d_o} - \\dfrac{10}{d_o} = -\\dfrac{9}{d_o}$, logo $d_o = 9 \\times 30 = 270\\ cm$. Conferência: $d_i = -27\\ cm$, virtual e entre V e F ($27 < 30$), como tem de ser. A alternativa $27\\ cm$ é a posição da IMAGEM, não do objeto.",
        },
        {
          id: "q-11",
          level: 4,
          origin: "pratica",
          statement: "Um objeto está a $22\\ cm$ de um espelho côncavo de distância focal $15\\ cm$. Para que a imagem tenha o mesmo tamanho do objeto, ele deve ser deslocado:",
          alternatives: [
            { id: "a", text: "$7\\ cm$, aproximando-se do espelho" },
            { id: "b", text: "$8\\ cm$, aproximando-se do espelho" },
            { id: "c", text: "$8\\ cm$, afastando-se do espelho" },
            { id: "d", text: "$15\\ cm$, afastando-se do espelho" },
          ],
          correctAlternativeId: "c",
          explanation:
            "No côncavo, imagem do mesmo tamanho só acontece com o objeto sobre o centro de curvatura: $d_o = R = 2f = 30\\ cm$. Conferindo com Gauss: $\\dfrac{1}{d_i} = \\dfrac{1}{15} - \\dfrac{1}{30} = \\dfrac{1}{30}$, então $d_i = 30\\ cm$ e $A = -1$ (real, invertida, mesmo tamanho). Imagem direita do mesmo tamanho ($A = +1$) é impossível: exigiria $d_i = -d_o$, e aí $1/f$ daria zero. O objeto está a $22\\ cm$ e precisa ir para $30\\ cm$: deslocar $8\\ cm$, afastando-se do espelho.",
        },
        {
          id: "q-12",
          level: 3,
          origin: "pratica",
          statement: "Um dentista usa um espelho côncavo de distância focal $3{,}0\\ cm$ e o posiciona a $2{,}0\\ cm$ de um dente. O aumento linear da imagem é:",
          alternatives: [
            { id: "a", text: "$-3$" },
            { id: "b", text: "$+1{,}5$" },
            { id: "c", text: "$+6$" },
            { id: "d", text: "$+3$" },
          ],
          correctAlternativeId: "d",
          explanation:
            "Gauss: $\\dfrac{1}{d_i} = \\dfrac{1}{3} - \\dfrac{1}{2} = \\dfrac{2}{6} - \\dfrac{3}{6} = -\\dfrac{1}{6}$, então $d_i = -6\\ cm$ (virtual, atrás do espelho). Aumento: $A = -\\dfrac{d_i}{d_o} = -\\dfrac{-6}{2} = +3$. Imagem virtual, direita e três vezes maior: o dente está entre F e V (caso 5), e é exatamente por isso que esse espelho serve ao dentista. O valor $-3$ troca a orientação; $+6$ é o módulo de $d_i$, não o aumento.",
        },
      ],
      videos: [EXERCICIOS_ESFERICOS, AULAO_OPTICA, PLAYLIST_OPTICA],
    },

    /* ══════════════════════════════════════════════════════════
       PARTE 3 — REFRAÇÃO DA LUZ
       ══════════════════════════════════════════════════════════ */
    {
      id: "refracao-da-luz",
      number: 3,
      title: "Refração da luz",
      description:
        "Capítulo 16 · Por que a luz entorta ao mudar de meio: índice de refração, lei de Snell-Descartes, ângulo limite, reflexão total e fibra óptica.",
      icon: "waves",
      objectives: [
        { id: "obj-1", text: "Explicar o que é refração e diferenciá-la da reflexão" },
        { id: "obj-2", text: "Relacionar índice de refração com a velocidade da luz no meio" },
        { id: "obj-3", text: "Saber o que muda e o que não muda na refração (frequência, velocidade, comprimento de onda)" },
        { id: "obj-4", text: "Aplicar a lei de Snell-Descartes em problemas numéricos" },
        { id: "obj-5", text: "Prever se o raio se aproxima ou se afasta da normal" },
        { id: "obj-6", text: "Calcular o ângulo limite e identificar quando ocorre reflexão total" },
      ],
      theory: [
        { type: "heading", text: "1. O que é refração" },
        {
          type: "paragraph",
          text: "Coloque um lápis dentro de um copo com água e olhe de lado: ele parece quebrado na superfície. Uma piscina parece mais rasa do que é. Nos dois casos a luz mudou de direção ao passar de um meio para outro. Isso é refração.",
        },
        {
          type: "definition",
          term: "Refração",
          text: "É a passagem da luz de um meio para outro, com mudança na sua velocidade. Quase sempre vem acompanhada de uma mudança de direção (o desvio).",
        },
        {
          type: "callout",
          variant: "info",
          title: "Reflexão × refração",
          text: "Na reflexão a luz BATE e VOLTA para o mesmo meio. Na refração a luz ATRAVESSA e segue no outro meio. Na prática os dois fenômenos acontecem ao mesmo tempo (por isso você vê seu reflexo na vitrine e enxerga o que há dentro da loja), mas as questões costumam tratar de um por vez.",
        },
        { type: "paragraph", text: "Estes são os elementos que aparecem no desenho de refração:" },
        {
          type: "list",
          items: [
            "**S**: superfície de separação entre os dois meios.",
            "**N**: a normal, reta perpendicular a S no ponto de incidência (tracejada).",
            "**RI**: raio incidente · **RR**: raio refratado.",
            "**$i$**: ângulo de incidência · **$r$**: ângulo de refração, ambos medidos a partir da normal.",
            "**$v_1$ e $v_2$**: velocidades da luz em cada meio · **$n_1$ e $n_2$**: índices de refração.",
          ],
        },
        { type: "diagram", name: "refracao", caption: "A luz passa para um meio onde é mais lenta ($n_2 > n_1$) e se aproxima da normal: $r < i$." },
        { type: "paragraph", text: "**Como desenhar:**" },
        {
          type: "list",
          style: "number",
          items: [
            "Trace a superfície de separação S.",
            "Marque o ponto de incidência.",
            "Trace a normal N, perpendicular a S, tracejada.",
            "Desenhe o raio incidente chegando ao ponto, com seta.",
            "Desenhe o raio refratado do outro lado da superfície.",
            "Marque os ângulos $i$ e $r$ a partir da normal.",
            "Identifique os meios e seus índices.",
          ],
        },

        { type: "heading", text: "2. Índice de refração" },
        {
          type: "paragraph",
          text: "A luz é mais rápida no vácuo: cerca de $3 \\times 10^8\\ m/s$. Dentro de qualquer material ela anda mais devagar. O índice de refração mede justamente quanto o meio 'segura' a luz.",
        },
        { type: "formula", text: "n = \\dfrac{c}{v}" },
        {
          type: "quantities",
          items: [
            { symbol: "n", name: "índice de refração absoluto do meio (número puro, sem unidade)" },
            { symbol: "c", name: "velocidade da luz no vácuo ($\\approx 3 \\times 10^8$)", unit: "m/s" },
            { symbol: "v", name: "velocidade da luz dentro do meio", unit: "m/s" },
          ],
        },
        {
          type: "list",
          items: [
            "Como $v \\leq c$, o índice de refração é sempre $n \\geq 1$.",
            "No vácuo, $n = 1$ exatamente. No ar, $n \\approx 1{,}0$ (usamos 1 nas contas).",
            "Quanto MAIOR o $n$, mais devagar a luz anda e mais o meio é chamado de refringente.",
          ],
        },
        {
          type: "table",
          headers: ["Meio", "$n$ aproximado", "A luz nele..."],
          rows: [
            ["Vácuo", "1,00", "anda com velocidade máxima"],
            ["Ar", "1,00 (≈1,0003)", "praticamente como no vácuo"],
            ["Água", "1,33", "anda a cerca de 3/4 de $c$"],
            ["Vidro comum", "1,5", "anda a cerca de 2/3 de $c$"],
            ["Diamante", "2,42", "anda a menos da metade de $c$"],
          ],
        },
        {
          type: "solved-example",
          title: "Exemplo das anotações: comparando dois meios",
          statement:
            "Use $c = 300\\,000\\ km/s$. No meio A a luz anda a $200\\,000\\ km/s$; no meio B, a $150\\,000\\ km/s$. Calcule os índices e diga em qual meio a luz é mais lenta.",
          steps: [
            "Meio A: $n_A = \\dfrac{c}{v_A} = \\dfrac{300\\,000}{200\\,000} = 1{,}5$.",
            "Meio B: $n_B = \\dfrac{300\\,000}{150\\,000} = 2$.",
            "Como $n_B > n_A$, a luz é mais lenta no meio B.",
            "As unidades se cancelam (km/s dividido por km/s): o índice de refração não tem unidade. Basta $c$ e $v$ estarem na mesma unidade.",
          ],
          answer: "$n_A = 1{,}5$ e $n_B = 2$; a luz é mais lenta em B, que tem o maior índice.",
        },
        {
          type: "solved-example",
          title: "Exemplo resolvido 1: velocidade dentro do meio",
          statement:
            "Qual é a velocidade da luz dentro de um vidro de índice de refração $1{,}5$? Use $c = 3 \\times 10^8\\ m/s$.",
          steps: [
            "A fórmula é $n = \\dfrac{c}{v}$, mas queremos $v$. Isolando: $v = \\dfrac{c}{n}$.",
            "Substituindo: $v = \\dfrac{3 \\times 10^8}{1{,}5}$.",
            "$v = 2 \\times 10^8\\ m/s$.",
            "Conferência: deu menor que $c$, como tinha de ser. E é cerca de $2/3$ de $c$, coerente com $n = 1{,}5$.",
          ],
          answer: "$v = 2 \\times 10^8\\ m/s$.",
        },

        { type: "heading", text: "3. O que muda e o que NÃO muda" },
        {
          type: "paragraph",
          text: "Esse ponto cai em prova como questão conceitual. Quando a luz passa de um meio para outro:",
        },
        {
          type: "table",
          headers: ["Grandeza", "Muda?", "Por quê"],
          rows: [
            ["Frequência ($f$)", "NÃO muda", "Quem define a frequência é a fonte que emitiu a luz, não o meio"],
            ["Velocidade ($v$)", "MUDA", "É justamente o que caracteriza a refração"],
            ["Comprimento de onda ($\\lambda$)", "MUDA", "Como $v = \\lambda f$ e $f$ é fixo, se $v$ cai, $\\lambda$ cai junto"],
            ["Cor", "NÃO muda", "A cor está ligada à frequência, que não muda"],
          ],
        },
        {
          type: "callout",
          variant: "warning",
          title: "Pegadinha comum",
          text: "Se uma alternativa disser que 'a frequência da luz diminui ao entrar na água', ela está errada. O que diminui é a velocidade e o comprimento de onda.",
        },

        { type: "heading", text: "4. A lei de Snell-Descartes" },
        {
          type: "paragraph",
          text: "Essa é a fórmula central do capítulo. Ela relaciona os ângulos com os índices dos dois meios. Lembrando: os ângulos continuam sendo medidos a partir da NORMAL, igual na reflexão.",
        },
        { type: "formula", text: "n_1 \\cdot \\operatorname{sen}i = n_2 \\cdot \\operatorname{sen}r" },
        {
          type: "quantities",
          items: [
            { symbol: "n_1", name: "índice de refração do meio de onde a luz vem" },
            { symbol: "i", name: "ângulo de incidência (entre o raio incidente e a normal)", unit: "graus" },
            { symbol: "n_2", name: "índice de refração do meio para onde a luz vai" },
            { symbol: "r", name: "ângulo de refração (entre o raio refratado e a normal)", unit: "graus" },
          ],
        },
        {
          type: "paragraph",
          text: "Como $n = c/v$, a mesma lei pode ser escrita com as velocidades. Substituindo $n_1 = c/v_1$ e $n_2 = c/v_2$ e cancelando o $c$:",
        },
        {
          type: "formula",
          text: "v_2 \\cdot \\operatorname{sen} i = v_1 \\cdot \\operatorname{sen} r",
          caption: "Mesma lei de Snell, com velocidades. Atenção à troca: $v_2$ acompanha $i$, e $v_1$ acompanha $r$.",
        },
        {
          type: "callout",
          variant: "info",
          title: "Na calculadora",
          text: "Para achar o ângulo a partir do seno, use a tecla $\\operatorname{sen}^{-1}$ (arco-seno). Antes, confira se a calculadora está em **graus** (aparece D ou DEG na tela), porque em radianos o resultado sai completamente diferente.",
        },
        {
          type: "paragraph",
          text: "Dela sai a regra prática que resolve metade das questões conceituais:",
        },
        {
          type: "list",
          items: [
            "Luz indo para um meio **mais refringente** ($n$ aumenta): o raio **se aproxima da normal** ($r < i$). Ex: ar → água.",
            "Luz indo para um meio **menos refringente** ($n$ diminui): o raio **se afasta da normal** ($r > i$). Ex: água → ar.",
            "**Incidência normal** ($i = 0°$, luz batendo de frente): não há desvio nenhum, o raio segue reto. A velocidade muda, mas a direção não.",
          ],
        },
        {
          type: "callout",
          variant: "info",
          title: "Como lembrar sem decorar",
          text: "Pense que o meio mais refringente 'freia' mais a luz. Ao entrar nele, o raio 'endireita', chegando mais perto da normal. Ao sair para um meio mais rápido, ele 'abre'. Essa analogia ajuda a lembrar o sentido, mas cuidado: a luz não é um carrinho, e quem manda de verdade é a conta da lei de Snell.",
        },
        {
          type: "interactive",
          tool: "refraction",
          title: "Teste você mesmo",
          note: "Mude os meios e o ângulo de incidência. Observe quando o raio se aproxima da normal, quando se afasta e o que acontece ao passar do ângulo limite. Os valores vêm da lei de Snell.",
        },
        {
          type: "solved-example",
          title: "Exemplo resolvido 2: aplicando Snell",
          statement:
            "Um raio de luz passa do ar ($n_1 = 1$) para a água ($n_2 = 1{,}33$) com ângulo de incidência de $30°$. Calcule o ângulo de refração. Dado: $\\operatorname{sen}30° = 0{,}50$.",
          steps: [
            "**Dados:** $n_1 = 1$, $i = 30°$, $n_2 = 1{,}33$. Queremos $r$.",
            "**Previsão:** a luz vai para um meio MAIS refringente, então esperamos $r < 30°$ (aproxima da normal).",
            "**Snell:** $1 \\times \\operatorname{sen}30° = 1{,}33 \\times \\operatorname{sen}r$.",
            "$1 \\times 0{,}50 = 1{,}33 \\times \\operatorname{sen}r$",
            "Isolando: $\\operatorname{sen}r = \\dfrac{0{,}50}{1{,}33} \\approx 0{,}376$.",
            "Consultando: $r \\approx 22°$.",
            "**Conferência:** $22° < 30°$, o raio realmente se aproximou da normal. Previsão confirmada.",
          ],
          answer: "$r \\approx 22°$ (o raio se aproxima da normal).",
        },

        { type: "heading", text: "5. Profundidade aparente" },
        {
          type: "paragraph",
          text: "Quem já olhou para o fundo de uma piscina sabe: ela parece mais rasa do que é. Um objeto debaixo d'água, visto de fora, parece estar **mais perto da superfície** do que realmente está.",
        },
        {
          type: "paragraph",
          text: "**Por quê?** A luz que sai do objeto passa da água para o ar e, como vai para um meio onde é mais rápida, **se afasta da normal**. O cérebro prolonga os raios em linha reta para trás, e esses prolongamentos se encontram num ponto mais acima. É ali que 'vemos' o objeto.",
        },
        {
          type: "diagram",
          name: "profundidade-aparente",
          caption:
            "Os raios refratados no ar, prolongados para trás (tracejado), se cruzam acima da posição real. Neste desenho, com raios pouco inclinados, a posição aparente fica a cerca de 0,74 da real; a fórmula, válida para observação perpendicular, dá 0,75.",
        },
        { type: "formula", text: "\\dfrac{n_{\\text{observador}}}{n_{\\text{objeto}}} = \\dfrac{p_{\\text{aparente}}}{p_{\\text{real}}}" },
        {
          type: "quantities",
          items: [
            { symbol: "n_{\\text{observador}}", name: "índice do meio onde está quem observa" },
            { symbol: "n_{\\text{objeto}}", name: "índice do meio onde está o objeto" },
            { symbol: "p_{\\text{aparente}}", name: "profundidade em que o objeto parece estar", unit: "m" },
            { symbol: "p_{\\text{real}}", name: "profundidade real do objeto", unit: "m" },
          ],
        },
        {
          type: "callout",
          variant: "warning",
          title: "Quando vale",
          text: "A fórmula vale para observação **aproximadamente perpendicular** à superfície (olhando quase reto de cima). Olhando muito inclinado, o objeto parece ainda mais raso e a fórmula simples deixa de valer.",
        },
        {
          type: "solved-example",
          title: "Exemplo das anotações: objeto a 1 m de profundidade",
          statement:
            "Um objeto está a $1\\ m$ de profundidade na água. Para quem olha de cima, a que profundidade ele parece estar? Use $n_{ar} = 1$ e $n_{água} = 4/3$.",
          steps: [
            "Quem observa está no ar: $n_{\\text{observador}} = 1$. O objeto está na água: $n_{\\text{objeto}} = \\dfrac{4}{3}$.",
            "Aplicando: $\\dfrac{1}{4/3} = \\dfrac{p_{\\text{aparente}}}{1}$.",
            "Dividir por uma fração é multiplicar pelo inverso: $\\dfrac{1}{4/3} = \\dfrac{3}{4}$.",
            "Logo $p_{\\text{aparente}} = \\dfrac{3}{4} \\times 1 = 0{,}75\\ m$.",
            "Conferência: deu menos que $1\\ m$, então o objeto parece mais raso, como deve ser quando se olha do ar para a água.",
          ],
          answer: "Ele parece estar a $0{,}75\\ m$ da superfície, embora esteja a $1\\ m$.",
        },
        { type: "paragraph", text: "**Como desenhar:**" },
        {
          type: "list",
          style: "number",
          items: [
            "Desenhe a superfície da água, com o ar acima e a água abaixo.",
            "Desenhe o objeto submerso.",
            "Trace dois raios saindo do objeto até a superfície.",
            "Desenhe os raios refratados no ar, afastando-se da normal.",
            "Prolongue os raios refratados para dentro da água com linhas tracejadas.",
            "Marque a posição aparente no cruzamento dos prolongamentos.",
            "Identifique as profundidades real e aparente.",
          ],
        },
        { type: "heading", text: "6. Ângulo limite e reflexão total" },
        {
          type: "paragraph",
          text: "Agora o caso mais interessante. Imagine a luz saindo da água para o ar: ela se afasta da normal. Se você for aumentando o ângulo de incidência, o raio refratado vai abrindo cada vez mais, até ficar rasante à superfície ($r = 90°$).",
        },
        {
          type: "paragraph",
          text: "O ângulo de incidência que produz exatamente $r = 90°$ se chama **ângulo limite (L)**. Se você passar dele, não existe mais raio refratado: toda a luz volta para o meio de origem. Isso é a **reflexão total**.",
        },
        { type: "formula", text: "\\operatorname{sen}L = \\dfrac{n_{\\text{menor}}}{n_{\\text{maior}}}" },
        {
          type: "quantities",
          items: [
            { symbol: "L", name: "ângulo limite", unit: "graus" },
            { symbol: "n_{menor}", name: "índice do meio MENOS refringente" },
            { symbol: "n_{maior}", name: "índice do meio MAIS refringente (onde a luz está)" },
          ],
        },
        {
          type: "callout",
          variant: "warning",
          title: "As DUAS condições (precisa das duas)",
          text: "Para haver reflexão total: (1) a luz precisa ir do meio MAIS refringente para o MENOS refringente; e (2) o ângulo de incidência precisa ser MAIOR que o ângulo limite. Faltando qualquer uma, parte da luz atravessa. Indo do ar para a água, por exemplo, nunca há reflexão total, por maior que seja o ângulo.",
        },
        {
          type: "solved-example",
          title: "Exemplo resolvido 3: ângulo limite",
          statement:
            "Calcule o ângulo limite para a luz que vai do vidro ($n = 1{,}5$) para o ar ($n = 1$). Em seguida, diga o que acontece com um raio que incide a $50°$ na superfície interna do vidro.",
          steps: [
            "**Checando a condição 1:** a luz vai do vidro ($1{,}5$) para o ar ($1$), ou seja, do mais para o menos refringente. Pode haver reflexão total.",
            "**Ângulo limite:** $\\operatorname{sen}L = \\dfrac{n_{menor}}{n_{maior}} = \\dfrac{1}{1{,}5} \\approx 0{,}667$.",
            "$L \\approx 41{,}8°$.",
            "**Checando a condição 2:** o raio incide a $50°$, que é MAIOR que $41{,}8°$.",
            "As duas condições foram satisfeitas, então ocorre reflexão total: nenhuma luz sai para o ar.",
            "**Interpretação:** o raio é inteiramente refletido de volta para dentro do vidro, obedecendo $i = r$ como em um espelho perfeito.",
          ],
          answer: "$L \\approx 41{,}8°$. Como $50° > L$, ocorre reflexão total e a luz não atravessa.",
        },
        {
          type: "table",
          headers: ["Situação", "O que acontece"],
          rows: [
            ["$i < L$", "Há refração (e uma parte da luz também reflete)"],
            ["$i = L$", "O raio refratado sai rasante, paralelo à superfície ($r = 90°$)"],
            ["$i > L$", "Reflexão total: não existe raio refratado"],
          ],
        },
        {
          type: "diagram",
          name: "angulo-limite",
          caption: "A luz vai do vidro para o ar. Abaixo do ângulo limite ela atravessa; no limite sai rasante; acima dele volta inteira para o vidro.",
        },
        {
          type: "paragraph",
          text: "**Como desenhar a reflexão total:** desenhe os dois meios e a normal; coloque o raio incidente no meio de **maior** índice, com ângulo maior que L; desenhe o refletido voltando ao meio de origem com o mesmo ângulo ($i = r$). E o mais importante: **não desenhe** raio refratado no segundo meio.",
        },
        {
          type: "paragraph",
          text: "**Fibra óptica.** É a aplicação mais importante disso. A fibra é um fio de vidro ou plástico muito fino, feito de um núcleo mais refringente envolvido por uma casca menos refringente. A luz entra quase paralela ao fio e bate nas paredes sempre com ângulo maior que o limite, então sofre reflexão total milhares de vezes e percorre quilômetros sem escapar, mesmo quando o cabo faz curvas. É assim que a internet chega até você.",
        },
        { type: "formula", text: "n_{\\text{núcleo}} > n_{\\text{casca}}", caption: "Condição fundamental da fibra óptica." },
        { type: "diagram", name: "fibra-optica", caption: "Como desenhar: um tubo comprido, com o núcleo no centro e a casca em volta; escreva a condição dos índices e desenhe o raio em zigue-zague, refletindo a cada batida na interface núcleo-casca." },
        {
          type: "interactive",
          tool: "draw",
          template: "refracao",
          title: "Pratique o diagrama",
          note: "A superfície, a normal e o raio incidente já estão desenhados. Trace o raio refratado e toque em **Conferir construção**. A prancheta mede o ângulo que você desenhou.",
        },
        {
          type: "checklist",
          title: "Confira seu diagrama",
          items: [
            "A normal está perpendicular à superfície e tracejada.",
            "Os ângulos $i$ e $r$ foram marcados a partir da normal, não da superfície.",
            "O raio refratado está do outro lado da superfície e do mesmo lado da normal que o incidente.",
            "Se o meio 2 é mais refringente, o raio refratado ficou mais perto da normal (e vice-versa).",
            "As setas indicam o sentido de propagação da luz.",
          ],
        },

        { type: "heading", text: "7. Erros frequentes" },
        {
          type: "list",
          items: [
            "Medir os ângulos a partir da superfície em vez da normal.",
            "Dizer que a frequência muda na refração. Ela NÃO muda. Quem muda é a velocidade e o comprimento de onda.",
            "Esquecer a condição de que a luz precisa vir do meio mais refringente para haver reflexão total.",
            "Trocar $n_1$ com $n_2$ na lei de Snell. O índice 1 é sempre o do meio de ONDE a luz vem.",
            "Achar que na incidência normal ($0°$) não há refração. Há: a velocidade muda. O que não há é desvio.",
            "Calcular $\\operatorname{sen}r$ e entregar isso como resposta, esquecendo de achar o ângulo.",
            "Obter $\\operatorname{sen}r > 1$ e achar que errou a conta. Isso é justamente o sinal de que houve reflexão total.",
            "Esquecer de colocar a calculadora em graus antes de usar o arco-seno.",
            "Na profundidade aparente, inverter os índices: em cima da fração vai o índice do meio de quem OBSERVA.",
          ],
        },

        { type: "heading", text: "8. Resumo da parte" },
        {
          type: "table",
          headers: ["Item", "O que guardar"],
          rows: [
            ["Refração", "Mudança de meio com mudança de velocidade"],
            ["Índice de refração", "$n = c/v$, sempre $n \\geq 1$"],
            ["Não muda", "Frequência e cor"],
            ["Muda", "Velocidade e comprimento de onda"],
            ["Lei de Snell", "$n_1 \\operatorname{sen}i = n_2 \\operatorname{sen}r$"],
            ["Para meio mais refringente", "Aproxima da normal"],
            ["Para meio menos refringente", "Afasta da normal"],
            ["Incidência normal", "Não desvia"],
            ["Ângulo limite", "$\\operatorname{sen}L = n_{menor}/n_{maior}$"],
            ["Reflexão total", "Do mais para o menos refringente E $i > L$"],
            ["Snell com velocidades", "$v_2 \\operatorname{sen} i = v_1 \\operatorname{sen} r$"],
            ["Profundidade aparente", "$\\dfrac{n_{obs}}{n_{obj}} = \\dfrac{p_{ap}}{p_{real}}$ (olhando quase perpendicular)"],
            ["Fibra óptica", "$n_{\\text{núcleo}} > n_{\\text{casca}}$"],
          ],
        },
      ],
      flashcards: [
        { id: "fc-1", question: "O que é refração da luz?", answer: "A passagem da luz de um meio para outro, com mudança de velocidade, em geral acompanhada de desvio na direção." },
        { id: "fc-2", question: "Qual é a fórmula do índice de refração absoluto?", answer: "$n = \\dfrac{c}{v}$, sendo $c$ a velocidade da luz no vácuo e $v$ a velocidade no meio. Vale sempre $n \\geq 1$." },
        { id: "fc-3", question: "Na refração, o que NÃO muda?", answer: "A frequência (e portanto a cor). Mudam a velocidade e o comprimento de onda." },
        { id: "fc-4", question: "Enuncie a lei de Snell-Descartes.", answer: "$n_1 \\cdot \\operatorname{sen}i = n_2 \\cdot \\operatorname{sen}r$, com os ângulos medidos a partir da normal." },
        { id: "fc-5", question: "A luz passa para um meio MAIS refringente. Ela se aproxima ou se afasta da normal?", answer: "Aproxima-se da normal ($r < i$)." },
        { id: "fc-6", question: "O que acontece quando a luz incide perpendicularmente à superfície ($i = 0°$)?", answer: "Não há desvio: o raio segue reto. A velocidade muda, mas a direção não." },
        { id: "fc-7", question: "O que é o ângulo limite?", answer: "O ângulo de incidência que produz refração rasante ($r = 90°$). Acima dele ocorre reflexão total. $\\operatorname{sen}L = n_{menor}/n_{maior}$." },
        { id: "fc-8", question: "Quais são as duas condições para ocorrer reflexão total?", answer: "A luz deve ir do meio mais refringente para o menos refringente, E o ângulo de incidência deve ser maior que o ângulo limite." },
        { id: "fc-9", question: "Como a fibra óptica usa a reflexão total?", answer: "O núcleo é mais refringente que a casca; a luz incide nas paredes sempre acima do ângulo limite e sofre reflexão total repetidas vezes, percorrendo o cabo sem escapar." },
        { id: "fc-10", question: "Por que uma piscina parece mais rasa do que é?", answer: "A luz que sai da água para o ar se afasta da normal; os prolongamentos dos raios se cruzam acima da posição real. Para observação perpendicular: $\\dfrac{n_{obs}}{n_{obj}} = \\dfrac{p_{ap}}{p_{real}}$." },
        { id: "fc-11", question: "Escreva a lei de Snell usando velocidades.", answer: "$v_2 \\cdot \\operatorname{sen} i = v_1 \\cdot \\operatorname{sen} r$." },
      ],
      questions: [
        {
          id: "q-1",
          level: 1,
          origin: "pratica",
          statement: "Um lápis mergulhado em um copo com água parece quebrado na superfície. Esse efeito é explicado pela:",
          alternatives: [
            { id: "a", text: "reflexão total da luz" },
            { id: "b", text: "refração da luz" },
            { id: "c", text: "reflexão difusa na água" },
            { id: "d", text: "ausência de luz dentro da água" },
          ],
          correctAlternativeId: "b",
          explanation:
            "A luz que vem da parte submersa do lápis muda de velocidade e de direção ao sair da água para o ar. Nosso cérebro supõe trajeto retilíneo e 'vê' a parte de baixo deslocada, dando o aspecto de quebra. Não é reflexão total porque a luz efetivamente atravessa a superfície.",
        },
        {
          id: "q-2",
          level: 2,
          origin: "pratica",
          statement: "A velocidade da luz em certo meio é $2{,}0 \\times 10^8\\ m/s$. Considerando $c = 3{,}0 \\times 10^8\\ m/s$, o índice de refração desse meio é:",
          alternatives: [
            { id: "a", text: "$0{,}67$" },
            { id: "b", text: "$1{,}0$" },
            { id: "c", text: "$1{,}5$" },
            { id: "d", text: "$2{,}0$" },
          ],
          correctAlternativeId: "c",
          explanation:
            "$n = \\dfrac{c}{v} = \\dfrac{3{,}0 \\times 10^8}{2{,}0 \\times 10^8} = 1{,}5$. A alternativa $0{,}67$ é o resultado de inverter a fração ($v/c$) e deveria ser descartada na hora, porque o índice de refração nunca é menor que 1.",
        },
        {
          id: "q-3",
          level: 1,
          origin: "pratica",
          statement: "Quando a luz passa do ar para a água, é correto afirmar que:",
          alternatives: [
            { id: "a", text: "a frequência diminui e a velocidade aumenta" },
            { id: "b", text: "todas as grandezas permanecem as mesmas" },
            { id: "c", text: "a frequência aumenta e o comprimento de onda aumenta" },
            { id: "d", text: "a frequência permanece a mesma e a velocidade diminui" },
          ],
          correctAlternativeId: "d",
          explanation:
            "A frequência é determinada pela fonte e não muda ao trocar de meio. A água tem $n > 1$, então a luz fica mais lenta. E como $v = \\lambda f$ com $f$ constante, o comprimento de onda também diminui.",
        },
        {
          id: "q-4",
          level: 2,
          origin: "pratica",
          statement: "Um raio luminoso incide perpendicularmente ($i = 0°$) sobre a superfície de separação entre ar e vidro. O raio refratado:",
          alternatives: [
            { id: "a", text: "não existe, pois ocorre reflexão total" },
            { id: "b", text: "desvia-se aproximando-se da normal" },
            { id: "c", text: "atravessa sem sofrer desvio, mas com velocidade menor" },
            { id: "d", text: "atravessa sem sofrer desvio e com a mesma velocidade" },
          ],
          correctAlternativeId: "c",
          explanation:
            "Na lei de Snell, com $i = 0°$ temos $\\operatorname{sen}i = 0$, o que força $\\operatorname{sen}r = 0$ e $r = 0°$: nenhum desvio. Mas houve refração: a luz entrou no vidro e passou a andar mais devagar. Confundir 'sem desvio' com 'sem refração' é o erro clássico aqui.",
        },
        {
          id: "q-5",
          level: 3,
          origin: "pratica",
          statement: "Um raio passa do ar ($n = 1$) para um meio de índice $n_2$, incidindo a $60°$ e refratando a $30°$. Dados $\\operatorname{sen}60° = 0{,}87$ e $\\operatorname{sen}30° = 0{,}50$, o valor de $n_2$ é aproximadamente:",
          alternatives: [
            { id: "a", text: "$1{,}7$" },
            { id: "b", text: "$1{,}2$" },
            { id: "c", text: "$0{,}58$" },
            { id: "d", text: "$2{,}0$" },
          ],
          correctAlternativeId: "a",
          explanation:
            "Snell: $1 \\times 0{,}87 = n_2 \\times 0{,}50$, logo $n_2 = \\dfrac{0{,}87}{0{,}50} = 1{,}74 \\approx 1{,}7$. Conferência: o raio se aproximou da normal ($30° < 60°$), então o meio 2 tem de ser mais refringente, ou seja, $n_2 > 1$. A alternativa $0{,}58$ vem de inverter a divisão e é impossível por ser menor que 1.",
        },
        {
          id: "q-6",
          level: 3,
          origin: "pratica",
          statement: "O ângulo limite entre um meio X e o ar ($n = 1$) é tal que $\\operatorname{sen}L = 0{,}5$. O índice de refração do meio X vale:",
          alternatives: [
            { id: "a", text: "$0{,}5$" },
            { id: "b", text: "$1{,}5$" },
            { id: "c", text: "$2{,}5$" },
            { id: "d", text: "$2{,}0$" },
          ],
          correctAlternativeId: "d",
          explanation:
            "$\\operatorname{sen}L = \\dfrac{n_{menor}}{n_{maior}} = \\dfrac{1}{n_X}$. Então $0{,}5 = \\dfrac{1}{n_X}$ e $n_X = 2{,}0$. (Como $\\operatorname{sen}L = 0{,}5$, o ângulo limite é $30°$: incidências acima de $30°$ dentro do meio X sofrem reflexão total.)",
        },
        {
          id: "q-7",
          level: 4,
          origin: "pratica",
          statement: "Sobre a reflexão total, considere: (I) Pode ocorrer quando a luz vai do ar para a água. (II) Exige ângulo de incidência maior que o ângulo limite. (III) É o princípio de funcionamento da fibra óptica. Está(ão) correta(s):",
          alternatives: [
            { id: "a", text: "apenas I e II" },
            { id: "b", text: "apenas II e III" },
            { id: "c", text: "apenas I e III" },
            { id: "d", text: "I, II e III" },
          ],
          correctAlternativeId: "b",
          explanation:
            "(I) é FALSA: indo do ar ($n=1$) para a água ($n=1{,}33$), a luz vai para o meio MAIS refringente e se aproxima da normal, então nunca há reflexão total nesse sentido. Ela só poderia ocorrer no caminho inverso, água → ar. (II) e (III) são verdadeiras: a reflexão total exige ultrapassar o ângulo limite, e é exatamente o que mantém a luz presa dentro da fibra óptica.",
        },
        {
          id: "q-8",
          level: 4,
          origin: "pratica",
          statement: "Um raio de luz se propaga dentro da água ($n = 1{,}33$) e atinge a superfície de separação com o ar ($n = 1$) com ângulo de incidência de $60°$. Sabendo que o ângulo limite água-ar é aproximadamente $49°$, o que acontece?",
          alternatives: [
            { id: "a", text: "O raio refrata, afastando-se da normal." },
            { id: "b", text: "O raio refrata, aproximando-se da normal." },
            { id: "c", text: "O raio sofre reflexão total e volta para a água." },
            { id: "d", text: "O raio atravessa sem desvio." },
          ],
          correctAlternativeId: "c",
          explanation:
            "Verifique as duas condições: (1) a luz vai da água para o ar, isto é, do mais para o menos refringente (ok); (2) $60° > 49°$, ultrapassou o ângulo limite (ok). Logo, ocorre reflexão total e nenhuma luz sai para o ar. Confirmando pela conta: $\\operatorname{sen}r = \\dfrac{1{,}33 \\times \\operatorname{sen}60°}{1} \\approx 1{,}15$, um valor impossível para um seno, o que é exatamente o sinal matemático da reflexão total.",
        },
        {
          id: "q-9",
          level: 5,
          origin: "pratica",
          statement: "A luz amarela tem comprimento de onda de $600\\ nm$ no vácuo. Ao entrar em um vidro de índice de refração $1{,}5$, seu comprimento de onda passa a ser:",
          alternatives: [
            { id: "a", text: "$400\\ nm$" },
            { id: "b", text: "$600\\ nm$" },
            { id: "c", text: "$900\\ nm$" },
            { id: "d", text: "Não é possível calcular sem saber a frequência." },
          ],
          correctAlternativeId: "a",
          explanation:
            "A frequência não muda. De $v = \\lambda f$, no vácuo $c = \\lambda_0 f$ e no meio $v = \\lambda f$. Dividindo as duas: $\\dfrac{\\lambda}{\\lambda_0} = \\dfrac{v}{c} = \\dfrac{1}{n}$, ou seja, $\\lambda = \\dfrac{\\lambda_0}{n} = \\dfrac{600}{1{,}5} = 400\\ nm$. Note que a frequência se cancelou, por isso a alternativa (d) é desnecessária. Curiosidade coerente: a cor percebida continua amarela, porque a cor depende da frequência, que não mudou.",
        },
        {
          id: "q-10",
          level: 2,
          origin: "pratica",
          statement: "Um objeto está no fundo de um tanque com $2{,}0\\ m$ de água ($n = 4/3$). Para quem olha de cima, quase perpendicularmente, o objeto parece estar a que profundidade?",
          alternatives: [
            { id: "a", text: "$1{,}0\\ m$" },
            { id: "b", text: "$1{,}5\\ m$" },
            { id: "c", text: "$2{,}0\\ m$" },
            { id: "d", text: "$2{,}7\\ m$" },
          ],
          correctAlternativeId: "b",
          explanation:
            "$\\dfrac{n_{obs}}{n_{obj}} = \\dfrac{p_{ap}}{p_{real}} \\Rightarrow \\dfrac{1}{4/3} = \\dfrac{p_{ap}}{2{,}0}$, logo $p_{ap} = \\dfrac{3}{4} \\times 2{,}0 = 1{,}5\\ m$. A alternativa $2{,}7\\ m$ ($2{,}0 \\times 4/3$) aparece quando se invertem os índices, e deixaria o objeto mais fundo, o contrário do que se observa.",
        },
        {
          id: "q-11",
          level: 3,
          origin: "pratica",
          statement: "A luz passa de um meio 1, onde sua velocidade é $v_1 = 2{,}4 \\times 10^8\\ m/s$, para um meio 2, onde vale $v_2 = 1{,}2 \\times 10^8\\ m/s$. Com ângulo de incidência de $30°$ ($\\operatorname{sen}30° = 0{,}50$), o seno do ângulo de refração vale:",
          alternatives: [
            { id: "a", text: "$0{,}25$" },
            { id: "b", text: "$0{,}50$" },
            { id: "c", text: "$0{,}75$" },
            { id: "d", text: "$1{,}0$" },
          ],
          correctAlternativeId: "a",
          explanation:
            "Pela lei com velocidades, $v_2 \\operatorname{sen} i = v_1 \\operatorname{sen} r$: $1{,}2 \\times 10^8 \\times 0{,}50 = 2{,}4 \\times 10^8 \\times \\operatorname{sen} r$, logo $\\operatorname{sen} r = \\dfrac{0{,}60}{2{,}4} = 0{,}25$. Conferência: a luz ficou mais lenta, então se aproxima da normal; de fato $0{,}25 < 0{,}50$, ou seja, $r < i$. A alternativa $1{,}0$ vem de trocar $v_1$ com $v_2$.",
        },
      ],
      videos: [AULAO_OPTICA, PLAYLIST_OPTICA],
    },
  ],

  // ← Vídeos que não pertencem a uma parte específica.
  generalVideos: [],

  // ← Questões discursivas gerais (área /discursivas). Modelo:
  //    { id: "disc-1",
  //      topic: "Nome do tema",
  //      relatedPartId: "cinematica",
  //      statement: "Enunciado...",
  //      solutionSteps: ["Passo 1...", "Passo 2..."],
  //      finalAnswer: "Resposta final." }
  // ← Aula de exercícios do professor ("Espelhos Planos e Esféricos").
  //    Gabarito transcrito do PDF; os enunciados completos estão no PDF.
  professorExercises: [
    { number: 1, topic: "Espelho plano", partId: "espelhos-planos", asks: "Distância horizontal entre a imagem do barbeiro e os olhos do rapaz.", study: ["Formação de imagens", "Simetria", "Distâncias objeto-imagem"], answer: "$2{,}10\\ m$" },
    { number: 2, topic: "Dois espelhos planos a 90°", partId: "espelhos-planos", asks: "Distâncias do objeto às três imagens formadas pelos espelhos.", study: ["Associação de espelhos", "Imagens sucessivas", "Pitágoras"], answer: "$16\\ cm$, $12\\ cm$ e $20\\ cm$", check: "Coerente: $12^2 + 16^2 = 144 + 256 = 400 = 20^2$. A imagem do canto fica na diagonal do retângulo formado pelas outras duas, como prevê a dupla reflexão." },
    { number: 3, topic: "Espelho côncavo", partId: "espelhos-esfericos", asks: "Afirmações sobre o foco, o deslocamento do objeto e as características da imagem em diferentes instantes.", study: ["Cinco casos", "Equação de Gauss", "Aumento linear"], answer: "I, II e III corretas; IV incorreta" },
    { number: 4, topic: "Espelho côncavo", partId: "espelhos-esfericos", asks: "Raio de curvatura e tamanho da imagem.", study: ["$f = R/2$", "Equação de Gauss", "Aumento linear"], answer: "$5{,}0\\ cm$" },
    { number: 5, topic: "Espelho convexo", partId: "espelhos-esfericos", asks: "Raio de curvatura e imagem dez vezes menor.", study: ["Aumento linear", "Equação de Gauss", "Sinais no convexo"], answer: "$4{,}5\\ m$", check: "Coerente com o convexo: imagem dez vezes menor e sempre direita significa $A = +0{,}1$ (sinal positivo)." },
    { number: 6, topic: "Espelho côncavo", partId: "espelhos-esfericos", asks: "Posição inicial do objeto e deslocamento até objeto e imagem terem o mesmo tamanho.", study: ["Aumento linear", "Equação de Gauss", "Objeto em C"], answer: "$6\\ cm$, afastando-se do espelho", check: "Coerente: no côncavo, objeto e imagem do mesmo tamanho exige o objeto sobre C ($d_o = 2f$). 'Afastando-se' indica que ele começou mais perto do espelho do que C." },
    { number: 7, topic: "Espelho côncavo", partId: "espelhos-esfericos", asks: "Centro de curvatura, posição do objeto e altura da imagem.", study: ["Geometria do espelho", "Equação de Gauss", "Aumento linear"], answer: "$6\\ cm$" },
    { number: 8, topic: "Espelho côncavo", partId: "espelhos-esfericos", asks: "Cálculo da distância da imagem.", study: ["Equação de Gauss", "Convenção de sinais"], answer: "$7{,}5\\ cm$" },
    { number: 9, topic: "Espelho odontológico", partId: "espelhos-esfericos", asks: "Ampliação produzida por um espelho côncavo.", study: ["Aumento linear", "Imagem virtual, direita e ampliada"], answer: "Aumento $4$; imagem virtual, direita e quatro vezes maior", check: "Coerente: $A = +4$ (positivo e maior que 1) só acontece no côncavo com o objeto entre F e V, o caso 5." },
    { number: 10, topic: "Objeto extenso inclinado", partId: "espelhos-esfericos", asks: "Comprimento da imagem de um objeto inclinado diante de um espelho côncavo.", study: ["Gauss em cada ponta", "Aumento linear", "Pitágoras"], answer: "$40\\sqrt{13}\\ cm \\approx 144{,}2\\ cm$", check: "Conta conferida: $\\sqrt{13} \\approx 3{,}606$ e $40 \\times 3{,}606 \\approx 144{,}2\\ cm$. O método está na Parte 2, seção 9." },
  ],

  discursiveQuestions: [
    /*
     * Questões criadas para praticar. As 10 da aula de exercícios do professor
     * estão catalogadas em `professorExercises` (acima), com o gabarito transcrito.
     */
    {
      id: "disc-1",
      topic: "Espelhos planos",
      relatedPartId: "espelhos-planos",
      level: 3,
      origin: "pratica",
      statement:
        "Uma pessoa de $1{,}60\\ m$ de altura está parada a $2{,}0\\ m$ de um espelho plano vertical.\n\na) A que distância da pessoa está a sua imagem?\nb) Qual é a altura da imagem?\nc) Ela caminha $0{,}75\\ m$ em direção ao espelho. Qual passa a ser a distância entre ela e a imagem?\nd) Qual a altura mínima de espelho para que ela se veja por inteiro?",
      solutionSteps: [
        "a) A imagem é simétrica: fica a $2{,}0\\ m$ do outro lado do espelho. Como estão em lados opostos, a distância entre as duas é $D = 2d = 2 \\times 2{,}0 = 4{,}0\\ m$.",
        "b) No espelho plano a imagem tem sempre o mesmo tamanho do objeto: $1{,}60\\ m$. Ela é virtual e direita.",
        "c) Nova distância ao espelho: $2{,}0 - 0{,}75 = 1{,}25\\ m$. Logo $D = 2 \\times 1{,}25 = 2{,}5\\ m$. (Conferindo pelo atalho: a distância diminui o dobro do deslocamento, $4{,}0 - 2\\times0{,}75 = 4{,}0 - 1{,}5 = 2{,}5\\ m$.)",
        "d) Pela construção com $i = r$, o espelho precisa ter metade da altura da pessoa: $1{,}60/2 = 0{,}80\\ m$. Esse resultado não depende da distância, então vale tanto antes quanto depois de ela caminhar.",
      ],
      finalAnswer: "a) $4{,}0\\ m$ · b) $1{,}60\\ m$ · c) $2{,}5\\ m$ · d) $0{,}80\\ m$",
    },
    {
      id: "disc-2",
      topic: "Espelhos planos",
      relatedPartId: "espelhos-planos",
      level: 4,
      origin: "pratica",
      statement:
        "Um raio de luz incide sobre um espelho plano formando $35°$ com a superfície do espelho.\n\na) Determine o ângulo de incidência e o de reflexão.\nb) Qual o ângulo entre o raio incidente e o raio refletido?\nc) Faça o desenho da situação, indicando a normal, os dois raios e os ângulos.",
      checklist: [
        "A normal foi traçada perpendicular ao espelho, no ponto de incidência, e está tracejada.",
        "Os ângulos foram marcados entre cada raio e a NORMAL (não entre o raio e o espelho).",
        "O raio incidente e o refletido estão em lados opostos da normal.",
        "Os dois ângulos marcados têm o mesmo valor.",
        "As setas mostram a luz chegando ao espelho e saindo dele.",
      ],
      solutionSteps: [
        "a) O enunciado deu o ângulo com a SUPERFÍCIE. Como a normal é perpendicular a ela, converta: $i = 90° - 35° = 55°$. Pela 2ª lei da reflexão, $r = i = 55°$.",
        "b) O raio incidente está a $55°$ de um lado da normal e o refletido a $55°$ do outro. Somando: $55° + 55° = 110°$.",
        "c) No desenho: trace o espelho, marque o ponto de incidência, trace a normal tracejada perpendicular ao espelho nesse ponto. Desenhe o raio incidente chegando a $55°$ da normal e o refletido saindo a $55°$ do outro lado. Marque as setas no sentido da propagação.",
        "Conferência: outra forma de obter (b) é notar que, se cada raio faz $35°$ com o espelho, o ângulo entre eles é $180° - 35° - 35° = 110°$. Bate com a primeira conta.",
      ],
      finalAnswer: "a) $i = r = 55°$ · b) $110°$ entre os dois raios",
    },
    {
      id: "disc-3",
      topic: "Espelhos esféricos",
      relatedPartId: "espelhos-esfericos",
      level: 3,
      origin: "pratica",
      statement:
        "Um objeto de $6\\ cm$ de altura está a $45\\ cm$ de um espelho côncavo cujo raio de curvatura mede $30\\ cm$.\n\na) Calcule a distância focal.\nb) Determine a posição da imagem.\nc) Calcule o aumento linear e a altura da imagem.\nd) Classifique a imagem quanto à natureza, orientação e tamanho.",
      solutionSteps: [
        "a) $f = \\dfrac{R}{2} = \\dfrac{30}{2} = 15\\ cm$. Positivo, porque o espelho é côncavo.",
        "b) Equação de Gauss: $\\dfrac{1}{15} = \\dfrac{1}{45} + \\dfrac{1}{d_i}$, logo $\\dfrac{1}{d_i} = \\dfrac{1}{15} - \\dfrac{1}{45}$. Com MMC 45: $\\dfrac{3}{45} - \\dfrac{1}{45} = \\dfrac{2}{45}$. Invertendo: $d_i = 22{,}5\\ cm$.",
        "c) $A = -\\dfrac{d_i}{d_o} = -\\dfrac{22{,}5}{45} = -0{,}5$. Altura: $h_i = A \\cdot h_o = -0{,}5 \\times 6 = -3\\ cm$ (o sinal indica inversão; o tamanho é $3\\ cm$).",
        "d) $d_i > 0$ → imagem REAL. $A < 0$ → INVERTIDA. $|A| = 0{,}5 < 1$ → MENOR.",
        "Conferência: o objeto está a $45\\ cm$, além do centro de curvatura ($R = 30\\ cm$). Pela tabela dos cinco casos, esperávamos imagem real, invertida e menor, situada entre F ($15$) e C ($30$). E $22{,}5\\ cm$ está entre $15$ e $30$. Tudo coerente.",
      ],
      finalAnswer:
        "a) $f = 15\\ cm$ · b) $d_i = 22{,}5\\ cm$ · c) $A = -0{,}5$ e imagem de $3\\ cm$ · d) real, invertida e menor",
    },
    {
      id: "disc-4",
      topic: "Espelhos esféricos",
      relatedPartId: "espelhos-esfericos",
      level: 4,
      origin: "pratica",
      statement:
        "Um objeto está a $8\\ cm$ de um espelho côncavo de distância focal $12\\ cm$.\n\na) Sem fazer contas, preveja as características da imagem a partir da posição do objeto.\nb) Confirme com a equação de Gauss, calculando $d_i$ e $A$.\nc) Construa o diagrama com os raios notáveis.",
      checklist: [
        "O eixo principal foi traçado e V, F e C estão marcados ($VC = 2 \\cdot VF$).",
        "O objeto foi desenhado entre F e V (dentro do foco).",
        "O raio paralelo ao eixo foi refletido passando por F.",
        "O raio que aponta para F foi refletido paralelo ao eixo.",
        "Os raios refletidos saem DIVERGENTES e só se cruzam quando prolongados para trás do espelho.",
        "Os prolongamentos estão tracejados e a imagem ficou atrás do espelho, maior e para cima.",
      ],
      solutionSteps: [
        "a) Como $d_o = 8\\ cm$ e $f = 12\\ cm$, temos $d_o < f$: o objeto está entre o foco e o vértice. É o 5º caso, então a previsão é imagem virtual, direita e maior.",
        "b) Gauss: $\\dfrac{1}{d_i} = \\dfrac{1}{12} - \\dfrac{1}{8}$. MMC 24: $\\dfrac{2}{24} - \\dfrac{3}{24} = -\\dfrac{1}{24}$. Invertendo: $d_i = -24\\ cm$.",
        "O sinal negativo confirma a previsão: imagem VIRTUAL, $24\\ cm$ atrás do espelho.",
        "Aumento: $A = -\\dfrac{-24}{8} = +3$. Positivo → direita; maior que 1 → três vezes maior. Previsão confirmada nos três aspectos.",
        "c) No desenho, os dois raios refletidos saem abrindo (divergentes). Só os prolongamentos tracejados, atrás do espelho, se encontram, e é lá que fica a imagem, maior e em pé.",
      ],
      finalAnswer:
        "a) virtual, direita e maior · b) $d_i = -24\\ cm$ e $A = +3$ · c) imagem atrás do espelho, três vezes maior",
    },
    {
      id: "disc-5",
      topic: "Refração da luz",
      relatedPartId: "refracao-da-luz",
      level: 4,
      origin: "pratica",
      statement:
        "Um raio de luz se propaga dentro de um bloco de vidro de índice de refração $1{,}6$ e atinge a superfície que o separa do ar ($n = 1$). Adote $c = 3 \\times 10^8\\ m/s$.\n\na) Qual a velocidade da luz dentro do vidro?\nb) Calcule o ângulo limite vidro-ar. (Use $\\operatorname{sen}L = 0{,}625 \\Rightarrow L \\approx 38{,}7°$.)\nc) O raio incide a $30°$. Ele atravessa para o ar? Justifique.\nd) E se incidisse a $45°$?",
      solutionSteps: [
        "a) $v = \\dfrac{c}{n} = \\dfrac{3 \\times 10^8}{1{,}6} = 1{,}875 \\times 10^8\\ m/s$. Menor que $c$, como esperado.",
        "b) $\\operatorname{sen}L = \\dfrac{n_{menor}}{n_{maior}} = \\dfrac{1}{1{,}6} = 0{,}625$, logo $L \\approx 38{,}7°$.",
        "c) A primeira condição está satisfeita (a luz vai do vidro para o ar, do mais para o menos refringente). Mas $30° < 38{,}7°$: não ultrapassou o limite. Então o raio ATRAVESSA, refratando-se e afastando-se da normal.",
        "Podemos até achar o ângulo: $1{,}6 \\times \\operatorname{sen}30° = 1 \\times \\operatorname{sen}r$, ou seja, $\\operatorname{sen}r = 1{,}6 \\times 0{,}5 = 0{,}8$, dando $r \\approx 53°$. Como $53° > 30°$, confirma-se o afastamento da normal.",
        "d) Agora $45° > 38{,}7°$: as duas condições são atendidas e ocorre REFLEXÃO TOTAL. Nenhuma luz sai para o ar; toda ela volta para o vidro obedecendo $i = r$.",
        "Verificação pela conta: $\\operatorname{sen}r = 1{,}6 \\times \\operatorname{sen}45° \\approx 1{,}6 \\times 0{,}707 \\approx 1{,}13$, que é impossível para um seno: justamente o sinal matemático da reflexão total.",
      ],
      finalAnswer:
        "a) $1{,}875 \\times 10^8\\ m/s$ · b) $L \\approx 38{,}7°$ · c) atravessa, refratando a $\\approx 53°$ · d) sofre reflexão total",
    },
    {
      id: "disc-6",
      topic: "Refração da luz",
      relatedPartId: "refracao-da-luz",
      level: 5,
      origin: "pratica",
      statement:
        "Explique, com suas palavras e usando os conceitos de índice de refração e reflexão total, por que a luz consegue percorrer vários quilômetros dentro de uma fibra óptica sem escapar pelas laterais, mesmo quando o cabo faz curvas.",
      solutionSteps: [
        "Comece pela estrutura: a fibra tem um NÚCLEO central e uma CASCA em volta. O núcleo é feito de material mais refringente (índice maior) que a casca.",
        "Primeira condição da reflexão total: a luz viaja dentro do núcleo e atinge a casca, ou seja, vai do meio MAIS refringente para o MENOS refringente. Condição satisfeita.",
        "Segunda condição: a luz é injetada quase paralela ao eixo da fibra. Assim, ao atingir a parede lateral, ela chega bem inclinada em relação à normal daquela parede, com ângulo de incidência MAIOR que o ângulo limite. Condição também satisfeita.",
        "Resultado: ocorre reflexão total. Diferente de um espelho comum, aqui não há perda por absorção na reflexão, porque 100% da luz é devolvida para o núcleo.",
        "Esse processo se repete milhares de vezes ao longo do cabo, e a luz vai 'quicando' dentro do núcleo até o destino.",
        "Nas curvas: desde que a curva seja suave, o ângulo de incidência nas paredes continua acima do limite, e a reflexão total se mantém. Se o cabo for dobrado demais, o ângulo pode cair abaixo do limite e parte da luz escapa. Por isso existe um raio mínimo de curvatura para instalação.",
      ],
      finalAnswer:
        "Porque o núcleo é mais refringente que a casca e a luz incide nas paredes com ângulo maior que o ângulo limite, sofrendo reflexão total sucessivas vezes, sem perda de intensidade na reflexão e mantendo-se presa ao núcleo, inclusive em curvas suaves.",
    },
  ],
};

/* ────────────────────────────────────────────────────────
   3. CÁLCULOS DERIVADOS (contagens, gabarito, navegação)
   ──────────────────────────────────────────────────────── */

// Contagens, gabarito e navegação entre partes são sempre calculados
// a partir do bloco 2 — nunca escritos à mão em dois lugares.

export function getReview(): Review {
  return review;
}

export function getParts(): Part[] {
  return review.parts;
}

export function getPart(id: string): Part | undefined {
  return review.parts.find((part) => part.id === id);
}

export function getAdjacentParts(id: string): {
  prev: Part | undefined;
  next: Part | undefined;
} {
  const parts = getParts();
  const index = parts.findIndex((part) => part.id === id);
  if (index === -1) return { prev: undefined, next: undefined };
  return {
    prev: index > 0 ? parts[index - 1] : undefined,
    next: index < parts.length - 1 ? parts[index + 1] : undefined,
  };
}

export function countFlashcards(part: Part): number {
  return part.flashcards.length;
}

export function countQuestions(part: Part): number {
  return part.questions.length;
}

export function countObjectives(part: Part): number {
  return part.objectives.length;
}

export function countPartVideos(part: Part): number {
  return part.videos.length;
}

export function totalFlashcards(): number {
  return getParts().reduce((sum, part) => sum + countFlashcards(part), 0);
}

export function totalQuestions(): number {
  return getParts().reduce((sum, part) => sum + countQuestions(part), 0);
}

export function totalObjectives(): number {
  return getParts().reduce((sum, part) => sum + countObjectives(part), 0);
}

/**
 * Lista cada vídeo UMA vez, junto com as partes que ele cobre.
 * Uma mesma playlist pode servir a várias partes — aqui ela
 * aparece uma única vez, com a lista de partes que cobre.
 */
export function allVideos(): { video: Video; parts: Part[] }[] {
  const list: { video: Video; parts: Part[] }[] = [];

  const add = (video: Video, part?: Part) => {
    const found = list.find((item) => item.video.id === video.id);
    if (found) {
      if (part && !found.parts.includes(part)) found.parts.push(part);
    } else {
      list.push({ video, parts: part ? [part] : [] });
    }
  };

  for (const video of review.generalVideos) add(video);
  for (const part of getParts()) {
    for (const video of part.videos) add(video, part);
  }

  return list;
}

/** Quantidade de vídeos distintos (uma playlist repetida conta uma vez). */
export function totalVideos(): number {
  return allVideos().length;
}

/** Letra (A, B, C...) correspondente ao índice de uma alternativa. */
export function letterFor(index: number): string {
  return String.fromCharCode(65 + index);
}

/** Retorna a letra da alternativa correta de uma questão. */
export function correctLetter(question: Question): string {
  const index = question.alternatives.findIndex(
    (alt) => alt.id === question.correctAlternativeId,
  );
  return index >= 0 ? letterFor(index) : "?";
}

export function totalDiscursiveQuestions(): number {
  return review.discursiveQuestions.length;
}

/**
 * Agrupa as questões discursivas por tema, preservando a ordem em
 * que os temas aparecem nos dados (bloco 2 deste arquivo).
 */
export function getDiscursiveQuestionsByTopic(): {
  topic: string;
  questions: DiscursiveQuestion[];
}[] {
  const groups: { topic: string; questions: DiscursiveQuestion[] }[] = [];
  for (const question of review.discursiveQuestions) {
    const existing = groups.find((g) => g.topic === question.topic);
    if (existing) {
      existing.questions.push(question);
    } else {
      groups.push({ topic: question.topic, questions: [question] });
    }
  }
  return groups;
}

/** Gabarito agrupado por parte — sempre derivado das questões, nunca duplicado. */
export function getAnswerKey(): { part: Part; entries: { question: Question; letter: string }[] }[] {
  return getParts()
    .filter((part) => part.questions.length > 0)
    .map((part) => ({
      part,
      entries: part.questions.map((question) => ({
        question,
        letter: correctLetter(question),
      })),
    }));
}


/* ────────────────
   4. UTILITÁRIOS
   ──────────────── */

/** Junta classes condicionalmente, ignorando valores falsy. */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

/** Calcula porcentagem segura (evita divisão por zero). */
export function percentage(done: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((done / total) * 100);
}
