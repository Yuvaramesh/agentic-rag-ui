import { useEffect, useRef } from "react";

export function useAutoResizeTextarea({
  minHeight = 72,
  maxHeight = 300,
} = {}) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const adjustHeight = (reset: boolean = false) => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = reset ? `${minHeight}px` : "auto";
      const newHeight = Math.min(
        Math.max(textarea.scrollHeight, minHeight),
        maxHeight
      );
      textarea.style.height = `${newHeight}px`;
    }
  };

  useEffect(() => {
    adjustHeight();
  }, []);

  return { textareaRef, adjustHeight };
}
