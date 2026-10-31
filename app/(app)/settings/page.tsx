"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { KeyRound, Loader2, UserRound } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { saveProviderConfig } from "@/lib/settings/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AI_PROVIDERS, type AiProviderId, type Profile, type CurriculumCode } from "@/lib/types";
import { safeErrorMessage } from "@/lib/utils";

const labels: Record<AiProviderId, string> = {
  openai: "OpenAI",
  anthropic: "Anthropic",
  gemini: "Gemini",
  deepseek: "DeepSeek",
  openrouter: "OpenRouter",
  custom: "Custom (OpenAI-compatible)",
};

export default function SettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = React.useState<Profile | null>(null);
  const [savingProfile, setSavingProfile] = React.useState(false);

  const [provider, setProvider] = React.useState<AiProviderId>("openai");
  const [label, setLabel] = React.useState("");
  const [baseUrl, setBaseUrl] = React.useState("");
  const [model, setModel] = React.useState("");
  const [apiKey, setApiKey] = React.useState("");
  const [savingKey, setSavingKey] = React.useState(false);

  React.useEffect(() => {
    async function load() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
        if (data) setProfile(data as Profile);
      } catch {
        // unconfigured
      }
    }
    load();
  }, []);

  React.useEffect(() => {
    setLabel(labels[provider]);
  }, [provider]);

  async function updateProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setSavingProfile(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: profile.full_name,
          country: profile.country,
          curriculum: profile.curriculum,
          degree: profile.degree,
          academic_year: profile.academic_year,
          daily_study_minutes: profile.daily_study_minutes,
          explanation_level: profile.explanation_level,
        })
        .eq("id", user.id);
      if (error) throw error;
      toast.success("Profile saved");
      router.refresh();
    } catch (e) {
      toast.error(safeErrorMessage(e));
    } finally {
      setSavingProfile(false);
    }
  }

  async function saveKey(e: React.FormEvent) {
    e.preventDefault();
    setSavingKey(true);
    try {
      const result = await saveProviderConfig({ provider, label: label || labels[provider], baseUrl, model, apiKey });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("AI provider saved and encrypted");
      setApiKey("");
      setBaseUrl("");
      setModel("");
    } catch (e) {
      toast.error(safeErrorMessage(e));
    } finally {
      setSavingKey(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your profile and AI providers.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserRound className="h-4 w-4 text-primary" /> Profile
          </CardTitle>
          <CardDescription>Used to personalise your tutor and planner.</CardDescription>
        </CardHeader>
        <CardContent>
          {!profile ? (
            <p className="text-sm text-muted-foreground">Profile not loaded.</p>
          ) : (
            <form onSubmit={updateProfile} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Full name</Label>
                  <Input value={profile.full_name ?? ""} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Country</Label>
                  <Input value={profile.country ?? ""} onChange={(e) => setProfile({ ...profile, country: e.target.value })} />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>Curriculum</Label>
                  <Input
                    value={profile.curriculum ?? ""}
                    onChange={(e) => setProfile({ ...profile, curriculum: (e.target.value || null) as CurriculumCode | null })}
                    placeholder="e.g. bd-mbbs"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Degree</Label>
                  <Input value={profile.degree ?? ""} onChange={(e) => setProfile({ ...profile, degree: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Academic year</Label>
                  <Input
                    type="number"
                    min={1}
                    max={12}
                    value={profile.academic_year ?? ""}
                    onChange={(e) => setProfile({ ...profile, academic_year: e.target.value ? Number(e.target.value) : null })}
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Daily study minutes</Label>
                  <Input
                    type="number"
                    value={profile.daily_study_minutes ?? ""}
                    onChange={(e) => setProfile({ ...profile, daily_study_minutes: e.target.value ? Number(e.target.value) : null })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Explanation level</Label>
                  <Select
                    value={profile.explanation_level}
                    onValueChange={(v) => setProfile({ ...profile, explanation_level: v as Profile["explanation_level"] })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner-friendly</SelectItem>
                      <SelectItem value="student">MBBS student</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={savingProfile}>
                  {savingProfile ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
                  Save profile
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <KeyRound className="h-4 w-4 text-primary" /> AI provider
          </CardTitle>
          <CardDescription>Bring your own key — it is encrypted at rest and never exposed to the browser.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={saveKey} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Provider</Label>
                <Select value={provider} onValueChange={(v) => setProvider(v as AiProviderId)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {AI_PROVIDERS.map((p) => (
                      <SelectItem key={p} value={p}>{labels[p]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Label</Label>
                <Input value={label} onChange={(e) => setLabel(e.target.value)} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Base URL (optional)</Label>
                <Input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder="https://api.openai.com/v1" />
              </div>
              <div className="space-y-2">
                <Label>Model</Label>
                <Input value={model} onChange={(e) => setModel(e.target.value)} placeholder="e.g. gpt-4o-mini" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>API key</Label>
              <Input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="sk-…" autoComplete="off" />
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={savingKey || !apiKey}>
                {savingKey ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
                Save provider
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
