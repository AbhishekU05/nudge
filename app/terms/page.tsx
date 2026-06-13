import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import Link from "next/link";
import { Container } from "@/components/site/container";
import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms of service for Duely, the collections management platform for freelancers and agencies.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />

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
              <h2 className="text-xl font-semibold text-zinc-50 mt-8 mb-4">5. Third Party Integrations</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>Duely connects to Xero, QuickBooks, and Gmail only with explicit user permission via each service's official OAuth flow.</li>
                <li>Duely only requests the minimum permissions needed to operate each feature.</li>
                <li>Users are responsible for ensuring they have the right to connect these accounts.</li>
                <li>All third party tokens are stored encrypted.</li>
                <li>Tokens are permanently deleted when the user disconnects the integration or deletes their account.</li>
                <li>Duely is not responsible for any changes, outages, or pricing changes made by Xero, QuickBooks, or Google that affect integration functionality.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-zinc-50 mt-8 mb-4">6. Termination</h2>
              <p>
                We reserve the right to suspend or terminate your access to Duely at any time, for any reason, including violation of these terms. Upon termination, your right to use the service will immediately cease.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-zinc-50 mt-8 mb-4">7. Contact Us</h2>
              <p>
                If you have any questions about these Terms, please contact us at <a href="mailto:support@duely.in" className="text-zinc-50 hover:underline">support@duely.in</a>.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-zinc-50 mt-8 mb-4">8. Changes to Terms</h2>
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

      <SiteFooter />
    </div>
  );
}
