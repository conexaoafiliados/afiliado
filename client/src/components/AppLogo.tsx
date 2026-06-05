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
  /** No celular, amplia a logo dentro do mesmo espaço (sem aumentar o header). */
  mobileFill?: boolean;
}

export function AppLogo({
  background,
  className = "",
  height = 54,
  href = "/",
  mobileFill = false,
}: AppLogoProps) {
  const { theme } = useTheme();
  const resolvedBackground = background ?? (theme === "dark" ? "dark" : "light");
  const img = (
    <img
      src={LOGO_SRC[resolvedBackground]}
      alt="Conexões Creators"
      className={[
        "w-auto max-w-full object-contain object-left",
        mobileFill ? "scale-[1.45] origin-left md:scale-100 md:origin-center" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ height }}
      decoding="async"
    />
  );

  const wrapClass = mobileFill
    ? "inline-flex items-center h-10 max-h-10 overflow-hidden md:h-auto md:max-h-none md:overflow-visible"
    : "inline-flex shrink-0 items-center";

  if (href) {
    return (
      <Link href={href}>
        <a className={wrapClass}>{img}</a>
      </Link>
    );
  }

  return <span className={wrapClass}>{img}</span>;
}
