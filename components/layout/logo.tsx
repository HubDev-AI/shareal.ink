import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <span className={cn("text-lg font-bold tracking-tight text-foreground", className)}>
      shareal<span className="text-accent">.ink</span>
    </span>
  );
}
