import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("text-primary", className)}
    >
      <path d="M32 8L16 16L8 32L16 48L32 56L48 48L56 32L48 16L32 8Z" />
      <circle cx="32" cy="32" r="12" />
      <path d="M32 20V44" />
      <path d="M20 32H44" />
    </svg>
  );
}