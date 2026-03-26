import { Toaster } from "@/components/ui/sonner";
import { useEffect, useRef } from "react";
import IPhonePreview from "./components/IPhonePreview";
import ScriptBuilder from "./components/ScriptBuilder";
import SettingsPanel from "./components/SettingsPanel";
import TopNav from "./components/TopNav";
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

export default function App() {
  const { identity, isInitializing } = useInternetIdentity();
  const { saveProject } = useStudioStore();
  const autoSaveRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    autoSaveRef.current = setInterval(() => {
      saveProject("__autosave__");
    }, 30000);
    return () => {
      if (autoSaveRef.current) clearInterval(autoSaveRef.current);
    };
  }, [saveProject]);

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
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "oklch(var(--studio-bg))" }}
    >
      <TopNav />
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
