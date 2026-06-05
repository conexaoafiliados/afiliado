import { Link } from "wouter";

interface UserAvatarProps {
  src?: string | null;
  name: string;
  size?: number;
  username?: string | null;
  className?: string;
}

export function UserAvatar({ src, name, size = 40, username, className = "" }: UserAvatarProps) {
  const initial = (name || "?").charAt(0).toUpperCase();
  const avatar = (
    <div
      className={`rounded-full overflow-hidden bg-gradient-to-br from-accent to-secondary flex items-center justify-center shrink-0 text-white font-bold ${className}`}
      style={{ width: size, height: size, fontSize: Math.max(12, size * 0.38) }}
    >
      {src ? (
        <img src={src} alt={name} className="h-full w-full object-cover" />
      ) : (
        <span>{initial}</span>
      )}
    </div>
  );

  if (username) {
    return (
      <Link href={`/profile/${username}`}>
        <a className="inline-flex hover:opacity-90 transition-opacity">{avatar}</a>
      </Link>
    );
  }

  return avatar;
}
