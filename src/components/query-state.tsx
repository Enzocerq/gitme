import { AlertTriangle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface QueryErrorProps {
  onRetry: () => void;
  className?: string;
}

export function QueryError({ onRetry, className }: QueryErrorProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-2xl border border-ruby-glow/20 bg-ruby-glow/5 p-8 text-center",
        className
      )}
    >
      <AlertTriangle className="size-5 text-ruby-glow" />
      <div>
        <p className="text-sm font-medium text-foreground">Não foi possível carregar os dados</p>
        <p className="text-xs text-muted-foreground mt-0.5">Verifique sua conexão ou tente novamente</p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors border border-border hover:border-foreground/30 rounded-md px-3 py-1.5"
      >
        <RefreshCw className="size-3" />
        Tentar novamente
      </button>
    </div>
  );
}
