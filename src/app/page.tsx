import Link from 'next/link';
import { Button } from '@/components/ui';

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      {/* Hero Section */}
      <div className="text-center max-w-2xl mx-auto">
        {/* Logo/Icon */}
        <div className="mb-8">
          <span className="text-6xl">📄</span>
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-bold text-[var(--text-primary)] mb-4">
          იდეის პასპორტი
        </h1>

        {/* Subtitle */}
        <p className="text-xl text-[var(--text-secondary)] mb-8">
          AI-ით მართული ბიზნეს გეგმის შემფასებელი
        </p>

        {/* Description */}
        <p className="text-[var(--text-secondary)] mb-12 leading-relaxed">
          გამარჯობა! მე ვარ <span className="font-semibold text-[var(--accent-hot)]">გიორგი</span> -
          შენი AI ბიზნეს მენტორი. ერთად შევქმნით შენი იდეის პასპორტს,
          რომელიც დაგეხმარება ბიზნეს გეგმის ჩამოყალიბებაში.
        </p>

        {/* CTA Button */}
        <Link href="/session">
          <Button size="lg" className="text-lg px-8 py-4">
            🚀 დავიწყოთ
          </Button>
        </Link>

        {/* Features */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="text-3xl mb-3">🎯</div>
            <h3 className="font-semibold mb-2">პერსონალიზებული</h3>
            <p className="text-sm text-[var(--text-secondary)]">
              შენს გამოცდილებაზე მორგებული კითხვები
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="text-3xl mb-3">🧠</div>
            <h3 className="font-semibold mb-2">ჭკვიანი AI</h3>
            <p className="text-sm text-[var(--text-secondary)]">
              იმახსოვრებს და აანალიზებს პასუხებს
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="text-3xl mb-3">📋</div>
            <h3 className="font-semibold mb-2">PDF ექსპორტი</h3>
            <p className="text-sm text-[var(--text-secondary)]">
              გადმოწერე მზა ბიზნეს დოკუმენტი
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-16 text-center text-sm text-[var(--text-muted)]">
        <p>შექმნილია Cofounder.ge-ს მიერ</p>
      </footer>
    </main>
  );
}
