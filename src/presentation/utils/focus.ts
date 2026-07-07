export function handleFormFocus(e: React.FocusEvent<HTMLElement>): void {
  const target = e.target;
  if (target instanceof HTMLElement && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) {
    setTimeout(() => target.scrollIntoView({ block: 'center', behavior: 'smooth' }), 350);
  }
}
