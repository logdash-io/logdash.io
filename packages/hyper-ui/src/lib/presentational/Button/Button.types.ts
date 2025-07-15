export interface ButtonProps {
  variant?:
    | "primary"
    | "secondary"
    | "accent"
    | "neutral"
    | "ghost"
    | "outline";
  size?: "xs" | "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
  class?: string;
  onclick?: (event: MouseEvent) => void;
  type?: "button" | "submit" | "reset";
}
