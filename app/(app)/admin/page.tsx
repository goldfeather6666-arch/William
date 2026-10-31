"use client";

import * as React from "react";
import {
  AlertTriangle,
  CreditCard,
  FileClock,
  Loader2,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ErrorState } from "@/components/common/error-state";
import { EmptyState } from "@/components/common/empty-state";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { formatCurrency, formatDateTime, formatNumber } from "@/lib/utils";
import type { Profile } from "@/lib/types";

interface UsageTotals {
  tokens: number | null;
  costCents: number | null;
}

interface AuditRow {
  id: string;
  created_at: string;
  actor_email: string | null;
  action: string;
  target_type: string;
}

interface ProviderConfigRow {
  id: string;
  provider: string;
  label: string;
  model: string | null;
  is_active: boolean;
}

interface Metrics {
  totalUsers: number | null;
  activeSubscriptions: number | null;
  usage: UsageTotals;
  auditLogs: AuditRow[];
}

function MetricCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription className="flex items-center gap-1.5">
          <Icon className="h-3.5 w-3.5" /> {label}
        </CardDescription>
        <CardTitle className="text-3xl">{value}</CardTitle>
      </CardHeader>
      {hint ? (
        <CardContent>
          <p className="text-xs text-muted-foreground">{hint}</p>
        </CardContent>
      ) : null}
    </Card>
  );
}

export default function AdminPage() {
  const [loading, setLoading] = React.useState(true);
  const [isAdmin, setIsAdmin] = React.useState<boolean | null>(null);
  const [metrics, setMetrics] = React.useState<Metrics>({
    totalUsers: null,
    activeSubscriptions: null,
    usage: { tokens: null, costCents: null },
    auditLogs: [],
  });
  const [providerConfigs, setProviderConfigs] = React.useState<ProviderConfigRow[] | null>(null);
  const [providerConfigsDenied, setProviderConfigsDenied] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user || cancelled) {
          if (!cancelled) {
            setIsAdmin(false);
            setLoading(false);
          }
          return;
        }

        // Access control: only platform admins may view the dashboard.
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();

        const role = (profile as Pick<Profile, "role"> | null)?.role;
        if (role !== "platform_admin") {
          if (!cancelled) {
            setIsAdmin(false);
            setLoading(false);
          }
          return;
        }

        if (!cancelled) setIsAdmin(true);

        const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

        const [usersRes, subsRes, usageRes, auditRes, providersRes] = await Promise.all([
          supabase.from("profiles").select("id", { count: "exact", head: true }),
          supabase.from("subscriptions").select("id", { count: "exact", head: true }).eq("status", "active"),
          supabase.from("usage_logs").select("prompt_tokens,completion_tokens,cost_cents").gte("created_at", since),
          supabase.from("audit_logs").select("id,created_at,actor_email,action,target_type").order("created_at", { ascending: false }).limit(10),
          supabase.from("ai_provider_configs").select("id,provider,label,model,is_active"),
        ]);

        const usage = usageRes.data ?? [];
        const totals: UsageTotals = {
          tokens: usageRes.error ? null : usage.reduce((sum, row) => sum + ((row.prompt_tokens ?? 0) + (row.completion_tokens ?? 0)), 0),
          costCents: usageRes.error ? null : usage.reduce((sum, row) => sum + (row.cost_cents ?? 0), 0),
        };

        const next: Metrics = {
          totalUsers: usersRes.error ? null : (usersRes.count ?? 0),
          activeSubscriptions: subsRes.error ? null : (subsRes.count ?? 0),
          usage: totals,
          auditLogs: auditRes.error ? [] : ((auditRes.data as AuditRow[] | null) ?? []),
        };

        if (!cancelled) {
          setMetrics(next);
          if (providersRes.error) {
            setProviderConfigsDenied(true);
            setProviderConfigs(null);
          } else {
            setProviderConfigsDenied(false);
            setProviderConfigs((providersRes.data as ProviderConfigRow[] | null) ?? []);
          }
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setIsAdmin(false);
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="mx-auto grid max-w-6xl place-items-center py-32">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Loading admin dashboard…</span>
        </div>
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="mx-auto grid max-w-3xl place-items-center py-24">
        <ErrorState
          icon={ShieldAlert}
          title="Access denied"
          description="This dashboard is restricted to platform administrators. If you believe this is a mistake, contact a platform admin."
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <h1 className="font-display text-2xl font-semibold sm:text-3xl">Admin</h1>
          <Badge variant="soft">
            <ShieldCheck className="mr-1 h-3.5 w-3.5" /> Platform
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">Platform-wide usage and audit visibility.</p>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="providers">Provider configs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              icon={Users}
              label="Total users"
              value={metrics.totalUsers == null ? "N/A" : formatNumber(metrics.totalUsers)}
            />
            <MetricCard
              icon={CreditCard}
              label="Active subscriptions"
              value={metrics.activeSubscriptions == null ? "N/A" : formatNumber(metrics.activeSubscriptions)}
            />
            <MetricCard
              icon={Sparkles}
              label="Tokens consumed (30d)"
              value={metrics.usage.tokens == null ? "N/A" : formatNumber(metrics.usage.tokens)}
            />
            <MetricCard
              icon={FileClock}
              label="Estimated cost (30d)"
              value={metrics.usage.costCents == null ? "N/A" : formatCurrency(metrics.usage.costCents)}
              hint="Based on logged usage rows"
            />
          </div>

          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold">Recent audit logs</h2>
              <Badge variant="soft">{metrics.auditLogs.length} entries</Badge>
            </div>

            {metrics.auditLogs.length === 0 ? (
              <EmptyState
                icon={FileClock}
                title="No audit activity"
                description="Audit logs are write-only for platforms admins, so nothing recent appears here yet."
              />
            ) : (
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b text-xs uppercase tracking-wide text-muted-foreground">
                          <th className="px-4 py-3 font-medium">When</th>
                          <th className="px-4 py-3 font-medium">Actor</th>
                          <th className="px-4 py-3 font-medium">Action</th>
                          <th className="px-4 py-3 font-medium">Target</th>
                        </tr>
                      </thead>
                      <tbody>
                        {metrics.auditLogs.map((log) => (
                          <tr key={log.id} className="border-b last:border-0 hover:bg-muted/40">
                            <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                              {formatDateTime(log.created_at)}
                            </td>
                            <td className="px-4 py-3">{log.actor_email ?? "—"}</td>
                            <td className="px-4 py-3 font-medium">{log.action}</td>
                            <td className="px-4 py-3 text-muted-foreground">{log.target_type}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="providers">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="h-4 w-4 text-primary" /> AI provider configs
              </CardTitle>
              <CardDescription>Bring-your-own-key configurations stored platform-wide.</CardDescription>
            </CardHeader>
            <CardContent>
              {providerConfigsDenied ? (
                <EmptyState
                  icon={AlertTriangle}
                  title="Provider configs unavailable"
                  description="Your role cannot read provider configurations under the current access policy."
                />
              ) : providerConfigs === null ? (
                <p className="text-sm text-muted-foreground">Provider configs could not be loaded.</p>
              ) : providerConfigs.length === 0 ? (
                <EmptyState
                  icon={Sparkles}
                  title="No provider configs"
                  description="No AI provider configurations have been saved yet."
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b text-xs uppercase tracking-wide text-muted-foreground">
                        <th className="px-4 py-3 font-medium">Provider</th>
                        <th className="px-4 py-3 font-medium">Label</th>
                        <th className="px-4 py-3 font-medium">Model</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {providerConfigs.map((cfg) => (
                        <tr key={cfg.id} className="border-b last:border-0 hover:bg-muted/40">
                          <td className="px-4 py-3 capitalize">{cfg.provider}</td>
                          <td className="px-4 py-3 font-medium">{cfg.label}</td>
                          <td className="px-4 py-3 text-muted-foreground">{cfg.model ?? "—"}</td>
                          <td className="px-4 py-3">
                            <Badge variant={cfg.is_active ? "soft" : "outline"}>
                              {cfg.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
