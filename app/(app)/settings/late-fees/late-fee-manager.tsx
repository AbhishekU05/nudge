"use client";

import { useState } from "react";
import { LateFeePolicy, GroupRecord } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { createLateFeePolicy, updateLateFeePolicy, deleteLateFeePolicy, toggleLateFeePolicyActive } from "@/app/actions/late-fees";

export function LateFeeManager({ 
  initialPolicies, 
  groups 
}: { 
  initialPolicies: LateFeePolicy[];
  groups: GroupRecord[];
}) {
  const [policies, setPolicies] = useState<LateFeePolicy[]>(initialPolicies);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  async function handleToggleActive(id: string, currentActive: boolean) {
    try {
      setPolicies(policies.map(p => p.id === id ? { ...p, active: !currentActive } : p));
      await toggleLateFeePolicyActive(id, !currentActive);
    } catch {
      // revert on error
      setPolicies(initialPolicies);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this policy?")) return;
    try {
      setPolicies(policies.filter(p => p.id !== id));
      await deleteLateFeePolicy(id);
    } catch {
      setPolicies(initialPolicies);
    }
  }

  return (
    <div className="space-y-6">
      {!isCreating && editingId === null && (
        <div className="flex justify-end">
          <Button onClick={() => setIsCreating(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Policy
          </Button>
        </div>
      )}

      {(isCreating || editingId !== null) && (
        <PolicyForm
          policy={editingId ? policies.find(p => p.id === editingId) : undefined}
          groups={groups}
          onCancel={() => {
            setIsCreating(false);
            setEditingId(null);
          }}
          onSuccess={(saved) => {
            setPolicies(prev =>
              prev.some(p => p.id === saved.id)
                ? prev.map(p => (p.id === saved.id ? saved : p))
                : [...prev, saved]
            );
            setIsCreating(false);
            setEditingId(null);
          }}
        />
      )}

      <div className="grid gap-4">
        {policies.map(policy => (
          <Card key={policy.id} className="border-white/10 bg-white/[0.035]">
            <CardHeader className="pb-3 flex flex-row items-start justify-between">
              <div>
                <CardTitle className="text-lg font-medium">{policy.name}</CardTitle>
                <CardDescription className="mt-1">
                  {policy.fee_type === "flat" ? `$${policy.fee_value}` : `${policy.fee_value}%`} 
                  {" • "} 
                  {policy.frequency === "once" ? "Applied once" : `Applied ${policy.frequency}`}
                  {" • "}
                  {policy.grace_period_days} days grace
                </CardDescription>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox"
                    checked={policy.active}
                    onChange={() => handleToggleActive(policy.id, policy.active)}
                    className="h-4 w-4 bg-transparent border-white/10 rounded accent-primary"
                  />
                  <Label className="text-xs text-zinc-400">
                    {policy.active ? "Active" : "Inactive"}
                  </Label>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={() => setEditingId(policy.id)} className="px-2">
                    <Edit2 className="h-4 w-4 text-zinc-400" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(policy.id)} className="px-2">
                    <Trash2 className="h-4 w-4 text-red-400 hover:text-red-300" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="text-sm text-zinc-400">
              <div className="flex gap-4">
                <div>
                  <span className="font-medium text-zinc-300">Applies to:</span>{" "}
                  New Invoices Only
                </div>
                {policy.included_group_ids && policy.included_group_ids.length > 0 && (
                  <div>
                    <span className="font-medium text-zinc-300">Included groups:</span>{" "}
                    {policy.included_group_ids.includes("00000000-0000-0000-0000-000000000000") ? policy.included_group_ids.length - 1 : policy.included_group_ids.length}
                  </div>
                )}
                <div>
                  <span className="font-medium text-zinc-300">Approval:</span>{" "}
                  {policy.auto_approve ? "Auto" : "Manual"}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {policies.length === 0 && !isCreating && (
          <div className="text-center py-12 border border-white/10 rounded-lg bg-white/[0.02]">
            <p className="text-zinc-500">No late fee policies defined yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function PolicyForm({ 
  policy, 
  groups, 
  onCancel, 
  onSuccess 
}: { 
  policy?: LateFeePolicy;
  groups: GroupRecord[];
  onCancel: () => void;
  onSuccess: (saved: LateFeePolicy) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // "Apply to" group selection — default: all groups included
  const allGroupIds = groups.map(g => g.id);
  const initialSelected = policy?.included_group_ids
    ? allGroupIds.filter(id => policy.included_group_ids.includes(id))
    : allGroupIds;
  const initialNoGroup = policy
    ? (policy.included_group_ids ?? []).includes("00000000-0000-0000-0000-000000000000")
    : true;

  const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(
    new Set(initialSelected)
  );
  const [includeNoGroup, setIncludeNoGroup] = useState(initialNoGroup);
  const [autoApprove, setAutoApprove] = useState(policy ? policy.auto_approve : true);

  const allChecked = groups.length > 0 && selectedGroupIds.size === groups.length;
  const someChecked = selectedGroupIds.size > 0 && !allChecked;

  function toggleAll() {
    if (allChecked) {
      setSelectedGroupIds(new Set());
    } else {
      setSelectedGroupIds(new Set(allGroupIds));
    }
  }

  function toggleGroup(id: string) {
    setSelectedGroupIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    // Validation: a policy must apply to at least one group (or "No group"),
    // otherwise it would never match any invoice.
    if (selectedGroupIds.size === 0 && !includeNoGroup) {
      setError("Select at least one group (or \"No group\") for this policy to apply to.");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);

      // Compute included = selected groups + optionally "00000000-0000-0000-0000-000000000000"
      const includedGroupIds = Array.from(selectedGroupIds);
      if (includeNoGroup) includedGroupIds.push("00000000-0000-0000-0000-000000000000");

      // Remove any stale included_group_ids from the form and inject computed ones
      formData.delete("included_group_ids");
      includedGroupIds.forEach(id => formData.append("included_group_ids", id));
      formData.set("auto_approve", autoApprove ? "true" : "false");

      const saved = policy
        ? await updateLateFeePolicy(policy.id, formData)
        : await createLateFeePolicy(formData);
      onSuccess(saved);
    } catch (error: unknown) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setError(`An error occurred: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-white/20 bg-white/[0.05]">
      <CardHeader>
        <CardTitle>{policy ? "Edit Policy" : "Create New Policy"}</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Policy Name</Label>
            <Input 
              id="name" 
              name="name" 
              defaultValue={policy?.name} 
              required 
              placeholder="e.g. Standard 5% Late Fee" 
              className="bg-black/20 border-white/10"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fee_type">Fee Type</Label>
              <select 
                id="fee_type" 
                name="fee_type" 
                defaultValue={policy?.fee_type || "percentage"}
                className="flex h-10 w-full items-center justify-between rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="flat">Flat Amount ($)</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="fee_value">Fee Value</Label>
              <Input 
                id="fee_value" 
                name="fee_value" 
                type="number" 
                step="0.01" 
                min="0"
                defaultValue={policy?.fee_value} 
                required 
                className="bg-black/20 border-white/10"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="grace_period_days">Grace Period (Days)</Label>
              <Input 
                id="grace_period_days" 
                name="grace_period_days" 
                type="number" 
                min="0"
                defaultValue={policy?.grace_period_days || 0} 
                required 
                className="bg-black/20 border-white/10"
              />
              <p className="text-xs text-zinc-500">Days after due date before fee applies.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="due_days">Late Fee Invoice Due (Days)</Label>
              <Input 
                id="due_days" 
                name="due_days" 
                type="number" 
                min="0"
                defaultValue={policy?.due_days || 0} 
                required 
                className="bg-black/20 border-white/10"
              />
              <p className="text-xs text-zinc-500">Days until the generated late fee is due (0 = due today).</p>
            </div>
          </div>

          <div className="space-y-2">
              <Label htmlFor="frequency">Frequency</Label>
              <select 
                id="frequency" 
                name="frequency" 
                defaultValue={policy?.frequency || "once"}
                className="flex h-10 w-full items-center justify-between rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="once">Apply Once</option>
                <option value="weekly">Apply Weekly</option>
                <option value="monthly">Apply Monthly</option>
              </select>
            </div>

          {/* Tax treatment for the late-fee invoice */}
          <div className="space-y-2">
              <Label htmlFor="tax_treatment">Tax on late fee</Label>
              <select
                id="tax_treatment"
                name="tax_treatment"
                defaultValue={policy?.tax_treatment || "no_tax"}
                className="flex h-10 w-full items-center justify-between rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="no_tax">No tax</option>
                <option value="exclusive">Add tax on top</option>
                <option value="inclusive">Tax inclusive</option>
              </select>
              <p className="text-xs text-zinc-500">
                Applies to the Xero late-fee invoice. QuickBooks fees are always non-taxable for now.
              </p>
            </div>


          {/* Auto Approve Toggle */}
          <div className="space-y-2">
            <Label>Approval Process</Label>
            <div className="flex items-center gap-2 rounded-md border border-white/10 bg-black/10 p-3">
              <input
                type="checkbox"
                id="auto_approve"
                checked={autoApprove}
                onChange={e => setAutoApprove(e.target.checked)}
                className="h-4 w-4 bg-transparent border-white/10 rounded accent-primary"
              />
              <Label htmlFor="auto_approve" className="text-sm font-normal cursor-pointer">
                Auto-approve late fees <span className="text-zinc-500">(If unchecked, they go to Automate tab for review)</span>
              </Label>
            </div>
          </div>

          {/* Groups — opt-in */}
          <div className="space-y-2">
            <Label>Apply Late Fee to Groups</Label>
            <p className="text-xs text-zinc-500">Check the groups this fee should apply to.</p>

            <div className="rounded-md border border-white/10 bg-black/10 p-3 space-y-2">
              {/* Check all row */}
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="group-check-all"
                    checked={allChecked}
                    ref={el => { if (el) el.indeterminate = someChecked; }}
                    onChange={toggleAll}
                    className="h-4 w-4 bg-transparent border-white/10 rounded accent-primary"
                  />
                  <Label htmlFor="group-check-all" className="text-sm font-medium cursor-pointer text-zinc-200">
                    {allChecked ? "Deselect all" : "Select all"}
                  </Label>
                </div>
                <span className="text-xs text-zinc-500">{selectedGroupIds.size} of {groups.length} selected</span>
              </div>

              {/* Per-group checkboxes */}
              <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto">
                {groups.map(group => (
                  <div key={group.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`group-${group.id}`}
                      checked={selectedGroupIds.has(group.id)}
                      onChange={() => toggleGroup(group.id)}
                      className="h-4 w-4 bg-transparent border-white/10 rounded accent-primary"
                    />
                    <Label htmlFor={`group-${group.id}`} className="text-sm font-normal cursor-pointer">
                      {group.name}
                    </Label>
                  </div>
                ))}
                {groups.length === 0 && (
                  <div className="col-span-2 text-zinc-500 text-sm italic">
                    No groups available.
                  </div>
                )}
              </div>

              {/* No group separator */}
              <div className="pt-2 border-t border-white/10">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="group-no-group"
                    checked={includeNoGroup}
                    onChange={e => setIncludeNoGroup(e.target.checked)}
                    className="h-4 w-4 bg-transparent border-white/10 rounded accent-primary"
                  />
                  <Label htmlFor="group-no-group" className="text-sm font-normal cursor-pointer">
                    No group <span className="text-zinc-500">(invoices not assigned to any group)</span>
                  </Label>
                </div>
              </div>
            </div>
          </div>

        </CardContent>
        <div className="flex items-center justify-end gap-2 border-t border-white/10 pt-4 px-6 pb-6">
          {error && (
            <p className="mr-auto text-sm text-red-400">{error}</p>
          )}
          <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Save Policy"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

