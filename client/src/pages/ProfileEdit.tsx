import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Camera, Loader2 } from "lucide-react";
import { useLocation } from "wouter";

function readImageFile(file: File, maxKb: number): Promise<{ base64: string; mime: string } | null> {
  return new Promise(resolve => {
    if (file.size > maxKb * 1024) {
      toast.error(`Imagem deve ter no máximo ${maxKb}KB`);
      resolve(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      resolve({ base64: reader.result as string, mime: file.type });
    };
    reader.readAsDataURL(file);
  });
}

export default function ProfileEdit() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { data: profile, isLoading } = trpc.profile.get.useQuery();
  const utils = trpc.useUtils();
  const updateProfile = trpc.profile.update.useMutation({
    onSuccess: () => {
      utils.auth.me.invalidate();
      toast.success("Perfil atualizado com sucesso!");
    },
    onError: () => toast.error("Erro ao atualizar perfil"),
  });

  const photoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    instagramHandle: "",
    tiktokHandle: "",
    youtubeHandle: "",
    twitterHandle: "",
    websiteUrl: "",
    age: "",
    platformObjective: "",
  });
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [photoUpload, setPhotoUpload] = useState<{ base64: string; mime: string } | null>(null);
  const [bannerUpload, setBannerUpload] = useState<{ base64: string; mime: string } | null>(null);

  useEffect(() => {
    if (profile) {
      setFormData(prev => ({
        ...prev,
        bio: profile.bio || "",
        instagramHandle: profile.instagramHandle || "",
        tiktokHandle: profile.tiktokHandle || "",
        youtubeHandle: profile.youtubeHandle || "",
        twitterHandle: profile.twitterHandle || "",
        websiteUrl: profile.websiteUrl || "",
        age: profile.age ? String(profile.age) : "",
        platformObjective: profile.platformObjective || "",
      }));
      if (profile.profileImageUrl) setPhotoPreview(profile.profileImageUrl);
      if (profile.bannerImageUrl) setBannerPreview(profile.bannerImageUrl);
    }
  }, [profile]);

  useEffect(() => {
    if (user?.name) {
      setFormData(prev => ({ ...prev, name: user.name || "" }));
    }
  }, [user?.name]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  async function onPhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const data = await readImageFile(file, 800);
    if (data) {
      setPhotoPreview(data.base64);
      setPhotoUpload(data);
    }
  }

  async function onBannerSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const data = await readImageFile(file, 1200);
    if (data) {
      setBannerPreview(data.base64);
      setBannerUpload(data);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile.mutateAsync({
        name: formData.name || undefined,
        bio: formData.bio || undefined,
        instagramHandle: formData.instagramHandle || undefined,
        tiktokHandle: formData.tiktokHandle || undefined,
        youtubeHandle: formData.youtubeHandle || undefined,
        twitterHandle: formData.twitterHandle || undefined,
        websiteUrl: formData.websiteUrl || "",
        age: formData.age ? parseInt(formData.age, 10) : undefined,
        platformObjective: formData.platformObjective || undefined,
        profileImageBase64: photoUpload?.base64,
        profileImageMime: photoUpload?.mime,
        bannerImageBase64: bannerUpload?.base64,
        bannerImageMime: bannerUpload?.mime,
      });
      setPhotoUpload(null);
      setBannerUpload(null);
    } catch (error) {
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
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Foto de Perfil</h2>
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-accent to-secondary flex items-center justify-center">
              {photoPreview ? (
                <img src={photoPreview} alt="Foto de perfil" className="w-full h-full object-cover" />
              ) : (
                <Camera className="w-8 h-8 text-white" />
              )}
            </div>
            <div>
              <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={onPhotoSelect} />
              <Button variant="outline" type="button" onClick={() => photoInputRef.current?.click()}>
                Alterar Foto
              </Button>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Banner</h2>
          <div className="w-full h-32 rounded-lg overflow-hidden bg-gradient-to-r from-accent via-secondary to-accent flex items-center justify-center">
            {bannerPreview ? (
              <img src={bannerPreview} alt="Banner" className="w-full h-full object-cover" />
            ) : (
              <Camera className="w-8 h-8 text-white" />
            )}
          </div>
          <input ref={bannerInputRef} type="file" accept="image/*" className="hidden" onChange={onBannerSelect} />
          <Button variant="outline" className="mt-4" type="button" onClick={() => bannerInputRef.current?.click()}>
            Alterar Banner
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="name">Nome</Label>
            <Input id="name" name="name" value={formData.name} onChange={handleChange} className="mt-2" />
          </div>

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
              <Label htmlFor="age">Idade</Label>
              <Input
                id="age"
                name="age"
                type="number"
                min={13}
                max={120}
                value={formData.age}
                onChange={handleChange}
                className="mt-2"
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="platformObjective">Objetivo na plataforma</Label>
              <Textarea
                id="platformObjective"
                name="platformObjective"
                value={formData.platformObjective}
                onChange={handleChange}
                className="mt-2"
                rows={2}
              />
            </div>
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
            />
          </div>

          <div className="flex gap-4">
            <Button type="submit" disabled={updateProfile.isPending} className="btn-primary">
              {updateProfile.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar Alterações"
              )}
            </Button>
            <Button variant="outline" type="button" onClick={() => setLocation("/dashboard")}>
              Cancelar
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
