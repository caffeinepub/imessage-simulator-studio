import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  FolderOpen,
  Play,
  RotateCcw,
  Save,
  Shield,
  Square,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useStudioStore } from "../store/studioStore";

interface TopNavProps {
  isAdmin?: boolean;
  onAdminClick?: () => void;
}

export default function TopNav({ isAdmin, onAdminClick }: TopNavProps) {
  const {
    saveProject,
    getSavedProjects,
    loadProject,
    deleteProject,
    isPlaying,
    setIsPlaying,
    setVisibleCount,
  } = useStudioStore();
  const { identity, clear } = useInternetIdentity();
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projects, setProjects] = useState<Array<{ name: string; data: any }>>(
    [],
  );

  const principalShort = identity
    ? `${identity.getPrincipal().toString().slice(0, 5)}...`
    : null;

  const handleSave = () => {
    if (!projectName.trim()) return;
    saveProject(projectName.trim());
    toast.success(`Project "${projectName}" saved`);
    setSaveDialogOpen(false);
    setProjectName("");
  };

  const handleOpenLoad = () => {
    setProjects(getSavedProjects());
    setLoadDialogOpen(true);
  };

  const handleLoad = (data: any) => {
    loadProject(data);
    setLoadDialogOpen(false);
    toast.success("Project loaded");
  };

  const handleDelete = (name: string) => {
    deleteProject(name);
    setProjects(getSavedProjects());
    toast.success(`Deleted "${name}"`);
  };

  const handlePlayStop = () => {
    if (isPlaying) {
      setIsPlaying(false);
    } else {
      setVisibleCount(0);
      setIsPlaying(true);
    }
  };

  const handleReset = () => {
    setIsPlaying(false);
    setVisibleCount(0);
  };

  return (
    <header
      className="flex items-center justify-between px-5 h-14 border-b flex-shrink-0"
      style={{
        background: "oklch(var(--studio-header))",
        borderColor: "oklch(var(--studio-border))",
      }}
      data-ocid="nav.section"
    >
      {/* Left: Brand + account pills */}
      <div className="flex items-center gap-3">
        <div className="flex flex-col leading-tight">
          <span
            className="font-bold"
            style={{
              fontSize: "18px",
              color: "oklch(var(--studio-text))",
              lineHeight: 1.2,
            }}
          >
            iMessage Simulator
          </span>
        </div>
        <div className="flex items-center gap-1.5 ml-1">
          {principalShort && (
            <button
              type="button"
              className="studio-pill-btn"
              data-ocid="nav.secondary_button"
              title={identity?.getPrincipal().toString()}
            >
              {principalShort}
            </button>
          )}
          <button
            type="button"
            className="studio-pill-btn"
            onClick={() => clear()}
            data-ocid="nav.secondary_button"
          >
            Sign out
          </button>
          {isAdmin && (
            <button
              type="button"
              className="studio-pill-btn flex items-center gap-1"
              style={{
                background: "oklch(var(--studio-blue) / 0.15)",
                color: "oklch(var(--studio-blue))",
                borderColor: "oklch(var(--studio-blue) / 0.3)",
              }}
              onClick={onAdminClick}
              data-ocid="nav.link"
            >
              <Shield size={10} />
              Admin
            </button>
          )}
        </div>
      </div>

      {/* Right: Play/Stop, Reset, Export, Save, Load */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handlePlayStop}
          className="flex items-center gap-1.5 font-semibold px-4 py-1.5 rounded-full transition-opacity hover:opacity-90"
          style={{
            background: isPlaying
              ? "oklch(var(--studio-red))"
              : "oklch(var(--studio-blue))",
            color: "white",
            fontSize: "12px",
          }}
          data-ocid="nav.primary_button"
        >
          {isPlaying ? (
            <>
              <Square size={11} fill="white" />
              Stop
            </>
          ) : (
            <>
              <Play size={11} fill="white" />
              Play
            </>
          )}
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="studio-pill-btn flex items-center gap-1"
          data-ocid="nav.button"
        >
          <RotateCcw size={10} />
          Reset
        </button>
        <button
          type="button"
          className="studio-pill-btn"
          onClick={() => {
            toast.info("Use the Export button in the Settings panel");
          }}
          data-ocid="nav.secondary_button"
        >
          Export
        </button>
        <button
          type="button"
          className="studio-pill-btn flex items-center gap-1"
          onClick={() => setSaveDialogOpen(true)}
          data-ocid="nav.save_button"
          title="Save project"
        >
          <Save size={10} />
          Save
        </button>
        <button
          type="button"
          className="studio-pill-btn flex items-center gap-1"
          onClick={handleOpenLoad}
          data-ocid="nav.open_modal_button"
          title="Load project"
        >
          <FolderOpen size={10} />
          Load
        </button>
      </div>

      {/* Save Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent
          className="max-w-sm"
          style={{
            background: "oklch(var(--studio-panel))",
            borderColor: "oklch(var(--studio-border))",
          }}
          data-ocid="save.dialog"
        >
          <DialogHeader>
            <DialogTitle style={{ color: "oklch(var(--studio-text))" }}>
              Save Project
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <Input
              placeholder="Project name..."
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              className="studio-input"
              style={{
                background: "oklch(var(--studio-surface))",
                borderColor: "oklch(var(--studio-border))",
                color: "oklch(var(--studio-text))",
              }}
              data-ocid="save.input"
            />
            <button
              type="button"
              className="w-full py-2 rounded-lg text-sm font-medium"
              onClick={handleSave}
              disabled={!projectName.trim()}
              style={{
                background: "oklch(var(--studio-blue))",
                color: "white",
                opacity: projectName.trim() ? 1 : 0.4,
              }}
              data-ocid="save.submit_button"
            >
              Save
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Load Dialog */}
      <Dialog open={loadDialogOpen} onOpenChange={setLoadDialogOpen}>
        <DialogContent
          className="max-w-sm"
          style={{
            background: "oklch(var(--studio-panel))",
            borderColor: "oklch(var(--studio-border))",
          }}
          data-ocid="load.dialog"
        >
          <DialogHeader>
            <DialogTitle style={{ color: "oklch(var(--studio-text))" }}>
              Load Project
            </DialogTitle>
          </DialogHeader>
          <div className="mt-2 space-y-2">
            {projects.filter((p) => p.name !== "__autosave__").length === 0 ? (
              <p
                className="text-sm text-center py-4"
                style={{ color: "oklch(var(--studio-muted))" }}
                data-ocid="load.empty_state"
              >
                No saved projects yet.
              </p>
            ) : (
              projects
                .filter((p) => p.name !== "__autosave__")
                .map((project, i) => (
                  <div
                    key={project.name}
                    className="flex items-center justify-between rounded-lg p-3"
                    style={{
                      background: "oklch(var(--studio-surface))",
                      border: "1px solid oklch(var(--studio-border))",
                    }}
                    data-ocid={`load.item.${i + 1}`}
                  >
                    <span
                      className="text-sm font-medium"
                      style={{ color: "oklch(var(--studio-text))" }}
                    >
                      {project.name}
                    </span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        className="text-xs px-2 py-1 rounded"
                        onClick={() => handleLoad(project.data)}
                        style={{ color: "oklch(var(--studio-blue))" }}
                        data-ocid={`load.primary_button.${i + 1}`}
                      >
                        Load
                      </button>
                      <button
                        type="button"
                        className="text-xs px-2 py-1 rounded hover:bg-white/10"
                        onClick={() => handleDelete(project.name)}
                        data-ocid={`load.delete_button.${i + 1}`}
                      >
                        <Trash2
                          size={13}
                          style={{ color: "oklch(var(--destructive))" }}
                        />
                      </button>
                    </div>
                  </div>
                ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
}
