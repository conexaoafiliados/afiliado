import { UserAvatar } from "@/components/UserAvatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Users, X } from "lucide-react";
import { Link } from "wouter";

type Member = {
  id: number;
  name: string;
  username: string | null;
  role: "user" | "admin";
  profileImageUrl: string | null;
  isOnline: boolean;
  isSelf: boolean;
};

type GroupMembersSidebarProps = {
  members: Member[];
  onlineCount: number;
  totalCount: number;
  className?: string;
  onClose?: () => void;
};

function MemberRow({ member }: { member: Member }) {
  return (
    <div className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-muted/50 transition-colors min-w-0">
      <div className="relative shrink-0">
        <UserAvatar src={member.profileImageUrl} name={member.name} size={32} username={member.username} />
        <span
          className={cn(
            "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-card",
            member.isOnline ? "bg-emerald-500" : "bg-muted-foreground/40"
          )}
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 min-w-0">
          {member.username ? (
            <Link href={`/profile/${member.username}`} className="text-sm truncate hover:underline">
              {member.name}
            </Link>
          ) : (
            <span className="text-sm truncate">{member.name}</span>
          )}
          {member.isSelf && (
            <span className="text-[10px] text-muted-foreground shrink-0">(você)</span>
          )}
        </div>
        {member.role === "admin" && (
          <Badge className="mt-0.5 h-4 px-1 text-[9px] bg-muted text-muted-foreground border-0 font-normal">
            ADMINISTRADOR
          </Badge>
        )}
      </div>
    </div>
  );
}

export function GroupMembersSidebar({
  members,
  onlineCount,
  totalCount,
  className,
  onClose,
}: GroupMembersSidebarProps) {
  const online = members.filter(m => m.isOnline);
  const offline = members.filter(m => !m.isOnline);

  return (
    <aside
      className={cn(
        "flex flex-col w-64 shrink-0 border-l border-border bg-card/30",
        className
      )}
    >
      <div className="px-4 py-3 border-b border-border flex items-center justify-between gap-2 shrink-0">
        <h2 className="font-semibold text-sm">Detalhes</h2>
        <div className="flex items-center gap-1">
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            {totalCount}
          </span>
          {onClose && (
            <Button variant="ghost" size="icon" className="h-7 w-7 ml-1" onClick={onClose} aria-label="Fechar">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-4">
        <div>
          <p className="px-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
            Online — {onlineCount}
          </p>
          <div className="space-y-0.5">
            {online.length === 0 ? (
              <p className="px-2 text-xs text-muted-foreground">Ninguém online agora</p>
            ) : (
              online.map(m => <MemberRow key={m.id} member={m} />)
            )}
          </div>
        </div>

        <div>
          <p className="px-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
            Offline — {offline.length}
          </p>
          <div className="space-y-0.5">
            {offline.map(m => (
              <MemberRow key={m.id} member={m} />
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
