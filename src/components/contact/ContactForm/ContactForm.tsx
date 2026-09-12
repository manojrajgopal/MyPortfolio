'use client';

import { useMemo, useState } from 'react';
import { primaryEmail } from '@/data/profile/contact';
import { CinematicButton } from '@/components/ui/Button/CinematicButton';
import styles from './ContactForm.module.css';

/**
 * A message composer, not a form submission.
 *
 * This site has no backend, so nothing here pretends to send anything. The
 * fields compose a `mailto:` link and hand it to the visitor's own mail
 * client — which is stated plainly underneath rather than hidden behind a
 * fake success message.
 */
export function ContactForm(): React.JSX.Element {
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const href = useMemo(() => {
    const line = subject.trim() || 'Hello Manoj';
    const signature = name.trim() ? `\n\n— ${name.trim()}` : '';
    const bodyText = `${message.trim()}${signature}`;
    return `mailto:${primaryEmail}?subject=${encodeURIComponent(line)}&body=${encodeURIComponent(
      bodyText,
    )}`;
  }, [message, name, subject]);

  return (
    <form
      className={styles.form}
      // The mailto link is the action; there is nothing to intercept.
      onSubmit={(event) => event.preventDefault()}
    >
      <div className={styles.field}>
        <label className="type-meta" htmlFor="contact-name">
          Name
        </label>
        <input
          id="contact-name"
          className={styles.input}
          value={name}
          onChange={(event) => setName(event.target.value)}
          autoComplete="name"
          placeholder="Who is writing"
        />
      </div>

      <div className={styles.field}>
        <label className="type-meta" htmlFor="contact-subject">
          Subject
        </label>
        <input
          id="contact-subject"
          className={styles.input}
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
          placeholder="What this is about"
        />
      </div>

      <div className={styles.field}>
        <label className="type-meta" htmlFor="contact-message">
          Message
        </label>
        <textarea
          id="contact-message"
          className={styles.textarea}
          rows={4}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Say as much or as little as you like"
        />
      </div>

      <div className={styles.actions}>
        <CinematicButton href={href}>Open in mail app</CinematicButton>
        <p className="type-meta">
          No server behind this page — the button composes the message in your own mail client.
        </p>
      </div>
    </form>
  );
}
