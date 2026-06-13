import Link from "next/link";
import { Container } from "@/components/site/container";
import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy policy for Duely. Learn how we handle your data, reminders, and payment information.",
  alternates: { canonical: "/privacy" },
};

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
              <p className="mt-4">We may use basic cookies or similar technologies to keep you signed in and improve the product experience.</p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-zinc-50 mt-8 mb-4">2. How We Use Your Data</h2>
              <p>
                We use your data strictly to operate and maintain Duely. Specifically, we use it to authenticate you, send payment reminders on your behalf, and provide customer support. We do not sell or share your data with advertisers. We process reminder content only to deliver emails on your behalf. We do not use this data for advertising or profiling.
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
              <h2 className="text-xl font-semibold text-zinc-50 mt-8 mb-4">4. Third Party Integrations</h2>
              <p className="mb-2">We request permission to connect with external services to provide our core features. Here is how we handle these integrations:</p>
              
              <h3 className="text-lg font-medium text-zinc-50 mt-6 mb-2">Gmail</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Duely requests permission to send emails on your behalf via your Gmail account.</li>
                <li>This permission is only used to send payment reminder emails to your own clients.</li>
                <li>Duely only sends emails, it never reads your inbox.</li>
                <li>Emails are sent only when you set up automated reminders or manually trigger a follow-up.</li>
                <li>Duely stores Google OAuth tokens securely to enable this feature.</li>
                <li>Gmail tokens are deleted when you disconnect the integration or delete your account.</li>
                <li>You can revoke this access at any time from your Google account settings at <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" className="text-zinc-50 hover:underline">myaccount.google.com/permissions</a>.</li>
                <li>Duely does not share Gmail access tokens with any third parties.</li>
              </ul>

              <h3 className="text-lg font-medium text-zinc-50 mt-6 mb-2">Xero</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Duely requests read access to your Xero account to import outstanding invoices.</li>
                <li>Access is only used to sync invoice status and stop reminders when invoices are marked paid in Xero.</li>
                <li>Duely does not read, store, or share any other Xero data.</li>
                <li>Xero OAuth tokens are stored encrypted and deleted when you disconnect the integration or delete your account.</li>
                <li>You can revoke access at any time from the Xero integration settings page.</li>
              </ul>

              <h3 className="text-lg font-medium text-zinc-50 mt-6 mb-2">QuickBooks</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Duely requests read access to your QuickBooks account to import outstanding invoices.</li>
                <li>Access is only used to sync invoice status and stop reminders when invoices are marked paid in QuickBooks.</li>
                <li>Duely does not read, store, or share any other QuickBooks data.</li>
                <li>QuickBooks OAuth tokens are stored encrypted and deleted when you disconnect the integration or delete your account.</li>
                <li>You can revoke access at any time from the QuickBooks integration settings page.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-zinc-50 mt-8 mb-4">5. Data Storage</h2>
              <p className="mb-2">We clarify how we store and manage your security data:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>OAuth tokens are stored encrypted in our database.</li>
                <li>Tokens are only used to send emails on the user&apos;s behalf.</li>
                <li>Tokens are deleted when a user deletes their account.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-zinc-50 mt-8 mb-4">6. Data Retention</h2>
              <p>
                We retain your data for as long as your account is active. If you delete your account, we will delete your personal data from our active systems within a reasonable period, except where retention is required for legal or operational reasons.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-zinc-50 mt-8 mb-4">7. Your Rights</h2>
              <p>
                You have the right to access, update, or delete your personal information. You can manage your data within your dashboard or contact us directly to request data deletion.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-zinc-50 mt-8 mb-4">8. Contact Us</h2>
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
