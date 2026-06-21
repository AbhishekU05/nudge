"use client";

import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { CustomerRecord, WorkflowStatus, getDaysOverdue } from "@/lib/types";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { Calendar, AlertCircle } from "lucide-react";

function formatCurrency(value: number, currency: string = "USD") {
  return new Intl.NumberFormat(undefined, {
    currency,
    style: "currency",
    maximumFractionDigits: 0,
  }).format(Number(value));
}

const COLUMNS: { id: WorkflowStatus; title: string; color: string }[] = [
  { id: "outstanding", title: "Outstanding", color: "border-blue-500/20 bg-blue-500/10 text-blue-400" },
  { id: "overdue", title: "Overdue (Escalate)", color: "border-red-500/20 bg-red-500/10 text-red-400" },
  { id: "promised", title: "Promised", color: "border-purple-500/20 bg-purple-500/10 text-purple-400" },
  { id: "partial", title: "Partial Payment", color: "border-yellow-500/20 bg-yellow-500/10 text-yellow-400" },
  { id: "paid", title: "Paid In Full", color: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400" },
];

export function PipelineClient({ initialCustomers }: { initialCustomers: CustomerRecord[] }) {
  const [isClient, setIsClient] = useState(false);
  const [customers, setCustomers] = useState<CustomerRecord[]>(initialCustomers);

  // We need this to avoid React hydration mismatch with react-beautiful-dnd
  useEffect(() => {
    setIsClient(true);
  }, []);

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const newStatus = destination.droppableId as WorkflowStatus;
    const oldStatus = source.droppableId as WorkflowStatus;

    // Optimistically update UI
    setCustomers(prev => 
      prev.map(c => c.id === draggableId ? { ...c, workflow_status: newStatus } : c)
    );

    // Save to DB
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase
      .from("customers")
      .update({ workflow_status: newStatus })
      .eq("id", draggableId);

    if (error) {
      console.error("Error updating status:", error);
      alert("Failed to update customer status");
      // Revert optimistic update
      setCustomers(prev => 
        prev.map(c => c.id === draggableId ? { ...c, workflow_status: oldStatus } : c)
      );
    } else {
      console.log(`Moved to ${COLUMNS.find(c => c.id === newStatus)?.title}`);
    }
  };

  if (!isClient) {
    return <div className="animate-pulse h-[500px] w-full bg-white/[0.02] rounded-xl border border-white/10" />;
  }

  const getCustomersByStatus = (status: WorkflowStatus) => {
    return customers
      .filter((c) => c.workflow_status === status && !c.unsubscribed)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  };

  return (
    <div className="flex h-full gap-6 overflow-x-auto pb-4">
      <DragDropContext onDragEnd={onDragEnd}>
        {COLUMNS.map((column) => {
          const colCustomers = getCustomersByStatus(column.id);
          const colTotal = colCustomers.reduce((acc, c) => acc + Math.max(0, Number(c.amount_owed) - Number(c.amount_paid)), 0);

          return (
            <div key={column.id} className="flex min-w-[320px] max-w-[320px] flex-col rounded-xl bg-white/[0.015] border border-white/5">
              <div className="p-4 border-b border-white/5 flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-zinc-100 flex items-center gap-2">
                    {column.title}
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${column.color}`}>
                      {colCustomers.length}
                    </span>
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1">{formatCurrency(colTotal)}</p>
                </div>
              </div>
              
              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={`flex-1 p-3 min-h-[500px] transition-colors ${snapshot.isDraggingOver ? "bg-white/[0.03]" : ""}`}
                  >
                    {colCustomers.map((customer, index) => {
                      const remaining = Math.max(0, Number(customer.amount_owed) - Number(customer.amount_paid));
                      const daysOverdue = getDaysOverdue(customer);

                      return (
                        <Draggable key={customer.id} draggableId={customer.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              style={provided.draggableProps.style}
                              className={`mb-3 last:mb-0 transition-shadow ${
                                snapshot.isDragging ? "shadow-2xl opacity-90 scale-[1.02]" : "shadow-sm hover:border-white/20"
                              }`}
                            >
                              <Card className="bg-[#1c1c1e] border-white/10 p-4 rounded-lg cursor-grab active:cursor-grabbing">
                                <Link href={`/customers/${customer.id}`} className="block">
                                  <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-medium text-zinc-200 text-sm line-clamp-1">{customer.recipient_name}</h4>
                                    <span className="font-semibold text-zinc-100 text-sm">{formatCurrency(remaining, customer.currency)}</span>
                                  </div>
                                  
                                  <div className="flex items-center gap-4 text-xs text-zinc-500 mt-3">
                                    {customer.due_date && (
                                      <div className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        {new Date(customer.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                      </div>
                                    )}
                                    {daysOverdue !== null && daysOverdue > 0 && column.id !== 'paid' && (
                                      <div className="flex items-center gap-1 text-red-400">
                                        <AlertCircle className="h-3 w-3" />
                                        {daysOverdue}d late
                                      </div>
                                    )}
                                  </div>
                                </Link>
                              </Card>
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </DragDropContext>
    </div>
  );
}
