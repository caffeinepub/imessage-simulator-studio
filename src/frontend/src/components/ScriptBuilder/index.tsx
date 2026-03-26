import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronDown,
  Clock,
  Copy,
  GripVertical,
  Phone,
  Plus,
  Trash2,
} from "lucide-react";
import { useRef, useState } from "react";
import { type Message, useStudioStore } from "../../store/studioStore";

function MessageRow({
  msg,
  index,
  onDragStart,
  onDragOver,
  onDrop,
}: {
  msg: Message;
  index: number;
  onDragStart: (i: number) => void;
  onDragOver: (e: React.DragEvent, i: number) => void;
  onDrop: (i: number) => void;
}) {
  const { updateMessage, deleteMessage, duplicateMessage, toggleSender } =
    useStudioStore();
  const [dragOver, setDragOver] = useState(false);

  const isMe = msg.sender === "me";
  const isTimestamp = msg.type === "timestamp";
  const isCall = msg.type === "call";

  return (
    <div
      draggable
      onDragStart={() => onDragStart(index)}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
        onDragOver(e, index);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={() => {
        setDragOver(false);
        onDrop(index);
      }}
      style={{
        borderBottomColor: "oklch(var(--studio-border))",
        minHeight: "38px",
        opacity: dragOver ? 0.6 : 1,
        background: dragOver ? "oklch(var(--studio-surface) / 0.5)" : undefined,
      }}
      className="group flex items-center gap-2 px-3 py-2 border-b transition-colors hover:bg-white/[0.03]"
      data-ocid={`script.item.${index + 1}`}
    >
      {/* Drag handle */}
      <span
        className="cursor-grab active:cursor-grabbing flex-shrink-0 opacity-20 group-hover:opacity-50 transition-opacity"
        data-ocid="script.drag_handle"
      >
        <GripVertical
          size={13}
          style={{ color: "oklch(var(--studio-muted))" }}
        />
      </span>

      {/* Role chip */}
      {!isTimestamp && !isCall && (
        <button
          type="button"
          onClick={() => toggleSender(msg.id)}
          className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 transition-opacity hover:opacity-80"
          style={{
            background: isMe
              ? "oklch(var(--studio-blue-chip))"
              : "oklch(var(--studio-green-chip))",
            color: "white",
            fontSize: "10px",
            minWidth: "34px",
            textAlign: "center",
          }}
          data-ocid="script.toggle"
        >
          {isMe ? "Me" : "Them"}
        </button>
      )}
      {isTimestamp && (
        <span
          className="px-2 py-0.5 rounded-full flex items-center gap-1 flex-shrink-0"
          style={{
            background: "oklch(var(--studio-pill))",
            color: "oklch(var(--studio-muted))",
            fontSize: "10px",
          }}
        >
          <Clock size={9} /> Time
        </span>
      )}
      {isCall && (
        <span
          className="px-2 py-0.5 rounded-full flex items-center gap-1 flex-shrink-0"
          style={{
            background: "oklch(var(--studio-pill))",
            color: "oklch(var(--studio-muted))",
            fontSize: "10px",
          }}
        >
          <Phone size={9} /> Call
        </span>
      )}

      {/* Text input inline */}
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
        className="flex-1 min-w-0 bg-transparent outline-none"
        style={{ color: "oklch(var(--studio-text))", fontSize: "12px" }}
        data-ocid="script.input"
      />

      {/* Row actions */}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
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
          <Trash2 size={11} style={{ color: "oklch(var(--destructive))" }} />
        </button>
      </div>
    </div>
  );
}

export default function ScriptBuilder() {
  const { messages, addMessage, setMessages, loadPreset } = useStudioStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [presetsOpen, setPresetsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const dragIndexRef = useRef<number | null>(null);

  const handleDragStart = (index: number) => {
    dragIndexRef.current = index;
  };

  const handleDragOver = (e: React.DragEvent, _index: number) => {
    e.preventDefault();
  };

  const handleDrop = (dropIndex: number) => {
    const dragIndex = dragIndexRef.current;
    if (dragIndex === null || dragIndex === dropIndex) return;
    const next = [...messages];
    const [removed] = next.splice(dragIndex, 1);
    next.splice(dropIndex, 0, removed);
    setMessages(next);
    dragIndexRef.current = null;
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
        className="px-4 pt-4 pb-2 border-b flex-shrink-0 flex items-center justify-between"
        style={{ borderColor: "oklch(var(--studio-border))" }}
      >
        <span className="studio-section-label">Script</span>
        <div className="flex items-center gap-2">
          <DropdownMenu open={presetsOpen} onOpenChange={setPresetsOpen}>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-1 text-xs rounded transition-colors hover:bg-white/5 px-1.5 py-1"
                style={{ color: "oklch(var(--studio-muted))" }}
                data-ocid="script.open_modal_button"
              >
                Presets <ChevronDown size={10} />
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
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-xs font-medium transition-colors hover:opacity-80"
            style={{ color: "oklch(var(--studio-blue))" }}
            data-ocid="script.upload_button"
          >
            Import .txt
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
      <div className="flex-1 overflow-y-auto">
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
          messages.map((msg, i) => (
            <MessageRow
              key={msg.id}
              msg={msg}
              index={i}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            />
          ))
        )}
      </div>

      {/* Add chips toolbar */}
      <div
        className="px-3 py-2.5 border-t flex items-center gap-1.5 flex-wrap flex-shrink-0"
        style={{ borderColor: "oklch(var(--studio-border))" }}
      >
        <button
          type="button"
          onClick={() => addMessage("me")}
          className="flex items-center gap-1 px-2 py-1 rounded-full font-medium transition-opacity hover:opacity-80"
          style={{
            background: "oklch(var(--studio-blue-chip))",
            color: "white",
            fontSize: "11px",
          }}
          data-ocid="script.primary_button"
        >
          <Plus size={10} /> Me
        </button>
        <button
          type="button"
          onClick={() => addMessage("them")}
          className="flex items-center gap-1 px-2 py-1 rounded-full font-medium transition-opacity hover:opacity-80"
          style={{
            background: "oklch(var(--studio-green-chip))",
            color: "white",
            fontSize: "11px",
          }}
          data-ocid="script.secondary_button"
        >
          <Plus size={10} /> Them
        </button>
        <button
          type="button"
          onClick={() => addMessage("me", "timestamp")}
          className="flex items-center gap-1 px-2 py-1 rounded-full transition-opacity hover:opacity-80"
          style={{
            background: "oklch(var(--studio-pill))",
            color: "oklch(var(--studio-muted))",
            fontSize: "11px",
          }}
          data-ocid="script.button"
        >
          <Clock size={10} /> Time
        </button>
        <button
          type="button"
          onClick={() => addMessage("me", "call")}
          className="flex items-center gap-1 px-2 py-1 rounded-full transition-opacity hover:opacity-80"
          style={{
            background: "oklch(var(--studio-pill))",
            color: "oklch(var(--studio-muted))",
            fontSize: "11px",
          }}
          data-ocid="script.button"
        >
          <Phone size={10} /> Call
        </button>
        <span
          className="ml-auto"
          style={{ color: "oklch(var(--studio-muted))", fontSize: "10px" }}
        >
          drag to reorder
        </span>
      </div>

      {/* History section */}
      <div
        className="border-t flex-shrink-0"
        style={{ borderColor: "oklch(var(--studio-border))" }}
      >
        <button
          type="button"
          onClick={() => setHistoryOpen(!historyOpen)}
          className="w-full flex items-center justify-between px-4 py-2.5 transition-colors hover:bg-white/[0.03]"
        >
          <span className="studio-section-label">History</span>
          <ChevronDown
            size={12}
            style={{
              color: "oklch(var(--studio-muted))",
              transform: historyOpen ? "rotate(180deg)" : "none",
              transition: "transform 150ms ease",
            }}
          />
        </button>
        {historyOpen && (
          <div
            className="px-4 py-3 text-xs"
            style={{ color: "oklch(var(--studio-muted))" }}
          >
            Pre-existing messages before script will appear here.
          </div>
        )}
      </div>
    </div>
  );
}
