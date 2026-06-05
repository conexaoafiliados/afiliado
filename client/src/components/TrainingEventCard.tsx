import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  daysUntilLabel,
  eventBannerGradient,
  formatEventSchedule,
  type TrainingEvent,
} from "@/data/mockTrainings";
import { cn } from "@/lib/utils";
import { Calendar, Loader2, User, Users, Video } from "lucide-react";
import { toast } from "sonner";

type TrainingEventCardProps = {
  event: TrainingEvent;
  featured?: boolean;
  onRegister?: (eventId: number) => void;
  registering?: boolean;
};

function EventBanner({ event, className }: { event: TrainingEvent; className?: string }) {
  if (event.imageUrl) {
    return <img src={event.imageUrl} alt="" className={cn("w-full object-cover", className)} />;
  }

  return (
    <div
      className={cn(
        "w-full flex items-end p-5 text-white bg-gradient-to-br",
        eventBannerGradient(event.title, event.category),
        className
      )}
    >
      <p className="font-bold text-lg leading-snug drop-shadow-sm line-clamp-2">{event.title}</p>
    </div>
  );
}

export function TrainingEventCard({
  event,
  featured = false,
  onRegister,
  registering,
}: TrainingEventCardProps) {
  const schedule = formatEventSchedule(event.startDate, event.endDate);
  const isLive = event.eventType === "live";

  function handleRegister() {
    if (event.isMock) {
      toast.message("Demonstração", { description: "Confirmação disponível após conectar o Supabase." });
      return;
    }
    onRegister?.(event.id);
  }

  if (featured) {
    return (
      <Card className="card-elegant overflow-hidden p-0">
        <EventBanner event={event} className="h-44 sm:h-52" />
        <div className="p-5 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h2 className="text-xl font-bold">{event.title}</h2>
            <Button
              size="sm"
              className={cn("btn-primary shrink-0", event.registered && "bg-muted text-foreground hover:bg-muted")}
              disabled={registering}
              onClick={handleRegister}
            >
              {registering ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : event.registered ? (
                "Confirmado ✓"
              ) : (
                "Confirmar"
              )}
            </Button>
          </div>

          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Calendar className="h-4 w-4 shrink-0" />
            {schedule}
          </p>

          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center rounded-full bg-emerald-500/10 text-emerald-700 px-2.5 py-1 text-xs font-medium">
              {daysUntilLabel(event.startDate)}
            </span>
            {isLive && (
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                <Video className="h-3.5 w-3.5" />
                Transmissão ao vivo
              </span>
            )}
            {event.hostName && (
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                <User className="h-3.5 w-3.5" />
                {event.hostName}
              </span>
            )}
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              {event.participantCount} participante{event.participantCount !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="card-elegant overflow-hidden p-0">
      <div className="flex flex-col sm:flex-row">
        <EventBanner event={event} className="sm:w-44 md:w-52 h-28 sm:h-auto sm:min-h-[7rem] shrink-0" />
        <div className="flex flex-1 flex-col sm:flex-row sm:items-center gap-3 p-4 min-w-0">
          <div className="flex-1 min-w-0 space-y-1.5">
            <h3 className="font-semibold text-sm leading-snug">{event.title}</h3>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{schedule}</span>
            </p>
            {isLive && (
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Video className="h-3.5 w-3.5 shrink-0" />
                Transmissão ao vivo
              </p>
            )}
          </div>
          <Button
            size="sm"
            className={cn("btn-primary shrink-0 self-start sm:self-center", event.registered && "bg-muted text-foreground hover:bg-muted")}
            disabled={registering}
            onClick={handleRegister}
          >
            {registering ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : event.registered ? (
              "Confirmado ✓"
            ) : (
              "Confirmar"
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}
