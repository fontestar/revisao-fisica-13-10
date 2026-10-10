import Link from "next/link";
import { Compass } from "lucide-react";
import { EmptyState } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="flex min-h-[60dvh] items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <EmptyState
          icon={Compass}
          title="Página não encontrada."
          description="O endereço pode estar errado ou a página não existe mais. Volte ao início para continuar estudando."
          action={
            <Link
              href="/"
              className="mt-2 inline-flex items-center gap-2 rounded-control bg-brand px-4 py-2.5 text-sm font-medium text-brand-contrast"
            >
              Voltar ao início
            </Link>
          }
        />
      </div>
    </div>
  );
}
