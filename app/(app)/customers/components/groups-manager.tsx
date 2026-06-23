"use client";

import { useState, useTransition } from "react";
import { FolderGit2, Plus, Edit2, Trash2, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GroupRecord } from "@/lib/types";
import { createGroup, updateGroup, deleteGroup } from "../actions";

export function GroupsManager({ groups }: { groups: GroupRecord[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<GroupRecord | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#3b82f6");

  const [isPending, startTransition] = useTransition();

  const handleOpen = () => setIsOpen(true);
  const handleClose = () => {
    setIsOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setEditingGroup(null);
    setIsCreating(false);
    setName("");
    setDescription("");
    setColor("#3b82f6");
  };

  const startEdit = (g: GroupRecord) => {
    setEditingGroup(g);
    setIsCreating(false);
    setName(g.name);
    setDescription(g.description || "");
    setColor(g.color || "#3b82f6");
  };

  const startCreate = () => {
    resetForm();
    setIsCreating(true);
  };

  const handleSave = async () => {
    if (!name.trim()) return;

    startTransition(async () => {
      try {
        if (isCreating) {
          await createGroup({ name, description, color });
        } else if (editingGroup) {
          await updateGroup(editingGroup.id, { name, description, color });
        }
        resetForm();
      } catch (err) {
        console.error(err);
      }
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this group?")) return;
    startTransition(async () => {
      try {
        await deleteGroup(id);
      } catch (err) {
        console.error(err);
      }
    });
  };

  return (
    <>
      <Button variant="secondary" onClick={handleOpen} className="w-full sm:w-auto gap-2">
        <FolderGit2 className="h-4 w-4" />
        Manage Groups
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between p-4 border-b border-zinc-800">
              <h2 className="text-lg font-medium text-zinc-100">Manage Groups</h2>
              <button onClick={handleClose} className="p-1 text-zinc-400 hover:text-zinc-100 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1">
              {!isCreating && !editingGroup ? (
                <div className="space-y-4">
                  <Button onClick={startCreate} className="w-full gap-2">
                    <Plus className="h-4 w-4" /> Create New Group
                  </Button>

                  <div className="space-y-2 mt-4">
                    {groups.length === 0 ? (
                      <p className="text-sm text-zinc-500 text-center py-4">No groups created yet.</p>
                    ) : (
                      groups.map((g) => (
                        <div key={g.id} className="flex items-center justify-between p-3 rounded-lg border border-zinc-800 bg-zinc-800/30">
                          <div className="flex items-center gap-3">
                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: g.color || "#3b82f6" }} />
                            <div>
                              <p className="text-sm font-medium text-zinc-200">{g.name}</p>
                              {g.description && <p className="text-xs text-zinc-500">{g.description}</p>}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => startEdit(g)} className="p-1.5 text-zinc-400 hover:text-blue-400 transition-colors">
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button onClick={() => handleDelete(g.id)} className="p-1.5 text-zinc-400 hover:text-red-400 transition-colors">
                              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-1">Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-md border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="e.g. VIP Clients"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-1">Description (Optional)</label>
                    <input
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full rounded-md border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="e.g. High priority customers"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-1">Color</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className="h-8 w-8 rounded cursor-pointer border-0 p-0"
                      />
                      <span className="text-sm text-zinc-400">{color}</span>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-zinc-800">
                    <Button variant="ghost" onClick={resetForm} disabled={isPending}>
                      Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={!name.trim() || isPending}>
                      {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Save Group
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
