import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ChevronDown,
  Clock,
  Copy,
  GripVertical,
  Phone,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import { useRef, useState } from "react";
import { type Message, useStudioStore } from "../../store/studioStore";

function SortableMessageRow({ msg, index }: { msg: Message; index: number }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: msg.id,
  });
  const { updateMessage, deleteMessage, duplicateMessage, toggleSender } =
    useStudioStore();

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  const isMe = msg.sender === "me";
  const isTimestamp = msg.type === "timestamp";
  const isCall = msg.type === "call";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group flex items-start gap-2 px-3 py-2 rounded-lg transition-colors hover:bg-white/5"
      data-ocid={`script.item.${index + 1}`}
    >
      {/* Drag handle */}
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="mt-2 cursor-grab active:cursor-grabbing flex-shrink-0 opacity-30 group-hover:opacity-60 transition-opacity"
        data-ocid="script.drag_handle"
      >
        <GripVertical
          size={14}
          style={{ color: "oklch(var(--studio-muted))" }}
        />
      </button>

      {/* Type pill */}
      <div className="flex flex-col gap-1.5 flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          {/* Sender toggle */}
          {!isTimestamp && !isCall && (
            <button
              type="button"
              onClick={() => toggleSender(msg.id)}
              className="text-xs font-semibold px-2 py-0.5 rounded-full transition-colors flex-shrink-0"
              style={{
                background: isMe
                  ? "oklch(var(--studio-blue))"
                  : "oklch(var(--studio-gray-bubble))",
                color: "white",
              }}
              data-ocid="script.toggle"
            >
              {isMe ? "Me" : "Them"}
            </button>
          )}
          {isTimestamp && (
            <span
              className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1"
              style={{
                background: "oklch(var(--studio-pill))",
                color: "oklch(var(--studio-muted))",
              }}
            >
              <Clock size={10} /> Time
            </span>
          )}
          {isCall && (
            <span
              className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1"
              style={{
                background: "oklch(var(--studio-pill))",
                color: "oklch(var(--studio-muted))",
              }}
            >
              <Phone size={10} /> Call
            </span>
          )}

          {/* Actions */}
          <div className="ml-auto flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={() => duplicateMessage(msg.id)}
              className="p-1 rounded hover:bg-white/10 transition-colors"
              title="Duplicate"
              data-ocid="script.secondary_button"
            >
              <Copy size={11} style={{ color: "oklch(var(--studio-muted))" }} />
            </button>
            <button
              type="button"
              onClick={() => deleteMessage(msg.id)}
              className="p-1 rounded hover:bg-red-500/20 transition-colors"
              title="Delete"
              data-ocid={`script.delete_button.${index + 1}`}
            >
              <Trash2
                size={11}
                style={{ color: "oklch(var(--destructive))" }}
              />
            </button>
          </div>
        </div>

        {/* Text input */}
        <input
          type="text"
          value={msg.text}
          onChange={(e) => updateMessage(msg.id, e.target.value)}
          placeholder={
            isTimestamp
              ? "Timestamp..."
              : isCall
                ? "Call description..."
                : "Message text..."
          }
          className="studio-input w-full text-xs"
          style={{
            background: "oklch(var(--studio-surface))",
            border: "1px solid oklch(var(--studio-border))",
            color: "oklch(var(--studio-text))",
            borderRadius: "6px",
            padding: "5px 8px",
            fontSize: "12px",
            outline: "none",
          }}
          data-ocid="script.input"
        />
      </div>
    </div>
  );
}

export default function ScriptBuilder() {
  const { messages, addMessage, setMessages, loadPreset } = useStudioStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [presetsOpen, setPresetsOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = messages.findIndex((m) => m.id === active.id);
    const newIndex = messages.findIndex((m) => m.id === over.id);
    setMessages(arrayMove(messages, oldIndex, newIndex));
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      const lines = text.split("\n").filter((l) => l.trim());
      const parsed = lines.map((line) => {
        const meMatch = line.match(/^(Me|me|ME):\s*(.*)/);
        const themMatch = line.match(
          /^(Them|them|THEM|Contact|contact):\s*(.*)/,
        );
        if (meMatch)
          return {
            id: Math.random().toString(36).slice(2),
            sender: "me" as const,
            type: "message" as const,
            text: meMatch[2],
          };
        if (themMatch)
          return {
            id: Math.random().toString(36).slice(2),
            sender: "them" as const,
            type: "message" as const,
            text: themMatch[2],
          };
        return {
          id: Math.random().toString(36).slice(2),
          sender: "me" as const,
          type: "message" as const,
          text: line,
        };
      });
      setMessages(parsed);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className="px-4 py-3 border-b flex-shrink-0"
        style={{ borderColor: "oklch(var(--studio-border))" }}
      >
        <div className="flex items-center justify-between mb-3">
          <h2
            className="text-sm font-semibold"
            style={{ color: "oklch(var(--studio-text))" }}
          >
            Script Builder
          </h2>
          <DropdownMenu open={presetsOpen} onOpenChange={setPresetsOpen}>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="text-xs px-2 py-1 rounded-md flex items-center gap-1 transition-colors hover:bg-white/10"
                style={{
                  color: "oklch(var(--studio-muted))",
                  border: "1px solid oklch(var(--studio-border))",
                }}
                data-ocid="script.open_modal_button"
              >
                Presets <ChevronDown size={11} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              style={{
                background: "oklch(var(--studio-panel))",
                borderColor: "oklch(var(--studio-border))",
              }}
              data-ocid="script.dropdown_menu"
            >
              {[
                { key: "dating-drama", label: "💔 Dating Drama" },
                { key: "caught-cheating", label: "🚨 Caught Cheating" },
                { key: "prank-script", label: "😂 Prank Script" },
              ].map((p) => (
                <DropdownMenuItem
                  key={p.key}
                  onClick={() => loadPreset(p.key)}
                  className="text-sm cursor-pointer"
                  style={{ color: "oklch(var(--studio-text))" }}
                >
                  {p.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => addMessage("me")}
            className="flex items-center gap-1 text-xs px-2 py-1 rounded-md font-medium transition-colors hover:opacity-90"
            style={{ background: "oklch(var(--studio-blue))", color: "white" }}
            data-ocid="script.primary_button"
          >
            <Plus size={11} /> Me
          </button>
          <button
            type="button"
            onClick={() => addMessage("them")}
            className="flex items-center gap-1 text-xs px-2 py-1 rounded-md font-medium transition-colors hover:opacity-90"
            style={{
              background: "oklch(var(--studio-gray-bubble))",
              color: "white",
            }}
            data-ocid="script.secondary_button"
          >
            <Plus size={11} /> Them
          </button>
          <button
            type="button"
            onClick={() => addMessage("me", "timestamp")}
            className="flex items-center gap-1 text-xs px-2 py-1 rounded-md transition-colors hover:bg-white/10"
            style={{
              background: "oklch(var(--studio-pill))",
              color: "oklch(var(--studio-muted))",
            }}
            data-ocid="script.button"
          >
            <Clock size={11} /> Time
          </button>
          <button
            type="button"
            onClick={() => addMessage("me", "call")}
            className="flex items-center gap-1 text-xs px-2 py-1 rounded-md transition-colors hover:bg-white/10"
            style={{
              background: "oklch(var(--studio-pill))",
              color: "oklch(var(--studio-muted))",
            }}
            data-ocid="script.button"
          >
            <Phone size={11} /> Call
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 text-xs px-2 py-1 rounded-md transition-colors hover:bg-white/10"
            style={{
              background: "oklch(var(--studio-pill))",
              color: "oklch(var(--studio-muted))",
            }}
            data-ocid="script.upload_button"
          >
            <Upload size={11} /> .txt
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt"
            className="hidden"
            onChange={handleImport}
          />
        </div>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto py-2">
        {messages.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center h-32 text-center px-4"
            data-ocid="script.empty_state"
          >
            <p
              className="text-xs"
              style={{ color: "oklch(var(--studio-muted))" }}
            >
              No messages yet. Add some or load a preset.
            </p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={messages.map((m) => m.id)}
              strategy={verticalListSortingStrategy}
            >
              {messages.map((msg, i) => (
                <SortableMessageRow key={msg.id} msg={msg} index={i} />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
}
