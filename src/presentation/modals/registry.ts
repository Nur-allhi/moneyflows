import { lazy } from 'react';
import type { ComponentType } from 'react';

const TransactionFormModal = lazy(() => import('./TransactionFormModal').then(m => ({ default: m.TransactionFormModal })));
const TransactionDetailModal = lazy(() => import('./TransactionDetailModal').then(m => ({ default: m.TransactionDetailModal })));
const TransactionEditModal = lazy(() => import('./TransactionEditModal').then(m => ({ default: m.TransactionEditModal })));
const DeleteConfirmModal = lazy(() => import('./DeleteConfirmModal').then(m => ({ default: m.DeleteConfirmModal })));
const EditMemberModal = lazy(() => import('./EditMemberModal').then(m => ({ default: m.EditMemberModal })));
const AddAccountModal = lazy(() => import('./AddAccountModal').then(m => ({ default: m.AddAccountModal })));
const SettingsModalWrapper = lazy(() => import('./SettingsModalWrapper').then(m => ({ default: m.SettingsModalWrapper })));
const SelectAccountModal = lazy(() => import('./SelectAccountModal').then(m => ({ default: m.SelectAccountModal })));

export const modalRegistry: Record<string, ComponentType<any>> = {
  'transaction-form': TransactionFormModal,
  'transaction-detail': TransactionDetailModal,
  'transaction-edit': TransactionEditModal,
  'delete-confirm': DeleteConfirmModal,
  'edit-member': EditMemberModal,
  'add-account': AddAccountModal,
  'settings': SettingsModalWrapper,
  'select-account': SelectAccountModal,
};
