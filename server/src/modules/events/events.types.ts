export type EventStatus = "draft" | "published" | "canceled";

export interface EventOrganizerDto {
  id: number;
  name: string;
}

export interface EventDto {
  id: number;
  title: string;
  description: string;
  startsAt: string;
  startLocal: string;
  timeZone: string;
  location: string;
  capacity: number;
  status: EventStatus;
  organizer: EventOrganizerDto;
  activeRegistrations: number;
  placesRemaining: number;
  hasStarted: boolean;
  isRegistrationOpen: boolean;
  isOwner?: boolean;
  myRegistration?: { id: number; status: string } | null;
}

export interface AttendeeDto {
  registrationId: number;
  name: string;
  email: string;
  registeredAt: string;
}

export interface ListEventsOptions {
  q?: string;
  onlyOpen?: boolean;
  days?: number;
  page?: number;
  limit?: number;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

export interface PaginatedEventsResponse {
  events: EventDto[];
  pagination: PaginationMeta;
}

export type { CreateEventInput, UpdateEventInput } from "./events.schemas.js";
