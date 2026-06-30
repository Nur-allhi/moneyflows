import type { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes, ReactNode } from 'react';
import styles from './FormField.module.css';

interface FormFieldProps {
  label: string;
  error?: string;
  className?: string;
  children?: ReactNode;
}

export function FormField({ label, error, className = '', children }: FormFieldProps) {
  return (
    <div className={`${styles.group} ${className}`}>
      <span className={styles.label}>{label}</span>
      {children}
      {error && <span className={styles.error}>{error}</span>}
    </div>
  );
}

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function FormInput({ label, error, className = '', ...inputProps }: FormInputProps) {
  return (
    <FormField label={label} error={error} className={className}>
      <input className={styles.input} {...inputProps} />
    </FormField>
  );
}

interface FormTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
}

export function FormTextarea({ label, error, className = '', ...textareaProps }: FormTextareaProps) {
  return (
    <FormField label={label} error={error} className={className}>
      <textarea className={`${styles.input} ${styles.textarea}`} {...textareaProps} />
    </FormField>
  );
}

interface FormSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
}

export function FormSelect({ label, error, className = '', children, ...selectProps }: FormSelectProps) {
  return (
    <FormField label={label} error={error} className={className}>
      <div className={styles.selectWrapper}>
        <select className={`${styles.input}`} {...selectProps}>
          {children}
        </select>
      </div>
    </FormField>
  );
}

interface AmountInputProps {
  label: string;
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  error?: string;
  className?: string;
}

export function AmountInput({ label, value, onChange, placeholder = '0.00', error, className = '' }: AmountInputProps) {
  return (
    <FormField label={label} error={error} className={className}>
      <div className={styles.amountWrap}>
        <span className={styles.amountCurrency}>BDT</span>
        <input
          className={styles.amountInput}
          type="text"
          inputMode="decimal"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
        />
      </div>
    </FormField>
  );
}
