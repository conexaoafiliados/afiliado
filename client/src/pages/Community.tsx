import { MentionTextarea } from "@/components/MentionTextarea";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PostCard } from "@/components/PostCard";
import { formatRelativeTime } from "@/lib/formatTime";
import { trpc } from "@/lib/trpc";
import { Loader2, Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Community() {
  const [newPost, setNewPost] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const utils = trpc.useUtils();

  const { data: posts = [], isLoading } = trpc.community.feed.useQuery({ limit: 50 });

  const createPost = trpc.community.post.useMutation({
    onSuccess: () => {
      setNewPost("");
      utils.community.feed.invalidate();
      utils.notifications.unreadCount.invalidate();
      toast.success("Post publicado!");
    },
    onError: err => toast.error(err.message),
  });

  const likePost = trpc.community.like.useMutation({
    onSuccess: () => {
      utils.community.feed.invalidate();
      utils.notifications.unreadCount.invalidate();
    },
    onError: err => toast.error(err.message),
  });

  const filteredPosts = posts.filter(
    post =>
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.authorName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div>
        <h1 className="text-4xl font-bold mb-2">Comunidade</h1>
        <p className="text-muted-foreground">
          Conecte-se com outros creators, comente e marque pessoas com @usuario
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder="Buscar posts..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <Card className="card-elegant">
        <h3 className="font-semibold mb-4">Compartilhe algo com a comunidade</h3>
        <MentionTextarea
          value={newPost}
          onChange={setNewPost}
          placeholder="O que está em sua mente?"
          rows={4}
          className="mb-4"
        />
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setNewPost("")}>
            Cancelar
          </Button>
          <Button
            className="btn-primary"
            onClick={() => createPost.mutate({ content: newPost.trim() })}
            disabled={!newPost.trim() || createPost.isPending}
          >
            {createPost.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Publicar"}
          </Button>
        </div>
      </Card>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPosts.map(post => (
            <PostCard
              key={post.id}
              id={post.id}
              author={post.authorName}
              content={post.content}
              timestamp={formatRelativeTime(post.createdAt)}
              likes={post.likes}
              comments={post.commentCount}
              liked={post.liked}
              onLike={id => likePost.mutate({ postId: id })}
            />
          ))}
        </div>
      )}

      {!isLoading && filteredPosts.length === 0 && (
        <Card className="card-elegant text-center py-12">
          <p className="text-muted-foreground">
            {posts.length === 0 ? "Nenhum post ainda. Seja o primeiro!" : "Nenhum post encontrado"}
          </p>
        </Card>
      )}
    </div>
  );
}
