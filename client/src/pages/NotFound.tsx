import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/BackButton";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8">
      <BackButton fallback="/" className="absolute top-6 left-6" />
      <h1 className="text-4xl font-bold">404</h1>
      <p className="text-muted-foreground">Página não encontrada</p>
      <Link href="/">
        <Button>Início</Button>
      </Link>
    </div>
  );
}
