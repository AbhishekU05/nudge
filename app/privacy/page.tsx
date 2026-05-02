import Link from "next/link";
import { Container } from "@/components/site/container";
import Image from "next/image";

export default function PrivacyPage() {
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
            Privacy Policy
          </h1>
          
          <div className="prose prose-invert max-w-none text-zinc-400 space-y-6">
            <p>
              At Duely, we respect your privacy and are committed to protecting your personal data. This policy outlines what we collect and how we use it.
            </p>

            <div>
              <h2 className="text-xl font-semibold text-zinc-50 mt-8 mb-4">1. Data We Collect</h2>
              <p className="mb-2">We collect basic information required to provide our service. This includes:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Account Data:</strong> Your email address when you sign up.</li>
                <li><strong>Reminder Data:</strong> The recipient names, email addresses, amounts, and optional messages you enter to create reminders.</li>
                <li><strong>Usage Data:</strong> Basic logs of how you interact with our application to help us improve the service.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-zinc-50 mt-8 mb-4">2. How We Use Your Data</h2>
              <p>
                We use your data strictly to operate and maintain Duely. Specifically, we use it to authenticate you, send payment reminders on your behalf, and provide customer support. We do not sell or share your data with advertisers.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-zinc-50 mt-8 mb-4">3. Third-Party Services</h2>
              <p className="mb-2">We use trusted third-party providers to run our infrastructure:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Supabase:</strong> For secure database storage and user authentication.</li>
                <li><strong>Resend:</strong> For reliable email delivery of your reminders.</li>
                <li><strong>Razorpay:</strong> For secure payment processing. We do not store your credit card details on our servers.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-zinc-50 mt-8 mb-4">4. Data Retention</h2>
              <p>
                We retain your data for as long as your account is active. If you delete your account, we will remove your personal data and the reminder data you created from our active databases.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-zinc-50 mt-8 mb-4">5. Your Rights</h2>
              <p>
                You have the right to access, update, or delete your personal information. You can manage your data within your dashboard or contact us directly to request data deletion.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-zinc-50 mt-8 mb-4">6. Contact Us</h2>
              <p>
                If you have any questions about this Privacy Policy, please contact us at <a href="mailto:support@duely.in" className="text-zinc-50 hover:underline">support@duely.in</a>.
              </p>
            </div>
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
