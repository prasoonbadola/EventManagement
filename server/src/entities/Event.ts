import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, OneToMany, JoinColumn,
} from "typeorm";
import type { EventStatus } from "../modules/events/events.types.js";
import type { UserEntity } from "./User.js";
import type { RegistrationEntity } from "./Registration.js";

export type { EventStatus };

/**
 * EventEntity
 * Represents a scheduled event created by an organizer.
 *
 * Time Zone Handling:
 * - `startsAt`: Stored as a UTC instant (TIMESTAMPTZ) for consistent server-side queries.
 * - `timeZone`: The original IANA time zone (e.g., 'Asia/Kolkata') where the event takes place.
 *   This ensures attendees in any zone see the local event time accurately formatted.
 */
@Entity("events")
export class EventEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "int", name: "organizer_id" })
  organizerId!: number;

  @ManyToOne("UserEntity", "events")
  @JoinColumn({ name: "organizer_id" })
  organizer!: UserEntity;

  @Column({ type: "text" })
  title!: string;

  @Column({ type: "text", default: "" })
  description!: string;

  /** UTC absolute timestamp when the event begins */
  @Column({ type: "timestamptz", name: "starts_at" })
  startsAt!: Date;

  /** IANA time zone identifier (e.g. 'America/New_York', 'Asia/Kolkata') */
  @Column({ type: "text", name: "time_zone" })
  timeZone!: string;

  @Column({ type: "text" })
  location!: string;

  /** Maximum attendees permitted (strictly positive integer) */
  @Column({ type: "int" })
  capacity!: number;

  /** Event lifecycle status: 'draft' -> 'published' -> 'canceled' */
  @Column({ type: "text", default: "draft" })
  status!: EventStatus;

  @CreateDateColumn({ type: "timestamptz", name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz", name: "updated_at" })
  updatedAt!: Date;

  @OneToMany("RegistrationEntity", "event")
  registrations!: RegistrationEntity[];

  /**
   * Virtual field computed dynamically in queries (via subquery).
   * Not a stored column in the database table.
   */
  activeCount?: number;
}
