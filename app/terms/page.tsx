import Link from "next/link";
import { Container } from "@/components/site/container";
import Image from "next/image";

export default function TermsPage() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-xl">
        <Container className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo.svg"
              width={32}
              height={32}
              alt="Duely Logo"
              className="h-8 w-8 rounded-md"
            />
            <span className="text-2xl font-semibold tracking-tight text-zinc-50">Duely</span>
          </Link>
        </Container>
      </header>

      <main className="flex-1 py-16">
        <Container className="max-w-3xl">
          <h1 className="text-4xl font-semibold tracking-[-0.04em] text-zinc-50 sm:text-5xl mb-8">
            Terms of Service
          </h1>
          
          <div className="prose prose-invert max-w-none text-zinc-400 space-y-6">
            <p>
              Welcome to Duely. By using Duely, you agree to these terms. Please read them carefully.
            </p>

            <div>
              <h2 className="text-xl font-semibold text-zinc-50 mt-8 mb-4">1. Description of Service</h2>
              <p>
                Duely provides a software-as-a-service (SaaS) platform that allows users to create and send automated, recurring payment reminder emails to collect money owed.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-zinc-50 mt-8 mb-4">2. User Responsibilities</h2>
              <p>
                You agree to use Duely responsibly. You must not use our service to send spam, harass others, or send deceptive or malicious emails. Accounts found abusing the service or generating high complaint rates will be suspended or terminated immediately without refund. You are solely responsible for the content and recipients of the emails you send using Duely. You must have a legitimate reason to contact recipients and comply with applicable laws.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-zinc-50 mt-8 mb-4">3. Payment Terms</h2>
              <p>
                Duely is a paid subscription service. Billing is handled securely through Razorpay. By subscribing, you agree to recurring billing based on your selected plan. You may cancel your subscription at any time through your dashboard. No refunds are provided for partial billing periods.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-zinc-50 mt-8 mb-4">4. Limitation of Liability</h2>
              <p>
                Duely is provided &quot;as is&quot; without any warranties, express or implied. We do not guarantee email delivery, timing, or recipient response. Duely is a tool to assist with follow-ups, not a guarantee of payment.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-zinc-50 mt-8 mb-4">5. Termination</h2>
              <p>
                We reserve the right to suspend or terminate your access to Duely at any time, for any reason, including violation of these terms. Upon termination, your right to use the service will immediately cease.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-zinc-50 mt-8 mb-4">6. Contact Us</h2>
              <p>
                If you have any questions about these Terms, please contact us at <a href="mailto:support@duely.in" className="text-zinc-50 hover:underline">support@duely.in</a>.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-zinc-50 mt-8 mb-4">7. Changes to Terms</h2>
              <p>
                We may update these Terms from time to time. Continued use of Duely after changes means you accept the updated Terms.
              </p>
            </div>

            <p className="pt-4 text-sm">
              These Terms are governed by the laws of India.
            </p>
          </div>
        </Container>
      </main>

      <footer className="border-t border-border">
        <Container className="flex flex-col sm:flex-row items-center justify-between gap-4 py-8 text-sm text-zinc-600">
          <div>© {new Date().getFullYear()} Duely. All rights reserved.</div>
          <div className="flex items-center gap-4">
            <Link href="/terms" className="hover:text-zinc-300 transition-colors">Terms</Link>
            <span>·</span>
            <Link href="/privacy" className="hover:text-zinc-300 transition-colors">Privacy</Link>
            <span>·</span>
            <div className="flex items-center gap-1.5">
              <span>Contact us:</span>
              <a href="mailto:support@duely.in" className="font-medium text-zinc-400 hover:text-zinc-100 transition-colors">
                support@duely.in
              </a>
            </div>
          </div>
        </Container>
      </footer>
    </div>
  );
}
