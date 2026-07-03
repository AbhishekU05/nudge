import { nudgeConfig } from "@/nudge.config";

export default function AdminConfig() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Global Configuration</h2>
      <p className="text-gray-600 text-sm">
        These settings are statically defined in <code className="bg-gray-100 px-1 py-0.5 rounded">nudge.config.ts</code>. 
        Changes require a code deployment.
      </p>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6">
          <pre className="bg-gray-50 p-4 rounded-lg text-sm text-gray-800 overflow-x-auto font-mono">
            {JSON.stringify(nudgeConfig, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
