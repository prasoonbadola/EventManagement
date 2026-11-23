import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn,
} from "typeorm";
import type { RegistrationStatus } from "../modules/registrations/registrations.types.js";
import type { UserEntity } from "./User.js";
import type { EventEntity } from "./Event.js";

export type { RegistrationStatus };

/**
 * RegistrationEntity
 * Represents an attendee's reservation for an event.
 *
 * Concurrency & Uniqueness:
 * - A user can only have one active registration per event at a time (enforced by a partial unique index in the DB).
 * - When canceled, `status` becomes 'canceled' and `canceledAt` records the cancellation time.
 * - Canceled registrations free up capacity for other attendees.
 */
@Entity("registrations")
export class RegistrationEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "int", name: "event_id" })
  eventId!: number;

  @ManyToOne("EventEntity", "registrations", { onDelete: "CASCADE" })
  @JoinColumn({ name: "event_id" })
  event!: EventEntity;

  @Column({ type: "int", name: "user_id" })
  userId!: number;

  @ManyToOne("UserEntity", "registrations")
  @JoinColumn({ name: "user_id" })
  user!: UserEntity;

  /** 'active' counts toward event capacity; 'canceled' frees up the seat */
  @Column({ type: "text", default: "active" })
  status!: RegistrationStatus;

  @CreateDateColumn({ type: "timestamptz", name: "created_at" })
  createdAt!: Date;

  /** Set when an attendee cancels their registration */
  @Column({ type: "timestamptz", name: "canceled_at", nullable: true })
  canceledAt!: Date | null;
}
