import { TemplatesClient } from "./templates-client";

export default function TemplatesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-zinc-100">Message Templates</h3>
        <p className="text-sm text-zinc-500">
          Create and manage your saved follow-up message templates by tone and stage.
        </p>
      </div>
      
      <TemplatesClient />
    </div>
  );
}
