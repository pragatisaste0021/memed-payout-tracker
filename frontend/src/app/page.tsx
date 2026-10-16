"use client";

import { useState } from "react";

type AuthMode = "login" | "signup";
type Role = "brand" | "creator";

export default function Home() {
  const [mode, setMode] = useState<AuthMode>("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("creator");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const endpoint =
        mode === "signup" ? "/auth/signup" : "/auth/login";

      const payload =
        mode === "signup"
          ? { name, email, password, role }
          : { email, password };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}${endpoint}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Authentication failed.");
      }

      const token = data.token || data.accessToken;

      if (!token) {
        throw new Error(
          "Authentication succeeded, but the API did not return a token."
        );
      }

      sessionStorage.setItem("token", token);
      sessionStorage.setItem("role", data.user.role);
      sessionStorage.setItem("user", JSON.stringify(data.user));

      window.location.href = "/dashboard";
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10 text-white">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
        <p className="text-sm font-semibold tracking-widest text-blue-400">
          MEME'D
        </p>

        <h1 className="mt-3 text-3xl font-bold">
          {mode === "signup" ? "Create your account" : "Welcome back"}
        </h1>

        <p className="mt-2 text-sm text-slate-400">
          Track campaigns, views, and creator payouts.
        </p>

        <div className="mt-6 grid grid-cols-2 rounded-lg bg-slate-800 p-1">
          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setMessage("");
            }}
            className={`rounded-md py-2 text-sm font-medium ${
              mode === "signup" ? "bg-blue-600" : "text-slate-300"
            }`}
          >
            Sign up
          </button>

          <button
            type="button"
            onClick={() => {
              setMode("login");
              setMessage("");
            }}
            className={`rounded-md py-2 text-sm font-medium ${
              mode === "login" ? "bg-blue-600" : "text-slate-300"
            }`}
          >
            Log in
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {mode === "signup" && (
            <>
              <div>
                <label htmlFor="name" className="mb-1 block text-sm">
                  Full name
                </label>
                <input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoComplete="name"
                  placeholder="Your name"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="role" className="mb-1 block text-sm">
                  I am a
                </label>
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as Role)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500"
                >
                  <option value="creator">Creator</option>
                  <option value="brand">Brand</option>
                </select>
              </div>
            </>
          )}

          <div>
            <label htmlFor="email" className="mb-1 block text-sm">
              Email address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="you@example.com"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete={
                mode === "signup" ? "new-password" : "current-password"
              }
              placeholder="Enter your password"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500"
            />
          </div>

          {message && (
            <p role="alert" className="rounded-lg bg-red-950 p-3 text-sm text-red-300">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 py-3 font-semibold transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? "Please wait..."
              : mode === "signup"
                ? "Create account"
                : "Log in"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-500">
          Meme'd Campaign Payout Tracker
        </p>
      </div>
    </main>
  );
}