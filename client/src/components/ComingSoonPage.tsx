import { Card } from "@/components/ui/card";
import { Clock } from "lucide-react";

interface ComingSoonPageProps {
  emoji: string;
  title: string;
  description?: string;
}

export default function ComingSoonPage({ emoji, title, description }: ComingSoonPageProps) {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <span className="text-2xl">{emoji}</span> {title}
      </h1>

      <Card className="card-elegant text-center py-16 px-6">
        <Clock className="h-10 w-10 mx-auto text-muted-foreground/50 mb-4" />
        <p className="text-lg font-medium">Em breve...</p>
        {description && (
          <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto leading-relaxed">
            {description}
          </p>
        )}
      </Card>
    </div>
  );
}
