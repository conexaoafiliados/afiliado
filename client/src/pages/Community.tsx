import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PostCard } from "@/components/PostCard";
import { Search } from "lucide-react";
import { useState } from "react";

interface Post {
  id: number;
  author: string;
  content: string;
  timestamp: string;
  likes: number;
  comments: number;
  liked: boolean;
}

const MOCK_POSTS: Post[] = [
  {
    id: 1,
    author: "Maria Silva",
    content: "Acabei de atingir 500 seguidores! Obrigada a todos que acompanham meu conteúdo 🎉",
    timestamp: "2 horas atrás",
    likes: 234,
    comments: 45,
    liked: false,
  },
  {
    id: 2,
    author: "João Santos",
    content: "Dica: Postar consistentemente é mais importante que postar muito. Qualidade > Quantidade",
    timestamp: "4 horas atrás",
    likes: 567,
    comments: 89,
    liked: true,
  },
  {
    id: 3,
    author: "Ana Costa",
    content: "Quem aqui está começando sua jornada como creator? Vamos crescer juntos! 💪",
    timestamp: "6 horas atrás",
    likes: 345,
    comments: 123,
    liked: false,
  },
  {
    id: 4,
    author: "Carlos Oliveira",
    content: "Novo vídeo no canal! Confira a edição que fiz com os presets da plataforma",
    timestamp: "8 horas atrás",
    likes: 456,
    comments: 67,
    liked: false,
  },
];

export default function Community() {
  const [posts, setPosts] = useState<Post[]>(MOCK_POSTS);
  const [newPost, setNewPost] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const handlePostSubmit = () => {
    if (newPost.trim()) {
      const post: Post = {
        id: posts.length + 1,
        author: "Você",
        content: newPost,
        timestamp: "Agora",
        likes: 0,
        comments: 0,
        liked: false,
      };
      setPosts([post, ...posts]);
      setNewPost("");
    }
  };

  const handleLike = (id: number) => {
    setPosts(prev =>
      prev.map(p =>
        p.id === id
          ? { ...p, likes: p.liked ? p.likes - 1 : p.likes + 1, liked: !p.liked }
          : p
      )
    );
  };

  const handleComment = (id: number) => {
    console.log("Comentando post", id);
  };

  const handleShare = (id: number) => {
    console.log("Compartilhando post", id);
  };

  const filteredPosts = posts.filter(post =>
    post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.author.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold mb-2">Comunidade</h1>
        <p className="text-muted-foreground">Conecte-se com outros creators e compartilhe experiências</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder="Buscar posts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* New Post */}
      <Card className="card-elegant">
        <h3 className="font-semibold mb-4">Compartilhe algo com a comunidade</h3>
        <Textarea
          placeholder="O que está em sua mente?"
          value={newPost}
          onChange={(e) => setNewPost(e.target.value)}
          className="mb-4"
          rows={4}
        />
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setNewPost("")}>
            Cancelar
          </Button>
          <Button
            className="btn-primary"
            onClick={handlePostSubmit}
            disabled={!newPost.trim()}
          >
            Publicar
          </Button>
        </div>
      </Card>

      {/* Posts Feed */}
      <div className="space-y-4">
        {filteredPosts.map(post => (
          <PostCard
            key={post.id}
            {...post}
            onLike={handleLike}
            onComment={handleComment}
            onShare={handleShare}
          />
        ))}
      </div>

      {filteredPosts.length === 0 && (
        <Card className="card-elegant text-center py-12">
          <p className="text-muted-foreground">Nenhum post encontrado</p>
        </Card>
      )}
    </div>
  );
}
