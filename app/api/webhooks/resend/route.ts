import { NextResponse } from "next/server";
import { Webhook } from "svix";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { inngest } from "@/lib/inngest/client";
import { getResendClient } from "@/lib/resend";

export async function POST(req: Request) {
  const payload = await req.text();
  const headers = req.headers;
  const svix_id = headers.get("svix-id");
  const svix_timestamp = headers.get("svix-timestamp");
  const svix_signature = headers.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json({ error: "Missing svix headers" }, { status: 400 });
  }

  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) {
    // If not configured, we'll still parse it, but skipping signature verification is unsafe in prod.
    // For local dev/testing without the secret, we'll just allow it.
    console.warn("RESEND_WEBHOOK_SECRET is not set, skipping signature verification.");
  } else {
    try {
      const wh = new Webhook(secret);
      wh.verify(payload, {
        "svix-id": svix_id,
        "svix-timestamp": svix_timestamp,
        "svix-signature": svix_signature,
      });
    } catch (err) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }
  }

  let event;
  try {
    event = JSON.parse(payload);
  } catch (err) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  // Handle email.bounced
  if (event.type === "email.bounced" || event.type === "email.complained" || event.type === "email.failed") {
    const data = event.data;
    if (!data || !data.to || !Array.isArray(data.to)) {
      return NextResponse.json({ success: true }); // Ignore if no 'to' array
    }

    const supabase = createSupabaseAdminClient();

    for (const email of data.to) {
      const emailStr = String(email).trim().toLowerCase();
      if (!emailStr) continue;

      console.log(`[Resend Webhook] Email ${event.type} for ${emailStr}, pausing active automations...`);

      // 1. Find and pause active client automations with this email
      const { data: clients } = await supabase
        .from("clients")
        .select("id, organization_id")
        .eq("email", emailStr)
        .eq("active", true);

      if (clients && clients.length > 0) {
        for (const c of clients) {
          await supabase.from("clients").update({ active: false }).eq("id", c.id);
          await inngest.send({
            name: "automation.disabled",
            data: { entityId: c.id, entityType: "client", organizationId: c.organization_id }
          });
        }
      }

      // Find and pause active invoice automations for this email. Invoices
      // have no email of their own (there is no recipient_email column on
      // invoices) - the target address always comes via the linked client.
      const { data: clientInvoices } = await supabase
        .from("invoices")
        .select("id, organization_id, clients!inner(email)")
        .eq("clients.email", emailStr)
        .eq("reminders_enabled", true);

      if (clientInvoices && clientInvoices.length > 0) {
         for (const i of clientInvoices) {
           await supabase.from("invoices").update({ reminders_enabled: false }).eq("id", i.id);
           await inngest.send({
             name: "automation.disabled",
             data: { entityId: i.id, entityType: "invoice", organizationId: i.organization_id }
           });
         }
      }
      // Notify organization admins of the bounce. Every invoice's email
      // comes from its linked client (see above - invoices have no email
      // column of their own), so orgs reached via clients already covers
      // every affected invoice too.
      const affectedOrgs = new Set<string>();

      const { data: orgClients } = await supabase.from("clients").select("organization_id").eq("email", emailStr);
      orgClients?.forEach(c => affectedOrgs.add(c.organization_id));

      if (affectedOrgs.size > 0) {
        const resend = getResendClient();
        for (const orgId of Array.from(affectedOrgs)) {
           const { data: members } = await supabase.from("organization_members").select("user_id").eq("organization_id", orgId).in("role", ["owner", "admin"]);
           if (members) {
              for (const member of members) {
                 const { data: { user } } = await supabase.auth.admin.getUserById(member.user_id);
                 if (user && user.email) {
                    let subject = `[Action Required] Automations Paused Due to Email Bounce`;
                    let reasonText = `a bounce or delivery failure report`;
                    let resolutionText = `Please update the client's email address in your dashboard and re-enable the automation when corrected.`;

                    if (event.type === "email.complained") {
                       subject = `[Action Required] Automations Paused - Marked as Spam`;
                       reasonText = `a spam complaint`;
                       resolutionText = `Because the client marked your reminder as spam, we strongly recommend reaching out to them directly to resolve the issue before ever re-enabling automated emails to this address.`;
                    }

                    await resend.emails.send({
                       from: "Duely Alerts <alerts@duely.in>",
                       to: user.email,
                       subject: subject,
                       html: `<p>Hello,</p><p>We received ${reasonText} for the email address <strong>${emailStr}</strong>. To protect your email reputation, we have automatically paused all active invoice and client automations targeting this address.</p><p>${resolutionText}</p><p>Best,<br/>The Duely Team</p>`
                    });
                 }
              }
           }
        }
      }
    }
  }

  return NextResponse.json({ success: true });
}
