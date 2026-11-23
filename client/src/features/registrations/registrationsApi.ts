import { api } from "../../shared/api/http";
import { queryClient } from "../../shared/api/queryClient";
import type { MyRegistration } from "./types";

export const registerForEvent = async (eventId: number) => {
  const res = await api<{ registration: { id: number } }>(`/events/${eventId}/registrations`, { method: "POST" });
  await queryClient.invalidateQueries();
  return res;
};

export const cancelRegistration = async (id: number) => {
  const res = await api(`/registrations/${id}`, { method: "DELETE" });
  await queryClient.invalidateQueries();
  return res;
};

export const listMyRegistrations = (scope: "upcoming" | "all" = "all") =>
  api<{ registrations: MyRegistration[] }>("/me/registrations", { params: { scope } });
