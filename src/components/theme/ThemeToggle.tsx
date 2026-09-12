'use client';

import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import type { ThemePreference } from '@/lib/theme/themeStore';
import styles from './ThemeToggle.module.css';

const OPTIONS: readonly { value: ThemePreference; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];

/**
 * Three explicit choices rather than a two-state switch.
 *
 * A binary toggle cannot express "follow my system", and that is the option
 * most people actually want — so it is a real segmented control with the
 * current state announced, not a sun that turns into a moon.
 */
export function ThemeToggle(): React.JSX.Element {
  const { preference, setTheme } = useTheme();

  return (
    <div className={styles.toggle} role="group" aria-label="Colour theme">
      {OPTIONS.map((option) => {
        const active = preference === option.value;
        const Icon = option.value === 'light' ? Sun : option.value === 'dark' ? Moon : Monitor;

        return (
          <button
            key={option.value}
            type="button"
            className={styles.option}
            data-active={active}
            aria-pressed={active}
            title={`${option.label} theme`}
            onClick={() => setTheme(option.value)}
          >
            <Icon size={13} aria-hidden="true" />
            <span className="visually-hidden">{option.label} theme</span>
          </button>
        );
      })}
    </div>
  );
}
