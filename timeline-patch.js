/* eslint-disable */
const fs = require('fs');
const file = 'components/site/customer-details.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add "timeline" to Tab type
content = content.replace(
  'type Tab = "payment" | "promise" | "followup" | "notes" | "automation";',
  'type Tab = "timeline" | "payment" | "promise" | "followup" | "notes" | "automation";'
);

// 2. Add the TimelineTab component before CustomerDetails
const timelineTabCode = `
// ---------------------------------------------------------------------------
// Timeline tab
// ---------------------------------------------------------------------------
function TimelineTab({ customer }: { customer: CustomerRecord }) {
  type ActivityItem = {
    id: string;
    label: string;
    sub?: string;
    at: string;
    tone: "success" | "warning" | "muted" | "primary" | "default";
    icon?: React.ElementType;
  };

  const entries: ActivityItem[] = [];

  // 1. Paid events
  if (customer.client_paid_at) {
    entries.push({
      id: \`\${customer.id}-paid-client\`,
      label: "Marked paid by customer",
      at: customer.client_paid_at,
      tone: "success",
      icon: CheckCircle2,
    });
  } else if (customer.workflow_status === "paid") {
    entries.push({
      id: \`\${customer.id}-paid-you\`,
      label: "Marked paid by you",
      at: customer.updated_at,
      tone: "success",
      icon: CheckCircle2,
    });
  }

  // 2. Promise events
  if (customer.promised_date) {
    entries.push({
      id: \`\${customer.id}-promised\`,
      label: "Payment promised",
      sub: \`Promised by \${new Date(customer.promised_date).toLocaleDateString()}\${customer.promise_notes ? \` - \${customer.promise_notes}\` : ''}\`,
      at: customer.updated_at,
      tone: "primary",
      icon: Clock,
    });
  }

  // 3. Reminders sent
  if (customer.last_sent_at) {
    entries.push({
      id: \`\${customer.id}-sent\`,
      label: "Automated reminder sent",
      at: customer.last_sent_at,
      tone: "muted",
      icon: Zap,
    });
  }

  // 4. Payment History (manual partial payments)
  for (const payment of customer.payment_history ?? []) {
    entries.push({
      id: \`\${payment.id}-payment\`,
      label: "Payment logged",
      sub: formatCurrency(Number(payment.amount), payment.currency),
      at: payment.created_at,
      tone: "success",
      icon: ReceiptText,
    });
  }

  // 5. Followup History
  for (const followup of customer.followup_history ?? []) {
    entries.push({
      id: \`\${followup.id}-followup\`,
      label: \`Follow-up: \${followup.method}\`,
      sub: \`Outcome: \${followup.outcome}\${followup.note ? \` - \${followup.note}\` : ''}\`,
      at: followup.created_at,
      tone: "default",
      icon: MessageSquare,
    });
  }

  // 6. Creation date
  entries.push({
    id: \`\${customer.id}-created\`,
    label: "Customer added",
    at: customer.created_at,
    tone: "muted",
  });

  const sorted = entries.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  const dotColors = {
    success: "bg-emerald-400 text-emerald-400 border-emerald-400/20",
    warning: "bg-red-400 text-red-400 border-red-400/20",
    primary: "bg-indigo-400 text-indigo-400 border-indigo-400/20",
    default: "bg-blue-400 text-blue-400 border-blue-400/20",
    muted: "bg-zinc-500 text-zinc-500 border-zinc-500/20",
  };

  return (
    <div className="space-y-4">
      <Section title="Activity Timeline">
        <div className="relative border-l border-white/10 ml-3 pl-6 space-y-6 py-2">
          {sorted.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.id} className="relative">
                <div className={cn("absolute -left-[30px] top-1 h-3 w-3 rounded-full border-2 bg-background", dotColors[item.tone])} />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-zinc-200">{item.label}</p>
                    {Icon && <Icon className={cn("h-3.5 w-3.5", dotColors[item.tone].split(" ")[1])} />}
                  </div>
                  {item.sub && <p className="mt-0.5 text-sm text-zinc-400">{item.sub}</p>}
                  <p className="mt-1 text-xs text-zinc-600">
                    {new Date(item.at).toLocaleString()}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </Section>
    </div>
  );
}

// ---------------------------------------------------------------------------
`;
content = content.replace(
  '// ---------------------------------------------------------------------------\n// Main drawer component\n// ---------------------------------------------------------------------------',
  timelineTabCode + '// Main drawer component\n// ---------------------------------------------------------------------------'
);

// 3. Add TabButton for Timeline
content = content.replace(
  '<TabButton\n            active={tab === "payment"}\n            onClick={() => setTab("payment")}',
  `<TabButton
            active={tab === "timeline"}
            onClick={() => setTab("timeline")}
            icon={History}
            label="Timeline"
          />
          <TabButton
            active={tab === "payment"}
            onClick={() => setTab("payment")}`
);

// 4. Render TimelineTab
content = content.replace(
  '{tab === "payment" && <PaymentTab customer={customer} />}',
  '{tab === "timeline" && <TimelineTab customer={customer} />}\n            {tab === "payment" && <PaymentTab customer={customer} />}'
);

// 5. Change defaultTab to "timeline"
content = content.replace(
  'initialTab = "payment",',
  'initialTab = "timeline",'
);

fs.writeFileSync(file, content);
