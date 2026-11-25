/** Keeps the form's submission action and feedback visible outside the scrolling area. */
export function TodoTaskFormFooter({ formId, label, pending, error }: {
  formId: string;
  label: string;
  pending: boolean;
  error: string | null;
}) {
  return (
    <footer className="task-form-footer">
      {error && <p className="error-message" role="alert">{error}</p>}
      <button type="submit" className="primary-button" form={formId} disabled={pending}>{label}</button>
    </footer>
  );
}
