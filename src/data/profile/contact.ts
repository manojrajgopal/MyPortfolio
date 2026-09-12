import type { ContactChannel } from '@/types/profile';

/**
 * Verified channels come straight from the résumé.
 * Profile URLs were not supplied, so they are declared as explicit placeholders
 * rather than invented. Fill in `href` and drop `placeholder` to activate one.
 */
export const contactChannels: readonly ContactChannel[] = [
  {
    id: 'email',
    label: 'Email',
    value: 'manojraj15@hotmail.com',
    href: 'mailto:manojraj15@hotmail.com',
    kind: 'email',
  },
  {
    id: 'phone',
    label: 'Phone',
    value: '+91 8951663446',
    href: 'tel:+918951663446',
    kind: 'phone',
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    value: 'Profile link pending',
    href: null,
    kind: 'link',
    placeholder: true,
  },
  {
    id: 'github',
    label: 'GitHub',
    value: 'Profile link pending',
    href: null,
    kind: 'link',
    placeholder: true,
  },
  {
    id: 'portfolio',
    label: 'Portfolio',
    value: 'Profile link pending',
    href: null,
    kind: 'link',
    placeholder: true,
  },
  {
    id: 'hackerrank',
    label: 'HackerRank',
    value: 'Profile link pending',
    href: null,
    kind: 'link',
    placeholder: true,
  },
] as const;

export const primaryEmail = 'manojraj15@hotmail.com';
export const primaryPhone = '+91 8951663446';
export const baseLocation = 'Bangalore, India';
