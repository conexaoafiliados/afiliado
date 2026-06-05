import { ChevronLeft } from "lucide-react";
import { useLocation } from "wouter";

type BackButtonProps = {
  fallback?: string;
  className?: string;
};

export function BackButton({ fallback = "/", className = "" }: BackButtonProps) {
  const [, setLocation] = useLocation();

  function handleBack() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      window.history.back();
      return;
    }
    setLocation(fallback);
  }

  return (
    <button
      type="button"
      onClick={handleBack}
      className={`inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors ${className}`}
      aria-label="Voltar à página anterior"
    >
      <ChevronLeft className="h-4 w-4" />
      Voltar
    </button>
  );
}
