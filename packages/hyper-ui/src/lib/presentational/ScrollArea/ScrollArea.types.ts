import type { Snippet } from "svelte";

export interface ScrollAreaProps {
  class?: string;
  orientation?: "x" | "y" | "xy";
  viewportRef?: HTMLDivElement | null;
  onscroll?: (event: Event) => void;
  children: Snippet;
}
