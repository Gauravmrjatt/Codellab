import React, { useRef, useState } from "react";

type Direction = "horizontal" | "vertical";

interface SplitPanelProps {
  direction?: Direction;
  minSize?: number;
  initialSize?: number; // percentage
  children: [React.ReactNode, React.ReactNode];
}

const SplitPanel: React.FC<SplitPanelProps> = ({
  direction = "horizontal",
  minSize = 100,
  initialSize = 50,
  children,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(initialSize);
  const [isDragging, setIsDragging] = useState(false);

  const isHorizontal = direction === "horizontal";

  const onMouseDown = () => {
    setIsDragging(true);
  };

  const onMouseMove = (e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    let newSize = isHorizontal
      ? ((e.clientX - rect.left) / rect.width) * 100
      : ((e.clientY - rect.top) / rect.height) * 100;

    newSize = Math.max(
      (minSize / (isHorizontal ? rect.width : rect.height)) * 100,
      Math.min(100 - (minSize / (isHorizontal ? rect.width : rect.height)) * 100, newSize)
    );

    setSize(newSize);
  };

  const onMouseUp = () => {
    setIsDragging(false);
  };

  React.useEffect(() => {
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  });

  return (
    <div
      ref={containerRef}
      style={{
        display: "flex",
        flexDirection: isHorizontal ? "row" : "column",
        width: "100%",
        height: "100%",
        userSelect: isDragging ? "none" : "auto",
      }}
    >
      <div
        style={{
          flexBasis: `${size}%`,
          overflow: "auto",
        }}
      >
        {children[0]}
      </div>

      {/* Divider */}
      <div
        onMouseDown={onMouseDown}
        style={{
          width: isHorizontal ? 6 : "100%",
          height: isHorizontal ? "100%" : 6,
          cursor: isHorizontal ? "col-resize" : "row-resize",
        }}
        className="split-panel-divider rounded-sm bg-transparent"
      />

      <div
        style={{
          flexGrow: 1,
          overflow: "auto",
        }}
        className="split-panel-child"
      >
        {children[1]}
      </div>
    </div>
  );
};

export default SplitPanel;
