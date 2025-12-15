import type { Snippet } from "svelte";

export interface ScrollAreaProps {
  class?: string;
  scrollbarClass?: string;
  orientation?: "x" | "y" | "xy";
  autoHideDelay?: number;
  thumbMinSize?: number;
  viewportRef?: HTMLDivElement | null;
  children: Snippet;
}
