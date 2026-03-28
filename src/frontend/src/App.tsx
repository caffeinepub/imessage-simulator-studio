import { Toaster } from "@/components/ui/sonner";
import React from "react";
import { useEffect, useRef, useState } from "react";
import AdminPanel from "./components/AdminPanel";
import IPhonePreview from "./components/IPhonePreview";
import ScriptBuilder from "./components/ScriptBuilder";
import SettingsPanel from "./components/SettingsPanel";
import TopNav from "./components/TopNav";
import { useActor } from "./hooks/useActor";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useStudioStore } from "./store/studioStore";

function LoginScreen() {
  const { login, isLoggingIn, isInitializing } = useInternetIdentity();

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center"
      style={{ background: "oklch(var(--studio-bg))" }}
    >
      <div className="flex flex-col items-center gap-6 max-w-sm w-full px-6">
        <div className="flex flex-col items-center gap-1">
          <h1
            className="font-bold text-3xl"
            style={{ color: "oklch(var(--studio-text))" }}
          >
            iMessage Simulator
          </h1>
          <p
            className="text-sm text-center mt-1"
            style={{ color: "oklch(var(--studio-muted))" }}
          >
            Create realistic iMessage conversations and export as viral videos.
          </p>
        </div>

        <div
          className="w-full rounded-xl p-6 flex flex-col gap-4"
          style={{
            background: "oklch(var(--studio-panel))",
            border: "1px solid oklch(var(--studio-border))",
          }}
        >
          <div className="flex flex-col gap-1">
            <h2
              className="text-base font-semibold"
              style={{ color: "oklch(var(--studio-text))" }}
            >
              Sign in to continue
            </h2>
            <p
              className="text-xs"
              style={{ color: "oklch(var(--studio-muted))" }}
            >
              Use Internet Identity for secure, password-free authentication.
            </p>
          </div>

          <button
            type="button"
            onClick={login}
            disabled={isLoggingIn || isInitializing}
            className="w-full py-2.5 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ background: "oklch(var(--studio-blue))", color: "white" }}
            data-ocid="login.primary_button"
          >
            {isLoggingIn ? "Signing in…" : "Sign in with Internet Identity"}
          </button>
        </div>

        <p className="text-xs" style={{ color: "oklch(var(--studio-muted))" }}>
          © {new Date().getFullYear()}. Built with love using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:opacity-80"
          >
            caffeine.ai
          </a>
        </p>
      </div>
    </div>
  );
}

function StudioApp() {
  const { saveProject } = useStudioStore();
  const { actor, isFetching } = useActor();
  const autoSaveRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);

  useEffect(() => {
    autoSaveRef.current = setInterval(() => {
      saveProject("__autosave__");
    }, 30000);
    return () => {
      if (autoSaveRef.current) clearInterval(autoSaveRef.current);
    };
  }, [saveProject]);

  useEffect(() => {
    if (!actor || isFetching) return;
    // Auto-register this user silently on every login
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    actor.registerSelf().catch(() => {});
    actor
      .isCallerAdmin()
      .then((result) => {
        setIsAdmin(result);
      })
      .catch(() => {
        setIsAdmin(false);
      });
  }, [actor, isFetching]);

  if (showAdmin && isAdmin) {
    return (
      <>
        <AdminPanel onBack={() => setShowAdmin(false)} />
        <Toaster />
      </>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "oklch(var(--studio-bg))" }}
    >
      <TopNav isAdmin={isAdmin} onAdminClick={() => setShowAdmin(true)} />
      <main
        className="flex-1 flex overflow-hidden"
        style={{ height: "calc(100vh - 56px)" }}
      >
        <div
          className="w-80 flex-shrink-0 overflow-y-auto border-r"
          style={{
            background: "oklch(var(--studio-panel))",
            borderColor: "oklch(var(--studio-border))",
          }}
        >
          <ScriptBuilder />
        </div>
        <div
          className="w-72 flex-shrink-0 overflow-y-auto border-r"
          style={{
            background: "oklch(var(--studio-bg))",
            borderColor: "oklch(var(--studio-border))",
          }}
        >
          <SettingsPanel />
        </div>
        <div
          className="flex-1 overflow-y-auto flex items-start justify-center p-8"
          style={{ background: "oklch(var(--studio-bg))" }}
        >
          <IPhonePreview />
        </div>
      </main>
      <Toaster />
    </div>
  );
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div
          className="min-h-screen flex items-center justify-center flex-col gap-4"
          style={{ background: "#000" }}
        >
          <p style={{ color: "#fff" }}>
            Something went wrong. Please refresh the page.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{ background: "#0a84ff", color: "white" }}
            className="px-4 py-2 rounded-lg text-sm"
          >
            Refresh
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const { identity, isInitializing } = useInternetIdentity();

  if (isInitializing) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "oklch(var(--studio-bg))" }}
      >
        <span
          className="text-sm animate-pulse"
          style={{ color: "oklch(var(--studio-muted))" }}
          data-ocid="app.loading_state"
        >
          Loading…
        </span>
      </div>
    );
  }

  if (!identity) {
    return (
      <>
        <LoginScreen />
        <Toaster />
      </>
    );
  }

  return (
    <ErrorBoundary>
      <StudioApp />
    </ErrorBoundary>
  );
}
