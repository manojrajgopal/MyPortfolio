'use client';

import { useCallback, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { contactChannels } from '@/data/profile/contact';
import styles from './ContactChannels.module.css';

/**
 * The channels, as a list of records.
 *
 * Links that exist are links. Links that were never supplied are shown as
 * pending rather than invented — an empty slot is more honest than a guess
 * at someone's profile URL.
 */
export function ContactChannels(): React.JSX.Element {
  const [copied, setCopied] = useState<string | null>(null);

  const copy = useCallback(async (id: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(id);
      window.setTimeout(() => setCopied((current) => (current === id ? null : current)), 1800);
    } catch {
      // Clipboard access can be refused; the value stays selectable on screen.
      setCopied(null);
    }
  }, []);

  return (
    <ul className={styles.channels}>
      {contactChannels.map((channel) => (
        <li key={channel.id} className={styles.channel} data-pending={channel.placeholder ?? false}>
          <span className="type-meta">{channel.label}</span>

          {channel.href ? (
            <a className={styles.value} href={channel.href}>
              {channel.value}
            </a>
          ) : (
            <span className={styles.value}>{channel.value}</span>
          )}

          {channel.kind !== 'link' ? (
            <button
              type="button"
              className={styles.copy}
              onClick={() => void copy(channel.id, channel.value)}
              aria-label={`Copy ${channel.label.toLowerCase()}`}
            >
              {copied === channel.id ? (
                <Check size={13} aria-hidden="true" />
              ) : (
                <Copy size={13} aria-hidden="true" />
              )}
              <span className="type-meta">{copied === channel.id ? 'Copied' : 'Copy'}</span>
            </button>
          ) : (
            <span className="type-meta">{channel.placeholder ? 'Pending' : ''}</span>
          )}
        </li>
      ))}
    </ul>
  );
}
