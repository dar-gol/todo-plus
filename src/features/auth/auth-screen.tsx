'use client';

import { FormEvent, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { authApi } from './auth-api';

export function AuthScreen({ onSignedIn }: { onSignedIn: () => void }) {
  const [registering, setRegistering] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setPending(true);
    setError(null);
    try {
      const email = String(data.get('email'));
      const password = String(data.get('password'));
      if (registering) await authApi.register(email, password, String(data.get('name')));
      else await authApi.login(email, password);
      onSignedIn();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Nie udało się zalogować.');
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-card" aria-labelledby="auth-title">
        <div className="brand-mark"><CheckCircle2 aria-hidden="true" /></div>
        <p className="eyebrow">TODO PLUS</p>
        <h1 id="auth-title">Spokojniej. Wszystko na swojej liście.</h1>
        <p className="muted">Zaloguj się tym samym kontem, którego używasz w Kitchen Plus.</p>
        <form onSubmit={submit} className="auth-form">
          {registering && <label>Jak mamy się do Ciebie zwracać?<input name="name" required maxLength={100} autoComplete="name" /></label>}
          <label>Adres e-mail<input name="email" type="email" required autoComplete="email" /></label>
          <label>Hasło<input name="password" type="password" required minLength={8} autoComplete={registering ? 'new-password' : 'current-password'} /></label>
          {error && <p className="error-message" role="alert">{error}</p>}
          <button className="primary-button" disabled={pending}>{pending ? 'Chwileczkę…' : registering ? 'Utwórz wspólne konto' : 'Zaloguj się'}</button>
        </form>
        <button className="text-button" onClick={() => { setRegistering((value) => !value); setError(null); }}>
          {registering ? 'Mam już konto' : 'Nie mam jeszcze konta'}
        </button>
      </section>
    </main>
  );
}
