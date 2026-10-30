/** Preserves the public HTTP status for session recovery decisions. */
export class ApiRequestError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
    this.name = 'ApiRequestError';
  }
}
