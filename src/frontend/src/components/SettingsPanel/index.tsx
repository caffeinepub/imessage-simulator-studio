import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { ChevronDown } from "lucide-react";
import { useRef, useState } from "react";
import { useStudioStore } from "../../store/studioStore";
import ExportModal from "../ExportModal";

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="px-4 pt-4 pb-2">
      <span className="studio-section-label">{label}</span>
    </div>
  );
}

function SettingRow({
  label,
  sub,
  children,
}: {
  label: string;
  sub?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="flex items-center justify-between gap-3 px-4 py-2.5 border-b"
      style={{ borderColor: "oklch(var(--studio-border))" }}
    >
      <div className="flex flex-col min-w-0">
        <span
          className="text-xs font-medium"
          style={{ color: "oklch(var(--studio-secondary))", fontSize: "12px" }}
        >
          {label}
        </span>
        {sub && (
          <span
            className="text-xs mt-0.5"
            style={{ color: "oklch(var(--studio-muted))", fontSize: "10px" }}
          >
            {sub}
          </span>
        )}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

function Divider() {
  return (
    <div
      className="h-px mx-0"
      style={{ background: "oklch(var(--studio-border))" }}
    />
  );
}

export default function SettingsPanel() {
  const { settings, updateSettings } = useStudioStore();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [audioOpen, setAudioOpen] = useState(false);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      updateSettings({ avatarUrl: evt.target?.result as string });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const speedOptions = [0.5, 0.75, 1, 1.5, 2];

  const receiptOptions: Array<{
    key: "none" | "delivered" | "read";
    label: string;
  }> = [
    { key: "none", label: "None" },
    { key: "delivered", label: "Delivered" },
    { key: "read", label: "Read + Time" },
  ];

  return (
    <div className="flex flex-col">
      <SectionHeader label="Settings" />
      <Divider />

      {/* Contact */}
      <SettingRow label="Contact" sub="Status bar name">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => avatarInputRef.current?.click()}
            className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center text-xs font-bold transition-opacity hover:opacity-80"
            style={{
              background: "oklch(var(--studio-blue))",
              color: "white",
              fontSize: "10px",
            }}
            title="Upload avatar"
            data-ocid="settings.upload_button"
          >
            {settings.avatarUrl ? (
              <img
                src={settings.avatarUrl}
                alt="avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              settings.contactName.charAt(0).toUpperCase()
            )}
          </button>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarUpload}
          />
          <input
            type="text"
            value={settings.contactName}
            onChange={(e) => updateSettings({ contactName: e.target.value })}
            className="bg-transparent text-xs outline-none w-24 text-right"
            style={{ color: "oklch(var(--studio-blue))", fontSize: "12px" }}
            data-ocid="settings.input"
          />
        </div>
      </SettingRow>

      {/* Time */}
      <SettingRow label="Time" sub="Status bar clock &amp; badge">
        <div className="flex items-center gap-1.5">
          <input
            type="text"
            value={settings.statusBarTime}
            onChange={(e) => updateSettings({ statusBarTime: e.target.value })}
            className="text-center rounded-md px-2 py-1 text-xs w-14"
            style={{
              background: "oklch(var(--studio-surface))",
              border: "1px solid oklch(var(--studio-border))",
              color: "oklch(var(--studio-text))",
              fontSize: "11px",
            }}
            maxLength={8}
            data-ocid="settings.input"
          />
          <input
            type="number"
            value={settings.notificationBadge}
            onChange={(e) =>
              updateSettings({
                notificationBadge: Math.min(99, Math.max(0, +e.target.value)),
              })
            }
            className="text-center rounded-md px-2 py-1 text-xs w-12"
            style={{
              background: "oklch(var(--studio-surface))",
              border: "1px solid oklch(var(--studio-border))",
              color: "oklch(var(--studio-text))",
              fontSize: "11px",
            }}
            min={0}
            max={99}
            placeholder="0"
            data-ocid="settings.input"
          />
        </div>
      </SettingRow>

      {/* Receipt */}
      <SettingRow label="Receipt" sub="Status under last sent msg">
        <div className="flex gap-0.5">
          {receiptOptions.map((opt) => (
            <button
              type="button"
              key={opt.key}
              onClick={() => updateSettings({ readReceipt: opt.key })}
              className="text-xs px-2 py-1 rounded-md font-medium transition-colors"
              style={{
                background:
                  settings.readReceipt === opt.key
                    ? "oklch(var(--studio-blue))"
                    : "oklch(var(--studio-surface))",
                color:
                  settings.readReceipt === opt.key
                    ? "white"
                    : "oklch(var(--studio-muted))",
                border: "1px solid oklch(var(--studio-border))",
                fontSize: "10px",
              }}
              data-ocid="settings.toggle"
            >
              {opt.label}
            </button>
          ))}
        </div>
      </SettingRow>

      {/* Theme */}
      <SettingRow label="Theme" sub="Dark">
        <Switch
          checked={settings.darkMode}
          onCheckedChange={(v) => updateSettings({ darkMode: v })}
          data-ocid="settings.switch"
        />
      </SettingRow>

      {/* Green */}
      <SettingRow label="Green" sub="SMS-style green bubbles">
        <Switch
          checked={settings.greenBubbles}
          onCheckedChange={(v) => updateSettings({ greenBubbles: v })}
          data-ocid="settings.switch"
        />
      </SettingRow>

      {/* Autoplay */}
      <SettingRow label="Autoplay" sub="Auto-play video messages">
        <Switch
          checked={settings.autoplay}
          onCheckedChange={(v) => updateSettings({ autoplay: v })}
          data-ocid="settings.switch"
        />
      </SettingRow>

      {/* TIMING SECTION */}
      <SectionHeader label="Timing" />
      <Divider />

      {/* Msg delay slider */}
      <div
        className="px-4 py-3 border-b"
        style={{ borderColor: "oklch(var(--studio-border))" }}
      >
        <div className="flex items-center justify-between mb-2">
          <span
            className="text-xs"
            style={{
              color: "oklch(var(--studio-secondary))",
              fontSize: "12px",
            }}
          >
            Msg
          </span>
          <span
            className="text-xs font-mono"
            style={{ color: "oklch(var(--studio-blue))", fontSize: "11px" }}
          >
            {settings.messageDelay}ms
          </span>
        </div>
        <Slider
          min={0}
          max={2000}
          step={50}
          value={[settings.messageDelay]}
          onValueChange={([v]) => updateSettings({ messageDelay: v })}
          data-ocid="settings.toggle"
        />
      </div>

      {/* Typing slider */}
      <div
        className="px-4 py-3 border-b"
        style={{ borderColor: "oklch(var(--studio-border))" }}
      >
        <div className="flex items-center justify-between mb-2">
          <span
            className="text-xs"
            style={{
              color: "oklch(var(--studio-secondary))",
              fontSize: "12px",
            }}
          >
            Typing
          </span>
          <span
            className="text-xs font-mono"
            style={{ color: "oklch(var(--studio-blue))", fontSize: "11px" }}
          >
            {settings.typingDuration}ms
          </span>
        </div>
        <Slider
          min={0}
          max={3000}
          step={100}
          value={[settings.typingDuration]}
          onValueChange={([v]) => updateSettings({ typingDuration: v })}
        />
      </div>

      {/* Call slider */}
      <div
        className="px-4 py-3 border-b"
        style={{ borderColor: "oklch(var(--studio-border))" }}
      >
        <div className="flex items-center justify-between mb-2">
          <span
            className="text-xs"
            style={{
              color: "oklch(var(--studio-secondary))",
              fontSize: "12px",
            }}
          >
            Call
          </span>
          <span
            className="text-xs font-mono"
            style={{ color: "oklch(var(--studio-blue))", fontSize: "11px" }}
          >
            {(settings.callBannerDuration / 1000).toFixed(1)}s
          </span>
        </div>
        <Slider
          min={0}
          max={5000}
          step={100}
          value={[settings.callBannerDuration]}
          onValueChange={([v]) => updateSettings({ callBannerDuration: v })}
        />
      </div>

      {/* Speed segmented */}
      <div
        className="px-4 py-3 border-b"
        style={{ borderColor: "oklch(var(--studio-border))" }}
      >
        <div className="flex items-center justify-between mb-2">
          <span
            className="text-xs"
            style={{
              color: "oklch(var(--studio-secondary))",
              fontSize: "12px",
            }}
          >
            Speed
          </span>
        </div>
        <div className="flex gap-1">
          {speedOptions.map((s) => (
            <button
              type="button"
              key={s}
              onClick={() => updateSettings({ playbackSpeed: s })}
              className="flex-1 text-xs py-1.5 rounded-md font-medium transition-colors"
              style={{
                background:
                  settings.playbackSpeed === s
                    ? "oklch(var(--studio-blue))"
                    : "oklch(var(--studio-surface))",
                color:
                  settings.playbackSpeed === s
                    ? "white"
                    : "oklch(var(--studio-muted))",
                border: "1px solid oklch(var(--studio-border))",
                fontSize: "11px",
              }}
              data-ocid="settings.toggle"
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      {/* AUDIO SECTION */}
      <div
        className="border-b"
        style={{ borderColor: "oklch(var(--studio-border))" }}
      >
        <button
          type="button"
          onClick={() => setAudioOpen(!audioOpen)}
          className="w-full flex items-center justify-between px-4 py-3 transition-colors hover:bg-white/[0.03]"
        >
          <span className="studio-section-label">Audio</span>
          <div className="flex items-center gap-2">
            <Switch
              checked={audioOpen}
              onCheckedChange={setAudioOpen}
              onClick={(e) => e.stopPropagation()}
              data-ocid="settings.switch"
            />
            <ChevronDown
              size={12}
              style={{
                color: "oklch(var(--studio-muted))",
                transform: audioOpen ? "rotate(180deg)" : "none",
                transition: "transform 150ms ease",
              }}
            />
          </div>
        </button>
        {audioOpen && (
          <div
            className="px-4 pb-3 text-xs"
            style={{ color: "oklch(var(--studio-muted))" }}
          >
            Audio settings coming soon.
          </div>
        )}
      </div>

      {/* Export */}
      <div className="px-4 py-3">
        <ExportModal />
      </div>

      <div className="pb-4" />
    </div>
  );
}
