import { lazy } from 'react';
import type { ComponentType } from 'react';

const TransactionFormModal = lazy(() => import('./TransactionFormModal').then(m => ({ default: m.TransactionFormModal })));
const TransactionDetailModal = lazy(() => import('./TransactionDetailModal').then(m => ({ default: m.TransactionDetailModal })));
const TransactionEditModal = lazy(() => import('./TransactionEditModal').then(m => ({ default: m.TransactionEditModal })));
const DeleteConfirmModal = lazy(() => import('./DeleteConfirmModal').then(m => ({ default: m.DeleteConfirmModal })));
const EditMemberModal = lazy(() => import('./EditMemberModal').then(m => ({ default: m.EditMemberModal })));
const AddAccountModal = lazy(() => import('./AddAccountModal').then(m => ({ default: m.AddAccountModal })));
const EditAccountModal = lazy(() => import('./EditAccountModal').then(m => ({ default: m.EditAccountModal })));
const SettingsModalWrapper = lazy(() => import('./SettingsModalWrapper').then(m => ({ default: m.SettingsModalWrapper })));
const SelectAccountModal = lazy(() => import('./SelectAccountModal').then(m => ({ default: m.SelectAccountModal })));

/**
 * Modal props come from useModalStore as Record<string, unknown> and are spread
 * onto the component by ModalRenderer. Each modal validates its own props, so
 * the registry erases concrete prop types once, here, instead of using `any`.
 */
export const modalRegistry = {
  'transaction-form': TransactionFormModal,
  'transaction-detail': TransactionDetailModal,
  'transaction-edit': TransactionEditModal,
  'delete-confirm': DeleteConfirmModal,
  'edit-member': EditMemberModal,
  'add-account': AddAccountModal,
  'edit-account': EditAccountModal,
  'settings': SettingsModalWrapper,
  'select-account': SelectAccountModal,
} satisfies Record<string, ComponentType<never>>;

export type ModalRegistryKey = keyof typeof modalRegistry;

export function getModalComponent(key: string): ComponentType<Record<string, unknown>> | null {
  const entry = modalRegistry[key as ModalRegistryKey];
  return entry ? (entry as unknown as ComponentType<Record<string, unknown>>) : null;
}
