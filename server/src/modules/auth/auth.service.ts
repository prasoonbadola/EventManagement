import bcrypt from "bcryptjs";
import { AppDataSource } from "../../db/data-source.js";
import { UserEntity } from "../../entities/User.js";
import { ApiError, ErrorCode } from "../../shared/errors.js";
import { signToken } from "../../shared/middleware/auth.js";
import type {
  AuthResponse,
  LoginInput,
  SignupInput,
  UpdateProfileInput,
  UserProfileResponse,
} from "./auth.types.js";

const userRepo = () => AppDataSource.getRepository(UserEntity);

/**
 * Register a new user in the system.
 * 1. Hashes the plain-text password with bcrypt (10 rounds).
 * 2. Saves the new user via TypeORM.
 * 3. Catches Postgres error code 23505 (unique constraint violation) if the email is taken.
 * 4. Signs a JWT token and returns user details (excluding password hash).
 */
export async function signup(input: SignupInput): Promise<AuthResponse> {
  const passwordHash = await bcrypt.hash(input.password, 10);
  const user = userRepo().create({
    name: input.name,
    email: input.email,
    passwordHash,
    role: input.role,
  });

  try {
    const saved = await userRepo().save(user);
    return {
      token: signToken(saved.id),
      user: { id: saved.id, name: saved.name, email: saved.email, role: saved.role },
    };
  } catch (e) {
    // 23505 = Postgres unique_violation (triggered by users_email_lower_uq)
    if ((e as { code?: string }).code === "23505") {
      throw new ApiError(409, ErrorCode.EMAIL_TAKEN, "An account with that email already exists.");
    }
    throw e;
  }
}

/**
 * Authenticate a user with email and password.
 * 1. Queries user by lowercase email to ensure case-insensitive matching.
 * 2. Compares supplied password against the stored bcrypt hash.
 * 3. Returns a signed JWT token on success.
 */
export async function login(input: LoginInput): Promise<AuthResponse> {
  const user = await userRepo()
    .createQueryBuilder("u")
    .where("lower(u.email) = :email", { email: input.email.toLowerCase() })
    .getOne();

  if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
    throw new ApiError(401, ErrorCode.BAD_CREDENTIALS, "Incorrect email or password.");
  }

  return {
    token: signToken(user.id),
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  };
}

/**
 * Update user profile (name and/or password).
 * If changing password:
 * 1. Requires `currentPassword` to match the existing hash for security.
 * 2. Hashes the new password with bcrypt.
 * 3. Saves the updated user record.
 */
export async function updateProfile(
  userId: number,
  input: UpdateProfileInput
): Promise<UserProfileResponse> {
  const user = await userRepo().findOneBy({ id: userId });
  if (!user) throw new ApiError(404, ErrorCode.NOT_FOUND, "User not found.");

  let newHash = user.passwordHash;
  if (input.newPassword) {
    if (!input.currentPassword || !(await bcrypt.compare(input.currentPassword, user.passwordHash))) {
      throw new ApiError(400, ErrorCode.BAD_CREDENTIALS, "Current password is incorrect.", {
        currentPassword: ["Current password is incorrect"],
      });
    }
    newHash = await bcrypt.hash(input.newPassword, 10);
  }

  user.name = input.name ?? user.name;
  user.passwordHash = newHash;
  const saved = await userRepo().save(user);

  return {
    user: { id: saved.id, name: saved.name, email: saved.email, role: saved.role },
  };
}
