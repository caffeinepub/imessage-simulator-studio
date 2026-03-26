import {
  ArrowUp,
  Battery,
  Camera,
  ChevronLeft,
  Grid2x2,
  PhoneCall,
  Signal,
  Video,
  Wifi,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { type Message, useStudioStore } from "../../store/studioStore";

// ─── Suggestion Engine ───────────────────────────────────────────────────────

const SUGGESTIONS: Record<string, [string, string, string]> = {
  i: ["I", "In", "Is"],
  yo: ["you", "your", "young"],
  he: ["he", "hey", "hello"],
  th: ["the", "this", "that"],
  wh: ["what", "when", "where"],
  ok: ["okay", "ok", "OK"],
  lo: ["love", "lol", "look"],
  ca: ["can", "call", "care"],
  go: ["go", "going", "good"],
  so: ["so", "some", "sorry"],
  ha: ["have", "had", "happy"],
  no: ["no", "not", "now"],
  wa: ["want", "was", "wait"],
  mi: ["miss", "mind", "mine"],
  to: ["to", "too", "today"],
  do: ["do", "done", "don't"],
  be: ["be", "been", "because"],
};

function getSuggestions(inputText: string): [string, string, string] {
  const lastWord = inputText.split(" ").pop()?.toLowerCase() ?? "";
  if (!lastWord) return ["I", "the", "a"];
  const key2 = lastWord.slice(0, 2);
  const key1 = lastWord.slice(0, 1);
  return (
    SUGGESTIONS[lastWord] ??
    SUGGESTIONS[key2] ??
    SUGGESTIONS[key1] ?? ["I", "the", "a"]
  );
}

// ─── Suggestion Bar ───────────────────────────────────────────────────────────

function SuggestionBar({
  inputText,
  darkMode,
}: {
  inputText: string;
  darkMode: boolean;
}) {
  const suggestions = getSuggestions(inputText);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        height: 44,
        background: darkMode ? "#1C1C1E" : "#D1D4D9",
        borderBottom: `1px solid ${darkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.15)"}`,
        flexShrink: 0,
      }}
    >
      {suggestions.map((word, i) => (
        <React.Fragment key={word}>
          {i > 0 && (
            <div
              style={{
                width: 1,
                height: 28,
                background: darkMode
                  ? "rgba(255,255,255,0.15)"
                  : "rgba(0,0,0,0.15)",
                flexShrink: 0,
              }}
            />
          )}
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                fontSize: 14,
                color: darkMode ? "#ffffff" : "#1C1C1E",
                opacity: i === 1 ? 1 : 0.6,
              }}
            >
              {i === 1 ? `"${word}"` : word}
            </span>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}

// ─── Typing Indicator ─────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 4, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      className="flex items-center gap-0.5 px-3 py-2.5 rounded-2xl rounded-bl-sm w-fit"
      style={{ background: "#3A3D44" }}
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="block w-1.5 h-1.5 rounded-full"
          style={{
            background: "#B7BEC9",
            animation: `bounce-dot 1.4s ease-in-out ${i * 0.16}s infinite`,
          }}
        />
      ))}
    </motion.div>
  );
}

// ─── iOS Keyboard ─────────────────────────────────────────────────────────────

function IOSKeyboard({
  darkMode,
  isVisible,
  inputText,
  activeKey,
}: {
  darkMode: boolean;
  isVisible: boolean;
  inputText: string;
  activeKey: string;
}) {
  const keyBg = darkMode ? "#3A3A3C" : "#ffffff";
  const activeKeyBg = darkMode ? "#636366" : "#e8e8ed";
  const specialKeyBg = darkMode ? "#636366" : "#ADB5BD";
  const keyText = darkMode ? "white" : "#1C1C1E";
  const kbBg = darkMode ? "#1C1C1E" : "#D1D4D9";
  const inputBarBg = darkMode
    ? "rgba(28,28,30,0.95)"
    : "rgba(242,242,247,0.95)";
  const borderColor = darkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.1)";

  const keyStyle = (
    k = "",
    special = false,
    wide = false,
  ): React.CSSProperties => {
    const isActive = k && k === activeKey;
    return {
      background: isActive ? activeKeyBg : special ? specialKeyBg : keyBg,
      color: keyText,
      height: 34,
      minWidth: wide ? 44 : 26,
      flex: wide ? "0 0 auto" : "1",
      borderRadius: 6,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 14,
      fontWeight: 400,
      boxShadow: isActive
        ? darkMode
          ? "0 2px 0 rgba(0,0,0,0.7)"
          : "0 2px 0 rgba(0,0,0,0.4)"
        : darkMode
          ? "0 1px 0 rgba(0,0,0,0.5)"
          : "0 1px 0 rgba(0,0,0,0.3)",
      cursor: "default",
      userSelect: "none",
      transform: isActive ? "scale(1.18)" : "scale(1)",
      transition:
        "transform 0.08s ease, background 0.08s ease, box-shadow 0.08s ease",
    };
  };

  const rows = [
    ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
    ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
    ["z", "x", "c", "v", "b", "n", "m"],
  ];

  return (
    <div
      style={{
        transform: isVisible ? "translateY(0)" : "translateY(100%)",
        transition: "transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)",
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Suggestion Bar */}
      <SuggestionBar inputText={inputText} darkMode={darkMode} />

      {/* Input Bar Row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "6px 10px",
          background: inputBarBg,
          backdropFilter: "blur(20px)",
          borderTop: `1px solid ${borderColor}`,
          flexShrink: 0,
        }}
      >
        <Camera size={22} style={{ color: "#0A84FF", flexShrink: 0 }} />
        <Grid2x2 size={20} style={{ color: "#0A84FF", flexShrink: 0 }} />

        {/* Multi-line input pill */}
        <div
          style={{
            flex: 1,
            minHeight: 30,
            maxHeight: 72,
            borderRadius: 15,
            border: `1px solid ${darkMode ? "#3A3D44" : "#D1D1D6"}`,
            background: darkMode ? "#2C2C2E" : "#FFFFFF",
            padding: "6px 10px",
            display: "flex",
            alignItems: "center",
            overflow: "hidden",
          }}
        >
          <span
            style={{
              flex: 1,
              fontSize: 12,
              color: inputText ? keyText : "#8E8E93",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              lineHeight: "1.4",
            }}
          >
            {inputText || "iMessage"}
            {inputText && (
              <span
                style={{
                  display: "inline-block",
                  width: 1.5,
                  height: 13,
                  background: "#0A84FF",
                  marginLeft: 1,
                  borderRadius: 1,
                  verticalAlign: "text-bottom",
                  animation: "blink-cursor 1s step-end infinite",
                }}
              />
            )}
          </span>
        </div>

        {/* Send button */}
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: inputText
              ? "#0A84FF"
              : darkMode
                ? "#3A3D44"
                : "#D1D1D6",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            transition: "background 0.15s",
          }}
        >
          <ArrowUp
            size={14}
            style={{ color: inputText ? "white" : "#8E8E93" }}
          />
        </div>
      </div>

      {/* Keyboard Area */}
      <div
        style={{
          background: kbBg,
          height: 260,
          padding: "8px 3px 4px",
          display: "flex",
          flexDirection: "column",
          gap: 6,
          flexShrink: 0,
        }}
      >
        {/* Row 1 */}
        <div style={{ display: "flex", gap: 5, padding: "0 2px" }}>
          {rows[0].map((k) => (
            <div key={k} style={keyStyle(k)}>
              {k}
            </div>
          ))}
        </div>
        {/* Row 2 */}
        <div style={{ display: "flex", gap: 5, padding: "0 14px" }}>
          {rows[1].map((k) => (
            <div key={k} style={keyStyle(k)}>
              {k}
            </div>
          ))}
        </div>
        {/* Row 3 */}
        <div
          style={{
            display: "flex",
            gap: 5,
            padding: "0 2px",
            alignItems: "center",
          }}
        >
          <div style={{ ...keyStyle("", true, true), minWidth: 36 }}>⬆</div>
          <div style={{ display: "flex", flex: 1, gap: 5 }}>
            {rows[2].map((k) => (
              <div key={k} style={keyStyle(k)}>
                {k}
              </div>
            ))}
          </div>
          <div style={{ ...keyStyle("", true, true), minWidth: 36 }}>⌫</div>
        </div>
        {/* Row 4 */}
        <div style={{ display: "flex", gap: 5, padding: "0 2px" }}>
          <div
            style={{ ...keyStyle("", true, true), minWidth: 44, fontSize: 12 }}
          >
            123
          </div>
          <div
            style={{
              ...keyStyle("", true),
              flex: 1,
              fontSize: 13,
            }}
          >
            space
          </div>
          <div
            style={{
              ...keyStyle("", true, true),
              minWidth: 56,
              fontSize: 12,
            }}
          >
            return
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Message Bubble ───────────────────────────────────────────────────────────

function MessageBubble({
  msg,
  isLast,
  isLastMe,
  settings,
}: {
  msg: Message;
  isLast: boolean;
  isLastMe: boolean;
  settings: {
    darkMode: boolean;
    greenBubbles: boolean;
    readReceipt: "none" | "delivered" | "read";
  };
}) {
  const bubbleColor = settings.greenBubbles
    ? msg.sender === "me"
      ? "#30D158"
      : "#3A3D44"
    : msg.sender === "me"
      ? "#0A84FF"
      : settings.darkMode
        ? "#3A3D44"
        : "#E9E9EB";

  const textColor =
    msg.sender === "me" || settings.darkMode ? "white" : "#1C1C1E";

  if (msg.type === "timestamp") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center text-xs py-1"
        style={{ color: "#8E8E93" }}
      >
        {msg.text}
      </motion.div>
    );
  }

  if (msg.type === "call") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25 }}
        className="flex items-center justify-center gap-2 text-xs py-2"
        style={{ color: "#8E8E93" }}
      >
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center"
          style={{ background: "#30D158" }}
        >
          <PhoneCall size={11} className="text-white" />
        </div>
        <span>{msg.text}</span>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={`flex flex-col ${
        msg.sender === "me" ? "items-end" : "items-start"
      }`}
    >
      <div
        className="max-w-[75%] px-3 py-2 text-xs leading-relaxed"
        style={{
          background: bubbleColor,
          color: textColor,
          borderRadius:
            msg.sender === "me" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
          wordBreak: "break-word",
        }}
      >
        {msg.text || <span style={{ opacity: 0.4 }}>empty</span>}
      </div>
      {isLastMe && isLast && settings.readReceipt !== "none" && (
        <span
          className="mt-0.5 mr-1"
          style={{ color: "#8E8E93", fontSize: "10px" }}
        >
          {settings.readReceipt === "read"
            ? `Read ${new Date().toLocaleTimeString([], {
                hour: "numeric",
                minute: "2-digit",
              })}`
            : "Delivered"}
        </span>
      )}
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function IPhonePreview() {
  const {
    messages,
    settings,
    visibleCount,
    isPlaying,
    setVisibleCount,
    setIsPlaying,
  } = useStudioStore();
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const playbackRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [typingVisible, setTypingVisible] = useState(false);
  const [inputText, setInputText] = useState("");
  const [activeKey, setActiveKey] = useState("");

  const scrollToBottom = useCallback(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, []);

  // Playback engine
  // biome-ignore lint/correctness/useExhaustiveDependencies: playback engine intentionally only reacts to isPlaying
  useEffect(() => {
    if (!isPlaying) {
      if (playbackRef.current) clearTimeout(playbackRef.current);
      setTypingVisible(false);
      setInputText("");
      setActiveKey("");
      return;
    }

    let cancelled = false;
    let step = visibleCount;

    const runStep = () => {
      if (cancelled || step >= messages.length) {
        setIsPlaying(false);
        setTypingVisible(false);
        setInputText("");
        setActiveKey("");
        return;
      }

      const msg = messages[step];
      const speed = settings.playbackSpeed;

      if (msg.type === "message") {
        if (msg.sender === "them") {
          // Show typing indicator for "them"
          setTypingVisible(true);
          scrollToBottom();
          playbackRef.current = setTimeout(() => {
            if (cancelled) return;
            setTypingVisible(false);
            step += 1;
            setVisibleCount(step);
            scrollToBottom();
            playbackRef.current = setTimeout(() => {
              if (!cancelled) runStep();
            }, settings.messageDelay / speed);
          }, settings.typingDuration / speed);
        } else {
          // "me" message: typewriter effect in input field
          setInputText("");
          const text = msg.text;
          let charIndex = 0;
          const typeChar = () => {
            if (cancelled) return;
            if (charIndex < text.length) {
              charIndex++;
              setInputText(text.slice(0, charIndex));

              // Key press animation
              const char = text[charIndex - 1].toLowerCase();
              setActiveKey(char);
              setTimeout(() => setActiveKey(""), 110);

              scrollToBottom();
              const extraDelay = charIndex % 5 === 0 ? 80 : 0;
              playbackRef.current = setTimeout(
                typeChar,
                (30 + extraDelay) / speed,
              );
            } else {
              // Done typing — send
              playbackRef.current = setTimeout(() => {
                if (cancelled) return;
                setInputText("");
                setActiveKey("");
                step += 1;
                setVisibleCount(step);
                scrollToBottom();
                playbackRef.current = setTimeout(() => {
                  if (!cancelled) runStep();
                }, settings.messageDelay / speed);
              }, 200 / speed);
            }
          };
          playbackRef.current = setTimeout(typeChar, 100 / speed);
        }
      } else {
        step += 1;
        setVisibleCount(step);
        scrollToBottom();
        const nextDelay =
          (msg.type === "call" ? settings.callBannerDuration : 400) / speed;
        playbackRef.current = setTimeout(() => {
          if (cancelled) return;
          runStep();
        }, nextDelay);
      }
    };

    runStep();

    return () => {
      cancelled = true;
      if (playbackRef.current) clearTimeout(playbackRef.current);
    };
  }, [isPlaying]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: visibleCount triggers scroll
  useEffect(() => {
    scrollToBottom();
  }, [visibleCount, scrollToBottom]);

  // Auto-play on load
  // biome-ignore lint/correctness/useExhaustiveDependencies: only run on mount
  useEffect(() => {
    if (settings.autoplay && messages.length > 0) {
      setVisibleCount(0);
      setIsPlaying(true);
    }
  }, []);

  const visibleMessages = messages.slice(0, visibleCount);
  const lastMeIndex =
    [...visibleMessages]
      .map((m, i) => ({ m, i }))
      .filter(({ m }) => m.sender === "me")
      .pop()?.i ?? -1;

  const iphoneBg = settings.darkMode ? "#000000" : "#F2F2F7";
  const headerBg = settings.darkMode
    ? "rgba(28,28,30,0.9)"
    : "rgba(242,242,247,0.9)";
  const headerText = settings.darkMode ? "white" : "#1C1C1E";

  return (
    <div className="flex flex-col items-center gap-4" id="iphone-preview-root">
      <style>{`
        @keyframes bounce-dot {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-4px); opacity: 1; }
        }
        @keyframes blink-cursor {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes key-press {
          0% { transform: scale(1); }
          40% { transform: scale(1.18); }
          100% { transform: scale(1); }
        }
      `}</style>

      {/* iPhone Frame */}
      <div
        id="iphone-frame"
        className="relative flex-shrink-0"
        style={{
          width: 300,
          height: 620,
          borderRadius: 48,
          background: settings.darkMode ? "#1C1C1E" : "#F2F2F7",
          border: "10px solid #0A0A0A",
          boxShadow:
            "0 40px 80px -20px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.06), inset 0 0 0 1px rgba(255,255,255,0.04)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Outer ring gloss */}
        <div
          style={{
            position: "absolute",
            inset: -1,
            borderRadius: 48,
            border: "1px solid rgba(255,255,255,0.08)",
            pointerEvents: "none",
            zIndex: 20,
          }}
        />

        {/* Screen */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            background: iphoneBg,
            borderRadius: 38,
            overflow: "hidden",
            fontFamily:
              '-apple-system, "SF Pro Text", "SF Pro Display", system-ui, sans-serif',
          }}
        >
          {/* Status Bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 20px 4px",
              background: headerBg,
              backdropFilter: "blur(20px)",
              flexShrink: 0,
              position: "relative",
            }}
          >
            {/* Dynamic Island */}
            <div
              style={{
                position: "absolute",
                top: 10,
                left: "50%",
                transform: "translateX(-50%)",
                width: 110,
                height: 30,
                background: "#000",
                borderRadius: 99,
                zIndex: 10,
              }}
            />
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: headerText,
                zIndex: 5,
                position: "relative",
              }}
            >
              {settings.statusBarTime}
            </span>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                zIndex: 5,
                position: "relative",
              }}
            >
              <Signal size={12} style={{ color: headerText }} />
              <Wifi size={12} style={{ color: headerText }} />
              <Battery size={14} style={{ color: headerText }} />
            </div>
          </div>

          {/* Chat Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "6px 12px 8px",
              background: headerBg,
              backdropFilter: "blur(20px)",
              borderBottom: `1px solid ${
                settings.darkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.1)"
              }`,
              flexShrink: 0,
              gap: 8,
            }}
          >
            <ChevronLeft
              size={18}
              style={{ color: "#0A84FF", flexShrink: 0 }}
            />
            {settings.notificationBadge > 0 && (
              <span
                style={{
                  background: "#FF3B30",
                  color: "white",
                  fontSize: 9,
                  fontWeight: 700,
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  marginLeft: -6,
                  marginRight: 2,
                }}
              >
                {settings.notificationBadge}
              </span>
            )}
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: "#0A84FF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: 700,
                  color: "white",
                  overflow: "hidden",
                  flexShrink: 0,
                }}
              >
                {settings.avatarUrl ? (
                  <img
                    src={settings.avatarUrl}
                    alt="avatar"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  settings.contactName.charAt(0).toUpperCase()
                )}
              </div>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: headerText,
                  lineHeight: 1,
                }}
              >
                {settings.contactName}
              </span>
            </div>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <Video size={16} style={{ color: "#0A84FF" }} />
              <PhoneCall size={15} style={{ color: "#0A84FF" }} />
            </div>
          </div>

          {/* Messages Area */}
          <div
            ref={chatScrollRef}
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "8px 12px",
              display: "flex",
              flexDirection: "column",
              gap: 4,
              scrollbarWidth: "none",
              overflowX: "hidden",
            }}
          >
            <AnimatePresence initial={false}>
              {visibleMessages.map((msg, i) => (
                <MessageBubble
                  key={msg.id}
                  msg={msg}
                  isLast={i === visibleMessages.length - 1}
                  isLastMe={i === lastMeIndex}
                  settings={settings}
                />
              ))}

              {typingVisible && isPlaying && (
                <motion.div
                  key="typing"
                  style={{ display: "flex", alignItems: "flex-end" }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <TypingIndicator />
                </motion.div>
              )}
            </AnimatePresence>

            {visibleCount === 0 && !isPlaying && (
              <div
                style={{
                  minHeight: 100,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                data-ocid="preview.empty_state"
              >
                <p
                  style={{
                    color: "#8E8E93",
                    fontSize: 11,
                    textAlign: "center",
                  }}
                >
                  Press Play to start the simulation
                </p>
              </div>
            )}
          </div>

          {/* Static Input Bar (shown when not playing) */}
          {!isPlaying && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 12px 12px",
                background: headerBg,
                backdropFilter: "blur(20px)",
                borderTop: `1px solid ${
                  settings.darkMode
                    ? "rgba(255,255,255,0.08)"
                    : "rgba(0,0,0,0.1)"
                }`,
                flexShrink: 0,
              }}
            >
              <Camera size={20} style={{ color: "#0A84FF", flexShrink: 0 }} />
              <Grid2x2 size={18} style={{ color: "#0A84FF", flexShrink: 0 }} />
              <div
                style={{
                  flex: 1,
                  height: 28,
                  borderRadius: 14,
                  border: `1px solid ${
                    settings.darkMode ? "#3A3D44" : "#D1D1D6"
                  }`,
                  display: "flex",
                  alignItems: "center",
                  paddingLeft: 10,
                }}
              >
                <span style={{ fontSize: 11, color: "#8E8E93" }}>iMessage</span>
              </div>
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: "50%",
                  background: settings.darkMode ? "#3A3D44" : "#D1D1D6",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <ArrowUp size={12} style={{ color: "#8E8E93" }} />
              </div>
            </div>
          )}

          {/* iOS Keyboard (shown when playing) */}
          {isPlaying && (
            <IOSKeyboard
              darkMode={settings.darkMode}
              isVisible={isPlaying}
              inputText={inputText}
              activeKey={activeKey}
            />
          )}
        </div>
      </div>

      {/* Playback Controls */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setVisibleCount(0);
            setIsPlaying(false);
            setInputText("");
          }}
          className="text-xs px-3 py-1.5 rounded-md font-medium transition-colors hover:bg-white/10"
          style={{
            background: "oklch(var(--studio-pill))",
            color: "oklch(var(--studio-muted))",
            border: "1px solid oklch(var(--studio-border))",
          }}
          data-ocid="preview.button"
        >
          Reset
        </button>
        <button
          type="button"
          onClick={() => {
            if (isPlaying) {
              setIsPlaying(false);
            } else {
              if (visibleCount >= messages.length) setVisibleCount(0);
              setIsPlaying(true);
            }
          }}
          className="text-xs px-4 py-1.5 rounded-md font-medium transition-opacity hover:opacity-90"
          style={{
            background: isPlaying
              ? "oklch(var(--destructive))"
              : "oklch(var(--studio-blue))",
            color: "white",
          }}
          data-ocid="preview.primary_button"
        >
          {isPlaying ? "⏸ Pause" : "▶ Play"}
        </button>
        <button
          type="button"
          onClick={() => setVisibleCount(messages.length)}
          className="text-xs px-3 py-1.5 rounded-md font-medium transition-colors hover:bg-white/10"
          style={{
            background: "oklch(var(--studio-pill))",
            color: "oklch(var(--studio-muted))",
            border: "1px solid oklch(var(--studio-border))",
          }}
          data-ocid="preview.button"
        >
          Show All
        </button>
      </div>

      <p className="text-xs" style={{ color: "oklch(var(--studio-muted))" }}>
        {visibleCount} / {messages.length} messages
      </p>
    </div>
  );
}
