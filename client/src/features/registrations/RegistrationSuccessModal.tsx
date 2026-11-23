import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Modal } from "../../shared/components/Modal";
import { useAuth } from "../auth/useAuth";
import { VirtualTicket } from "./VirtualTicket";

interface Props {
  open: boolean;
  onClose: () => void;
  event: {
    id: number;
    title: string;
    description: string;
    startsAt: string;
    timeZone: string;
    location: string;
  };
}

export function RegistrationSuccessModal({ open, onClose, event }: Props) {
  const { user } = useAuth();
  const [registeredAt] = useState(() => new Date().toISOString());

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Registration Confirmed!"
      size="md"
      footer={
        <div className="flex items-center justify-between w-full">
          <Link
            to="/me"
            className="btn small inline-flex items-center gap-1.5"
            onClick={onClose}
          >
            <span>View My Passes</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <button
            type="button"
            className="btn primary small"
            onClick={onClose}
          >
            Done
          </button>
        </div>
      }
    >
      <VirtualTicket
        event={event}
        attendee={{
          name: user?.name ?? "Registered Attendee",
          email: user?.email ?? "",
        }}
        registeredAt={registeredAt}
        status="active"
        showActions={true}
        onClose={onClose}
      />
    </Modal>
  );
}
