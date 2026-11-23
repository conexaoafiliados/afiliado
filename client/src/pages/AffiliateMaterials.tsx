import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Download, Share2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

const FILTERS = [
  { id: "tudo", label: "Tudo" },
  { id: "imagem", label: "Imagem" },
  { id: "pdf", label: "PDF" },
  { id: "video", label: "Vídeo" },
] as const;

type Material = {
  id: number;
  title: string;
  fileUrl: string;
  mimeType: string | null;
  sizeBytes: number | null;
  kind: string;
};

function formatSize(bytes: number | null) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AffiliateMaterials() {
  const { data } = trpc.affiliateProgram.materials.useQuery();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("tudo");
  const [open, setOpen] = useState<Material | null>(null);
  const items = useMemo(() => {
    const list = data?.materials ?? [];
    if (filter === "tudo") return list;
    return list.filter(item => item.kind === filter);
  }, [data?.materials, filter]);

  async function share(item: Material) {
    if (navigator.share) {
      try {
        await navigator.share({ title: item.title, url: item.fileUrl });
        return;
      } catch {
        return;
      }
    }
    await navigator.clipboard.writeText(item.fileUrl);
    toast.success("Link do arquivo copiado");
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Materiais</h1>
        <p className="text-muted-foreground">
          Imagens, vídeos e arquivos prontos da marca. Baixe, compartilhe e cole com seu cupom e seu link.
        </p>
      </div>
      {data?.message && <Card className="p-4 text-sm">{data.message}</Card>}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map(item => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            className={`rounded-full px-3 py-1.5 text-sm ${filter === item.id ? "bg-foreground text-background" : "bg-card border border-border"}`}
          >
            {item.label}
            {item.id === "tudo" ? ` ${data?.materials.length ?? 0}` : ""}
          </button>
        ))}
      </div>
      {items.length === 0 ? (
        <Card className="p-10 text-center text-sm text-muted-foreground">
          Nenhum material publicado neste filtro.
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {items.map(item => (
            <button key={item.id} type="button" onClick={() => setOpen(item)} className="text-left">
              <Card className="overflow-hidden">
                <div className="flex aspect-square items-center justify-center bg-muted">
                  {item.kind === "imagem" ? (
                    <img src={item.fileUrl} alt="" className="h-full w-full object-contain" />
                  ) : (
                    <span className="text-xs uppercase text-muted-foreground">{item.kind}</span>
                  )}
                </div>
                <div className="p-3">
                  <p className="line-clamp-2 text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.kind}</p>
                </div>
              </Card>
            </button>
          ))}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button type="button" className="absolute inset-0 bg-black/50" aria-label="Fechar" onClick={() => setOpen(null)} />
          <div className="relative z-10 w-full max-w-lg rounded-2xl bg-card p-4">
            <button type="button" className="absolute right-3 top-3 rounded-full bg-muted p-1" onClick={() => setOpen(null)} aria-label="Fechar">
              <X className="h-4 w-4" />
            </button>
            {open.kind === "imagem" && (
              <img src={open.fileUrl} alt="" className="max-h-80 w-full rounded-xl object-contain bg-muted" />
            )}
            <h2 className="mt-3 text-xl font-bold">{open.title}</h2>
            <p className="text-sm text-muted-foreground">{formatSize(open.sizeBytes)}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Baixar guarda o arquivo. Compartilhar envia o link para o Instagram ou WhatsApp quando o aparelho permitir.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <a href={open.fileUrl} download={open.title}>
                <Button type="button" className="w-full">
                  <Download className="mr-2 h-4 w-4" /> Baixar
                </Button>
              </a>
              <Button type="button" variant="outline" onClick={() => void share(open)}>
                <Share2 className="mr-2 h-4 w-4" /> Compartilhar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
