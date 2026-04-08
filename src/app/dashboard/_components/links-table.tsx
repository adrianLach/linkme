"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Copy,
  Check,
  Trash2,
  BarChart2,
  ToggleLeft,
  ToggleRight,
  ExternalLink,
} from "lucide-react";
import { deleteLinkAction, toggleLinkAction } from "../actions";

export type SerializedLink = {
  id: string;
  slug: string;
  url: string;
  title: string | null;
  tags: string[];
  active: boolean;
  clickCount: string;
  clickLimit: string | null;
  expiresAt: string | null;
  createdAt: string;
};

function CopyButton({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    const shortUrl = `${window.location.origin}/${slug}`;
    navigator.clipboard.writeText(shortUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <button
      onClick={handleCopy}
      title="Copy short link"
      className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-700 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
    >
      {copied ? (
        <Check className="h-4 w-4 text-emerald-500" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </button>
  );
}

function DeleteButton({ id }: { id: string }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (!confirming) {
      setConfirming(true);
      setTimeout(() => setConfirming(false), 3000);
      return;
    }
    startTransition(async () => {
      await deleteLinkAction(id);
      setConfirming(false);
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      title={confirming ? "Click again to confirm deletion" : "Delete link"}
      className={`inline-flex items-center justify-center h-8 w-8 rounded-lg transition-colors ${
        confirming
          ? "bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400"
          : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-700 hover:text-red-500"
      } disabled:opacity-50`}
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}

function ToggleButton({
  id,
  active,
}: {
  id: string;
  active: boolean;
}) {
  const [pending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(async () => {
      await toggleLinkAction(id, !active);
    });
  }

  return (
    <button
      onClick={handleToggle}
      disabled={pending}
      title={active ? "Disable link" : "Enable link"}
      className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50"
    >
      {active ? (
        <ToggleRight className="h-5 w-5 text-emerald-500" />
      ) : (
        <ToggleLeft className="h-5 w-5 text-zinc-400" />
      )}
    </button>
  );
}

function truncate(str: string, max: number) {
  return str.length > max ? str.slice(0, max) + "…" : str;
}

export function LinksTable({ links }: { links: SerializedLink[] }) {
  const router = useRouter();

  if (links.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-16 text-center">
        <p className="text-zinc-500 dark:text-zinc-400">
          No links yet. Create your first one!
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
              <th className="px-4 py-3 text-left font-semibold text-zinc-600 dark:text-zinc-400">
                Short link
              </th>
              <th className="px-4 py-3 text-left font-semibold text-zinc-600 dark:text-zinc-400">
                Destination
              </th>
              <th className="px-4 py-3 text-right font-semibold text-zinc-600 dark:text-zinc-400">
                Clicks
              </th>
              <th className="px-4 py-3 text-center font-semibold text-zinc-600 dark:text-zinc-400">
                Status
              </th>
              <th className="px-4 py-3 text-left font-semibold text-zinc-600 dark:text-zinc-400">
                Created
              </th>
              <th className="px-4 py-3 text-right font-semibold text-zinc-600 dark:text-zinc-400">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {links.map((link) => (
              <tr
                key={link.id}
                className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors"
              >
                {/* Short link */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-indigo-600 font-medium">
                      /{link.slug}
                    </span>
                    <a
                      href={`/${link.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                  {link.title && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                      {link.title}
                    </p>
                  )}
                </td>

                {/* Destination */}
                <td className="px-4 py-3 max-w-xs">
                  <span
                    className="text-zinc-600 dark:text-zinc-400 truncate block"
                    title={link.url}
                  >
                    {truncate(link.url, 55)}
                  </span>
                </td>

                {/* Clicks */}
                <td className="px-4 py-3 text-right">
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                    {Number(link.clickCount).toLocaleString()}
                  </span>
                </td>

                {/* Status */}
                <td className="px-4 py-3 text-center">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                      link.active
                        ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400"
                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
                    }`}
                  >
                    {link.active ? "Active" : "Disabled"}
                  </span>
                </td>

                {/* Created */}
                <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                  {new Date(link.createdAt).toLocaleDateString()}
                </td>

                {/* Actions */}
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-0.5">
                    <CopyButton slug={link.slug} />
                    <button
                      onClick={() =>
                        router.push(`/dashboard/links/${link.id}`)
                      }
                      title="View analytics"
                      className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-700 hover:text-indigo-600 transition-colors"
                    >
                      <BarChart2 className="h-4 w-4" />
                    </button>
                    <ToggleButton id={link.id} active={link.active} />
                    <DeleteButton id={link.id} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
