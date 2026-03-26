# iMessage Simulator Studio

## Current State
The app has a working IPhonePreview component with an IOSKeyboard component. The keyboard renders correctly but is entirely static — no key animations, no per-character feedback. The input bar uses a fixed-height single-line display (not a textarea), which clips text and can overflow horizontally. The input text is shown inside a small 30px-height div with `whiteSpace: nowrap`. There is no suggestion bar. No key press animations exist.

## Requested Changes (Diff)

### Add
- iOS-style suggestion bar (3 word suggestions above the keyboard, updating based on last typed word)
- Per-key press animation: when a character is typed during typewriter effect, the matching keyboard key should briefly scale up and highlight (like a real key press)
- Blinking cursor inside the input field (already partially there, but only when inputText is non-empty — make it always visible when playing)
- Suggestion bar styled like iOS dark mode: dark background, 3 evenly spaced word options separated by vertical dividers

### Modify
- Input bar: replace the fixed-height single-line div with a textarea-style element that auto-grows in height (up to ~80px max), wraps text, and never overflows horizontally. The send button must stay visible at all times (align-items: flex-end on the row container).
- IOSKeyboard component: accept an `activeKey` prop (the current character being typed). When `activeKey` matches a key, that key animates — scale up briefly and show a highlighted background for ~100ms, then return to normal. Use CSS transitions.
- Playback engine in IPhonePreview: when typing a character, set `activeKey` state to that character, then clear it after ~100ms so the key animation triggers.
- Typing delays: add small randomized variation (25-55ms base + occasional 80ms pause every 5 chars) for natural feel.

### Remove
- Nothing removed, only enhancements

## Implementation Plan
1. Add `activeKey` state in IPhonePreview, passed to IOSKeyboard
2. In the typewriter loop, after setting inputText, also setActiveKey(char) then setTimeout to clear it after 100ms
3. In IOSKeyboard, each key checks if it matches activeKey — if so, apply transform: scale(1.2) and a brighter background color via CSS transition (transition: all 0.1s)
4. Add suggestion bar component above keyboard rows: 3 words from a static suggestion map keyed by last word prefix, styled as dark bar with text separated by thin vertical lines
5. Suggestions update when inputText changes — derive last word, look up suggestions
6. Replace the input field div inside IOSKeyboard with a multi-line text display that wraps and grows: use a div with `whiteSpace: pre-wrap`, `wordBreak: break-word`, min-height 30px, max-height 72px, overflow hidden, showing inputText with a blinking cursor span appended
7. Input row container: use `alignItems: flex-end` so send button stays at bottom when text grows
