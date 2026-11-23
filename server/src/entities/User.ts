import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from "typeorm";
import type { Role } from "../modules/auth/auth.types.js";
import type { EventEntity } from "./Event.js";
import type { RegistrationEntity } from "./Registration.js";

export type { Role };

/**
 * UserEntity
 * Represents a registered user in the Gathr system.
 * A user can either be an 'organizer' (creates events) or an 'attendee' (registers for events).
 */
@Entity("users")
export class UserEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "text" })
  name!: string;

  /** Email is unique (case-insensitive in DB via lower(email) unique index) */
  @Column({ type: "text" })
  email!: string;

  /** Bcrypt hashed password (never stored in plain text) */
  @Column({ type: "text", name: "password_hash" })
  passwordHash!: string;

  /** Role-based access control: 'organizer' or 'attendee' */
  @Column({ type: "text" })
  role!: Role;

  @CreateDateColumn({ type: "timestamptz", name: "created_at" })
  createdAt!: Date;

  /** Events created by this user (if role = organizer) */
  @OneToMany("EventEntity", "organizer")
  events!: EventEntity[];

  /** Registrations made by this user (if role = attendee) */
  @OneToMany("RegistrationEntity", "user")
  registrations!: RegistrationEntity[];
}
