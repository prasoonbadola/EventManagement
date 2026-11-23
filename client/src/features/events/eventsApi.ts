import { api } from "../../shared/api/http";
import { queryClient } from "../../shared/api/queryClient";
import type {
  AttendeesResponse,
  Event,
  ListAttendeesParams,
  ListEventsParams,
  ListOrganizerEventsParams,
  OrganizerEventsResponse,
  Pagination,
} from "./types";

export const listEvents = (params?: string | ListEventsParams) => {
  if (typeof params === "string") {
    return api<{ events: Event[]; pagination?: Pagination }>("/events", { params: { q: params } });
  }
  return api<{ events: Event[]; pagination?: Pagination }>("/events", { params });
};
export const getEvent = (id: string | number) => api<{ event: Event }>(`/events/${id}`);

export const createEvent = async (body: unknown) => {
  const res = await api<{ event: Event }>("/events", { method: "POST", body });
  await queryClient.invalidateQueries();
  return res;
};

export const updateEvent = async (id: string | number, body: unknown) => {
  const res = await api<{ event: Event }>(`/events/${id}`, { method: "PATCH", body });
  await queryClient.invalidateQueries();
  return res;
};

export const deleteEvent = async (id: string | number) => {
  const res = await api<{ id: number; deleted: true }>(`/events/${id}`, { method: "DELETE" });
  await queryClient.invalidateQueries();
  return res;
};

export const listOrganizerEvents = (params?: ListOrganizerEventsParams) => {
  const p = params?.status === "all" ? { ...params, status: undefined } : params;
  return api<OrganizerEventsResponse>("/organizer/events", { params: p });
};

export const listAttendees = (id: string | number, params?: ListAttendeesParams) =>
  api<AttendeesResponse>(`/events/${id}/registrations`, { params });
