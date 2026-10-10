import { SectionLabel, EmptyState } from "@/components/ui";
import { DiscursiveCard, DiscursiveProgress } from "@/components/study";
import { getDiscursiveQuestionsByTopic, review } from "@/content";

export const metadata = {
  title: `Questões discursivas · ${review.kicker}`,
};

export default function DiscursivasPage() {
  const questions = review.discursiveQuestions;
  const groups = getDiscursiveQuestionsByTopic();

  /** Numeração contínua (01…05) atravessando os grupos de tema. */
  const numberOf = (questionId: string) =>
    questions.findIndex((q) => q.id === questionId) + 1;

  return (
    <div className="px-4 py-10 sm:px-8 sm:py-14 lg:px-12 lg:py-16">
      <div className="mx-auto max-w-3xl">
        <SectionLabel>Recursos gerais</SectionLabel>
        <h1 className="mt-3 font-display text-3xl font-medium text-ink sm:text-4xl">
          Questões discursivas
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink-soft">
          Questões abertas que combinam o conteúdo das partes estudadas. Resolva cada uma no papel
          antes de abrir a resolução: é assim que você descobre o que realmente já domina.
        </p>

        {questions.length > 0 ? (
          <>
            <div className="mt-8">
              <DiscursiveProgress questions={questions} />
            </div>

            <div className="mt-10 flex flex-col gap-12">
              {groups.map((group) => (
                <section key={group.topic}>
                  <h2 className="font-display text-lg font-medium text-ink">{group.topic}</h2>
                  <div className="mt-4 flex flex-col gap-5">
                    {group.questions.map((question) => (
                      <DiscursiveCard
                        key={question.id}
                        question={question}
                        number={numberOf(question.id)}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </>
        ) : (
          <EmptyState
            className="mt-10"
            title="As questões discursivas aparecerão aqui."
            description="Nenhuma questão discursiva disponível no momento."
          />
        )}
      </div>
    </div>
  );
}
