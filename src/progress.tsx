"use client";

/* ============================================================================
   PROGRESSO DO ESTUDANTE
   ============================================================================
   Guarda no navegador (localStorage) o que já foi estudado: flashcards
   vistos, questões respondidas, objetivos concluídos, teoria lida e
   questões discursivas resolvidas — e calcula as porcentagens.
   ============================================================================ */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getParts, percentage, type Part, type PartStatus } from "@/content";


/* ──────────────────────────────
   ARMAZENAMENTO (localStorage)
   ────────────────────────────── */

/**
 * PROGRESSO DO ESTUDANTE
 * ---------------------------------------------------------------
 * Guarda, durante a sessão (via localStorage), o que o estudante
 * já revisou: flashcards vistos/dominados, questões respondidas,
 * objetivos concluídos e teoria visualizada.
 *
 * Este contexto vive no layout raiz, então o progresso persiste
 * durante a navegação entre páginas (Início, Parte, Gabarito...).
 * ---------------------------------------------------------------
 */

const STORAGE_KEY = "study-platform:progress:v1";

type FlashcardStatus = "known" | "unknown";

interface ProgressState {
  flashcardStatus: Record<string, FlashcardStatus>;
  questionAnswers: Record<string, { alternativeId: string; correct: boolean }>;
  objectivesDone: Record<string, true>;
  theoryViewed: Record<string, true>;
  /** Questões discursivas marcadas como resolvidas (área geral). */
  discursiveDone: Record<string, true>;
}

const emptyState: ProgressState = {
  flashcardStatus: {},
  questionAnswers: {},
  objectivesDone: {},
  theoryViewed: {},
  discursiveDone: {},
};

function flashcardKey(partId: string, cardId: string) {
  return `${partId}::${cardId}`;
}
function questionKey(partId: string, questionId: string) {
  return `${partId}::${questionId}`;
}
function objectiveKey(partId: string, objectiveId: string) {
  return `${partId}::${objectiveId}`;
}

interface ProgressContextValue {
  state: ProgressState;
  markFlashcard: (partId: string, cardId: string, status: FlashcardStatus) => void;
  resetPartFlashcards: (partId: string, cardIds: string[]) => void;
  getFlashcardStatus: (partId: string, cardId: string) => FlashcardStatus | undefined;
  answerQuestion: (
    partId: string,
    questionId: string,
    alternativeId: string,
    correct: boolean,
  ) => void;
  resetPartQuestions: (partId: string, questionIds: string[]) => void;
  getQuestionAnswer: (
    partId: string,
    questionId: string,
  ) => { alternativeId: string; correct: boolean } | undefined;
  toggleObjective: (partId: string, objectiveId: string) => void;
  isObjectiveDone: (partId: string, objectiveId: string) => boolean;
  markTheoryViewed: (partId: string) => void;
  isTheoryViewed: (partId: string) => boolean;
  toggleDiscursive: (questionId: string) => void;
  isDiscursiveDone: (questionId: string) => boolean;
}

/**
 * Valor usado quando não existe um <ProgressProvider> acima na árvore.
 *
 * Isso acontece durante a geração das páginas (build / renderização no
 * servidor), onde não há navegador nem localStorage. Nesse momento o
 * progresso é sempre vazio — exatamente o que o provider também
 * renderiza no servidor —, então o HTML gerado fica idêntico e não há
 * erro de hidratação. No navegador o provider sempre existe (ele está
 * no AppShell), e o progresso funciona normalmente.
 *
 * Usar um padrão em vez de lançar erro evita que a geração da página
 * quebre inteira caso algum componente seja renderizado fora do
 * provider.
 */
const progressFallback: ProgressContextValue = {
  state: emptyState,
  markFlashcard: () => {},
  resetPartFlashcards: () => {},
  getFlashcardStatus: () => undefined,
  answerQuestion: () => {},
  resetPartQuestions: () => {},
  getQuestionAnswer: () => undefined,
  toggleObjective: () => {},
  isObjectiveDone: () => false,
  markTheoryViewed: () => {},
  isTheoryViewed: () => false,
  toggleDiscursive: () => {},
  isDiscursiveDone: () => false,
};

const ProgressContext = createContext<ProgressContextValue>(progressFallback);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ProgressState>(emptyState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<ProgressState>;
        setState({ ...emptyState, ...parsed });
      }
    } catch {
      // localStorage indisponível — a plataforma continua funcionando sem persistência.
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignora falhas de escrita (ex: modo privado)
    }
  }, [state, hydrated]);

  const markFlashcard = useCallback(
    (partId: string, cardId: string, status: FlashcardStatus) => {
      setState((prev) => ({
        ...prev,
        flashcardStatus: { ...prev.flashcardStatus, [flashcardKey(partId, cardId)]: status },
      }));
    },
    [],
  );

  const resetPartFlashcards = useCallback((partId: string, cardIds: string[]) => {
    setState((prev) => {
      const next = { ...prev.flashcardStatus };
      for (const id of cardIds) delete next[flashcardKey(partId, id)];
      return { ...prev, flashcardStatus: next };
    });
  }, []);

  const getFlashcardStatus = useCallback(
    (partId: string, cardId: string) => state.flashcardStatus[flashcardKey(partId, cardId)],
    [state.flashcardStatus],
  );

  const answerQuestion = useCallback(
    (partId: string, questionId: string, alternativeId: string, correct: boolean) => {
      setState((prev) => ({
        ...prev,
        questionAnswers: {
          ...prev.questionAnswers,
          [questionKey(partId, questionId)]: { alternativeId, correct },
        },
      }));
    },
    [],
  );

  const resetPartQuestions = useCallback((partId: string, questionIds: string[]) => {
    setState((prev) => {
      const next = { ...prev.questionAnswers };
      for (const id of questionIds) delete next[questionKey(partId, id)];
      return { ...prev, questionAnswers: next };
    });
  }, []);

  const getQuestionAnswer = useCallback(
    (partId: string, questionId: string) => state.questionAnswers[questionKey(partId, questionId)],
    [state.questionAnswers],
  );

  const toggleObjective = useCallback((partId: string, objectiveId: string) => {
    setState((prev) => {
      const key = objectiveKey(partId, objectiveId);
      const next = { ...prev.objectivesDone };
      if (next[key]) {
        delete next[key];
      } else {
        next[key] = true;
      }
      return { ...prev, objectivesDone: next };
    });
  }, []);

  const isObjectiveDone = useCallback(
    (partId: string, objectiveId: string) => Boolean(state.objectivesDone[objectiveKey(partId, objectiveId)]),
    [state.objectivesDone],
  );

  const markTheoryViewed = useCallback((partId: string) => {
    setState((prev) => {
      if (prev.theoryViewed[partId]) return prev;
      return { ...prev, theoryViewed: { ...prev.theoryViewed, [partId]: true } };
    });
  }, []);

  const isTheoryViewed = useCallback(
    (partId: string) => Boolean(state.theoryViewed[partId]),
    [state.theoryViewed],
  );

  const toggleDiscursive = useCallback((questionId: string) => {
    setState((prev) => {
      const next = { ...prev.discursiveDone };
      if (next[questionId]) {
        delete next[questionId];
      } else {
        next[questionId] = true;
      }
      return { ...prev, discursiveDone: next };
    });
  }, []);

  const isDiscursiveDone = useCallback(
    (questionId: string) => Boolean(state.discursiveDone[questionId]),
    [state.discursiveDone],
  );

  const value = useMemo<ProgressContextValue>(
    () => ({
      state,
      markFlashcard,
      resetPartFlashcards,
      getFlashcardStatus,
      answerQuestion,
      resetPartQuestions,
      getQuestionAnswer,
      toggleObjective,
      isObjectiveDone,
      markTheoryViewed,
      isTheoryViewed,
      toggleDiscursive,
      isDiscursiveDone,
    }),
    [
      state,
      markFlashcard,
      resetPartFlashcards,
      getFlashcardStatus,
      answerQuestion,
      resetPartQuestions,
      getQuestionAnswer,
      toggleObjective,
      isObjectiveDone,
      markTheoryViewed,
      isTheoryViewed,
      toggleDiscursive,
      isDiscursiveDone,
    ],
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): ProgressContextValue {
  return useContext(ProgressContext);
}


export type { PartStatus };

/* ──────────────────────────────────────────
   CÁLCULO DE PROGRESSO (por parte e geral)
   ────────────────────────────────────────── */

/**
 * Combina os dados de conteúdo (src/content.ts) com o progresso
 * salvo do estudante (bloco acima) para gerar
 * números prontos para exibir na interface.
 */


export interface PartProgress {
  flashcardsTotal: number;
  flashcardsReviewed: number;
  flashcardsKnown: number;
  questionsTotal: number;
  questionsAnswered: number;
  questionsCorrect: number;
  objectivesTotal: number;
  objectivesDone: number;
  theoryViewed: boolean;
  percent: number;
  status: PartStatus;
}

export function usePartProgress(part: Part): PartProgress {
  const { state } = useProgress();

  return useMemo(() => {
    const flashcardsTotal = part.flashcards.length;
    const flashcardsReviewed = part.flashcards.filter(
      (card) => state.flashcardStatus[`${part.id}::${card.id}`],
    ).length;
    const flashcardsKnown = part.flashcards.filter(
      (card) => state.flashcardStatus[`${part.id}::${card.id}`] === "known",
    ).length;

    const questionsTotal = part.questions.length;
    const answeredEntries = part.questions
      .map((q) => state.questionAnswers[`${part.id}::${q.id}`])
      .filter(Boolean);
    const questionsAnswered = answeredEntries.length;
    const questionsCorrect = answeredEntries.filter((a) => a?.correct).length;

    const objectivesTotal = part.objectives.length;
    const objectivesDone = part.objectives.filter(
      (o) => state.objectivesDone[`${part.id}::${o.id}`],
    ).length;

    const theoryViewed = Boolean(state.theoryViewed[part.id]);

    const trackedUnits = [
      part.theory.length > 0 ? 1 : 0,
      flashcardsTotal > 0 ? 1 : 0,
      questionsTotal > 0 ? 1 : 0,
    ].reduce((a, b) => a + b, 0);

    const completedUnits = [
      part.theory.length > 0 && theoryViewed ? 1 : 0,
      flashcardsTotal > 0 && flashcardsReviewed === flashcardsTotal ? 1 : 0,
      questionsTotal > 0 && questionsAnswered === questionsTotal ? 1 : 0,
    ].reduce((a, b) => a + b, 0);

    const percent = trackedUnits > 0 ? percentage(completedUnits, trackedUnits) : 0;

    let status: PartStatus = "not-started";
    if (completedUnits > 0 && completedUnits === trackedUnits && trackedUnits > 0) {
      status = "completed";
    } else if (
      theoryViewed ||
      flashcardsReviewed > 0 ||
      questionsAnswered > 0 ||
      objectivesDone > 0
    ) {
      status = "in-progress";
    }

    return {
      flashcardsTotal,
      flashcardsReviewed,
      flashcardsKnown,
      questionsTotal,
      questionsAnswered,
      questionsCorrect,
      objectivesTotal,
      objectivesDone,
      theoryViewed,
      percent,
      status,
    };
  }, [part, state]);
}

export interface OverallProgress {
  partsTotal: number;
  partsCompleted: number;
  flashcardsTotal: number;
  flashcardsReviewed: number;
  questionsTotal: number;
  questionsAnswered: number;
  objectivesTotal: number;
  objectivesDone: number;
  percent: number;
}

export function useOverallProgress(): OverallProgress {
  const { state } = useProgress();

  return useMemo(() => {
    const parts = getParts();
    let flashcardsTotal = 0;
    let flashcardsReviewed = 0;
    let questionsTotal = 0;
    let questionsAnswered = 0;
    let objectivesTotal = 0;
    let objectivesDone = 0;
    let partsCompleted = 0;

    for (const part of parts) {
      flashcardsTotal += part.flashcards.length;
      flashcardsReviewed += part.flashcards.filter(
        (c) => state.flashcardStatus[`${part.id}::${c.id}`],
      ).length;

      questionsTotal += part.questions.length;
      questionsAnswered += part.questions.filter(
        (q) => state.questionAnswers[`${part.id}::${q.id}`],
      ).length;

      objectivesTotal += part.objectives.length;
      const doneHere = part.objectives.filter(
        (o) => state.objectivesDone[`${part.id}::${o.id}`],
      ).length;
      objectivesDone += doneHere;

      const trackedUnits = [
        part.theory.length > 0 ? 1 : 0,
        part.flashcards.length > 0 ? 1 : 0,
        part.questions.length > 0 ? 1 : 0,
      ].reduce((a, b) => a + b, 0);
      const theoryViewed = Boolean(state.theoryViewed[part.id]);
      const flashcardsDoneHere = part.flashcards.filter(
        (c) => state.flashcardStatus[`${part.id}::${c.id}`],
      ).length;
      const questionsDoneHere = part.questions.filter(
        (q) => state.questionAnswers[`${part.id}::${q.id}`],
      ).length;
      const completedUnits = [
        part.theory.length > 0 && theoryViewed ? 1 : 0,
        part.flashcards.length > 0 && flashcardsDoneHere === part.flashcards.length ? 1 : 0,
        part.questions.length > 0 && questionsDoneHere === part.questions.length ? 1 : 0,
      ].reduce((a, b) => a + b, 0);
      if (trackedUnits > 0 && completedUnits === trackedUnits) partsCompleted += 1;
    }

    const totalTrackable = flashcardsTotal + questionsTotal + objectivesTotal;
    const totalDone = flashcardsReviewed + questionsAnswered + objectivesDone;

    return {
      partsTotal: parts.length,
      partsCompleted,
      flashcardsTotal,
      flashcardsReviewed,
      questionsTotal,
      questionsAnswered,
      objectivesTotal,
      objectivesDone,
      percent: percentage(totalDone, totalTrackable),
    };
  }, [state]);
}
