import { cn } from "@/lib/utils";

type AvatarProps = {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizes = {
  sm: "h-9 w-9 text-xs",
  md: "h-11 w-11 text-sm",
  lg: "h-14 w-14 text-base",
};

export function getInitials(nome: string) {
  return nome
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function Avatar({ name, size = "md", className }: AvatarProps) {
  return (
    <div
      className={cn(
        "rounded-full bg-accent-muted text-accent flex items-center justify-center font-semibold flex-shrink-0 ring-2 ring-card",
        sizes[size],
        className
      )}
      aria-hidden
    >
      {getInitials(name)}
    </div>
  );
}
