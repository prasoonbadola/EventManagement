import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "@tanstack/react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { ApiError } from "../../shared/api/http";
import { useConfirm } from "../../shared/components/ConfirmProvider";
import { Empty, ErrorState, Loading } from "../../shared/components/States";
import { useToast } from "../../shared/components/Toast";
import { useFetch } from "../../shared/hooks/useFetch";
import { eventFormSchema, type EventFormData } from "./eventSchemas";
import { createEvent, getEvent, updateEvent } from "./eventsApi";

const zones: string[] =
  (Intl as unknown as { supportedValuesOf?: (k: string) => string[] }).supportedValuesOf?.(
    "timeZone"
  ) ?? ["UTC"];
const viewerZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

export function EventFormPage() {
  const { id } = useParams({ strict: false });
  const editing = !!id;
  const nav = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();
  const [serverError, setServerError] = useState<string | null>(null);

  const existing = useFetch(() => (editing ? getEvent(id!) : Promise.resolve(null)), [id]);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<EventFormData>({
    resolver: zodResolver(eventFormSchema),
    mode: "onBlur",
    defaultValues: {
      title: "",
      description: "",
      startLocal: "",
      timeZone: viewerZone,
      location: "",
      capacity: 20,
      status: "draft",
    },
  });

  // Populate form with existing event data once fetched
  useEffect(() => {
    const e = existing.data?.event;
    if (e) {
      reset({
        title: e.title,
        description: e.description,
        startLocal: e.startLocal,
        timeZone: e.timeZone,
        location: e.location,
        capacity: e.capacity,
        status: e.status,
      });
    }
  }, [existing.data, reset]);

  if (editing && existing.loading) return <Loading />;
  if (existing.error) return <ErrorState error={existing.error} retry={existing.reload} />;
  const cur = existing.data?.event;
  if (cur && cur.status === "canceled") {
    return <Empty title="This event is canceled">Canceled events can't be edited.</Empty>;
  }

  async function onSubmit(data: EventFormData) {
    if (data.status === "canceled" && cur?.status !== "canceled") {
      const ok = await confirm({
        title: "Cancel this event?",
        message: (
          <p>
            Attendees will see it as canceled and nobody can register.{" "}
            <strong>This can't be undone.</strong>
          </p>
        ),
        confirmText: "Cancel event",
        cancelText: "Go back",
        tone: "danger",
      });
      if (!ok) return;
    }

    setServerError(null);
    try {
      const r = editing ? await updateEvent(id!, data) : await createEvent(data);
      toast("ok", editing ? "Event updated." : "Event created.");
      nav({ to: `/events/${r.event.id}` });
    } catch (e) {
      const apiErr = e as ApiError;
      if (apiErr.details) {
        for (const [field, msgs] of Object.entries(apiErr.details)) {
          setError(field as keyof EventFormData, {
            type: "server",
            message: msgs[0],
          });
        }
      } else {
        setServerError(apiErr.message);
      }
    }
  }

  const statusOptions =
    cur?.status === "published"
      ? ["published", "canceled"]
      : ["draft", "published", "canceled"];

  return (
    <div className="card">
      <h1>{editing ? "Edit event" : "New event"}</h1>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <label>
          Title
          <input
            type="text"
            disabled={isSubmitting}
            maxLength={200}
            {...register("title")}
          />
          {errors.title && <span className="fe">{errors.title.message}</span>}
        </label>

        <label>
          Description
          <textarea
            rows={5}
            disabled={isSubmitting}
            {...register("description")}
          />
          {errors.description && <span className="fe">{errors.description.message}</span>}
        </label>

        <div className="two">
          <label>
            Starts (local time at the venue)
            <input
              type="datetime-local"
              disabled={isSubmitting}
              {...register("startLocal")}
            />
            {errors.startLocal && <span className="fe">{errors.startLocal.message}</span>}
          </label>

          <label>
            Time zone
            <select disabled={isSubmitting} {...register("timeZone")}>
              {(zones.includes(viewerZone) ? zones : [viewerZone, ...zones]).map((z) => (
                <option key={z} value={z}>
                  {z}
                </option>
              ))}
            </select>
            {errors.timeZone && <span className="fe">{errors.timeZone.message}</span>}
          </label>
        </div>

        <label>
          Venue / location
          <input
            type="text"
            disabled={isSubmitting}
            maxLength={200}
            {...register("location")}
          />
          {errors.location && <span className="fe">{errors.location.message}</span>}
        </label>

        <div className="two">
          <label>
            Maximum capacity
            <input
              type="number"
              min={1}
              step={1}
              disabled={isSubmitting}
              {...register("capacity", { valueAsNumber: true })}
            />
            {errors.capacity && <span className="fe">{errors.capacity.message}</span>}
            {cur && (
              <small className="muted">
                {cur.activeRegistrations} active registration(s) — capacity can't go below that.
              </small>
            )}
          </label>

          <label>
            Status
            <select disabled={isSubmitting} {...register("status")}>
              {statusOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            {errors.status && <span className="fe">{errors.status.message}</span>}
            {cur?.status !== "canceled" && (
              <small className="muted">Canceling can't be undone.</small>
            )}
          </label>
        </div>

        {serverError && (
          <p className="note bad" role="alert">
            {serverError}
          </p>
        )}

        <div className="formactions">
          <button className="btn primary" disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : editing ? "Save changes" : "Create event"}
          </button>
          <button
            type="button"
            className="btn"
            disabled={isSubmitting}
            onClick={() => window.history.back()}
          >
            Back
          </button>
        </div>
      </form>
    </div>
  );
}
