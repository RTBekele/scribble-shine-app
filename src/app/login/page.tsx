"use client";

import { useState } from "react";
import { BackBar } from "@/components/BackBar";
import { createClient, supabaseConfigured } from "@/lib/supabase/client";
import { Mail, Loader2, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!supabaseConfigured()) {
      setError(
        "Supabase isn't configured yet. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your .env.local."
      );
      return;
    }
    setLoading(true);
    try {
      const sb = createClient();
      const { error } = await sb.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo:
            typeof window !== "undefined" ? window.location.origin : undefined,
        },
      });
      if (error) throw error;
      setSent(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Sign-in failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen">
      <BackBar title="Parent Login" />

      <section className="mx-auto max-w-md px-6 md:px-10 pb-16">
        <div className="bg-soft-card rounded-xl2 shadow-tile p-7">
          <div className="grid place-items-center mb-4">
            <span className="w-12 h-12 rounded-2xl bg-primary text-white grid place-items-center shadow-soft">
              <ShieldCheck size={22} />
            </span>
          </div>
          <h2 className="font-display font-extrabold text-2xl text-ink text-center">
            Welcome, grown-up!
          </h2>
          <p className="text-sm text-soft-muted text-center mt-1">
            Sign in to sync your child&apos;s library across devices.
          </p>

          {sent ? (
            <div className="mt-6 rounded-xl bg-primary-50 text-primary-700 p-4 text-sm text-center font-bold">
              Check your email for a magic link.
            </div>
          ) : (
            <form onSubmit={signIn} className="mt-6 space-y-3">
              <label className="block text-sm font-bold text-ink">Email</label>
              <div className="flex items-center gap-2 rounded-xl border border-primary-100 bg-soft-bg px-3 py-2">
                <Mail size={16} className="text-soft-muted" />
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="parent@example.com"
                  className="bg-transparent outline-none flex-1 text-sm"
                />
              </div>
              <button
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-600 text-white font-bold py-3 rounded-2xl shadow-soft disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  "Send magic link"
                )}
              </button>
              {error ? (
                <p className="text-sm text-accent-pink">{error}</p>
              ) : null}
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
