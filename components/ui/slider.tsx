"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"

const BUBBLE_SIZE = 112
const BUBBLE_GAP = 24

interface SliderProps
  extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
  /**
   * Small live preview shown in a floating circular bubble above the thumb
   * while dragging on a touchscreen - the same idea as the iOS text-cursor
   * loupe, since a finger dragging the thumb otherwise sits right on top of
   * the on-screen result it's controlling. Desktop pointer drags skip it:
   * a mouse cursor doesn't cover the page the way a finger does.
   */
  previewContent?: React.ReactNode
}

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  SliderProps
>(({ className, previewContent, onPointerDown, onPointerMove, onPointerUp, onPointerCancel, ...props }, ref) => {
  const [bubblePos, setBubblePos] = React.useState<{ x: number; y: number } | null>(null)
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => setMounted(true), [])

  const clearBubble = () => setBubblePos(null)

  return (
    <SliderPrimitive.Root
      ref={ref}
      className={cn(
        "relative flex w-full touch-none select-none items-center",
        className
      )}
      onPointerDown={(e) => {
        if (previewContent && e.pointerType === "touch") {
          setBubblePos({ x: e.clientX, y: e.clientY })
        }
        onPointerDown?.(e)
      }}
      onPointerMove={(e) => {
        setBubblePos((prev) => (prev ? { x: e.clientX, y: e.clientY } : prev))
        onPointerMove?.(e)
      }}
      onPointerUp={(e) => {
        clearBubble()
        onPointerUp?.(e)
      }}
      onPointerCancel={(e) => {
        clearBubble()
        onPointerCancel?.(e)
      }}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
        <SliderPrimitive.Range className="absolute h-full bg-primary" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />

      {mounted && bubblePos && previewContent &&
        createPortal(
          <div
            className="pointer-events-none fixed z-[100] flex items-center justify-center overflow-hidden rounded-full border-4 border-background bg-muted shadow-2xl ring-1 ring-border"
            style={{
              left: bubblePos.x,
              top: bubblePos.y - BUBBLE_GAP,
              width: BUBBLE_SIZE,
              height: BUBBLE_SIZE,
              transform: "translate(-50%, -100%)",
            }}
          >
            {previewContent}
          </div>,
          document.body
        )}
    </SliderPrimitive.Root>
  )
})
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
