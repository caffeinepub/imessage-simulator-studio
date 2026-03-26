import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { FolderOpen, MessageSquare, Save, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useStudioStore } from "../store/studioStore";

export default function TopNav() {
  const { saveProject, getSavedProjects, loadProject, deleteProject } =
    useStudioStore();
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projects, setProjects] = useState<Array<{ name: string; data: any }>>(
    [],
  );

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

  return (
    <header
      className="flex items-center justify-between px-5 h-14 border-b flex-shrink-0"
      style={{
        background: "oklch(var(--studio-panel))",
        borderColor: "oklch(var(--studio-border))",
      }}
      data-ocid="nav.section"
    >
      {/* Brand */}
      <div className="flex items-center gap-2.5">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: "oklch(var(--studio-blue))" }}
        >
          <MessageSquare size={15} className="text-white" />
        </div>
        <span
          className="text-sm font-semibold"
          style={{ color: "oklch(var(--studio-text))" }}
        >
          iMessage{" "}
          <span style={{ color: "oklch(var(--studio-muted))" }}>Studio</span>
        </span>
      </div>

      {/* Center links */}
      <nav className="hidden md:flex items-center gap-6">
        {["App", "Features", "Pricing", "Docs"].map((link) => (
          <a
            key={link}
            href="/"
            className="text-sm font-medium transition-colors hover:opacity-100"
            style={{ color: "oklch(var(--studio-muted))" }}
            data-ocid="nav.link"
          >
            {link}
          </a>
        ))}
      </nav>

      {/* Right: actions */}
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="ghost"
          className="gap-1.5 text-xs"
          onClick={() => setSaveDialogOpen(true)}
          style={{ color: "oklch(var(--studio-muted))" }}
          data-ocid="nav.save_button"
        >
          <Save size={13} />
          Save
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="gap-1.5 text-xs"
          onClick={handleOpenLoad}
          style={{ color: "oklch(var(--studio-muted))" }}
          data-ocid="nav.open_modal_button"
        >
          <FolderOpen size={13} />
          Load
        </Button>
        <button
          type="button"
          className="text-xs font-medium px-3 py-1.5 rounded-full transition-opacity hover:opacity-90"
          style={{
            background: "oklch(var(--primary))",
            color: "oklch(var(--primary-foreground))",
          }}
          data-ocid="nav.primary_button"
        >
          Upgrade to Pro
        </button>
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold"
          style={{ background: "oklch(var(--studio-blue))", color: "white" }}
        >
          U
        </div>
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
            <Button
              className="w-full"
              onClick={handleSave}
              disabled={!projectName.trim()}
              style={{
                background: "oklch(var(--studio-blue))",
                color: "white",
              }}
              data-ocid="save.submit_button"
            >
              Save
            </Button>
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
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleLoad(project.data)}
                        style={{ color: "oklch(var(--studio-blue))" }}
                        data-ocid={`load.primary_button.${i + 1}`}
                      >
                        Load
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(project.name)}
                        data-ocid={`load.delete_button.${i + 1}`}
                      >
                        <Trash2
                          size={13}
                          style={{ color: "oklch(var(--destructive))" }}
                        />
                      </Button>
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
