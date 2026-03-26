import { Toaster } from "@/components/ui/sonner";
import { useEffect, useRef } from "react";
import IPhonePreview from "./components/IPhonePreview";
import ScriptBuilder from "./components/ScriptBuilder";
import SettingsPanel from "./components/SettingsPanel";
import TopNav from "./components/TopNav";
import { useStudioStore } from "./store/studioStore";

export default function App() {
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
        {/* Left Panel: Script Builder */}
        <div
          className="w-80 flex-shrink-0 overflow-y-auto border-r"
          style={{
            background: "oklch(var(--studio-panel))",
            borderColor: "oklch(var(--studio-border))",
          }}
        >
          <ScriptBuilder />
        </div>

        {/* Center Panel: Settings */}
        <div
          className="w-72 flex-shrink-0 overflow-y-auto border-r"
          style={{
            background: "oklch(var(--studio-bg))",
            borderColor: "oklch(var(--studio-border))",
          }}
        >
          <SettingsPanel />
        </div>

        {/* Right Panel: iPhone Preview */}
        <div
          className="flex-1 overflow-y-auto flex items-start justify-center p-8"
          style={{ background: "oklch(var(--studio-bg))" }}
        >
          <IPhonePreview />
        </div>
      </main>

      {/* Footer */}
      <footer
        className="text-center text-xs py-2"
        style={{
          color: "oklch(var(--studio-muted))",
          background: "oklch(var(--studio-bg))",
        }}
      >
        © {new Date().getFullYear()}. Built with ❤️ using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:opacity-80 transition-opacity"
        >
          caffeine.ai
        </a>
      </footer>
      <Toaster />
    </div>
  );
}
