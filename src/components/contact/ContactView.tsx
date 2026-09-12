'use client';

import dynamic from 'next/dynamic';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { personal } from '@/data/profile/personal';
import { baseLocation } from '@/data/profile/contact';
import { enterDelay } from '@/lib/motion/timelines';
import { CustomCursor } from '@/components/cursor/CustomCursor';
import { ContactChannels } from './ContactChannels';
import { ContactForm } from './ContactForm/ContactForm';
import styles from './ContactView.module.css';

const ContactScene = dynamic(
  () => import('./ContactScene/ContactScene').then((module) => module.ContactScene),
  { ssr: false },
);

/**
 * The contact route.
 *
 * It opens the way the film closes — a statement first, the details after.
 * The beacon turning behind it is the same object language as the hero
 * artifact, so arriving here does not feel like leaving the world.
 */
export function ContactView(): React.JSX.Element {
  return (
    <>
      <CustomCursor />
      <ContactScene />
      <div className="atmosphere" aria-hidden="true" />
      <div className="vignette" aria-hidden="true" />

      <main id="main" className={styles.page}>
        <header className={`${styles.head} enter`} style={enterDelay(0)}>
          <Link prefetch={false} href="/" className={styles.back}>
            <ArrowLeft size={14} aria-hidden="true" />
            <span className="type-meta type-meta--wide">Back to the experience</span>
          </Link>
        </header>

        <div className={styles.grid}>
          <section className="stack enter" style={enterDelay(1)}>
            <h1 className="type-display">
              Let&rsquo;s build
              <br />
              <span className="type-serif">something.</span>
            </h1>
            <p className="type-lede">
              Open to roles and collaborations where backend engineering meets AI.
            </p>
            <p className="type-meta">
              {personal.name} — {baseLocation}
            </p>

            <ContactChannels />
          </section>

          <section className="stack enter" style={enterDelay(2)}>
            <p className="type-meta type-meta--wide champagne">Write a message</p>
            <ContactForm />
          </section>
        </div>
      </main>
    </>
  );
}
