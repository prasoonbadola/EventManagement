export type EventStatus = "draft" | "published" | "canceled";

export interface EventOrganizer {
  id: number;
  name: string;
}

export interface Event {
  id: number;
  title: string;
  description: string;
  startsAt: string;
  startLocal: string;
  timeZone: string;
  location: string;
  capacity: number;
  status: EventStatus;
  organizer: EventOrganizer;
  activeRegistrations: number;
  placesRemaining: number;
  hasStarted: boolean;
  isRegistrationOpen: boolean;
  isOwner?: boolean;
  myRegistration?: { id: number; status: string } | null;
}

export interface Attendee {
  registrationId: number;
  name: string;
  email: string;
  registeredAt: string;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

export interface OrganizerStats {
  total: number;
  live: number;
  drafts: number;
  canceled: number;
  used: number;
  fill: number;
}

export interface ListEventsParams {
  q?: string;
  onlyOpen?: boolean;
  days?: number;
  page?: number;
  limit?: number;
}

export interface ListOrganizerEventsParams {
  page?: number;
  limit?: number;
  status?: string;
  q?: string;
}

export interface ListAttendeesParams {
  page?: number;
  limit?: number;
  q?: string;
}

export interface OrganizerEventsResponse {
  events: Event[];
  pagination: Pagination;
  stats: OrganizerStats;
}

export interface AttendeesResponse {
  attendees: Attendee[];
  pagination: Pagination;
}
