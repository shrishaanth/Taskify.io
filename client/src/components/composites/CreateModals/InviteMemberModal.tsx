import { useRef } from "react";
import { Modal } from "../../primitives/Modal/Modal";
import { Button } from "../../primitives/Button/Button";
import {
  InviteForm,
  type InviteFormHandle,
  type InviteFormValues,
} from "../InviteForm/InviteForm";

export interface InviteMemberModalProps {
  open: boolean;
  onClose: () => void;
  onInvite: (values: InviteFormValues) => void;
  pending?: boolean;
}

export function InviteMemberModal({
  open,
  onClose,
  onInvite,
  pending = false,
}: InviteMemberModalProps) {
  const formRef = useRef<InviteFormHandle>(null);

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title="Invite Member"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => formRef.current?.submit()} loading={pending}>
            Send Invite
          </Button>
        </>
      }
    >
      <InviteForm
        ref={formRef}
        scope="org"
        hideSubmit
        pending={pending}
        onSubmit={onInvite}
      />
    </Modal>
  );
}
