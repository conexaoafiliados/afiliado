import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Camera, Loader2 } from "lucide-react";

export default function ProfileEdit() {
  const { user } = useAuth();
  const { data: profile, isLoading } = trpc.profile.get.useQuery();
  const updateProfile = trpc.profile.update.useMutation();

  const [formData, setFormData] = useState({
    bio: "",
    instagramHandle: "",
    tiktokHandle: "",
    youtubeHandle: "",
    twitterHandle: "",
    websiteUrl: "",
  });

  // Sincronizar formulário com dados do perfil quando carregarem
  useEffect(() => {
    if (profile) {
      setFormData({
        bio: profile.bio || "",
        instagramHandle: profile.instagramHandle || "",
        tiktokHandle: profile.tiktokHandle || "",
        youtubeHandle: profile.youtubeHandle || "",
        twitterHandle: profile.twitterHandle || "",
        websiteUrl: profile.websiteUrl || "",
      });
    }
  }, [profile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile.mutateAsync(formData);
      toast.success("Perfil atualizado com sucesso!");
    } catch (error) {
      toast.error("Erro ao atualizar perfil");
      console.error(error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Editar Perfil</h1>

      <Card className="p-8">
        {/* Profile Image Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Foto de Perfil</h2>
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-accent to-secondary flex items-center justify-center">
              <Camera className="w-8 h-8 text-white" />
            </div>
            <div>
              <Button variant="outline" disabled>
                Alterar Foto (em breve)
              </Button>
              <p className="text-xs text-muted-foreground mt-2">Upload de imagens em desenvolvimento</p>
            </div>
          </div>
        </div>

        {/* Banner Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Banner</h2>
          <div className="w-full h-32 rounded-lg bg-gradient-to-r from-accent via-secondary to-accent flex items-center justify-center">
            <Camera className="w-8 h-8 text-white" />
          </div>
          <Button variant="outline" className="mt-4" disabled>
            Alterar Banner (em breve)
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              placeholder="Conte um pouco sobre você e seu conteúdo..."
              className="mt-2"
              rows={4}
            />
            <p className="text-xs text-muted-foreground mt-1">{formData.bio.length}/500</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="instagramHandle">Instagram</Label>
              <Input
                id="instagramHandle"
                name="instagramHandle"
                value={formData.instagramHandle}
                onChange={handleChange}
                placeholder="@seu_usuario"
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="tiktokHandle">TikTok</Label>
              <Input
                id="tiktokHandle"
                name="tiktokHandle"
                value={formData.tiktokHandle}
                onChange={handleChange}
                placeholder="@seu_usuario"
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="youtubeHandle">YouTube</Label>
              <Input
                id="youtubeHandle"
                name="youtubeHandle"
                value={formData.youtubeHandle}
                onChange={handleChange}
                placeholder="@seu_canal"
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="twitterHandle">Twitter</Label>
              <Input
                id="twitterHandle"
                name="twitterHandle"
                value={formData.twitterHandle}
                onChange={handleChange}
                placeholder="@seu_usuario"
                className="mt-2"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="websiteUrl">Website</Label>
            <Input
              id="websiteUrl"
              name="websiteUrl"
              value={formData.websiteUrl}
              onChange={handleChange}
              placeholder="https://seu-site.com"
              className="mt-2"
              type="url"
            />
          </div>

          <div className="flex gap-4">
            <Button
              type="submit"
              disabled={updateProfile.isPending}
              className="btn-primary"
            >
              {updateProfile.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar Alterações"
              )}
            </Button>
            <Button variant="outline">Cancelar</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
