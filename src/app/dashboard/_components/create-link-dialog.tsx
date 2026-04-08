"use client";

import { useActionState, useEffect, useRef, useState, startTransition } from "react";
import { Plus, X, Link2 } from "lucide-react";
import { createLinkAction, type ActionResult } from "../actions";

export function CreateLinkDialog() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    createLinkAction,
    null
  );
  const formRef = useRef<HTMLFormElement>(null);
  const prevStateRef = useRef<typeof state>(null);

  // Close dialog and reset form on success.
  // We compare against the previous state ref to detect a new success result
  // and schedule the open toggle via startTransition to avoid a synchronous
  // setState call inside the effect body.
  useEffect(() => {
    if (state !== prevStateRef.current) {
      prevStateRef.current = state;
      if (state && "success" in state) {
        formRef.current?.reset();
        startTransition(() => setOpen(false));
      }
    }
  }, [state]);

  const error = state && "error" in state ? state.error : null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
      >
        <Plus className="h-4 w-4" />
        New link
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Dialog */}
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Link2 className="h-5 w-5 text-indigo-600" />
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                  Create short link
                </h2>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form ref={formRef} action={formAction} className="space-y-4">
              {/* URL */}
              <div>
                <label
                  htmlFor="cl-url"
                  className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                >
                  Destination URL <span className="text-red-500">*</span>
                </label>
                <input
                  id="cl-url"
                  name="url"
                  type="url"
                  required
                  placeholder="https://example.com/very/long/path"
                  className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {/* Custom slug */}
              <div>
                <label
                  htmlFor="cl-slug"
                  className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                >
                  Custom slug{" "}
                  <span className="font-normal text-zinc-400">(optional)</span>
                </label>
                <input
                  id="cl-slug"
                  name="slug"
                  type="text"
                  placeholder="my-slug"
                  pattern="[a-zA-Z0-9_-]+"
                  maxLength={60}
                  className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {/* Title */}
              <div>
                <label
                  htmlFor="cl-title"
                  className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                >
                  Title{" "}
                  <span className="font-normal text-zinc-400">(optional)</span>
                </label>
                <input
                  id="cl-title"
                  name="title"
                  type="text"
                  placeholder="My link title"
                  maxLength={200}
                  className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="cl-password"
                  className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                >
                  Password protection{" "}
                  <span className="font-normal text-zinc-400">(optional)</span>
                </label>
                <input
                  id="cl-password"
                  name="password"
                  type="password"
                  placeholder="Leave blank for no password"
                  minLength={4}
                  className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {error && (
                <p className="rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 px-3.5 py-2.5 text-sm text-red-600 dark:text-red-400">
                  {error}
                </p>
              )}

              <div className="flex items-center justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60 transition-colors"
                >
                  {pending ? "Creating…" : "Create link"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
