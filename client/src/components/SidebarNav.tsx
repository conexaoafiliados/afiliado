import { useAdminAccess } from "@/hooks/useAdminAccess";
import { cn } from "@/lib/utils";
import {
  Award,
  BarChart3,
  ChevronDown,
  GraduationCap,
  Home,
  Megaphone,
  Shield,
  Store,
  Target,
  TrendingUp,
  User,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";

type NavItem = {
  label: string;
  path: string;
  icon?: React.ComponentType<{ className?: string }>;
  emoji?: string;
  /** Caminhos adicionais que também marcam este item como ativo (rotas legadas/relacionadas). */
  alsoActive?: string[];
};

type NavSection = {
  title: string;
  collapsible?: boolean;
  defaultOpen?: boolean;
  items: NavItem[];
};

/** Acessos principais do movimento. */
const mainItems: NavItem[] = [
  { label: "Meu início", path: "/dashboard", icon: Home },
  { label: "Marcas e produtos", path: "/marcas", icon: Store },
  { label: "Campanhas", path: "/campanhas", icon: Megaphone, alsoActive: ["/start/campanhas"] },
  { label: "Missões", path: "/growth/missions", icon: Target },
  { label: "Aprender", path: "/aprender", icon: GraduationCap, alsoActive: ["/vender"] },
  { label: "Comunidade", path: "/community/feed", icon: Users },
  { label: "Meu perfil", path: "/profile/edit", icon: User },
];

const sections: NavSection[] = [
  {
    title: "MINHA EVOLUÇÃO",
    collapsible: true,
    defaultOpen: false,
    items: [
      { label: "Jornada de seguidores", path: "/growth/progress", icon: TrendingUp },
      { label: "Conquistas", path: "/growth/achievements", icon: Award },
      { label: "Analytics", path: "/analytics/overview", icon: BarChart3 },
    ],
  },
  {
    title: "MAIS",
    collapsible: true,
    defaultOpen: false,
    items: [
      { label: "Avisos", path: "/acessos/avisos", emoji: "🔔" },
      { label: "Treinamentos e Reuniões", path: "/acessos/treinamentos", emoji: "📅" },
      { label: "Grupo Aberto", path: "/start/grupo-aberto", emoji: "📢" },
      { label: "Punições", path: "/acessos/punicoes", emoji: "❌" },
    ],
  },
];

type SidebarNavProps = {
  onNavigate?: () => void;
  className?: string;
};

function isActivePath(current: string, path: string) {
  if (path === "/") return current === "/";
  return current === path || current.startsWith(`${path}/`);
}

function isItemActive(current: string, item: NavItem) {
  return isActivePath(current, item.path) || (item.alsoActive ?? []).some(p => isActivePath(current, p));
}

function NavLink({
  item,
  location,
  onNavigate,
  emphasis,
}: {
  item: NavItem;
  location: string;
  onNavigate?: () => void;
  emphasis?: boolean;
}) {
  const active = isItemActive(location, item);
  const Icon = item.icon;
  return (
    <Link href={item.path}>
      <a
        onClick={onNavigate}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 text-sm transition-colors",
          emphasis ? "py-2.5" : "py-2",
          active ? "bg-accent/10 text-accent font-medium" : "text-foreground/80 hover:bg-muted/60"
        )}
      >
        {Icon ? (
          <Icon className="h-4 w-4 shrink-0" />
        ) : (
          item.emoji && <span className="text-base leading-none shrink-0 w-4 text-center">{item.emoji}</span>
        )}
        <span className="truncate">{item.label}</span>
      </a>
    </Link>
  );
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
  const containsActive = section.items.some(item => isItemActive(location, item));
  const [open, setOpen] = useState(section.defaultOpen ?? true);

  // Ao entrar numa rota da seção, reabre automaticamente; o usuário ainda pode recolher.
  useEffect(() => {
    if (containsActive) setOpen(true);
  }, [containsActive, location]);

  return (
    <div>
      {section.collapsible ? (
        <button
          type="button"
          onClick={() => setOpen(prev => !prev)}
          aria-expanded={open}
          className="flex w-full items-center gap-1 px-3 pt-4 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground transition-colors"
        >
          <span className="truncate">{section.title}</span>
          <ChevronDown className={cn("h-3.5 w-3.5 shrink-0 transition-transform", open && "rotate-180")} />
        </button>
      ) : (
        <p className="px-3 pt-4 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {section.title}
        </p>
      )}

      {open && (
        <div className="space-y-0.5">
          {section.items.map(item => (
            <NavLink key={item.path} item={item} location={location} onNavigate={onNavigate} />
          ))}
        </div>
      )}
    </div>
  );
}

export function SidebarNav({ onNavigate, className }: SidebarNavProps) {
  const [location] = useLocation();
  const { isStaff } = useAdminAccess();

  return (
    <nav className={cn("flex flex-col", className)} aria-label="Navegação principal">
      <div className="space-y-0.5 px-1">
        {mainItems.map(item => (
          <NavLink key={item.path} item={item} location={location} onNavigate={onNavigate} emphasis />
        ))}
      </div>

      {sections.map(section => (
        <NavSectionBlock key={section.title} section={section} location={location} onNavigate={onNavigate} />
      ))}

      {isStaff && (
        <div className="mt-2 px-1">
          <Link href="/admin">
            <a
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                isActivePath(location, "/admin")
                  ? "bg-accent/15 text-accent font-medium"
                  : "text-foreground/80 hover:bg-muted/60"
              )}
            >
              <Shield className="h-4 w-4 shrink-0" />
              <span>Administração</span>
            </a>
          </Link>
        </div>
      )}
    </nav>
  );
}
