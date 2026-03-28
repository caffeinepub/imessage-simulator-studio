import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Principal } from "@icp-sdk/core/principal";
import {
  Loader2,
  Plus,
  RefreshCw,
  Shield,
  Trash2,
  UserCog,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { UserRole, Variant_active_suspended } from "../../backend";
import type { UserSummary } from "../../backend";
import { useActor } from "../../hooks/useActor";

interface EditState {
  principal: Principal;
  name: string;
  email: string;
  role: UserRole;
}

interface AdminPanelProps {
  onBack: () => void;
}

export default function AdminPanel({ onBack }: AdminPanelProps) {
  const { actor, isFetching } = useActor();
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMutating, setIsMutating] = useState(false);

  // Add form
  const [addPrincipal, setAddPrincipal] = useState("");
  const [addName, setAddName] = useState("");
  const [addEmail, setAddEmail] = useState("");
  const [addRole, setAddRole] = useState<UserRole>(UserRole.user);
  const [isAdding, setIsAdding] = useState(false);

  // Edit dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editState, setEditState] = useState<EditState | null>(null);

  // Confirm remove dialog
  const [removeOpen, setRemoveOpen] = useState(false);
  const [removePrincipal, setRemovePrincipal] = useState<Principal | null>(
    null,
  );

  const fetchUsers = useCallback(async () => {
    if (!actor) return;
    setIsLoading(true);
    try {
      const list = await actor.listUsers();
      setUsers(list);
    } catch (_e) {
      toast.error("Failed to load users");
    } finally {
      setIsLoading(false);
    }
  }, [actor]);

  useEffect(() => {
    if (actor && !isFetching) fetchUsers();
  }, [actor, isFetching, fetchUsers]);

  const handleAdd = async () => {
    if (!actor || !addPrincipal.trim() || !addName.trim()) return;
    setIsAdding(true);
    try {
      const principal = Principal.fromText(addPrincipal.trim());
      await (actor as any).addUser(
        principal,
        addName.trim(),
        addEmail.trim() || null,
        addRole,
      );
      toast.success("User added successfully");
      setAddPrincipal("");
      setAddName("");
      setAddEmail("");
      setAddRole(UserRole.user);
      await fetchUsers();
    } catch (_e) {
      toast.error("Failed to add user — check the principal ID");
    } finally {
      setIsAdding(false);
    }
  };

  const handleSuspend = async (principal: Principal) => {
    if (!actor) return;
    setIsMutating(true);
    try {
      await actor.suspendUser(principal);
      toast.success("User suspended");
      await fetchUsers();
    } catch (_e) {
      toast.error("Failed to suspend user");
    } finally {
      setIsMutating(false);
    }
  };

  const handleUnsuspend = async (principal: Principal) => {
    if (!actor) return;
    setIsMutating(true);
    try {
      await actor.unsuspendUser(principal);
      toast.success("User unsuspended");
      await fetchUsers();
    } catch (_e) {
      toast.error("Failed to unsuspend user");
    } finally {
      setIsMutating(false);
    }
  };

  const handleOpenEdit = (user: UserSummary) => {
    setEditState({
      principal: user.principal,
      name: user.profile.name,
      email: (user.profile as any).email ?? "",
      role: user.role,
    });
    setEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!actor || !editState) return;
    setIsMutating(true);
    try {
      await (actor as any).updateUser(
        editState.principal,
        editState.name,
        editState.email.trim() || null,
        editState.role,
      );
      toast.success("User updated");
      setEditOpen(false);
      await fetchUsers();
    } catch (_e) {
      toast.error("Failed to update user");
    } finally {
      setIsMutating(false);
    }
  };

  const handleOpenRemove = (principal: Principal) => {
    setRemovePrincipal(principal);
    setRemoveOpen(true);
  };

  const handleConfirmRemove = async () => {
    if (!actor || !removePrincipal) return;
    setIsMutating(true);
    try {
      await actor.removeUser(removePrincipal);
      toast.success("User removed");
      setRemoveOpen(false);
      setRemovePrincipal(null);
      await fetchUsers();
    } catch (_e) {
      toast.error("Failed to remove user");
    } finally {
      setIsMutating(false);
    }
  };

  const roleBadgeStyle = (role: UserRole) => {
    switch (role) {
      case UserRole.admin:
        return {
          background: "oklch(var(--studio-blue) / 0.2)",
          color: "oklch(var(--studio-blue))",
        };
      case UserRole.user:
        return {
          background: "oklch(var(--studio-green) / 0.2)",
          color: "oklch(var(--studio-green))",
        };
      default:
        return {
          background: "oklch(var(--studio-muted) / 0.2)",
          color: "oklch(var(--studio-muted))",
        };
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "oklch(var(--studio-bg))" }}
      data-ocid="admin.panel"
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-6 py-4 border-b"
        style={{
          borderColor: "oklch(var(--studio-border))",
          background: "oklch(var(--studio-header))",
        }}
      >
        <div className="flex items-center gap-3">
          <Shield size={18} style={{ color: "oklch(var(--studio-blue))" }} />
          <div>
            <h1
              className="font-bold text-base"
              style={{ color: "oklch(var(--studio-text))" }}
            >
              User Management
            </h1>
            <p
              className="text-xs"
              style={{ color: "oklch(var(--studio-muted))" }}
            >
              Add, update, suspend, or remove users
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchUsers}
            disabled={isLoading}
            className="studio-pill-btn flex items-center gap-1"
            data-ocid="admin.secondary_button"
          >
            <RefreshCw size={11} className={isLoading ? "animate-spin" : ""} />
            Refresh
          </button>
          <button
            type="button"
            onClick={onBack}
            className="studio-pill-btn"
            data-ocid="admin.secondary_button"
          >
            ← Back to Studio
          </button>
        </div>
      </div>

      <div className="flex-1 p-6 space-y-6 max-w-5xl w-full mx-auto">
        {/* Add User Form */}
        <div
          className="rounded-xl p-5"
          style={{
            background: "oklch(var(--studio-panel))",
            border: "1px solid oklch(var(--studio-border))",
          }}
          data-ocid="admin.card"
        >
          <h2
            className="text-xs font-semibold uppercase tracking-widest mb-4"
            style={{ color: "oklch(var(--studio-muted))" }}
          >
            Add New User
          </h2>
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex flex-col gap-1 flex-1 min-w-48">
              <Label
                className="text-xs"
                style={{ color: "oklch(var(--studio-muted))" }}
              >
                Principal ID
              </Label>
              <Input
                placeholder="aaaaa-bbbbb-ccccc..."
                value={addPrincipal}
                onChange={(e) => setAddPrincipal(e.target.value)}
                style={{
                  background: "oklch(var(--studio-surface))",
                  borderColor: "oklch(var(--studio-border))",
                  color: "oklch(var(--studio-text))",
                  fontSize: "12px",
                }}
                data-ocid="admin.input"
              />
            </div>
            <div className="flex flex-col gap-1 w-40">
              <Label
                className="text-xs"
                style={{ color: "oklch(var(--studio-muted))" }}
              >
                Name
              </Label>
              <Input
                placeholder="Display name"
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                style={{
                  background: "oklch(var(--studio-surface))",
                  borderColor: "oklch(var(--studio-border))",
                  color: "oklch(var(--studio-text))",
                  fontSize: "12px",
                }}
                data-ocid="admin.input"
              />
            </div>
            <div className="flex flex-col gap-1 w-44">
              <Label
                className="text-xs"
                style={{ color: "oklch(var(--studio-muted))" }}
              >
                Email{" "}
                <span style={{ color: "oklch(var(--studio-muted) / 0.6)" }}>
                  (optional)
                </span>
              </Label>
              <Input
                type="email"
                placeholder="user@example.com"
                value={addEmail}
                onChange={(e) => setAddEmail(e.target.value)}
                style={{
                  background: "oklch(var(--studio-surface))",
                  borderColor: "oklch(var(--studio-border))",
                  color: "oklch(var(--studio-text))",
                  fontSize: "12px",
                }}
                data-ocid="admin.input"
              />
            </div>
            <div className="flex flex-col gap-1 w-32">
              <Label
                className="text-xs"
                style={{ color: "oklch(var(--studio-muted))" }}
              >
                Role
              </Label>
              <Select
                value={addRole}
                onValueChange={(v) => setAddRole(v as UserRole)}
              >
                <SelectTrigger
                  style={{
                    background: "oklch(var(--studio-surface))",
                    borderColor: "oklch(var(--studio-border))",
                    color: "oklch(var(--studio-text))",
                    fontSize: "12px",
                  }}
                  data-ocid="admin.select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent
                  style={{
                    background: "oklch(var(--studio-panel))",
                    borderColor: "oklch(var(--studio-border))",
                  }}
                >
                  <SelectItem value={UserRole.user}>User</SelectItem>
                  <SelectItem value={UserRole.admin}>Admin</SelectItem>
                  <SelectItem value={UserRole.guest}>Guest</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleAdd}
              disabled={isAdding || !addPrincipal.trim() || !addName.trim()}
              className="flex items-center gap-1.5"
              style={{
                background: "oklch(var(--studio-blue))",
                color: "white",
                fontSize: "12px",
                height: "36px",
              }}
              data-ocid="admin.primary_button"
            >
              {isAdding ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Plus size={13} />
              )}
              Add User
            </Button>
          </div>
        </div>

        {/* Users Table */}
        <div
          className="rounded-xl overflow-hidden"
          style={{
            background: "oklch(var(--studio-panel))",
            border: "1px solid oklch(var(--studio-border))",
          }}
        >
          <div
            className="px-5 py-3 border-b"
            style={{ borderColor: "oklch(var(--studio-border))" }}
          >
            <h2
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: "oklch(var(--studio-muted))" }}
            >
              All Users ({users.length})
            </h2>
          </div>

          {isLoading ? (
            <div
              className="flex items-center justify-center py-16 gap-2"
              data-ocid="admin.loading_state"
            >
              <Loader2
                size={16}
                className="animate-spin"
                style={{ color: "oklch(var(--studio-muted))" }}
              />
              <span
                className="text-sm"
                style={{ color: "oklch(var(--studio-muted))" }}
              >
                Loading users…
              </span>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-16" data-ocid="admin.empty_state">
              <p
                className="text-sm"
                style={{ color: "oklch(var(--studio-muted))" }}
              >
                No users found. Add one above.
              </p>
            </div>
          ) : (
            <Table data-ocid="admin.table">
              <TableHeader>
                <TableRow
                  style={{ borderColor: "oklch(var(--studio-border))" }}
                >
                  <TableHead
                    className="text-xs"
                    style={{ color: "oklch(var(--studio-muted))" }}
                  >
                    Principal
                  </TableHead>
                  <TableHead
                    className="text-xs"
                    style={{ color: "oklch(var(--studio-muted))" }}
                  >
                    Name
                  </TableHead>
                  <TableHead
                    className="text-xs"
                    style={{ color: "oklch(var(--studio-muted))" }}
                  >
                    Email
                  </TableHead>
                  <TableHead
                    className="text-xs"
                    style={{ color: "oklch(var(--studio-muted))" }}
                  >
                    Role
                  </TableHead>
                  <TableHead
                    className="text-xs"
                    style={{ color: "oklch(var(--studio-muted))" }}
                  >
                    Status
                  </TableHead>
                  <TableHead
                    className="text-xs text-right"
                    style={{ color: "oklch(var(--studio-muted))" }}
                  >
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user, i) => (
                  <TableRow
                    key={user.principal.toString()}
                    style={{ borderColor: "oklch(var(--studio-border))" }}
                    data-ocid={`admin.row.${i + 1}`}
                  >
                    <TableCell>
                      <code
                        className="text-xs px-2 py-0.5 rounded"
                        style={{
                          background: "oklch(var(--studio-surface))",
                          color: "oklch(var(--studio-text))",
                          fontFamily: "monospace",
                        }}
                      >
                        {user.principal.toString().slice(0, 12)}…
                      </code>
                    </TableCell>
                    <TableCell
                      className="text-sm font-medium"
                      style={{ color: "oklch(var(--studio-text))" }}
                    >
                      {user.profile.name}
                    </TableCell>
                    <TableCell
                      className="text-sm"
                      style={{
                        color: (user.profile as any).email
                          ? "oklch(var(--studio-text))"
                          : "oklch(var(--studio-muted))",
                      }}
                    >
                      {(user.profile as any).email || "—"}
                    </TableCell>
                    <TableCell>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={roleBadgeStyle(user.role)}
                      >
                        {user.role}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{
                          background:
                            user.profile.status ===
                            Variant_active_suspended.active
                              ? "oklch(var(--studio-green) / 0.15)"
                              : "oklch(var(--destructive) / 0.15)",
                          color:
                            user.profile.status ===
                            Variant_active_suspended.active
                              ? "oklch(var(--studio-green))"
                              : "oklch(var(--destructive))",
                        }}
                      >
                        {user.profile.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {user.profile.status ===
                          Variant_active_suspended.active && (
                          <button
                            type="button"
                            onClick={() => handleSuspend(user.principal)}
                            disabled={isMutating}
                            className="text-xs px-2.5 py-1 rounded transition-opacity hover:opacity-80"
                            style={{
                              background: "oklch(var(--studio-amber) / 0.15)",
                              color: "oklch(var(--studio-amber))",
                            }}
                            data-ocid={`admin.toggle.${i + 1}`}
                          >
                            Suspend
                          </button>
                        )}
                        {user.profile.status ===
                          Variant_active_suspended.suspended && (
                          <button
                            type="button"
                            onClick={() => handleUnsuspend(user.principal)}
                            disabled={isMutating}
                            className="text-xs px-2.5 py-1 rounded transition-opacity hover:opacity-80"
                            style={{
                              background: "oklch(var(--studio-green) / 0.15)",
                              color: "oklch(var(--studio-green))",
                            }}
                            data-ocid={`admin.toggle.${i + 1}`}
                          >
                            Unsuspend
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(user)}
                          disabled={isMutating}
                          className="text-xs px-2.5 py-1 rounded transition-opacity hover:opacity-80"
                          style={{
                            background: "oklch(var(--studio-blue) / 0.15)",
                            color: "oklch(var(--studio-blue))",
                          }}
                          data-ocid={`admin.edit_button.${i + 1}`}
                        >
                          <UserCog size={12} className="inline mr-1" />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenRemove(user.principal)}
                          disabled={isMutating}
                          className="text-xs px-2.5 py-1 rounded transition-opacity hover:opacity-80"
                          style={{
                            background: "oklch(var(--destructive) / 0.15)",
                            color: "oklch(var(--destructive))",
                          }}
                          data-ocid={`admin.delete_button.${i + 1}`}
                        >
                          <Trash2 size={12} className="inline mr-1" />
                          Remove
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent
          style={{
            background: "oklch(var(--studio-panel))",
            borderColor: "oklch(var(--studio-border))",
          }}
          data-ocid="admin.dialog"
        >
          <DialogHeader>
            <DialogTitle style={{ color: "oklch(var(--studio-text))" }}>
              Edit User
            </DialogTitle>
          </DialogHeader>
          {editState && (
            <div className="space-y-4 py-2">
              <div className="space-y-1">
                <Label
                  className="text-xs"
                  style={{ color: "oklch(var(--studio-muted))" }}
                >
                  Principal
                </Label>
                <code
                  className="block text-xs px-3 py-2 rounded"
                  style={{
                    background: "oklch(var(--studio-surface))",
                    color: "oklch(var(--studio-muted))",
                    fontFamily: "monospace",
                  }}
                >
                  {editState.principal.toString()}
                </code>
              </div>
              <div className="space-y-1">
                <Label
                  className="text-xs"
                  style={{ color: "oklch(var(--studio-muted))" }}
                >
                  Name
                </Label>
                <Input
                  value={editState.name}
                  onChange={(e) =>
                    setEditState((s) =>
                      s ? { ...s, name: e.target.value } : s,
                    )
                  }
                  style={{
                    background: "oklch(var(--studio-surface))",
                    borderColor: "oklch(var(--studio-border))",
                    color: "oklch(var(--studio-text))",
                  }}
                  data-ocid="admin.input"
                />
              </div>
              <div className="space-y-1">
                <Label
                  className="text-xs"
                  style={{ color: "oklch(var(--studio-muted))" }}
                >
                  Email{" "}
                  <span style={{ color: "oklch(var(--studio-muted) / 0.6)" }}>
                    (optional)
                  </span>
                </Label>
                <Input
                  type="email"
                  placeholder="user@example.com"
                  value={editState.email}
                  onChange={(e) =>
                    setEditState((s) =>
                      s ? { ...s, email: e.target.value } : s,
                    )
                  }
                  style={{
                    background: "oklch(var(--studio-surface))",
                    borderColor: "oklch(var(--studio-border))",
                    color: "oklch(var(--studio-text))",
                  }}
                  data-ocid="admin.input"
                />
              </div>
              <div className="space-y-1">
                <Label
                  className="text-xs"
                  style={{ color: "oklch(var(--studio-muted))" }}
                >
                  Role
                </Label>
                <Select
                  value={editState.role}
                  onValueChange={(v) =>
                    setEditState((s) => (s ? { ...s, role: v as UserRole } : s))
                  }
                >
                  <SelectTrigger
                    style={{
                      background: "oklch(var(--studio-surface))",
                      borderColor: "oklch(var(--studio-border))",
                      color: "oklch(var(--studio-text))",
                    }}
                    data-ocid="admin.select"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent
                    style={{
                      background: "oklch(var(--studio-panel))",
                      borderColor: "oklch(var(--studio-border))",
                    }}
                  >
                    <SelectItem value={UserRole.user}>User</SelectItem>
                    <SelectItem value={UserRole.admin}>Admin</SelectItem>
                    <SelectItem value={UserRole.guest}>Guest</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <button
              type="button"
              onClick={() => setEditOpen(false)}
              className="studio-pill-btn"
              data-ocid="admin.cancel_button"
            >
              Cancel
            </button>
            <Button
              onClick={handleSaveEdit}
              disabled={isMutating || !editState?.name.trim()}
              style={{
                background: "oklch(var(--studio-blue))",
                color: "white",
              }}
              data-ocid="admin.save_button"
            >
              {isMutating ? (
                <Loader2 size={14} className="animate-spin mr-1" />
              ) : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Remove Dialog */}
      <Dialog open={removeOpen} onOpenChange={setRemoveOpen}>
        <DialogContent
          style={{
            background: "oklch(var(--studio-panel))",
            borderColor: "oklch(var(--studio-border))",
          }}
          data-ocid="admin.dialog"
        >
          <DialogHeader>
            <DialogTitle style={{ color: "oklch(var(--studio-text))" }}>
              Remove User
            </DialogTitle>
          </DialogHeader>
          <p
            className="text-sm py-2"
            style={{ color: "oklch(var(--studio-muted))" }}
          >
            Are you sure you want to permanently remove this user? This action
            cannot be undone.
          </p>
          {removePrincipal && (
            <code
              className="block text-xs px-3 py-2 rounded"
              style={{
                background: "oklch(var(--studio-surface))",
                color: "oklch(var(--studio-muted))",
                fontFamily: "monospace",
              }}
            >
              {removePrincipal.toString()}
            </code>
          )}
          <DialogFooter>
            <button
              type="button"
              onClick={() => setRemoveOpen(false)}
              className="studio-pill-btn"
              data-ocid="admin.cancel_button"
            >
              Cancel
            </button>
            <Button
              onClick={handleConfirmRemove}
              disabled={isMutating}
              style={{
                background: "oklch(var(--destructive))",
                color: "white",
              }}
              data-ocid="admin.confirm_button"
            >
              {isMutating ? (
                <Loader2 size={14} className="animate-spin mr-1" />
              ) : null}
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
