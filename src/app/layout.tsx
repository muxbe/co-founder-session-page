import type { Metadata } from 'next';
import { Noto_Sans_Georgian, Patrick_Hand } from 'next/font/google';
import './globals.css';

// Georgian font for main text
const notoGeorgian = Noto_Sans_Georgian({
  variable: '--font-noto-georgian',
  subsets: ['georgian', 'latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

// Handwriting font for playful elements
const patrickHand = Patrick_Hand({
  variable: '--font-patrick-hand',
  subsets: ['latin'],
  weight: ['400'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'იდეის პასპორტი | Idea Passport',
  description: 'AI-ით მართული ბიზნეს გეგმის შემფასებელი - შექმენი შენი იდეის პასპორტი გიორგისთან ერთად',
  keywords: ['ბიზნეს გეგმა', 'სტარტაპი', 'AI', 'იდეის შეფასება', 'საქართველო'],
  authors: [{ name: 'Cofounder.ge' }],
  openGraph: {
    title: 'იდეის პასპორტი | Idea Passport',
    description: 'AI-ით მართული ბიზნეს გეგმის შემფასებელი',
    type: 'website',
    locale: 'ka_GE',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ka">
      <body
        className={`${notoGeorgian.variable} ${patrickHand.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
