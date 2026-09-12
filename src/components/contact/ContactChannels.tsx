'use client';

import { useCallback, useState } from 'react';
import { ArrowUpRight, Check, Copy } from 'lucide-react';
import { contactChannels } from '@/data/profile/contact';
import styles from './ContactChannels.module.css';

/** `mailto:` and `tel:` hand off to the OS; anything else leaves the site. */
function isExternal(href: string): boolean {
  return /^https?:/i.test(href);
}

/**
 * The channels, as a list of records.
 *
 * Links that exist are links. A channel declared without a URL is shown as
 * pending rather than invented — an empty slot is more honest than a guess at
 * someone's profile address.
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
            <a
              className={styles.value}
              href={channel.href}
              // Profile links leave the site; mail and phone hand off to the
              // operating system and must stay in place.
              {...(isExternal(channel.href)
                ? { target: '_blank', rel: 'noreferrer noopener' }
                : {})}
            >
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
          ) : channel.href ? (
            <span className={styles.visit} aria-hidden="true">
              <span className="type-meta">Visit</span>
              <ArrowUpRight size={13} />
            </span>
          ) : (
            <span className="type-meta">Pending</span>
          )}
        </li>
      ))}
    </ul>
  );
}
