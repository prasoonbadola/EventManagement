import type { Event } from "../events/types";

export type StatusTab = "all" | "published" | "draft" | "canceled";

export interface MenuCoords {
  top?: number;
  bottom?: number;
  right: number;
}

export interface OrganizerActionMenuProps {
  event: Event;
  onDuplicate: (event: Event) => void;
  onPublish: (event: Event) => void;
  onCancel: (event: Event) => void;
  onDelete: (event: Event) => void;
}
