import { useState, useEffect } from 'react';
import { Modal, FormInput } from '../components';
import { useMemberStore } from '../stores/useMemberStore';
import { Member } from '../../core/domain/Member';

interface EditMemberModalProps {
  memberId: string;
  onClose: () => void;
}

export function EditMemberModal({ memberId, onClose }: EditMemberModalProps) {
  const member = useMemberStore((s) => s.members.find((m) => m.id === memberId));
  const saveMember = useMemberStore((s) => s.saveMember);
  const [name, setName] = useState('');
  const [shortName, setShortName] = useState('');

  useEffect(() => {
    if (member) {
      setName(member.name);
      setShortName(member.shortName ?? '');
    }
  }, [member]);

  if (!member) return null;

  const handleSave = async () => {
    if (!name.trim()) return;
    const updated = new Member(
      member.id, name.trim(), shortName.trim() || undefined,
      member.email, member.phone, member.avatarUrl, member.isExternal, member.metadata,
      member.createdAt,
    );
    await saveMember(updated);
    onClose();
  };

  return (
    <Modal isOpen onClose={onClose} title="Edit Member" saveLabel="Save" onSave={handleSave}>
      <FormInput label="Name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      <FormInput label="Short Name" value={shortName} onChange={(e) => setShortName(e.target.value)} placeholder="Optional" />
    </Modal>
  );
}
