import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Award, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface AchievementBadgeProps {
  title: string;
  description?: string | null;
  unlocked: boolean;
  unlockedAt?: Date | string | null;
}

export function AchievementBadge({ title, description, unlocked, unlockedAt }: AchievementBadgeProps) {
  return (
    <Card
      className={cn(
        "card-elegant p-5 transition-all",
        unlocked ? "border-accent/40 bg-accent/5" : "opacity-75"
      )}
    >
      <div className="flex items-start gap-4">
        <div
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
            unlocked ? "bg-accent text-white" : "bg-muted text-muted-foreground"
          )}
        >
          {unlocked ? <Award className="h-6 w-6" /> : <Lock className="h-6 w-6" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold">{title}</h3>
            <Badge variant={unlocked ? "default" : "outline"}>
              {unlocked ? "Desbloqueada" : "Bloqueada"}
            </Badge>
          </div>
          {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
          {unlocked && unlockedAt && (
            <p className="text-xs text-muted-foreground mt-2">
              Desbloqueada em {new Date(unlockedAt).toLocaleDateString("pt-BR")}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
