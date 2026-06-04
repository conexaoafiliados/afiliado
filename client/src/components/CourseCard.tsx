import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Star, Users, Clock } from "lucide-react";

interface CourseCardProps {
  id: number;
  title: string;
  description: string;
  instructor: string;
  level: "beginner" | "intermediate" | "advanced";
  duration: number;
  lessons: number;
  students: number;
  rating: number;
  price: number;
  enrolled: boolean;
  progress?: number;
  onEnroll?: (id: number) => void;
  onContinue?: (id: number) => void;
}

export function CourseCard({
  id,
  title,
  description,
  instructor,
  level,
  duration,
  lessons,
  students,
  rating,
  price,
  enrolled,
  progress,
  onEnroll,
  onContinue,
}: CourseCardProps) {
  const getLevelLabel = (lv: string) => {
    switch (lv) {
      case "beginner":
        return "Iniciante";
      case "intermediate":
        return "Intermediário";
      case "advanced":
        return "Avançado";
      default:
        return lv;
    }
  };

  const getLevelColor = (lv: string) => {
    switch (lv) {
      case "beginner":
        return "bg-emerald-100 text-emerald-700";
      case "intermediate":
        return "bg-blue-100 text-blue-700";
      case "advanced":
        return "bg-purple-100 text-purple-700";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <Card className="card-elegant hover-lift flex flex-col">
      <div className="mb-4">
        <div className="w-full h-32 bg-gradient-to-br from-accent/20 to-secondary/20 rounded-lg flex items-center justify-center mb-4">
          <BookOpen className="w-12 h-12 text-accent opacity-30" />
        </div>
        <h3 className="font-semibold text-lg mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground mb-3">{description}</p>
        <p className="text-xs text-muted-foreground font-medium">Por {instructor}</p>
      </div>

      <div className="space-y-3 mb-4 flex-1">
        <div className="flex items-center justify-between">
          <Badge className={getLevelColor(level)}>
            {getLevelLabel(level)}
          </Badge>
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span className="text-sm font-semibold">{rating}</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>{duration}m</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <BookOpen className="w-4 h-4" />
            <span>{lessons} aulas</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Users className="w-4 h-4" />
            <span>{students}</span>
          </div>
        </div>

        {enrolled && progress !== undefined && (
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-medium">Progresso</span>
              <span className="text-xs font-semibold text-accent">{progress}%</span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-bar-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <Button
        className="w-full btn-primary"
        variant={enrolled ? "default" : "outline"}
        onClick={() => {
          if (enrolled && onContinue) onContinue(id);
          if (!enrolled && onEnroll) onEnroll(id);
        }}
      >
        {enrolled ? "Continuar Curso" : "Inscrever-se"}
      </Button>
    </Card>
  );
}
