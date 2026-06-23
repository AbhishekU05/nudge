"use client";

import { useState } from "react";
import { promiseToPayAction } from "@/app/actions/portal";
import { Loader2, Calendar } from "lucide-react";

export function PromiseButton({ invoiceId, token, existingPromiseDate }: { invoiceId: string; token: string; existingPromiseDate?: string | null }) {
  const [isOpen, setIsOpen] = useState(false);
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  if (success || existingPromiseDate) {
    return (
      <div className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-200 dark:border-zinc-800 h-10 px-4 text-sm bg-zinc-50 dark:bg-zinc-900/50 text-zinc-600 dark:text-zinc-400">
        <Calendar className="w-4 h-4" />
        Promised by {existingPromiseDate ? new Date(existingPromiseDate).toLocaleDateString() : new Date(date).toLocaleDateString()}
      </div>
    );
  }

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-200 dark:border-zinc-800 font-medium tracking-tight transition-colors focus-visible:outline-none focus-visible:ring-2 h-10 px-4 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
      >
        I'll pay by...
      </button>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) return;
    
    setLoading(true);
    try {
      await promiseToPayAction(invoiceId, date, token);
      setSuccess(true);
    } catch (error) {
      console.error(error);
      alert("Failed to submit promise. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-200">
      <input 
        type="date" 
        value={date}
        onChange={(e) => setDate(e.target.value)}
        min={new Date().toISOString().split("T")[0]}
        required
        disabled={loading}
        className="h-10 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
      />
      <button 
        type="submit"
        disabled={loading || !date}
        className="inline-flex items-center justify-center gap-2 rounded-lg font-medium tracking-tight h-10 px-4 text-sm bg-zinc-900 text-zinc-50 hover:bg-zinc-900/90 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-50/90 disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm"}
      </button>
      <button 
        type="button"
        onClick={() => setIsOpen(false)}
        disabled={loading}
        className="inline-flex items-center justify-center h-10 px-3 text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        Cancel
      </button>
    </form>
  );
}
