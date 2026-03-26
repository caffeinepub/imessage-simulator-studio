import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Download, Film, Image, X } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { type Message, useStudioStore } from "../../store/studioStore";

export default function ExportModal() {
  const { messages, settings } = useStudioStore();
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [exportType, setExportType] = useState<"image" | "video" | null>(null);
  const cancelRef = useRef(false);

  const handleExportImage = useCallback(async () => {
    try {
      setExporting(true);
      setExportType("image");
      setProgress(10);

      const html2canvas = (await import("html2canvas")).default;
      setProgress(40);

      const frame = document.getElementById("iphone-frame");
      if (!frame) throw new Error("iPhone frame not found");

      const canvas = await html2canvas(frame, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
        allowTaint: true,
      });

      setProgress(80);
      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = "imessage-screenshot.png";
      a.click();
      setProgress(100);
      toast.success("Screenshot saved!");
    } catch (err) {
      console.error(err);
      toast.error("Export failed. Try again.");
    } finally {
      setExporting(false);
      setExportType(null);
      setProgress(0);
    }
  }, []);

  const handleExportVideo = useCallback(async () => {
    cancelRef.current = false;
    setExporting(true);
    setExportType("video");
    setProgress(0);

    try {
      const CANVAS_W = 1080;
      const CANVAS_H = 1920;
      const FPS = 30;

      const canvas = document.createElement("canvas");
      canvas.width = CANVAS_W;
      canvas.height = CANVAS_H;
      const ctx = canvas.getContext("2d")!;

      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9"
        : "video/webm";

      const stream = canvas.captureStream(FPS);
      const recorder = new MediaRecorder(stream, { mimeType });
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      const recordingDone = new Promise<void>((resolve) => {
        recorder.onstop = () => resolve();
      });

      recorder.start();

      const SCALE = CANVAS_W / 280;
      const iphoneBg = settings.darkMode ? "#000000" : "#F2F2F7";
      const bubbleBlue = settings.greenBubbles ? "#30D158" : "#0A84FF";
      const bubbleGray = "#3A3D44";
      const totalMessages = messages.length;
      const frameDelay = 1000 / FPS;

      const roundRect = (
        x: number,
        y: number,
        w: number,
        h: number,
        r: number,
        fill: string,
      ) => {
        ctx.fillStyle = fill;
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, r);
        ctx.fill();
      };

      const wrapText = (
        text: string,
        maxWidth: number,
        fontSize: number,
      ): string[] => {
        ctx.font = `${fontSize}px -apple-system, Inter, sans-serif`;
        const words = text.split(" ");
        const lines: string[] = [];
        let line = "";
        for (const word of words) {
          const test = line ? `${line} ${word}` : word;
          if (ctx.measureText(test).width > maxWidth) {
            if (line) lines.push(line);
            line = word;
          } else {
            line = test;
          }
        }
        if (line) lines.push(line);
        return lines;
      };

      const drawBackground = () => {
        ctx.fillStyle = "#0B0C10";
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
        const frameX = CANVAS_W / 2 - 150 * SCALE;
        const frameY = CANVAS_H / 2 - 310 * SCALE;
        const frameW = 300 * SCALE;
        const frameH = 620 * SCALE;
        roundRect(
          frameX - 10,
          frameY - 10,
          frameW + 20,
          frameH + 20,
          50 * SCALE,
          "#0A0A0A",
        );
        roundRect(frameX, frameY, frameW, frameH, 42 * SCALE, iphoneBg);
        return { frameX, frameY };
      };

      const sleep = (ms: number) =>
        new Promise<void>((res) => setTimeout(res, ms));

      let drawnMessages: Message[] = [];
      const { frameX, frameY } = drawBackground();

      const getMessageY = (index: number) => {
        let y = frameY + 120 * SCALE;
        for (let i = 0; i < index; i++) {
          const msg = drawnMessages[i];
          if (!msg) continue;
          const lines = wrapText(msg.text, 180 * SCALE, 28);
          y += (lines.length * 36 + 20) * SCALE + 8 * SCALE;
        }
        return y;
      };

      const drawMessage = (msg: Message, msgY: number) => {
        if (msg.type === "timestamp") {
          ctx.fillStyle = "#8E8E93";
          ctx.font = "20px -apple-system, Inter, sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(msg.text, CANVAS_W / 2, msgY + 20 * SCALE);
          return;
        }

        const isMe = msg.sender === "me";
        const maxBubbleW = 200 * SCALE;
        const padding = 16 * SCALE;
        const fontSize = 28;

        ctx.font = `${fontSize}px -apple-system, Inter, sans-serif`;
        const lines = wrapText(msg.text, maxBubbleW - padding * 2, fontSize);
        const lineH = 36;
        const bubbleH = (lines.length * lineH + 24) * SCALE;
        let maxLineW = 0;
        for (const line of lines) {
          const w = ctx.measureText(line).width;
          if (w > maxLineW) maxLineW = w;
        }
        const bubbleW = Math.min(maxBubbleW, maxLineW + padding * 2);
        const bubbleX = isMe
          ? frameX + 280 * SCALE - bubbleW - 10 * SCALE
          : frameX + 10 * SCALE;

        roundRect(
          bubbleX,
          msgY,
          bubbleW,
          bubbleH,
          18 * SCALE,
          isMe ? bubbleBlue : bubbleGray,
        );

        ctx.fillStyle = "white";
        ctx.font = `${fontSize}px -apple-system, Inter, sans-serif`;
        ctx.textAlign = "left";
        for (let li = 0; li < lines.length; li++) {
          ctx.fillText(
            lines[li],
            bubbleX + padding,
            msgY + (24 + li * lineH) * SCALE,
            maxBubbleW - padding * 2,
          );
        }
      };

      for (let i = 0; i < totalMessages; i++) {
        if (cancelRef.current) break;

        const msg = messages[i];
        setProgress(Math.round((i / totalMessages) * 90));

        if (msg.type === "message") {
          const typingFrames = Math.max(
            1,
            Math.round(
              settings.typingDuration / settings.playbackSpeed / frameDelay,
            ),
          );
          for (let f = 0; f < typingFrames; f++) {
            if (cancelRef.current) break;
            drawBackground();
            for (let j = 0; j < drawnMessages.length; j++) {
              drawMessage(drawnMessages[j], getMessageY(j));
            }
            const typingY = getMessageY(drawnMessages.length);
            const dotPhase = (f / typingFrames) * Math.PI * 2;
            for (let d = 0; d < 3; d++) {
              const dotX = frameX + (20 + d * 12) * SCALE;
              const dotY =
                typingY + (8 + Math.sin(dotPhase + d * 1.2) * 3) * SCALE;
              ctx.fillStyle = "#B7BEC9";
              ctx.beginPath();
              ctx.arc(dotX, dotY, 5 * SCALE, 0, Math.PI * 2);
              ctx.fill();
            }
            await sleep(frameDelay);
          }
        }

        if (cancelRef.current) break;

        drawnMessages = [...drawnMessages, msg];
        drawBackground();
        for (let j = 0; j < drawnMessages.length; j++) {
          drawMessage(drawnMessages[j], getMessageY(j));
        }

        const delayFrames = Math.max(
          1,
          Math.round(
            settings.messageDelay / settings.playbackSpeed / frameDelay,
          ),
        );
        for (let f = 0; f < delayFrames; f++) {
          if (cancelRef.current) break;
          await sleep(frameDelay);
        }
      }

      setProgress(95);
      recorder.stop();
      await recordingDone;

      const blob = new Blob(chunks, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "imessage-conversation.webm";
      a.click();
      URL.revokeObjectURL(url);

      setProgress(100);
      toast.success("Video exported as WebM!");
    } catch (err) {
      console.error(err);
      toast.error("Video export failed.");
    } finally {
      setExporting(false);
      setExportType(null);
      setProgress(0);
    }
  }, [messages, settings]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="w-full text-sm font-medium py-2.5 rounded-xl flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
          style={{ background: "oklch(var(--studio-blue))", color: "white" }}
          data-ocid="export.open_modal_button"
        >
          <Download size={14} /> Export
        </button>
      </DialogTrigger>

      <DialogContent
        className="max-w-sm"
        style={{
          background: "oklch(var(--studio-panel))",
          borderColor: "oklch(var(--studio-border))",
        }}
        data-ocid="export.dialog"
      >
        <DialogHeader>
          <DialogTitle style={{ color: "oklch(var(--studio-text))" }}>
            Export Conversation
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 mt-2">
          <button
            type="button"
            onClick={handleExportImage}
            disabled={exporting}
            className="w-full flex items-center gap-3 p-3 rounded-xl transition-colors hover:bg-white/5 disabled:opacity-50"
            style={{ border: "1px solid oklch(var(--studio-border))" }}
            data-ocid="export.primary_button"
          >
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: "oklch(var(--studio-surface))" }}
            >
              <Image size={16} style={{ color: "oklch(var(--studio-blue))" }} />
            </div>
            <div className="text-left">
              <p
                className="text-sm font-medium"
                style={{ color: "oklch(var(--studio-text))" }}
              >
                Export as Image
              </p>
              <p
                className="text-xs"
                style={{ color: "oklch(var(--studio-muted))" }}
              >
                PNG screenshot of the iPhone frame
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={handleExportVideo}
            disabled={exporting}
            className="w-full flex items-center gap-3 p-3 rounded-xl transition-colors hover:bg-white/5 disabled:opacity-50"
            style={{ border: "1px solid oklch(var(--studio-border))" }}
            data-ocid="export.secondary_button"
          >
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: "oklch(var(--studio-surface))" }}
            >
              <Film size={16} style={{ color: "oklch(var(--studio-green))" }} />
            </div>
            <div className="text-left">
              <p
                className="text-sm font-medium"
                style={{ color: "oklch(var(--studio-text))" }}
              >
                Export as Video
              </p>
              <p
                className="text-xs"
                style={{ color: "oklch(var(--studio-muted))" }}
              >
                WebM format · 1080×1920 · 30fps
              </p>
            </div>
          </button>

          {exporting && (
            <div className="space-y-2" data-ocid="export.loading_state">
              <div className="flex items-center justify-between">
                <span
                  className="text-xs"
                  style={{ color: "oklch(var(--studio-muted))" }}
                >
                  {exportType === "image"
                    ? "Capturing screenshot..."
                    : "Rendering video..."}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    cancelRef.current = true;
                  }}
                  className="hover:opacity-80 transition-opacity"
                  data-ocid="export.cancel_button"
                >
                  <X
                    size={13}
                    style={{ color: "oklch(var(--studio-muted))" }}
                  />
                </button>
              </div>
              <Progress value={progress} className="h-1.5" />
              <p
                className="text-xs text-right"
                style={{ color: "oklch(var(--studio-muted))" }}
              >
                {progress}%
              </p>
            </div>
          )}

          <div
            className="p-3 rounded-lg"
            style={{
              background: "oklch(var(--studio-surface))",
              border: "1px solid oklch(var(--studio-border))",
            }}
          >
            <span
              className="text-xs leading-relaxed"
              style={{ color: "oklch(var(--studio-muted))" }}
            >
              💡 Video exports as{" "}
              <strong style={{ color: "oklch(var(--studio-text))" }}>
                WebM
              </strong>{" "}
              format (native browser recording). Use a converter for MP4 if
              needed.
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
