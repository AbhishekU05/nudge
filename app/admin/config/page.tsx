import { nudgeConfig } from "@/nudge.config";
import { getQuickBooksMode } from "@/lib/platform-settings";
import { toggleQuickBooksMode } from "@/app/actions/admin";
import { redirect } from "next/navigation";

export default async function AdminConfig({
  searchParams,
}: {
  searchParams: { success?: string };
}) {
  const qbMode = await getQuickBooksMode();

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Global Configuration</h2>

      {searchParams.success && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
          {searchParams.success}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Dynamic Platform Settings</h3>
          <p className="text-gray-600 text-sm mb-4">
            These settings affect all users globally and can be changed without a deployment.
          </p>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div>
              <p className="font-medium text-gray-900">QuickBooks Integration Mode</p>
              <p className="text-sm text-gray-500">
                Currently running in: <strong className="text-gray-900 capitalize">{qbMode}</strong>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Sandbox uses QUICKBOOKS_DEV_CLIENT_ID and points to sandbox endpoints.
              </p>
            </div>
            <form action={async () => {
              "use server";
              await toggleQuickBooksMode(qbMode);
            }}>
              <button
                type="submit"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  qbMode === "production" 
                    ? "bg-amber-100 text-amber-700 hover:bg-amber-200" 
                    : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                }`}
              >
                Switch to {qbMode === "production" ? "Sandbox" : "Production"}
              </button>
            </form>
          </div>
        </div>

        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Static Configuration</h3>
          <p className="text-gray-600 text-sm mb-4">
            These settings are statically defined in <code className="bg-gray-100 px-1 py-0.5 rounded">nudge.config.ts</code>. 
            Changes require a code deployment.
          </p>
          <pre className="bg-gray-50 p-4 rounded-lg text-sm text-gray-800 overflow-x-auto font-mono">
            {JSON.stringify(nudgeConfig, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
