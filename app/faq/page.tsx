import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, HelpCircle, Mail, ShieldCheck } from "lucide-react";

import { Container } from "@/components/site/container";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const faqs = [
  {
    question: "What is Duely for?",
    answer:
      "Duely helps freelancers, agencies, and service businesses track unpaid customer balances, log partial payments, record promises, and follow up professionally.",
  },
  {
    question: "Is Duely an accounting system?",
    answer:
      "No. Duely is intentionally lighter than accounting software. It focuses on the post-invoice workflow: who owes what, what has been paid, what was promised, and when to follow up.",
  },
  {
    question: "Can I log partial payments?",
    answer:
      "Yes. You can record each payment amount against a customer and see the payment history with the timestamp for every logged payment.",
  },
  {
    question: "What happens when a customer clicks \"I've paid\"?",
    answer:
      "Duely marks the customer as customer-confirmed paid and stops active reminders. The dashboard shows that differently from a payment you marked as paid yourself.",
  },
  {
    question: "Can I edit reminder emails?",
    answer:
      "Yes. Tone templates give you a starting point, and the message text is editable before automation is enabled.",
  },
  {
    question: "How often can reminders be sent?",
    answer:
      "Automated reminders are capped to at least one day apart. Every reminder includes a clean unsubscribe path so customers can opt out.",
  },
  {
    question: "Do I need a payment link?",
    answer:
      "No. Payment links are optional. If you add one, Duely includes a Pay now button in the reminder email.",
  },
  {
    question: "Can I use Duely without automation?",
    answer:
      "Yes. You can use Duely purely as a collections tracker for balances, notes, promises, and payment history. Automation is a backup workflow.",
  },
];

export default function FAQPage() {
  return (
    <div className="flex min-h-screen flex-col">
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
            <span className="text-2xl font-semibold tracking-tight text-zinc-50">
              Duely
            </span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-100"
          >
            <ArrowLeft className="h-4 w-4" />
            Home
          </Link>
        </Container>
      </header>

      <main className="flex-1">
        <Container className="py-14 sm:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="default" className="gap-1.5">
              <HelpCircle className="h-3 w-3" />
              FAQ
            </Badge>
            <h1 className="mt-6 text-5xl font-semibold tracking-[-0.055em] text-zinc-50 sm:text-6xl">
              Common questions about Duely.
            </h1>
            <p className="mt-5 text-base leading-7 text-zinc-500">
              Short answers for how Duely handles payment tracking, reminders,
              customer confirmations, and billing.
            </p>
          </div>

          <div className="mx-auto mt-12 grid max-w-5xl gap-3 md:grid-cols-2">
            {faqs.map((faq) => (
              <Card key={faq.question} className="bg-white/[0.03]">
                <CardContent className="p-5">
                  <h2 className="text-base font-semibold text-zinc-50">
                    {faq.question}
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-zinc-500">
                    {faq.answer}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mx-auto mt-12 grid max-w-5xl gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
              <CheckCircle2 className="h-5 w-5 text-emerald-300" />
              <p className="mt-4 text-sm font-medium text-zinc-200">
                Payment history stays visible.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
              <ShieldCheck className="h-5 w-5 text-indigo-300" />
              <p className="mt-4 text-sm font-medium text-zinc-200">
                Reminders are respectful by design.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
              <Mail className="h-5 w-5 text-amber-300" />
              <p className="mt-4 text-sm font-medium text-zinc-200">
                Customers can confirm they paid.
              </p>
            </div>
          </div>
        </Container>
      </main>
    </div>
  );
}
