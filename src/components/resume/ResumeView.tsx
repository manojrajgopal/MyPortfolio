'use client';

import Link from 'next/link';
import { ArrowLeft, Printer } from 'lucide-react';
import { personal } from '@/data/profile/personal';
import { summary } from '@/data/profile/summary';
import { contactChannels } from '@/data/profile/contact';
import { experiences } from '@/data/experience/experience';
import { projects } from '@/data/projects/projects';
import { skillGroups } from '@/data/skills/skills';
import { education } from '@/data/education/education';
import { certifications } from '@/data/certifications/certifications';
import { primaryAchievement } from '@/data/achievements/achievements';
import { languages } from '@/data/languages/languages';
import { enterDelay } from '@/lib/motion/timelines';
import { CustomCursor } from '@/components/cursor/CustomCursor';
import { TokenList } from '@/components/ui/TokenList/TokenList';
import styles from './ResumeView.module.css';

/**
 * The full record, in one readable document.
 *
 * The main experience is deliberately sparing with text; this page is the
 * opposite, and exists so nothing has to be hunted for. It carries a print
 * stylesheet, so "save as PDF" produces a clean single document — no
 * pre-generated file is claimed to exist that does not.
 */
export function ResumeView(): React.JSX.Element {
  return (
    <>
      <CustomCursor />
      <div className={styles.backdrop} aria-hidden="true" />

      <main id="main" className={styles.page}>
        <header className={`${styles.head} enter`} style={enterDelay(0)}>
          <Link href="/" className={styles.back}>
            <ArrowLeft size={14} aria-hidden="true" />
            <span className="type-meta type-meta--wide">Back to the experience</span>
          </Link>

          <button type="button" className="btn" onClick={() => window.print()}>
            <Printer size={13} aria-hidden="true" />
            <span>Print / Save as PDF</span>
          </button>
        </header>

        <section className={`${styles.masthead} enter`} style={enterDelay(1)}>
          <h1 className="type-display">{personal.name}</h1>
          <p className="type-meta type-meta--wide champagne">{personal.title}</p>
          <ul className={styles.contactRow}>
            {contactChannels
              .filter((channel) => !channel.placeholder)
              .map((channel) => (
                <li key={channel.id}>
                  {channel.href ? (
                    <a href={channel.href} className="type-meta">
                      {channel.value}
                    </a>
                  ) : (
                    <span className="type-meta">{channel.value}</span>
                  )}
                </li>
              ))}
            <li>
              <span className="type-meta">{personal.location}</span>
            </li>
          </ul>
        </section>

        <Block title="Summary" index="01" order={2}>
          <p className="type-body" style={{ maxWidth: '70ch' }}>
            {summary.full}
          </p>
        </Block>

        <Block title="Experience" index="02" order={3}>
          {experiences.map((entry) => (
            <article key={entry.id} className={styles.entry}>
              <div className={styles.entryAside}>
                <p className="type-meta tabular">{entry.period}</p>
                <p className="type-meta">
                  {entry.mode} — {entry.location}
                </p>
              </div>
              <div className="stack stack--tight">
                <h3 className="type-heading ivory">{entry.role}</h3>
                <p className="type-meta champagne">{entry.company}</p>
                <ul className={styles.bullets}>
                  {entry.responsibilities.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <TokenList items={entry.stack} />
              </div>
            </article>
          ))}
        </Block>

        <Block title="Projects" index="03" order={4}>
          {projects.map((project) => (
            <article key={project.id} className={styles.entry}>
              <div className={styles.entryAside}>
                <p className="type-meta tabular">{project.period}</p>
                {project.metrics[0]?.ratio !== undefined ? (
                  <p className="type-meta copper">{project.metrics[0].value} accuracy</p>
                ) : null}
              </div>
              <div className="stack stack--tight">
                <h3 className="type-heading ivory">{project.title}</h3>
                <p className="type-meta champagne">{project.subtitle}</p>
                <p className="type-body" style={{ maxWidth: '70ch' }}>
                  {project.description}
                </p>
                <TokenList items={project.technologies} upper={false} />
              </div>
            </article>
          ))}
        </Block>

        <Block title="Skills" index="04" order={5}>
          <div className={styles.skills}>
            {skillGroups.map((group) => (
              <div key={group.id} className="stack stack--tight">
                <p className="type-meta type-meta--wide champagne">{group.name}</p>
                <TokenList items={group.nodes.map((node) => node.name)} upper={false} />
              </div>
            ))}
          </div>
        </Block>

        <Block title="Education" index="05" order={6}>
          {education.map((entry) => (
            <article key={entry.id} className={styles.entry}>
              <div className={styles.entryAside}>
                <p className="type-meta tabular">{entry.period}</p>
                <p className="type-meta">{entry.location}</p>
              </div>
              <div className="stack stack--tight">
                <h3 className="type-heading ivory">{entry.qualification}</h3>
                <p className="type-meta champagne">{entry.institution}</p>
              </div>
            </article>
          ))}
        </Block>

        <Block title="Certifications" index="06" order={7}>
          <div className={styles.certifications}>
            {certifications.map((certification) => (
              <article key={certification.id} className="stack stack--tight">
                <p className="type-meta tabular">{certification.date}</p>
                <h3 className="type-heading ivory" style={{ fontSize: 'var(--t-body)' }}>
                  {certification.name}
                </h3>
                <p className="type-meta champagne">{certification.organization}</p>
                <p className="type-body" style={{ fontSize: 'var(--t-small)' }}>
                  {certification.focus}
                </p>
              </article>
            ))}
          </div>
        </Block>

        <Block title="Achievement" index="07" order={8}>
          <article className="stack stack--tight">
            <h3 className="type-heading ivory">{primaryAchievement.name}</h3>
            <p className="type-meta champagne">{primaryAchievement.issuer}</p>
            <p className="type-body">{primaryAchievement.description}</p>
          </article>
        </Block>

        <Block title="Languages" index="08" order={9}>
          <ul className={styles.languages}>
            {languages.map((language) => (
              <li key={language.id}>
                <span className="ivory">{language.language}</span>
                <span className="type-meta">{language.proficiency}</span>
              </li>
            ))}
          </ul>
        </Block>
      </main>
    </>
  );
}

interface BlockProps {
  readonly title: string;
  readonly index: string;
  /** Position in the entrance sequence. */
  readonly order: number;
  readonly children: React.ReactNode;
}

function Block({ title, index, order, children }: BlockProps): React.JSX.Element {
  return (
    <section className={`${styles.block} enter`} style={enterDelay(order)}>
      <header className={styles.blockHead}>
        <span className="type-index tabular">{index}</span>
        <h2 className="type-meta type-meta--wide">{title}</h2>
        <span className="hairline" aria-hidden="true" />
      </header>
      <div className={styles.blockBody}>{children}</div>
    </section>
  );
}
