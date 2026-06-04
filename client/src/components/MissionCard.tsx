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

  return (
    <Card className="card-elegant hover-lift">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3 flex-1">
          {getStatusIcon(status)}
          <div>
            <h3 className="font-semibold text-lg">{title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex gap-2">
          <Badge className={getDifficultyColor(difficulty)}>
            {difficulty === "easy" && "Fácil"}
            {difficulty === "medium" && "Médio"}
            {difficulty === "hard" && "Difícil"}
          </Badge>
          <Badge variant="outline">{getCategoryLabel(category)}</Badge>
        </div>
        <div className="text-right">
          <p className="font-bold text-accent">{reward} pts</p>
        </div>
      </div>

      <Button
        className="w-full btn-primary"
        disabled={status === "completed"}
        onClick={() => {
          if (status === "pending" && onAccept) onAccept(id);
          if (status === "in_progress" && onContinue) onContinue(id);
        }}
      >
        {status === "completed" && "✓ Concluída"}
        {status === "in_progress" && "Continuar"}
        {status === "pending" && "Aceitar Missão"}
      </Button>
    </Card>
  );
}
