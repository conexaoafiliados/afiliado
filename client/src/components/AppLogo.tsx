import { useTheme } from "@/contexts/ThemeContext";
import { Link } from "wouter";

/** `light` = fundo claro/branco → logo com fundo branco. `dark` = fundo escuro/preto → logo com fundo preto. */
export type LogoBackground = "light" | "dark";

const LOGO_SRC: Record<LogoBackground, string> = {
  light: "/logos/logo-fundo-branco.png",
  dark: "/logos/logo-fundo-preto.png",
};

interface AppLogoProps {
  /** Omitir para seguir o tema do app (claro/escuro). */
  background?: LogoBackground;
  className?: string;
  height?: number;
  href?: string | null;
}

export function AppLogo({ background, className = "", height = 36, href = "/" }: AppLogoProps) {
  const { theme } = useTheme();
  const resolvedBackground = background ?? (theme === "dark" ? "dark" : "light");
  const img = (
    <img
      src={LOGO_SRC[resolvedBackground]}
      alt="Conexões Creators"
      className={`w-auto max-w-full object-contain ${className}`.trim()}
      style={{ height }}
      decoding="async"
    />
  );

  if (href) {
    return (
      <Link href={href}>
        <a className="inline-flex shrink-0 items-center">{img}</a>
      </Link>
    );
  }

  return <span className="inline-flex shrink-0 items-center">{img}</span>;
}
