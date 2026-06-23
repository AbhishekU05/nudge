"use client";

import { useTransition, useRef } from "react";
import { submitFeedback } from "./actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export function FeedbackForm() {
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      try {
        await submitFeedback(formData);
        toast.success("Feedback sent successfully! Thank you.");
        formRef.current?.reset();
      } catch (err: any) {
        toast.error(err.message || "Failed to send feedback.");
      }
    });
  };

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-4 max-w-xl">
      <div className="space-y-2">
        <label htmlFor="message" className="text-sm font-medium text-zinc-200">
          Your Feedback
        </label>
        <Textarea 
          id="message" 
          name="message" 
          placeholder="Tell us what's on your mind... Ideas, bugs, or just saying hi!" 
          required 
          className="min-h-[150px] resize-y"
        />
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Send Feedback
      </Button>
    </form>
  );
}
