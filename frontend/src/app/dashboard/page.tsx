"use client";

import { useCallback, useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL;

type Role = "brand" | "creator";

type Milestone = {
  views: number;
  payout: number;
};

type Campaign = {
  _id: string;
  name: string;
  platform: string;
  budget: number;
  spent: number;
  remainingBudget: number;
  milestones: Milestone[];
};

type Submission = {
  _id: string;
  postUrl: string;
  views: number;
  payout: number;
  paid: boolean;
  campaignId: Campaign | string;
};

function getArray<T>(data: unknown, key: string): T[] {
  if (!data || typeof data !== "object") return [];

  const result = (data as Record<string, unknown>)[key];
  return Array.isArray(result) ? (result as T[]) : [];
}

export default function Dashboard() {
  const [role, setRole] = useState<Role | null>(null);
  const [token, setToken] = useState("");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [name, setName] = useState("");
  const [platform, setPlatform] = useState("Instagram");
  const [budget, setBudget] = useState("");
  const [milestones, setMilestones] = useState("1000:10,5000:50");
  const [postUrls, setPostUrls] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const request = useCallback(
    async (path: string, options: RequestInit = {}) => {
      const response = await fetch(`${API}${path}`, {
        ...options,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Request failed.");
      }

      return data;
    },
    [token]
  );

  const loadDashboard = useCallback(async () => {
    if (!token || !role) return;

    try {
      setLoading(true);
      setMessage("");

      const campaignData = await request("/campaigns");
      setCampaigns(getArray<Campaign>(campaignData, "campaigns"));

      if (role === "creator") {
        const submissionData = await request("/submissions/mine");
        setSubmissions(
          getArray<Submission>(submissionData, "submissions")
        );
      }
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to load dashboard."
      );
    } finally {
      setLoading(false);
    }
  }, [token, role, request]);

  useEffect(() => {
    const savedToken = sessionStorage.getItem("token");
    const savedRole = sessionStorage.getItem("role");

    if (!savedToken || (savedRole !== "brand" && savedRole !== "creator")) {
      window.location.replace("/");
      return;
    }

    setToken(savedToken);
    setRole(savedRole);
  }, []);

  useEffect(() => {
    if (token && role) {
      void loadDashboard();
    }
  }, [token, role, loadDashboard]);

  async function createCampaign(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const parsedMilestones: Milestone[] = milestones
        .split(",")
        .map((item) => {
          const [views, payout] = item.split(":").map(Number);
          return { views, payout };
        });

      if (
        parsedMilestones.some(
          (m) =>
            !Number.isSafeInteger(m.views) ||
            !Number.isSafeInteger(m.payout) ||
            m.views <= 0 ||
            m.payout < 0
        )
      ) {
        throw new Error(
          "Enter milestones as views:payout, for example 1000:10,5000:50."
        );
      }

      await request("/campaigns", {
        method: "POST",
        body: JSON.stringify({
          name,
          platform,
          budget: Number(budget),
          milestones: parsedMilestones,
        }),
      });

      setName("");
      setBudget("");
      setMessage("Campaign created successfully!");
      await loadDashboard();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not create campaign."
      );
    } finally {
      setSaving(false);
    }
  }

  async function submitPost(
    e: React.FormEvent<HTMLFormElement>,
    campaignId: string
  ) {
    e.preventDefault();
    setMessage("");

    try {
      await request("/submissions", {
        method: "POST",
        body: JSON.stringify({
          campaignId,
          postUrl: postUrls[campaignId],
        }),
      });

      setPostUrls((previous) => ({ ...previous, [campaignId]: "" }));
      setMessage("Post submitted successfully!");
      await loadDashboard();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not submit post."
      );
    }
  }

  function logout() {
    sessionStorage.clear();
    window.location.replace("/");
  }

  if (!role || loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        Loading dashboard...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <p className="text-sm font-semibold tracking-widest text-blue-400">
              MEME'D
            </p>
            <h1 className="mt-2 text-3xl font-bold">
              {role === "brand" ? "Brand Dashboard" : "Creator Dashboard"}
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Manage campaigns, views, and payouts.
            </p>
          </div>

          <button
            onClick={logout}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800"
          >
            Log out
          </button>
        </header>

        {message && (
          <p
            role="status"
            className="mt-5 rounded-lg border border-slate-700 bg-slate-900 p-3 text-sm"
          >
            {message}
          </p>
        )}

        {role === "brand" && (
          <section className="mt-8 rounded-xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-xl font-semibold">Create a campaign</h2>
            <p className="mt-1 text-sm text-slate-400">
              Set a budget and define payouts for view milestones.
            </p>

            <form onSubmit={createCampaign} className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="campaignName" className="mb-1 block text-sm">
                  Campaign name
                </label>
                <input
                  id="campaignName"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-3"
                  placeholder="Summer campaign"
                />
              </div>

              <div>
                <label htmlFor="platform" className="mb-1 block text-sm">
                  Platform
                </label>
                <select
                  id="platform"
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-3"
                >
                  <option value="Instagram">Instagram</option>
                  <option value="YouTube">YouTube</option>
                </select>
              </div>

              <div>
                <label htmlFor="budget" className="mb-1 block text-sm">
                  Total budget
                </label>
                <input
                  id="budget"
                  type="number"
                  min="1"
                  required
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-3"
                  placeholder="10000"
                />
              </div>

              <div>
                <label htmlFor="milestones" className="mb-1 block text-sm">
                  View milestones
                </label>
                <input
                  id="milestones"
                  required
                  value={milestones}
                  onChange={(e) => setMilestones(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-3"
                  placeholder="1000:10,5000:50"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Format: views:payout, separated by commas.
                </p>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-blue-600 px-4 py-3 font-semibold hover:bg-blue-500 disabled:opacity-60 sm:col-span-2"
              >
                {saving ? "Creating..." : "Create campaign"}
              </button>
            </form>
          </section>
        )}

        <section className="mt-8">
          <h2 className="text-xl font-semibold">
            {role === "brand" ? "Your available campaigns" : "Available campaigns"}
          </h2>

          {campaigns.length === 0 ? (
            <p className="mt-4 rounded-xl border border-slate-800 p-6 text-slate-400">
              No campaigns with remaining budget are available right now.
            </p>
          ) : (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {campaigns.map((campaign) => (
                <article
                  key={campaign._id}
                  className="rounded-xl border border-slate-800 bg-slate-900 p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-lg font-semibold">{campaign.name}</h3>
                    <span className="rounded-full bg-slate-800 px-3 py-1 text-xs">
                      {campaign.platform}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-slate-400">Total budget</p>
                      <p className="mt-1 font-semibold">
                        {campaign.budget.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400">Remaining budget</p>
                      <p className="mt-1 font-semibold text-emerald-400">
                        {campaign.remainingBudget.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 border-t border-slate-800 pt-4">
                    <p className="text-sm font-medium">Payout milestones</p>
                    <ul className="mt-2 space-y-1 text-sm text-slate-300">
                      {campaign.milestones.map((milestone) => (
                        <li key={milestone.views}>
                          {milestone.views.toLocaleString()} views →{" "}
                          {milestone.payout.toLocaleString()} payout
                        </li>
                      ))}
                    </ul>
                  </div>

                  {role === "creator" && campaign.remainingBudget > 0 && (
                    <form
                      onSubmit={(e) => submitPost(e, campaign._id)}
                      className="mt-5 space-y-3"
                    >
                      <label
                        htmlFor={`post-${campaign._id}`}
                        className="block text-sm"
                      >
                        Your post URL
                      </label>
                      <input
                        id={`post-${campaign._id}`}
                        type="url"
                        required
                        value={postUrls[campaign._id] || ""}
                        onChange={(e) =>
                          setPostUrls((previous) => ({
                            ...previous,
                            [campaign._id]: e.target.value,
                          }))
                        }
                        placeholder="https://..."
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-3"
                      />
                      <button
                        type="submit"
                        className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold hover:bg-blue-500"
                      >
                        Submit post
                      </button>
                    </form>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>

        {role === "creator" && (
          <section className="mt-10">
            <h2 className="text-xl font-semibold">My submissions</h2>
            <p className="mt-1 text-sm text-slate-400">
              Track the views and payouts recorded for your posts.
            </p>

            {submissions.length === 0 ? (
              <p className="mt-4 rounded-xl border border-slate-800 p-6 text-slate-400">
                You have not submitted any posts yet.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {submissions.map((submission) => (
                  <article
                    key={submission._id}
                    className="rounded-xl border border-slate-800 bg-slate-900 p-5"
                  >
                    <a
                      href={submission.postUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="break-all text-sm text-blue-400 underline"
                    >
                      {submission.postUrl}
                    </a>
                    <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm">
                      <p>
                        Views:{" "}
                        <span className="font-semibold">
                          {submission.views.toLocaleString()}
                        </span>
                      </p>
                      <p>
                        Payout:{" "}
                        <span className="font-semibold text-emerald-400">
                          {submission.payout.toLocaleString()}
                        </span>
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}