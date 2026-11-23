import { useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation, useNavigate, useSearch } from "@tanstack/react-router";
import { Eye, EyeOff } from "lucide-react";
import { ApiError } from "../../shared/api/http";
import { useAuth } from "./useAuth";

const email = z.string().trim().toLowerCase().email("Enter a valid email address");

const loginSchema = z.object({
  email,
  password: z.string().min(1, "Password is required"),
});

const signupSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  email,
  password: z.string().min(8, "Use at least 8 characters"),
  role: z.enum(["attendee", "organizer"]),
});

type FormValues = {
  name?: string;
  email: string;
  password: string;
  role?: "attendee" | "organizer";
};

type Mode = "login" | "signup";

const safeRedirect = (from?: string) =>
  from && from.startsWith("/") && !from.startsWith("//") ? from : null;

export function LoginPage() {
  const { signIn } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const search = useSearch({ strict: false }) as { from?: string } | undefined;

  const [mode, setMode] = useState<Mode>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const dynamicResolver: Resolver<FormValues> = (values, ctx, opts) => {
    const schema = mode === "login" ? loginSchema : signupSchema;
    return zodResolver(schema)(values, ctx, opts);
  };

  const {
    register,
    handleSubmit,
    setError,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: dynamicResolver,
    defaultValues: { name: "", email: "", password: "", role: "attendee" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setGeneralError(null);
    try {
      const payload =
        mode === "login"
          ? { email: values.email, password: values.password }
          : { ...values, role: values.role ?? "attendee" };

      const user = await signIn(mode, payload);
      const target =
        safeRedirect(search?.from ?? (loc.state as { from?: string } | undefined)?.from) ??
        (user.role === "organizer" ? "/organizer" : "/me");
      nav({ to: target, replace: true });
    } catch (e) {
      if (e instanceof ApiError && e.details) {
        Object.entries(e.details).forEach(([field, msgs]) =>
          setError(field as keyof FormValues, { message: msgs[0] })
        );
      } else {
        setGeneralError(
          e instanceof ApiError ? e.message : "Something went wrong. Please try again."
        );
      }
    }
  });

  function switchMode() {
    setMode((m) => (m === "login" ? "signup" : "login"));
    setGeneralError(null);
    reset({ name: "", email: "", password: "", role: "attendee" });
  }

  function fillDemo(demoEmail: string) {
    setValue("email", demoEmail, { shouldValidate: true });
    setValue("password", "password123", { shouldValidate: true });
    setGeneralError(null);
  }

  return (
    <div className="card narrow">
      <h1>{mode === "login" ? "Sign in" : "Create account"}</h1>
      <form onSubmit={onSubmit} noValidate>
        {mode === "signup" && (
          <label htmlFor="name">
            Name
            <input
              id="name"
              autoComplete="name"
              disabled={isSubmitting}
              aria-invalid={!!errors.name}
              {...register("name")}
            />
            {errors.name && <span className="fe" role="alert">{errors.name.message}</span>}
          </label>
        )}

        <label htmlFor="email">
          Email
          <input
            id="email"
            type="email"
            autoComplete="email"
            disabled={isSubmitting}
            aria-invalid={!!errors.email}
            {...register("email")}
          />
          {errors.email && <span className="fe" role="alert">{errors.email.message}</span>}
        </label>

        <label htmlFor="password">
          Password
          <div className="input-with-action">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              disabled={isSubmitting}
              aria-invalid={!!errors.password}
              {...register("password")}
            />
            <button
              type="button"
              className="input-action-btn"
              aria-pressed={showPassword}
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword((s) => !s)}
            >
              {showPassword ? (
                <span className="flex items-center gap-1">
                  <EyeOff className="w-4 h-4" /> Hide
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <Eye className="w-4 h-4" /> Show
                </span>
              )}
            </button>
          </div>
          {errors.password && <span className="fe" role="alert">{errors.password.message}</span>}
        </label>

        {mode === "signup" && (
          <label htmlFor="role">
            I am an
            <select id="role" disabled={isSubmitting} {...register("role")}>
              <option value="attendee">Attendee</option>
              <option value="organizer">Organizer</option>
            </select>
            {errors.role && <span className="fe" role="alert">{errors.role.message}</span>}
          </label>
        )}

        {generalError && <p className="note bad" role="alert">{generalError}</p>}

        <button type="submit" className="btn primary" disabled={isSubmitting}>
          {isSubmitting ? "Please wait…" : mode === "login" ? "Sign in" : "Sign up"}
        </button>
      </form>

      <p className="muted switch">
        {mode === "login" ? "New here? " : "Have an account? "}
        <button type="button" className="link" onClick={switchMode}>
          {mode === "login" ? "Create an account" : "Sign in"}
        </button>
      </p>

      {mode === "login" && (
        <div className="demo">
          <span>
            Demo accounts (password <code>password123</code>):
          </span>
          <button type="button" className="link" onClick={() => fillDemo("olivia@example.com")}>
            Organizer · Olivia
          </button>
          <button type="button" className="link" onClick={() => fillDemo("omar@example.com")}>
            Organizer · Omar
          </button>
          <button type="button" className="link" onClick={() => fillDemo("alice@example.com")}>
            Attendee · Alice
          </button>
          <button type="button" className="link" onClick={() => fillDemo("bob@example.com")}>
            Attendee · Bob
          </button>
        </div>
      )}
    </div>
  );
}
