import { TOOL_ICON_NODES } from "@/lib/tool-icon-nodes";

/**
 * Renders a lucide icon from raw path data as plain <svg> elements — see
 * lib/tool-icon-nodes.ts for why this can't just use lucide-react's own
 * <Icon> components inside next/og.
 */
export function OgIcon({
  name,
  size,
  color,
  strokeWidth = 2,
}: {
  name: string;
  size: number;
  color: string;
  strokeWidth?: number;
}) {
  const node = TOOL_ICON_NODES[name];
  if (!node) return null;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: "flex" }}
    >
      {node.map(([tag, attrs]) => {
        const Tag = tag as unknown as "path";
        return <Tag key={attrs.key as string} {...attrs} />;
      })}
    </svg>
  );
}
