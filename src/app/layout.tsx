import type { Metadata, Viewport } from 'next';
import { Inter, Instrument_Serif, JetBrains_Mono, Sora } from 'next/font/google';
import { personal } from '@/data/profile/personal';
import { summary } from '@/data/profile/summary';
import { ExperienceProvider } from '@/components/experience/ExperienceProvider';
import { THEME_BOOT_SCRIPT } from '@/lib/theme/themeStore';
import './globals.css';

const display = Sora({
  subsets: ['latin'],
  weight: ['200', '300', '400', '600'],
  variable: '--font-display',
  display: 'swap',
});

const body = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

const serif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: 'italic',
  variable: '--font-serif',
  display: 'swap',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
});

const title = 'Manoj R — Software Engineer | Backend Developer | AI/ML';
const description =
  'Cinematic portfolio of Manoj R, a Bangalore-based software engineer working across ' +
  'Python backends, C# .NET services, AI/ML systems and full-stack delivery.';

export const metadata: Metadata = {
  title: {
    default: title,
    template: '%s — Manoj R',
  },
  description,
  applicationName: 'Manoj R — Portfolio',
  authors: [{ name: personal.name }],
  creator: personal.name,
  keywords: [
    'Manoj R',
    'Software Engineer',
    'Backend Developer',
    'Python',
    'C# .NET',
    'AI/ML',
    'Full Stack Developer',
    'Bangalore',
  ],
  openGraph: {
    type: 'profile',
    title,
    description,
    siteName: 'Manoj R',
    locale: 'en_IN',
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
  },
  robots: { index: true, follow: true },
  icons: {
    icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  // Both, so the browser chrome follows whichever theme is active.
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#08080a' },
    { media: '(prefers-color-scheme: light)', color: '#f2eee6' },
  ],
  colorScheme: 'dark light',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

/**
 * Structured data describing the person the site is about.
 * Everything in it comes from the same static résumé data the UI renders.
 */
const personSchema = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: personal.name,
  jobTitle: 'Software Engineer',
  description: summary.full,
  email: 'mailto:manojraj15@hotmail.com',
  telephone: '+91 8951663446',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Bangalore',
    addressCountry: 'IN',
  },
  knowsLanguage: ['English', 'Kannada', 'Hindi', 'Telugu'],
  knowsAbout: ['Python', 'C# .NET', 'REST APIs', 'TensorFlow', 'NLP', 'React', 'AWS', 'Docker'],
} as const;

export default function RootLayout({
  children,
}: {
  readonly children: React.ReactNode;
}): React.JSX.Element {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${serif.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Sets the theme before first paint. Without it every load shows a
            flash of the wrong palette while React hydrates. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <ExperienceProvider>{children}</ExperienceProvider>
        <script
          type="application/ld+json"
          // Static, author-controlled JSON — no user input reaches this.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
        />
      </body>
    </html>
  );
}
