import { cn } from "@/lib/utils";
import {
  Award,
  BarChart3,
  ChevronDown,
  LayoutDashboard,
  Target,
  User,
  Users,
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";

type NavItem = {
  label: string;
  path: string;
  emoji?: string;
};

type NavSection = {
  title: string;
  collapsible?: boolean;
  defaultOpen?: boolean;
  items: NavItem[];
};

type BottomNavItem = {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
};

const primaryItems = [
  { label: "Comunidade", path: "/community/feed", icon: Users, primary: true },
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard, primary: false },
] as const;

const sections: NavSection[] = [
  {
    title: "COMECE A VENDER!",
    items: [
      { label: "Seu primeiro passo", path: "/vender/primeiro-passo", emoji: "👋" },
      { label: "Se Aprofunde", path: "/vender/aprofunde", emoji: "📚" },
      { label: "Progresso", path: "/growth/progress", emoji: "📈" },
    ],
  },
  {
    title: "PRINCIPAIS ACESSOS",
    collapsible: true,
    defaultOpen: true,
    items: [
      { label: "Avisos", path: "/acessos/avisos", emoji: "🔔" },
      { label: "Treinamentos e Reuniões", path: "/acessos/treinamentos", emoji: "📅" },
      { label: "Eventos Presenciais", path: "/acessos/eventos", emoji: "🚐" },
      { label: "Punições", path: "/acessos/punicoes", emoji: "❌" },
      { label: "Videos em Alta", path: "/acessos/videos", emoji: "🚀" },
      { label: "Produtos em Alta", path: "/acessos/produtos", emoji: "📦" },
    ],
  },
  {
    title: "CATEGORIA START",
    items: [
      { label: "Grupo Aberto", path: "/start/grupo-aberto", emoji: "📢" },
      { label: "Campanhas Conexões Creators", path: "/start/campanhas", emoji: "⭐" },
    ],
  },
];

const bottomItems: BottomNavItem[] = [
  { label: "Missões", path: "/growth/missions", icon: Target },
  { label: "Conquistas", path: "/growth/achievements", icon: Award },
  { label: "Analytics", path: "/analytics/overview", icon: BarChart3 },
  { label: "Perfil", path: "/profile/edit", icon: User },
];

type SidebarNavProps = {
  onNavigate?: () => void;
  className?: string;
};

function isActivePath(current: string, path: string) {
  if (path === "/") return current === "/";
  return current === path || current.startsWith(`${path}/`);
}

function NavSectionBlock({
  section,
  location,
  onNavigate,
}: {
  section: NavSection;
  location: string;
  onNavigate?: () => void;
}) {
  const [open, setOpen] = useState(section.defaultOpen ?? true);

  return (
    <div>
      {section.collapsible ? (
        <button
          type="button"
          onClick={() => setOpen(prev => !prev)}
          className="flex w-full items-center gap-1 px-3 pt-4 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground transition-colors"
        >
          <span className="truncate">{section.title}</span>
          <ChevronDown
            className={cn("h-3.5 w-3.5 shrink-0 transition-transform", open && "rotate-180")}
          />
        </button>
      ) : (
        <p className="px-3 pt-4 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {section.title}
        </p>
      )}

      {(!section.collapsible || open) && (
        <div className="space-y-0.5">
          {section.items.map(item => {
            const active = isActivePath(location, item.path);
            return (
              <Link key={item.path} href={item.path}>
                <a
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-muted text-foreground font-medium"
                      : "text-foreground/80 hover:bg-muted/60"
                  )}
                >
                  {item.emoji && <span className="text-base leading-none shrink-0">{item.emoji}</span>}
                  <span className="truncate">{item.label}</span>
                </a>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function SidebarNav({ onNavigate, className }: SidebarNavProps) {
  const [location] = useLocation();

  return (
    <nav className={cn("flex flex-col", className)}>
      <div className="space-y-1 px-1">
        {primaryItems.map(item => {
          const active = isActivePath(location, item.path);
          const Icon = item.icon;

          if (item.primary) {
            return (
              <Link key={item.path} href={item.path}>
                <a
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-primary/90 text-primary-foreground hover:bg-primary"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </a>
              </Link>
            );
          }

          return (
            <Link key={item.path} href={item.path}>
              <a
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                  active
                    ? "bg-muted text-foreground font-medium"
                    : "text-foreground/80 hover:bg-muted/60"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </a>
            </Link>
          );
        })}
      </div>

      {sections.map(section => (
        <NavSectionBlock
          key={section.title}
          section={section}
          location={location}
          onNavigate={onNavigate}
        />
      ))}

      <div className="mt-2 space-y-0.5 px-1">
        {bottomItems.map(item => {
          const active = isActivePath(location, item.path);
          const Icon = item.icon;
          return (
            <Link key={item.path} href={item.path}>
              <a
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                  active
                    ? "bg-muted text-foreground font-medium"
                    : "text-foreground/80 hover:bg-muted/60"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </a>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
