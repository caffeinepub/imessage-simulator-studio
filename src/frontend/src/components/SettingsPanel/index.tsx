import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useRef } from "react";
import { useStudioStore } from "../../store/studioStore";
import ExportModal from "../ExportModal";

function Card({
  title,
  children,
}: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-xl p-4 space-y-3"
      style={{
        background: "oklch(var(--studio-panel))",
        border: "1px solid oklch(var(--studio-border))",
      }}
    >
      <h3
        className="text-sm font-semibold"
        style={{ color: "oklch(var(--studio-text))" }}
      >
        {title}
      </h3>
      {children}
    </div>
  );
}

function SettingRow({
  label,
  children,
}: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span
        className="text-xs font-medium"
        style={{ color: "oklch(var(--studio-muted))" }}
      >
        {label}
      </span>
      {children}
    </div>
  );
}

export default function SettingsPanel() {
  const { settings, updateSettings } = useStudioStore();
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const inputStyle = {
    background: "oklch(var(--studio-surface))",
    borderColor: "oklch(var(--studio-border))",
    color: "oklch(var(--studio-text))",
    fontSize: "12px",
  };

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

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="pt-1 pb-0.5 px-1">
        <h2
          className="text-sm font-semibold"
          style={{ color: "oklch(var(--studio-text))" }}
        >
          Simulator Settings
        </h2>
      </div>

      {/* Contact */}
      <Card title="Contact Info">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => avatarInputRef.current?.click()}
            className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center text-sm font-bold transition-opacity hover:opacity-80"
            style={{ background: "oklch(var(--studio-blue))", color: "white" }}
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
          <div className="flex-1">
            <Input
              value={settings.contactName}
              onChange={(e) => updateSettings({ contactName: e.target.value })}
              placeholder="Contact name"
              style={inputStyle}
              className="h-8 text-xs"
              data-ocid="settings.input"
            />
          </div>
        </div>
      </Card>

      {/* Time */}
      <Card title="Status Bar">
        <SettingRow label="Time">
          <input
            type="text"
            value={settings.statusBarTime}
            onChange={(e) => updateSettings({ statusBarTime: e.target.value })}
            className="w-20 text-center rounded-md px-2 py-1 text-xs"
            style={inputStyle}
            maxLength={8}
            data-ocid="settings.input"
          />
        </SettingRow>
        <SettingRow label="Badge Count">
          <input
            type="number"
            value={settings.notificationBadge}
            onChange={(e) =>
              updateSettings({
                notificationBadge: Math.min(99, Math.max(0, +e.target.value)),
              })
            }
            className="w-20 text-center rounded-md px-2 py-1 text-xs"
            style={inputStyle}
            min={0}
            max={99}
            data-ocid="settings.input"
          />
        </SettingRow>
      </Card>

      {/* Message Settings */}
      <Card title="Message Settings">
        <div className="space-y-1.5">
          <Label
            className="text-xs"
            style={{ color: "oklch(var(--studio-muted))" }}
          >
            Read Receipt
          </Label>
          <div className="flex gap-1">
            {(["none", "delivered", "read"] as const).map((opt) => (
              <button
                type="button"
                key={opt}
                onClick={() => updateSettings({ readReceipt: opt })}
                className="flex-1 text-xs py-1.5 rounded-md font-medium capitalize transition-colors"
                style={{
                  background:
                    settings.readReceipt === opt
                      ? "oklch(var(--studio-blue))"
                      : "oklch(var(--studio-surface))",
                  color:
                    settings.readReceipt === opt
                      ? "white"
                      : "oklch(var(--studio-muted))",
                  border: "1px solid oklch(var(--studio-border))",
                }}
                data-ocid="settings.toggle"
              >
                {opt === "read"
                  ? "Read"
                  : opt.charAt(0).toUpperCase() + opt.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Theme */}
      <Card title="Theme">
        <SettingRow label="iPhone Dark Mode">
          <Switch
            checked={settings.darkMode}
            onCheckedChange={(v) => updateSettings({ darkMode: v })}
            data-ocid="settings.switch"
          />
        </SettingRow>
        <SettingRow label="Green Bubbles (SMS)">
          <Switch
            checked={settings.greenBubbles}
            onCheckedChange={(v) => updateSettings({ greenBubbles: v })}
            data-ocid="settings.switch"
          />
        </SettingRow>
      </Card>

      {/* Animation */}
      <Card title="Animation">
        <SettingRow label="Autoplay on Load">
          <Switch
            checked={settings.autoplay}
            onCheckedChange={(v) => updateSettings({ autoplay: v })}
            data-ocid="settings.switch"
          />
        </SettingRow>
      </Card>

      {/* Timing */}
      <Card title="Timing">
        <div className="space-y-4">
          <div className="space-y-2">
            <SettingRow label="Message Delay">
              <span
                className="text-xs font-mono"
                style={{ color: "oklch(var(--studio-blue))" }}
              >
                {settings.messageDelay}ms
              </span>
            </SettingRow>
            <Slider
              min={0}
              max={2000}
              step={50}
              value={[settings.messageDelay]}
              onValueChange={([v]) => updateSettings({ messageDelay: v })}
              data-ocid="settings.toggle"
            />
          </div>
          <div className="space-y-2">
            <SettingRow label="Typing Duration">
              <span
                className="text-xs font-mono"
                style={{ color: "oklch(var(--studio-blue))" }}
              >
                {settings.typingDuration}ms
              </span>
            </SettingRow>
            <Slider
              min={0}
              max={3000}
              step={100}
              value={[settings.typingDuration]}
              onValueChange={([v]) => updateSettings({ typingDuration: v })}
            />
          </div>
          <div className="space-y-2">
            <SettingRow label="Call Banner">
              <span
                className="text-xs font-mono"
                style={{ color: "oklch(var(--studio-blue))" }}
              >
                {settings.callBannerDuration}ms
              </span>
            </SettingRow>
            <Slider
              min={0}
              max={5000}
              step={100}
              value={[settings.callBannerDuration]}
              onValueChange={([v]) => updateSettings({ callBannerDuration: v })}
            />
          </div>

          {/* Playback speed */}
          <div className="space-y-2">
            <Label
              className="text-xs"
              style={{ color: "oklch(var(--studio-muted))" }}
            >
              Playback Speed
            </Label>
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
                  }}
                  data-ocid="settings.toggle"
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Export */}
      <ExportModal />

      <div className="pb-2" />
    </div>
  );
}
