import { Modal } from "../../shared/components/Modal";
import { useAuth } from "../auth/useAuth";
import type { MyRegistration } from "./types";
import { VirtualTicket } from "./VirtualTicket";

interface Props {
  reg: MyRegistration | null;
  onClose: () => void;
  onCancel: (r: MyRegistration) => void;
}

export function RegistrationDetailModal({ reg, onClose, onCancel }: Props) {
  const { user } = useAuth();
  const e = reg?.event;

  return (
    <Modal
      open={Boolean(reg)}
      onClose={onClose}
      title="Virtual Admission Pass"
      size="md"
    >
      {reg && e && (
        <VirtualTicket
          event={e}
          attendee={{
            name: user?.name ?? "Registered Attendee",
            email: user?.email ?? "",
          }}
          registrationId={reg.id}
          registeredAt={reg.registeredAt}
          status={reg.status}
          showActions={true}
          onCancel={() => onCancel(reg)}
          onClose={onClose}
        />
      )}
    </Modal>
  );
}
