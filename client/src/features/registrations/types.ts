import type { EventStatus } from "../events/types";

export type RegistrationStatus = "active" | "canceled";
export type RegistrationScope = "upcoming" | "all";

export interface MyRegistrationEvent {
  id: number;
  title: string;
  description: string;
  startsAt: string;
  timeZone: string;
  location: string;
  status: EventStatus;
}

export interface MyRegistration {
  id: number;
  status: RegistrationStatus;
  registeredAt: string;
  canceledAt: string | null;
  event: MyRegistrationEvent;
}

export interface RegistrationSuccessResult {
  id: number;
  eventId: number;
  status: RegistrationStatus;
  registeredAt: string;
}

export interface VirtualTicketEvent {
  id: number;
  title: string;
  description?: string;
  startsAt: string;
  timeZone: string;
  location: string;
}

export interface TicketAttendee {
  name: string;
  email: string;
}

export interface VirtualTicketProps {
  event: VirtualTicketEvent;
  attendee: TicketAttendee;
  registrationId?: number;
  registeredAt?: string;
  status?: "active" | "canceled";
  showActions?: boolean;
  onCancel?: () => void;
  onClose?: () => void;
}

export interface AddToCalendarMenuProps {
  event: {
    id: number;
    title: string;
    description?: string;
    location?: string;
    startsAt: string;
  };
  align?: "left" | "right";
  direction?: "up" | "down";
  size?: "small" | "normal";
}
