import type { ContactChannel } from '@/types/profile';

/**
 * Every channel here is verified and live.
 *
 * The `placeholder` flag on `ContactChannel` stays in the type for any future
 * profile that is announced before its URL exists — the UI renders such an
 * entry as pending rather than inventing a link.
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
    value: 'linkedin.com/in/manoj-r-8767ba25a',
    href: 'https://www.linkedin.com/in/manoj-r-8767ba25a/',
    kind: 'link',
  },
  {
    id: 'github',
    label: 'GitHub',
    value: 'github.com/manojrajgopal',
    href: 'https://github.com/manojrajgopal',
    kind: 'link',
  },
] as const;

export const primaryEmail = 'manojraj15@hotmail.com';
export const primaryPhone = '+91 8951663446';
export const baseLocation = 'Bangalore, India';
