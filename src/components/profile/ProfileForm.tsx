"use client";

import { useState, type FormEvent } from "react";
import { useAtom } from "jotai";
import { Icon } from "@/components/ui/Icon";
import { userProfileSchema } from "@/lib/schemas/user";
import { userProfileAtom } from "@/store/atoms";

export function ProfileForm() {
  const [profile, setProfile] = useAtom(userProfileAtom);
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved">("idle");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = userProfileSchema.safeParse({ name, email });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0];
        if (typeof field === "string" && !fieldErrors[field]) {
          fieldErrors[field] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setProfile(result.data);
    setSaveStatus("saved");
    setTimeout(() => setSaveStatus("idle"), 2000);
  };

  const handleCancel = () => {
    setName(profile.name);
    setEmail(profile.email);
    setErrors({});
  };

  return (
    <form className="space-y-stack-md" onSubmit={handleSubmit} data-testid="profile-form">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-stack-md">
        <div className="space-y-stack-sm">
          <label
            htmlFor="fullName"
            className="text-label-md text-on-surface-variant uppercase tracking-wider block"
          >
            Full Name
          </label>
          <div className="relative">
            <input
              id="fullName"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              data-testid="profile-name-input"
              className="w-full px-stack-md py-3 bg-surface rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary-container outline-none transition-all text-body-md"
            />
            <Icon name="person" className="absolute right-3 top-1/2 -translate-y-1/2 text-outline-variant" />
          </div>
          {errors.name && (
            <p className="text-sm text-error" data-testid="profile-name-error" role="alert">
              {errors.name}
            </p>
          )}
        </div>

        <div className="space-y-stack-sm">
          <label
            htmlFor="emailAddress"
            className="text-label-md text-on-surface-variant uppercase tracking-wider block"
          >
            Email Address
          </label>
          <div className="relative">
            <input
              id="emailAddress"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              data-testid="profile-email-input"
              className="w-full px-stack-md py-3 bg-surface rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary-container outline-none transition-all text-body-md"
            />
            <Icon name="mail" className="absolute right-3 top-1/2 -translate-y-1/2 text-outline-variant" />
          </div>
          {errors.email && (
            <p className="text-sm text-error" data-testid="profile-email-error" role="alert">
              {errors.email}
            </p>
          )}
        </div>
      </div>

      <div className="pt-stack-md flex flex-col md:flex-row justify-end gap-stack-sm">
        <button
          type="button"
          onClick={handleCancel}
          data-testid="profile-cancel-btn"
          className="px-stack-lg py-3 rounded-lg border border-outline text-on-surface-variant text-label-md hover:bg-surface-variant transition-colors active:scale-95"
        >
          Cancel
        </button>
        <button
          type="submit"
          data-testid="profile-save-btn"
          className={`px-stack-lg py-3 rounded-lg text-label-md hover:opacity-90 shadow-md active:scale-95 transition-all flex items-center justify-center gap-base ${
            saveStatus === "saved"
              ? "bg-emerald-600 text-white"
              : "bg-primary text-on-primary"
          }`}
        >
          <Icon name={saveStatus === "saved" ? "check_circle" : "save"} className="text-[18px]" />
          {saveStatus === "saved" ? "Updated!" : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
