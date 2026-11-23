import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { api, ApiError } from "../../shared/api/http";
import { Modal } from "../../shared/components/Modal";
import { useToast } from "../../shared/components/Toast";
import { useAuth } from "./useAuth";
import { profileSchema, type ProfileFormData } from "./authSchemas";
import type { User } from "./types";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function ProfileModal({ open, onClose }: Props) {
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const [showPasswords, setShowPasswords] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    mode: "onBlur",
    values: {
      name: user?.name ?? "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
    resetOptions: {
      keepDefaultValues: false,
    },
  });

  const handleClose = () => {
    setServerError(null);
    setShowPasswords(false);
    reset();
    onClose();
  };

  async function onSubmit(data: ProfileFormData) {
    setServerError(null);

    const body: Record<string, string> = {};
    if (data.name.trim() && data.name.trim() !== user?.name) {
      body.name = data.name.trim();
    }
    if (data.newPassword) {
      body.currentPassword = data.currentPassword ?? "";
      body.newPassword = data.newPassword;
    }

    if (Object.keys(body).length === 0) {
      onClose();
      return;
    }

    try {
      const res = await api<{ user: User }>("/auth/profile", {
        method: "PATCH",
        body,
      });

      updateUser(res.user);
      toast("ok", "Profile updated successfully.");
      onClose();
    } catch (e) {
      const apiErr = e as ApiError;
      if (apiErr.details) {
        for (const [field, msgs] of Object.entries(apiErr.details)) {
          setError(field as keyof ProfileFormData, {
            type: "server",
            message: msgs[0],
          });
        }
      } else {
        setServerError(apiErr.message);
      }
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Account Profile"
      size="md"
      footer={
        <>
          <button
            type="button"
            className="btn"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="profile-form"
            className="btn primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving…" : "Save changes"}
          </button>
        </>
      }
    >
      <form
        id="profile-form"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        style={{ display: "grid", gap: "14px" }}
      >
        <label>
          Email address
          <input
            type="email"
            value={user?.email ?? ""}
            disabled
            style={{ opacity: 0.7, cursor: "not-allowed" }}
          />
          <small className="muted" style={{ display: "block", marginTop: "4px" }}>
            Role: <strong>{user?.role}</strong> (email cannot be changed)
          </small>
        </label>

        <label>
          Display Name
          <input
            type="text"
            disabled={isSubmitting}
            maxLength={80}
            {...register("name")}
          />
          {errors.name && <span className="fe">{errors.name.message}</span>}
        </label>

        <div
          style={{
            marginTop: "10px",
            paddingTop: "14px",
            borderTop: "1px dashed var(--line)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "8px",
            }}
          >
            <h4 style={{ margin: 0 }}>Change Password</h4>
            <button
              type="button"
              className="link flex items-center gap-1"
              style={{ fontSize: "0.82rem" }}
              onClick={() => setShowPasswords((s) => !s)}
            >
              {showPasswords ? (
                <>
                  <EyeOff className="w-3.5 h-3.5" /> Hide passwords
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5" /> Show passwords
                </>
              )}
            </button>
          </div>
          <p className="muted" style={{ fontSize: "0.88rem", margin: "0 0 12px" }}>
            Leave blank if you don't wish to change your password.
          </p>

          <label>
            Current Password
            <input
              type={showPasswords ? "text" : "password"}
              disabled={isSubmitting}
              autoComplete="current-password"
              {...register("currentPassword")}
            />
            {errors.currentPassword && (
              <span className="fe">{errors.currentPassword.message}</span>
            )}
          </label>

          <div className="two" style={{ marginTop: "10px" }}>
            <label>
              New Password
              <input
                type={showPasswords ? "text" : "password"}
                disabled={isSubmitting}
                autoComplete="new-password"
                {...register("newPassword")}
              />
              {errors.newPassword && (
                <span className="fe">{errors.newPassword.message}</span>
              )}
            </label>

            <label>
              Confirm New Password
              <input
                type={showPasswords ? "text" : "password"}
                disabled={isSubmitting}
                autoComplete="new-password"
                {...register("confirmPassword")}
              />
              {errors.confirmPassword && (
                <span className="fe">{errors.confirmPassword.message}</span>
              )}
            </label>
          </div>
        </div>

        {serverError && (
          <p className="note bad" role="alert" style={{ margin: "8px 0 0" }}>
            {serverError}
          </p>
        )}
      </form>
    </Modal>
  );
}
