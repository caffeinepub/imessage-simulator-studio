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

      const dark = settings.darkMode;
      const BUBBLE_ME = settings.greenBubbles ? "#30D158" : "#0A84FF";
      const BUBBLE_THEM = dark ? "#3A3D44" : "#E9E9EB";
      const TEXT_THEM = dark ? "#ffffff" : "#1C1C1E";
      const BG = dark ? "#000000" : "#F2F2F7";

      const CW = 1080;
      const PAD = 48;
      const MAX_W = CW * 0.72;
      const IMG_W = CW * 0.3;
      const PAD_H = 28;
      const PAD_V = 20;
      const LINE_H = 56;
      const MSG_GAP = 20;
      const SIDE = 32;
      const MSG_FONT = '40px -apple-system, "SF Pro Text", sans-serif';
      const MAX_IMG_H = 450;

      // Measure canvas for text wrapping
      const measureCanvas = document.createElement("canvas");
      measureCanvas.width = CW;
      measureCanvas.height = 100;
      const mctx = measureCanvas.getContext("2d")!;

      const wrapText2 = (
        ctx2: CanvasRenderingContext2D,
        text: string,
        maxW: number,
        font: string,
      ): string[] => {
        ctx2.font = font;
        const words = text.split(" ");
        const lines: string[] = [];
        let line = "";
        for (const word of words) {
          const test = line ? `${line} ${word}` : word;
          if (ctx2.measureText(test).width > maxW && line) {
            lines.push(line);
            line = word;
          } else {
            line = test;
          }
        }
        if (line) lines.push(line);
        return lines.length ? lines : [""];
      };

      // Preload images
      const preloadedImages = new Map<string, HTMLImageElement>();
      await Promise.all(
        messages
          .filter((m) => m.imageUrl)
          .map(
            (m) =>
              new Promise<void>((resolve) => {
                const img = new window.Image();
                img.crossOrigin = "anonymous";
                img.onload = () => {
                  preloadedImages.set(m.id, img);
                  resolve();
                };
                img.onerror = () => resolve();
                img.src = m.imageUrl!;
              }),
          ),
      );

      setProgress(40);

      const getImgH = (
        imgEl: HTMLImageElement | undefined,
        imgW: number,
      ): number => {
        if (!imgEl || imgEl.naturalWidth === 0) return 200;
        const ratio = imgEl.naturalHeight / imgEl.naturalWidth;
        return Math.min(Math.round(imgW * ratio), MAX_IMG_H);
      };

      const getMsgHeight = (msg: Message): number => {
        if (msg.type === "timestamp") return 64 + MSG_GAP;
        const hasImage = !!msg.imageUrl;
        const hasText = !!msg.text;
        const lines = hasText
          ? wrapText2(mctx, msg.text, MAX_W - PAD_H * 2, MSG_FONT)
          : [];
        const textH = lines.length > 0 ? lines.length * LINE_H : 0;
        if (hasImage) {
          const imgH = getImgH(preloadedImages.get(msg.id), IMG_W);
          return imgH + (hasText ? textH + PAD_V : 0) + PAD_V * 2 + MSG_GAP;
        }
        return (hasText ? lines.length : 1) * LINE_H + PAD_V * 2 + MSG_GAP;
      };

      const totalMsgH = messages.reduce((a, m) => a + getMsgHeight(m), 0);
      const CH = totalMsgH + PAD * 2;

      const canvas = document.createElement("canvas");
      canvas.width = CW;
      canvas.height = Math.max(CH, 200);
      const ctx = canvas.getContext("2d")!;

      // Background
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, CW, canvas.height);

      const rr = (
        x: number,
        y: number,
        w: number,
        h: number,
        r: number | number[],
        fill: string,
      ) => {
        ctx.fillStyle = fill;
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, r);
        ctx.fill();
      };

      let y = PAD;

      for (const msg of messages) {
        if (msg.type === "timestamp") {
          ctx.fillStyle = "#8E8E93";
          ctx.font = '36px -apple-system, "SF Pro Text", sans-serif';
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(msg.text, CW / 2, y + 32);
          y += getMsgHeight(msg);
          continue;
        }

        const isMe = msg.sender === "me";
        const color = isMe ? BUBBLE_ME : BUBBLE_THEM;
        const tColor = isMe ? "white" : TEXT_THEM;
        const hasImage = !!msg.imageUrl;
        const hasText = !!msg.text;
        const lines = hasText
          ? wrapText2(ctx, msg.text, MAX_W - PAD_H * 2, MSG_FONT)
          : [];
        const bR = isMe ? [26, 26, 6, 26] : [26, 26, 26, 6];
        const imgEl = preloadedImages.get(msg.id);
        const imgH = getImgH(imgEl, IMG_W);
        const msgH = getMsgHeight(msg);

        if (hasImage && !hasText) {
          const bX = isMe ? CW - SIDE - IMG_W : SIDE;
          if (imgEl) {
            ctx.save();
            ctx.beginPath();
            ctx.roundRect(bX, y, IMG_W, imgH, bR);
            ctx.clip();
            ctx.drawImage(imgEl, bX, y, IMG_W, imgH);
            ctx.restore();
          } else {
            rr(bX, y, IMG_W, imgH, bR, color);
          }
        } else {
          ctx.font = MSG_FONT;
          let maxLW = 0;
          for (const l of lines) {
            const w = ctx.measureText(l).width;
            if (w > maxLW) maxLW = w;
          }
          const bW = hasImage ? IMG_W : Math.min(MAX_W, maxLW + PAD_H * 2);
          const textH = lines.length * LINE_H;
          const bH = hasImage
            ? imgH + (hasText ? textH + PAD_V : 0) + PAD_V * 2
            : textH + PAD_V * 2;
          const bX = isMe ? CW - SIDE - bW : SIDE;

          rr(bX, y, bW, bH, bR, color);

          if (hasImage && imgEl) {
            ctx.save();
            ctx.beginPath();
            ctx.roundRect(bX, y, bW, imgH + PAD_V, [
              bR[0] as number,
              bR[1] as number,
              0,
              0,
            ]);
            ctx.clip();
            ctx.drawImage(imgEl, bX, y, bW, imgH);
            ctx.restore();
          }

          ctx.fillStyle = tColor;
          ctx.font = MSG_FONT;
          ctx.textAlign = "left";
          ctx.textBaseline = "middle";
          const textStartY = hasImage
            ? y + imgH + PAD_V + LINE_H / 2
            : y + PAD_V + LINE_H / 2;
          lines.forEach((line, li) => {
            ctx.fillText(line, bX + PAD_H, textStartY + li * LINE_H);
          });
        }

        y += msgH;
      }

      setProgress(80);

      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = "imessage-export.png";
      a.click();
      setProgress(100);
      toast.success("Image saved!");
    } catch (err) {
      console.error(err);
      toast.error("Export failed. Try again.");
    } finally {
      setExporting(false);
      setExportType(null);
      setProgress(0);
    }
  }, [messages, settings]);

  const handleExportVideo = useCallback(async () => {
    cancelRef.current = false;
    setExporting(true);
    setExportType("video");
    setProgress(0);

    try {
      const CW = 1080;
      const CH = 1920;
      const FPS = 30;
      const FRAME_MS = 1000 / FPS;

      const canvas = document.createElement("canvas");
      canvas.width = CW;
      canvas.height = CH;
      const ctx = canvas.getContext("2d")!;

      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9"
        : "video/webm";
      const stream = canvas.captureStream(FPS);
      const recorder = new MediaRecorder(stream, { mimeType });
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => e.data.size > 0 && chunks.push(e.data);
      const recordingDone = new Promise<void>((res) => {
        recorder.onstop = () => res();
      });
      recorder.start();

      const sleep = (ms: number) =>
        new Promise<void>((res) => setTimeout(res, ms));

      const PH_W = 720;
      const PH_H = 1488;
      const PH_X = (CW - PH_W) / 2;
      const PH_Y = (CH - PH_H) / 2;
      const PH_BORDER = 24;
      const PH_OUTER_R = 115;
      const SC_INNER_R = 91;

      const SC_X = PH_X + PH_BORDER;
      const SC_Y = PH_Y + PH_BORDER;
      const SC_W = PH_W - PH_BORDER * 2;
      const SC_H = PH_H - PH_BORDER * 2;

      const STATUS_H = 108;
      const HEADER_H = 148;
      const KB_SUGGEST = 100;
      const KB_INPUT = 115;
      const KB_KEYS = 420;
      const KB_TOTAL = KB_SUGGEST + KB_INPUT + KB_KEYS;
      const MSG_TOP = SC_Y + STATUS_H + HEADER_H;
      const MSG_H = SC_H - STATUS_H - HEADER_H - KB_TOTAL;
      const KB_TOP = MSG_TOP + MSG_H;
      const KB_KEYS_TOP = KB_TOP + KB_SUGGEST + KB_INPUT;
      const ROW_Y_START = KB_KEYS_TOP + 16;
      const KEY_H = 88;
      const KEY_GAP = 12;

      const dark = settings.darkMode;
      const BG = dark ? "#000000" : "#F2F2F7";
      const HEADER_BG = dark ? "#1C1C1E" : "#F2F2F7";
      const TEXT_COLOR = dark ? "#ffffff" : "#1C1C1E";
      const BUBBLE_ME = settings.greenBubbles ? "#30D158" : "#0A84FF";
      const BUBBLE_THEM = dark ? "#3A3D44" : "#E9E9EB";
      const TEXT_THEM = dark ? "#ffffff" : "#1C1C1E";
      const KB_BG = dark ? "#1C1C1E" : "#D1D4D9";
      const KEY_BG = dark ? "#3A3A3C" : "#ffffff";
      const KEY_ACTIVE_BG = dark ? "#636366" : "#e8e8ed";
      const SPECIAL_KEY = dark ? "#636366" : "#ADB5BD";
      const INPUT_PILL = dark ? "#2C2C2E" : "#ffffff";
      const INPUT_BORDER = dark ? "#3A3D44" : "#D1D1D6";
      const BLUE = "#0A84FF";
      const SEPARATOR = dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.1)";

      let visibleMsgs: Message[] = [];
      let showTypingDots = false;
      let inputText = "";
      let activeKey = "";

      // Preloaded images map (populated async)
      const preloadedImages = new Map<string, HTMLImageElement>();
      const MAX_IMG_H = 288; // matches preview maxHeight: 120px at 2.4x scale
      const getImgH = (
        imgEl: HTMLImageElement | undefined,
        imgW: number,
      ): number => {
        if (!imgEl || imgEl.naturalWidth === 0) return 200;
        const ratio = imgEl.naturalHeight / imgEl.naturalWidth;
        return Math.min(Math.round(imgW * ratio), MAX_IMG_H);
      };

      // Preload all message images
      await Promise.all(
        messages
          .filter((m) => m.imageUrl)
          .map(
            (m) =>
              new Promise<void>((resolve) => {
                const img = new window.Image();
                img.onload = () => {
                  preloadedImages.set(m.id, img);
                  resolve();
                };
                img.onerror = () => resolve();
                img.src = m.imageUrl!;
              }),
          ),
      );

      // Preload avatar image
      let avatarImage: HTMLImageElement | null = null;
      if (settings.avatarUrl) {
        await new Promise<void>((resolve) => {
          const img = new window.Image();
          img.onload = () => {
            avatarImage = img;
            resolve();
          };
          img.onerror = () => resolve();
          img.src = settings.avatarUrl!;
        });
      }

      const rr = (
        x: number,
        y: number,
        w: number,
        h: number,
        r: number | number[],
        fill: string,
      ) => {
        ctx.fillStyle = fill;
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, r);
        ctx.fill();
      };

      const wrapText = (text: string, maxW: number, font: string): string[] => {
        ctx.font = font;
        const words = text.split(" ");
        const lines: string[] = [];
        let line = "";
        for (const word of words) {
          const test = line ? `${line} ${word}` : word;
          if (ctx.measureText(test).width > maxW && line) {
            lines.push(line);
            line = word;
          } else {
            line = test;
          }
        }
        if (line) lines.push(line);
        return lines.length ? lines : [""];
      };

      const drawFrame = () => {
        const grad = ctx.createLinearGradient(0, 0, 0, CH);
        grad.addColorStop(0, "#0E0E12");
        grad.addColorStop(1, "#08080C");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, CW, CH);

        rr(PH_X, PH_Y, PH_W, PH_H, PH_OUTER_R, "#0A0A0A");
        ctx.strokeStyle = "rgba(255,255,255,0.07)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(PH_X + 1, PH_Y + 1, PH_W - 2, PH_H - 2, PH_OUTER_R - 1);
        ctx.stroke();

        ctx.save();
        ctx.beginPath();
        ctx.roundRect(SC_X, SC_Y, SC_W, SC_H, SC_INNER_R);
        ctx.clip();

        ctx.fillStyle = BG;
        ctx.fillRect(SC_X, SC_Y, SC_W, SC_H);

        ctx.fillStyle = HEADER_BG;
        ctx.fillRect(SC_X, SC_Y, SC_W, STATUS_H);
        rr(SC_X + (SC_W - 168) / 2, SC_Y + 14, 168, 38, 20, "#000000");

        ctx.fillStyle = TEXT_COLOR;
        ctx.font = '600 30px -apple-system, "SF Pro Text", sans-serif';
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(
          settings.statusBarTime,
          SC_X + 22,
          SC_Y + STATUS_H / 2 + 4,
        );

        ctx.font = "500 20px -apple-system, sans-serif";
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        ctx.fillText(
          "\u25AE\u25AE\u25AE  \u2248  \u229F",
          SC_X + SC_W - 20,
          SC_Y + STATUS_H / 2 + 4,
        );

        ctx.fillStyle = SEPARATOR;
        ctx.fillRect(SC_X, SC_Y + STATUS_H - 1, SC_W, 1);

        ctx.fillStyle = HEADER_BG;
        ctx.fillRect(SC_X, SC_Y + STATUS_H, SC_W, HEADER_H);

        const hMid = SC_Y + STATUS_H + HEADER_H / 2;

        ctx.strokeStyle = BLUE;
        ctx.lineWidth = 3;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        ctx.moveTo(SC_X + 40, hMid - 13);
        ctx.lineTo(SC_X + 24, hMid);
        ctx.lineTo(SC_X + 40, hMid + 13);
        ctx.stroke();

        const avX = SC_X + SC_W / 2;
        const avY = SC_Y + STATUS_H + HEADER_H / 2 - 22;

        // Draw avatar circle
        ctx.save();
        ctx.beginPath();
        ctx.arc(avX, avY, 38, 0, Math.PI * 2);
        ctx.clip();
        if (avatarImage) {
          ctx.drawImage(avatarImage, avX - 38, avY - 38, 76, 76);
        } else {
          ctx.fillStyle = BLUE;
          ctx.fill();
          ctx.restore();
          ctx.save();
          ctx.fillStyle = "white";
          ctx.font = '700 30px -apple-system, "SF Pro Text", sans-serif';
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(
            settings.contactName.charAt(0).toUpperCase(),
            avX,
            avY + 1,
          );
        }
        ctx.restore();

        ctx.fillStyle = TEXT_COLOR;
        ctx.font = '600 24px -apple-system, "SF Pro Text", sans-serif';
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(
          settings.contactName,
          SC_X + SC_W / 2,
          SC_Y + STATUS_H + HEADER_H - 28,
        );

        ctx.fillStyle = BLUE;
        ctx.font = "500 26px -apple-system, sans-serif";
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        ctx.fillText("\u25B7", SC_X + SC_W - 58, hMid - 1);
        ctx.fillText("\u260E", SC_X + SC_W - 22, hMid - 1);

        ctx.fillStyle = SEPARATOR;
        ctx.fillRect(SC_X, SC_Y + STATUS_H + HEADER_H - 1, SC_W, 1);

        ctx.save();
        ctx.beginPath();
        ctx.rect(SC_X, MSG_TOP, SC_W, MSG_H);
        ctx.clip();

        const MSG_FONT = '27px -apple-system, "SF Pro Text", sans-serif';
        const MAX_W = SC_W * 0.72;
        const IMG_W = SC_W * 0.3; // 30% width for image bubbles
        const PAD_H = 26;
        const PAD_V = 18;
        const LINE_H = 36;
        const MSG_GAP = 12;
        const SIDE = 18;

        const msgHeights = visibleMsgs.map((msg) => {
          if (msg.type === "timestamp") return 40 + MSG_GAP;
          const hasImage = !!msg.imageUrl;
          const hasText = !!msg.text;
          const lines = hasText
            ? wrapText(msg.text, MAX_W - PAD_H * 2, MSG_FONT)
            : [];
          const textH = lines.length > 0 ? lines.length * LINE_H : 0;
          if (hasImage) {
            const _imgH = getImgH(preloadedImages.get(msg.id), IMG_W);
            return _imgH + (hasText ? textH + PAD_V : 0) + PAD_V * 2 + MSG_GAP;
          }
          return (hasText ? lines.length : 1) * LINE_H + PAD_V * 2 + MSG_GAP;
        });
        const totalMsgH = msgHeights.reduce((a, b) => a + b, 0);
        const dotH = showTypingDots ? 50 + MSG_GAP : 0;
        const totalH = totalMsgH + dotH;

        const PAD_BOTTOM = 8;
        const msgStartY = Math.min(
          MSG_TOP + 10,
          MSG_TOP + MSG_H - totalH - PAD_BOTTOM,
        );

        let yV = msgStartY;

        for (let mi = 0; mi < visibleMsgs.length; mi++) {
          const msg = visibleMsgs[mi];

          if (msg.type === "timestamp") {
            ctx.fillStyle = "#8E8E93";
            ctx.font = '22px -apple-system, "SF Pro Text", sans-serif';
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(msg.text, SC_X + SC_W / 2, yV + 20);
            yV += msgHeights[mi];
            continue;
          }

          const isMe = msg.sender === "me";
          const color = isMe ? BUBBLE_ME : BUBBLE_THEM;
          const tColor = isMe ? "white" : TEXT_THEM;
          const hasImage = !!msg.imageUrl;
          const hasText = !!msg.text;
          const lines = hasText
            ? wrapText(msg.text, MAX_W - PAD_H * 2, MSG_FONT)
            : [];
          const bR = isMe ? [18, 18, 4, 18] : [18, 18, 18, 4];

          if (hasImage && !hasText) {
            // Image-only: draw image with rounded corners, no background
            const imgEl = preloadedImages.get(msg.id);
            const imgW = IMG_W; // 30% width matches preview
            const imgH = getImgH(imgEl, imgW);
            const bX = isMe ? SC_X + SC_W - SIDE - imgW : SC_X + SIDE;
            if (imgEl) {
              ctx.save();
              ctx.beginPath();
              ctx.roundRect(bX, yV, imgW, imgH, bR);
              ctx.clip();
              ctx.drawImage(imgEl, bX, yV, imgW, imgH);
              ctx.restore();
            } else {
              rr(bX, yV, imgW, imgH, bR, color);
            }
          } else {
            ctx.font = MSG_FONT;
            let maxLW = 0;
            for (const l of lines) {
              const w = ctx.measureText(l).width;
              if (w > maxLW) maxLW = w;
            }
            const bW = hasImage ? IMG_W : Math.min(MAX_W, maxLW + PAD_H * 2);
            const _imgElForH = preloadedImages.get(msg.id);
            const _computedImgH = getImgH(_imgElForH, bW);
            const imgPartH = hasImage ? _computedImgH + PAD_V : 0;
            const textPartH =
              lines.length > 0 ? lines.length * LINE_H + PAD_V * 2 : PAD_V * 2;
            const bH = hasImage ? imgPartH + textPartH : textPartH;
            const bX = isMe ? SC_X + SC_W - SIDE - bW : SC_X + SIDE;

            rr(bX, yV, bW, bH, bR, color);

            if (hasImage) {
              const imgEl = preloadedImages.get(msg.id);
              if (imgEl) {
                const imgBubbleH = getImgH(imgEl, bW);
                ctx.save();
                ctx.beginPath();
                const imgBR = isMe ? [18, 18, 0, 18] : [18, 18, 18, 0];
                ctx.roundRect(bX, yV, bW, imgBubbleH, imgBR);
                ctx.clip();
                ctx.drawImage(imgEl, bX, yV, bW, imgBubbleH);
                ctx.restore();
              }
            }

            if (hasText) {
              ctx.fillStyle = tColor;
              ctx.font = MSG_FONT;
              ctx.textAlign = "left";
              ctx.textBaseline = "alphabetic";
              const textStartY = yV + imgPartH + PAD_V;
              for (let li = 0; li < lines.length; li++) {
                ctx.fillText(
                  lines[li],
                  bX + PAD_H,
                  textStartY + (li + 1) * LINE_H - 8,
                );
              }
            }
          }

          yV += msgHeights[mi];
        }

        if (showTypingDots) {
          const dotBW = 80;
          const dotBH = 50;
          rr(SC_X + SIDE, yV, dotBW, dotBH, [18, 18, 18, 4], BUBBLE_THEM);
          const phase = (Date.now() / 300) % (Math.PI * 2);
          for (let d = 0; d < 3; d++) {
            const bounce = Math.sin(phase + d * 1.2) * 6;
            ctx.fillStyle = "#B7BEC9";
            ctx.beginPath();
            ctx.arc(
              SC_X + SIDE + 16 + d * 24,
              yV + dotBH / 2 + bounce,
              7,
              0,
              Math.PI * 2,
            );
            ctx.fill();
          }
        }

        ctx.restore(); // messages clip

        // Suggestion bar
        ctx.fillStyle = KB_BG;
        ctx.fillRect(SC_X, KB_TOP, SC_W, KB_SUGGEST);
        ctx.fillStyle = SEPARATOR;
        ctx.fillRect(SC_X, KB_TOP + KB_SUGGEST - 1, SC_W, 1);

        const lastWord = inputText.split(" ").pop()?.toLowerCase() ?? "";
        const SUGG_MAP: Record<string, [string, string, string]> = {
          i: ["I", "In", "Is"],
          yo: ["you", "your", "young"],
          he: ["he", "hey", "hello"],
          th: ["the", "this", "that"],
          wh: ["what", "when", "where"],
          ok: ["okay", "ok", "OK"],
          ca: ["can", "call", "care"],
          go: ["go", "going", "good"],
          so: ["so", "some", "sorry"],
          ha: ["have", "had", "happy"],
          no: ["no", "not", "now"],
          wa: ["want", "was", "wait"],
          do: ["do", "done", "don't"],
          be: ["be", "been", "because"],
        };
        const suggsEntry =
          SUGG_MAP[lastWord] ??
          SUGG_MAP[lastWord.slice(0, 2)] ??
          SUGG_MAP[lastWord.slice(0, 1)] ??
          null;
        const suggs = suggsEntry ?? ["I", "the", "a"];

        for (let si = 0; si < 3; si++) {
          if (si > 0) {
            ctx.fillStyle = dark
              ? "rgba(255,255,255,0.15)"
              : "rgba(0,0,0,0.15)";
            ctx.fillRect(
              SC_X + (SC_W * si) / 3,
              KB_TOP + 14,
              1,
              KB_SUGGEST - 28,
            );
          }
          ctx.fillStyle =
            si === 1
              ? TEXT_COLOR
              : dark
                ? "rgba(255,255,255,0.55)"
                : "rgba(0,0,0,0.45)";
          ctx.font = '22px -apple-system, "SF Pro Text", sans-serif';
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          const word = si === 1 ? `"${suggs[si]}"` : suggs[si];
          ctx.fillText(
            word,
            SC_X + SC_W * (si / 3 + 1 / 6),
            KB_TOP + KB_SUGGEST / 2,
          );
        }

        // Input bar
        ctx.fillStyle = dark ? "rgba(28,28,30,0.97)" : "rgba(242,242,247,0.97)";
        ctx.fillRect(SC_X, KB_TOP + KB_SUGGEST, SC_W, KB_INPUT);
        ctx.fillStyle = SEPARATOR;
        ctx.fillRect(SC_X, KB_TOP + KB_SUGGEST, SC_W, 1);

        const iBarMid = KB_TOP + KB_SUGGEST + KB_INPUT / 2;

        ctx.strokeStyle = BLUE;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(SC_X + 30, iBarMid, 13, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = BLUE;
        ctx.beginPath();
        ctx.arc(SC_X + 30, iBarMid, 5.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = BLUE;
        ctx.lineWidth = 2;
        for (let gi = 0; gi < 2; gi++) {
          for (let gj = 0; gj < 2; gj++) {
            ctx.strokeRect(SC_X + 56 + gi * 13, iBarMid - 12 + gj * 13, 9, 9);
          }
        }

        const sendR = 24;
        const sendX = SC_X + SC_W - sendR - 10;
        const pillFont = '24px -apple-system, "SF Pro Text", sans-serif';
        const pillPadH = 14;
        const pillX = SC_X + 86;
        const pillW = sendX - sendR - 12 - pillX;
        const pillLineH = 34;
        const pillPadV = 14;

        const inputLines = inputText
          ? wrapText(inputText, pillW - pillPadH * 2, pillFont)
          : [];
        const maxLines = 3;
        const visibleLines = inputLines.slice(0, maxLines);
        const pillH = Math.max(
          KB_INPUT - 24,
          visibleLines.length * pillLineH + pillPadV,
        );
        const pillY = iBarMid - pillH / 2;

        rr(pillX, pillY, pillW, pillH, 22, INPUT_PILL);
        ctx.strokeStyle = INPUT_BORDER;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(pillX, pillY, pillW, pillH, 22);
        ctx.stroke();

        // Text inside pill — vertically centered
        ctx.save();
        ctx.beginPath();
        ctx.rect(pillX + 4, pillY + 2, pillW - 8, pillH - 4);
        ctx.clip();
        ctx.font = pillFont;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        if (inputText && visibleLines.length > 0) {
          ctx.fillStyle = TEXT_COLOR;
          // Center the text block vertically within the pill
          const textBlockH = visibleLines.length * pillLineH;
          const blockStartY = pillY + (pillH - textBlockH) / 2 + pillLineH / 2;
          visibleLines.forEach((line, li) => {
            ctx.fillText(line, pillX + pillPadH, blockStartY + li * pillLineH);
          });
          // Cursor after last typed character
          const lastLine = visibleLines[visibleLines.length - 1];
          const lastLineY = blockStartY + (visibleLines.length - 1) * pillLineH;
          const tw = ctx.measureText(lastLine).width;
          ctx.fillStyle = BLUE;
          ctx.fillRect(pillX + pillPadH + tw + 2, lastLineY - 13, 2.5, 26);
        } else {
          ctx.fillStyle = "#8E8E93";
          ctx.fillText("iMessage", pillX + pillPadH, pillY + pillH / 2 + 1);
        }
        ctx.restore();

        ctx.fillStyle = inputText ? BLUE : dark ? "#3A3D44" : "#D1D1D6";
        ctx.beginPath();
        ctx.arc(sendX, iBarMid, sendR, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = inputText ? "white" : "#8E8E93";
        ctx.lineWidth = 2.8;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        ctx.moveTo(sendX, iBarMid + 11);
        ctx.lineTo(sendX, iBarMid - 11);
        ctx.moveTo(sendX - 8, iBarMid - 4);
        ctx.lineTo(sendX, iBarMid - 11);
        ctx.lineTo(sendX + 8, iBarMid - 4);
        ctx.stroke();

        ctx.fillStyle = KB_BG;
        ctx.fillRect(SC_X, KB_KEYS_TOP, SC_W, KB_KEYS);

        const ROWS = [
          ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
          ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
          ["z", "x", "c", "v", "b", "n", "m"],
        ];
        const ROW_PADS = [6, 40, 0];

        for (let ri = 0; ri < 2; ri++) {
          const row = ROWS[ri];
          const pad = ROW_PADS[ri];
          const availW = SC_W - pad * 2 - 8;
          const gap = 8;
          const kW = (availW - gap * (row.length - 1)) / row.length;
          const rowY = ROW_Y_START + ri * (KEY_H + KEY_GAP);
          for (let ki = 0; ki < row.length; ki++) {
            const k = row[ki];
            const kx = SC_X + pad + 4 + ki * (kW + gap);
            const isActive = k === activeKey;
            rr(kx, rowY, kW, KEY_H, 10, isActive ? KEY_ACTIVE_BG : KEY_BG);
            if (!isActive) {
              ctx.fillStyle = dark ? "rgba(0,0,0,0.5)" : "rgba(0,0,0,0.3)";
              ctx.fillRect(kx, rowY + KEY_H - 2, kW, 2);
            }
            ctx.fillStyle = TEXT_COLOR;
            ctx.font = `${isActive ? "700" : "400"} 28px -apple-system, "SF Pro Text", sans-serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(k, kx + kW / 2, rowY + KEY_H / 2 + 1);
          }
        }

        {
          const SPEC_W = 72;
          const gap = 8;
          const letterRow = ROWS[2];
          const availLetterW =
            SC_W - 8 - SPEC_W * 2 - gap * (letterRow.length + 1);
          const lkW = availLetterW / letterRow.length;
          const r3Y = ROW_Y_START + 2 * (KEY_H + KEY_GAP);

          rr(SC_X + 4, r3Y, SPEC_W, KEY_H, 10, SPECIAL_KEY);
          ctx.fillStyle = TEXT_COLOR;
          ctx.font = "26px -apple-system, sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("\u2B06", SC_X + 4 + SPEC_W / 2, r3Y + KEY_H / 2);

          const lkStartX = SC_X + 4 + SPEC_W + gap;
          for (let ki = 0; ki < letterRow.length; ki++) {
            const k = letterRow[ki];
            const kx = lkStartX + ki * (lkW + gap);
            const isActive = k === activeKey;
            rr(kx, r3Y, lkW, KEY_H, 10, isActive ? KEY_ACTIVE_BG : KEY_BG);
            if (!isActive) {
              ctx.fillStyle = dark ? "rgba(0,0,0,0.5)" : "rgba(0,0,0,0.3)";
              ctx.fillRect(kx, r3Y + KEY_H - 2, lkW, 2);
            }
            ctx.fillStyle = TEXT_COLOR;
            ctx.font = `${isActive ? "700" : "400"} 28px -apple-system, "SF Pro Text", sans-serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(k, kx + lkW / 2, r3Y + KEY_H / 2 + 1);
          }

          const bsX = lkStartX + letterRow.length * (lkW + gap) - gap + gap;
          rr(bsX, r3Y, SPEC_W, KEY_H, 10, SPECIAL_KEY);
          ctx.fillStyle = TEXT_COLOR;
          ctx.font = "26px -apple-system, sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("\u232B", bsX + SPEC_W / 2, r3Y + KEY_H / 2);
        }

        {
          const r4Y = ROW_Y_START + 3 * (KEY_H + KEY_GAP);
          const NUM_W = 110;
          const RET_W = 150;
          const gap = 8;
          const spaceW = SC_W - 8 - NUM_W - RET_W - gap * 2;

          rr(SC_X + 4, r4Y, NUM_W, KEY_H, 10, SPECIAL_KEY);
          ctx.fillStyle = TEXT_COLOR;
          ctx.font = '22px -apple-system, "SF Pro Text", sans-serif';
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("123", SC_X + 4 + NUM_W / 2, r4Y + KEY_H / 2);

          rr(SC_X + 4 + NUM_W + gap, r4Y, spaceW, KEY_H, 10, SPECIAL_KEY);
          ctx.fillText(
            "space",
            SC_X + 4 + NUM_W + gap + spaceW / 2,
            r4Y + KEY_H / 2,
          );

          rr(SC_X + SC_W - 4 - RET_W, r4Y, RET_W, KEY_H, 10, SPECIAL_KEY);
          ctx.fillText(
            "return",
            SC_X + SC_W - 4 - RET_W + RET_W / 2,
            r4Y + KEY_H / 2,
          );
        }

        ctx.restore(); // screen clip
      };

      const drawInterval = setInterval(drawFrame, FRAME_MS);
      drawFrame();

      const speed = settings.playbackSpeed;
      const totalMsgs = messages.length;

      for (let i = 0; i < totalMsgs; i++) {
        if (cancelRef.current) break;
        setProgress(Math.round((i / totalMsgs) * 90));

        const msg = messages[i];

        if (msg.type === "message") {
          if (msg.sender === "them") {
            showTypingDots = true;
            await sleep(settings.typingDuration / speed);
            if (cancelRef.current) break;
            showTypingDots = false;
            visibleMsgs = [...visibleMsgs, msg];
            await sleep(settings.messageDelay / speed);
          } else {
            inputText = "";
            activeKey = "";
            const text = msg.text;
            for (let ci = 0; ci < text.length; ci++) {
              if (cancelRef.current) break;
              inputText = text.slice(0, ci + 1);
              const ch = text[ci].toLowerCase();
              activeKey = ch;
              const keyClear = ch;
              setTimeout(() => {
                if (activeKey === keyClear) activeKey = "";
              }, 110);
              const extra = ci % 5 === 0 ? 60 : 0;
              await sleep((28 + extra) / speed);
            }
            await sleep(200 / speed);
            if (!cancelRef.current) {
              inputText = "";
              activeKey = "";
              visibleMsgs = [...visibleMsgs, msg];
              await sleep(settings.messageDelay / speed);
            }
          }
        } else {
          visibleMsgs = [...visibleMsgs, msg];
          const delay = msg.type === "call" ? settings.callBannerDuration : 400;
          await sleep(delay / speed);
        }
      }

      await sleep(2500);

      clearInterval(drawInterval);
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
      toast.success("Video exported!");
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
                PNG of all messages, clean layout
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
                WebM \u00b7 1080\u00d71920 \u00b7 30fps \u00b7 with animations
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
                    ? "Rendering messages..."
                    : "Rendering animated video..."}
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
              {
                "\uD83D\uDCA1 Video includes the full iPhone UI \u2014 keyboard, typing animation, and all message effects. Exported as "
              }
              <strong style={{ color: "oklch(var(--studio-text))" }}>
                WebM
              </strong>
              .
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
