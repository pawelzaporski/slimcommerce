'use client';

import { useState, type FormEvent } from 'react';

/** Zapis do newslettera - tylko warstwa UI (API nie ma jeszcze takiego endpointu). */
export default function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!email.trim()) return;
    setDone(true);
  }

  if (done) {
    return (
      <p className="rounded-2xl bg-white/70 px-5 py-4 text-sm font-semibold text-ink">
        Dziękujemy! Zapis do newslettera zostanie potwierdzony e-mailem.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-3 sm:flex-row">
      <input
        type="email"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="Twój adres e-mail"
        aria-label="Adres e-mail"
        className="field flex-1 rounded-full px-5"
      />
      <button type="submit" className="btn btn-brand">
        Zapisz się
      </button>
    </form>
  );
}
