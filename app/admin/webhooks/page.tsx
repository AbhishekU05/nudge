import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { format } from "date-fns";

export default async function AdminWebhooks() {
  const supabase = createSupabaseAdminClient();

  const { data: webhooks, error } = await supabase
    .from("webhook_events")
    .select("*")
    .order("processed_at", { ascending: false })
    .limit(100);

  if (error) {
    return <div className="text-red-500">Error loading webhooks: {error.message}</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Webhook Ingestion Log</h2>
      <p className="text-gray-600 text-sm">
        Displaying the last 100 webhook events processed by the system (Dodo Payments idempotency log).
      </p>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-medium">
              <tr>
                <th className="px-6 py-4">Event ID</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Processed At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {webhooks?.map((webhook) => (
                <tr key={webhook.id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4 font-mono text-xs text-gray-500">
                    {webhook.id}
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-medium">
                      {webhook.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {webhook.processed_at ? format(new Date(webhook.processed_at), "MMM d, yyyy HH:mm:ss") : "Unknown"}
                  </td>
                </tr>
              ))}
              {webhooks?.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-gray-500 italic">
                    No webhook events processed yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
