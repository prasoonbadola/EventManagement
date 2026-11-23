import type { EventStatus } from "../events/events.types.js";

export type RegistrationStatus = "active" | "canceled";
export type RegistrationScope = "upcoming" | "all";

export interface RegistrationDto {
  id: number;
  eventId: number;
  status: RegistrationStatus;
  registeredAt: string;
}

export interface CancelRegistrationDto {
  id: number;
  status: "canceled";
}

export interface MyRegistrationEventDto {
  id: number;
  title: string;
  description: string;
  startsAt: string;
  timeZone: string;
  location: string;
  status: EventStatus;
}

export interface MyRegistrationDto {
  id: number;
  status: RegistrationStatus;
  registeredAt: string;
  canceledAt: string | null;
  event: MyRegistrationEventDto;
}
