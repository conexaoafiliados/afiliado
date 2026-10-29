import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Zap, Lock } from "lucide-react";

interface MissionCardProps {
  id: number;
  title: string;
  description: string;
  category: "growth" | "engagement" | "learning";
  difficulty: "easy" | "medium" | "hard";
  reward: number;
  status: "pending" | "in_progress" | "completed";
  brandLabel?: string | null;
  validationStatus?: string;
  onAccept?: (id: number) => void;
  onContinue?: (id: number) => void;
}

export function MissionCard({
  id,
  title,
  description,
  category,
  difficulty,
  reward,
  status,
  brandLabel,
  validationStatus = "none",
  onAccept,
  onContinue,
}: MissionCardProps) {
  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case "easy":
        return "bg-emerald-100 text-emerald-700";
      case "medium":
        return "bg-amber-100 text-amber-700";
      case "hard":
        return "bg-rose-100 text-rose-700";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case "growth":
        return "Crescimento";
      case "engagement":
        return "Engajamento";
      case "learning":
        return "Aprendizado";
      default:
        return cat;
    }
  };

  const getStatusIcon = (s: string) => {
    switch (s) {
      case "completed":
        return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
      case "in_progress":
        return <Zap className="w-5 h-5 text-amber-600" />;
      default:
        return <Lock className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const actionLabel =
    status === "completed"
      ? "✓ Concluída e validada"
      : validationStatus === "pending_review"
        ? "Aguardando validação"
        : validationStatus === "rejected"
          ? "Reenviar participação"
          : status === "in_progress"
            ? "Enviar participação"
            : "Aceitar Missão";

  return (
    <Card className="card-elegant hover-lift">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3 flex-1">
          {getStatusIcon(status)}
          <div>
            <h3 className="font-semibold text-lg">{title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
            {brandLabel && <p className="text-xs text-accent mt-2 font-medium">{brandLabel}</p>}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex gap-2 flex-wrap">
          <Badge className={getDifficultyColor(difficulty)}>
            {difficulty === "easy" && "Fácil"}
            {difficulty === "medium" && "Médio"}
            {difficulty === "hard" && "Difícil"}
          </Badge>
          <Badge variant="outline">{getCategoryLabel(category)}</Badge>
          {validationStatus === "pending_review" && <Badge variant="outline">Em análise</Badge>}
        </div>
        <div className="text-right">
          <p className="font-bold text-accent">{reward} pts</p>
          <p className="text-[10px] text-muted-foreground">após validação</p>
        </div>
      </div>

      <Button
        className="w-full btn-primary"
        disabled={status === "completed" || validationStatus === "pending_review"}
        onClick={() => {
          if (status === "pending" && onAccept) onAccept(id);
          if (status === "in_progress" && onContinue) onContinue(id);
        }}
      >
        {actionLabel}
      </Button>
    </Card>
  );
}
