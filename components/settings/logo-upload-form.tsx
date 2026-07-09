"use client";

import { updateOrganizationLogo } from "@/app/actions/organization";
import { useState } from "react";

export function LogoUploadForm({ currentLogo }: { currentLogo: string | null }) {
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (formData: FormData) => {
    setError(null);
    const file = formData.get("logo_file") as File | null;
    if (file && file.size > 0) {
      if (!["image/jpeg", "image/png"].includes(file.type)) {
        setError("Please upload a JPEG or PNG image.");
        return;
      }
      if (file.size > 500 * 1024) {
        setError("Image must be smaller than 500KB.");
        return;
      }
    }
    
    try {
      await updateOrganizationLogo(formData);
    } catch (err: unknown) {
      setError((err as Error).message || "Failed to upload logo.");
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <form action={handleSubmit} className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <input 
          type="file" 
          name="logo_file" 
          accept="image/jpeg, image/png"
          className="flex h-9 w-full sm:max-w-xs rounded-md border border-white/10 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        />
        <div className="flex gap-2">
          <button type="submit" className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50">
            Upload Logo
          </button>
          {currentLogo && (
            <button 
              type="submit" 
              name="logo_url" 
              value="" 
              className="inline-flex h-9 items-center justify-center rounded-md bg-red-500/10 px-4 py-2 text-sm font-medium text-red-500 shadow hover:bg-red-500/20 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
            >
              Remove Logo
            </button>
          )}
        </div>
      </form>
      {error && <p className="text-sm font-medium text-red-500">{error}</p>}
    </div>
  );
}
