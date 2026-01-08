"use client"

import type React from "react"
import { useState, useRef, useCallback, useEffect, forwardRef, useImperativeHandle, useMemo } from "react"
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Move, Crosshair } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Tile, Player } from "@/components/shift-game"

export interface GameViewportRef {
  centerOnTile: (x: number, y: number) => void
}

interface GameViewportProps {
  tiles: Tile[]
  players: Player[]
  currentTurn: number
  onAddTile: (direction: "up" | "down" | "left" | "right") => void
  onCenterCamera: () => void
}

const TILE_SIZE = 64
const TILE_GAP = 4
const TOTAL_TILE_SIZE = TILE_SIZE + TILE_GAP

export const GameViewport = forwardRef<GameViewportRef, GameViewportProps>(
  ({ tiles, players, currentTurn, onAddTile, onCenterCamera }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const [pan, setPan] = useState({ x: 0, y: 0 })
    const [zoom, setZoom] = useState(1)
    const [isDragging, setIsDragging] = useState(false)
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
    const [isInitialized, setIsInitialized] = useState(false)

    const worldBounds = useMemo(() => {
      if (tiles.length === 0) {
        return { minX: 0, maxX: 0, minY: 0, maxY: 0, width: 0, height: 0, offsetX: 0, offsetY: 0 }
      }

      const bounds = tiles.reduce(
        (acc, tile) => ({
          minX: Math.min(acc.minX, tile.x),
          maxX: Math.max(acc.maxX, tile.x),
          minY: Math.min(acc.minY, tile.y),
          maxY: Math.max(acc.maxY, tile.y),
        }),
        {
          minX: Number.POSITIVE_INFINITY,
          maxX: Number.NEGATIVE_INFINITY,
          minY: Number.POSITIVE_INFINITY,
          maxY: Number.NEGATIVE_INFINITY,
        },
      )

      // Calculate world size with padding for expansion
      const padding = 5
      const width = (bounds.maxX - bounds.minX + 1 + padding * 2) * TOTAL_TILE_SIZE
      const height = (bounds.maxY - bounds.minY + 1 + padding * 2) * TOTAL_TILE_SIZE

      // Offset to normalize negative coordinates into positive world space
      const offsetX = (-bounds.minX + padding) * TOTAL_TILE_SIZE
      const offsetY = (-bounds.minY + padding) * TOTAL_TILE_SIZE

      return { ...bounds, width, height, offsetX, offsetY }
    }, [tiles])

    const tileToWorld = useCallback(
      (tileX: number, tileY: number) => ({
        x: tileX * TOTAL_TILE_SIZE + worldBounds.offsetX,
        y: tileY * TOTAL_TILE_SIZE + worldBounds.offsetY,
      }),
      [worldBounds.offsetX, worldBounds.offsetY],
    )

    const centerOnTile = useCallback(
      (tileX: number, tileY: number) => {
        if (!containerRef.current) return
        const rect = containerRef.current.getBoundingClientRect()
        const worldPos = tileToWorld(tileX, tileY)

        setPan({
          x: rect.width / 2 - (worldPos.x + TILE_SIZE / 2) * zoom,
          y: rect.height / 2 - (worldPos.y + TILE_SIZE / 2) * zoom,
        })
      },
      [tileToWorld, zoom],
    )

    useImperativeHandle(
      ref,
      () => ({
        centerOnTile,
      }),
      [centerOnTile],
    )

    // Center the board on mount
    useEffect(() => {
      if (containerRef.current && !isInitialized && tiles.length > 0) {
        const rect = containerRef.current.getBoundingClientRect()
        const centerTileX = Math.floor((worldBounds.minX + worldBounds.maxX) / 2)
        const centerTileY = Math.floor((worldBounds.minY + worldBounds.maxY) / 2)
        const worldPos = tileToWorld(centerTileX, centerTileY)

        setPan({
          x: rect.width / 2 - worldPos.x,
          y: rect.height / 2 - worldPos.y,
        })
        setIsInitialized(true)
      }
    }, [tiles.length, worldBounds, tileToWorld, isInitialized])

    const handleMouseDown = useCallback(
      (e: React.MouseEvent) => {
        if (e.button === 0) {
          setIsDragging(true)
          setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
        }
      },
      [pan],
    )

    const handleMouseMove = useCallback(
      (e: React.MouseEvent) => {
        if (isDragging) {
          setPan({
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y,
          })
        }
      },
      [isDragging, dragStart],
    )

    const handleMouseUp = useCallback(() => {
      setIsDragging(false)
    }, [])

    const handleWheel = useCallback((e: React.WheelEvent) => {
      e.preventDefault()
      const delta = e.deltaY > 0 ? 0.9 : 1.1
      setZoom((prev) => Math.min(Math.max(prev * delta, 0.3), 2))
    }, [])

    return (
      <div className="absolute inset-0 grid-pattern">
        {/* Viewport - overflow hidden parent */}
        <div
          ref={containerRef}
          className="absolute inset-0 cursor-grab active:cursor-grabbing overflow-hidden"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          <div
            className="absolute"
            style={{
              width: worldBounds.width,
              height: worldBounds.height,
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: "0 0",
            }}
          >
            {/* Grid tiles rendered at normalized world positions */}
            {tiles.map((tile) => {
              const worldPos = tileToWorld(tile.x, tile.y)
              return <GameTile key={tile.id} tile={tile} x={worldPos.x} y={worldPos.y} />
            })}

            {players.map((player) => {
              const worldPos = tileToWorld(player.position.x, player.position.y)
              return (
                <PlayerToken
                  key={player.id}
                  player={player}
                  x={worldPos.x}
                  y={worldPos.y}
                  isActive={player.id === currentTurn}
                  playerIndex={players.findIndex((p) => p.id === player.id)}
                />
              )
            })}
          </div>
        </div>

        <div className="absolute top-2 md:top-4 left-1/2 -translate-x-1/2 z-10">
          <Button
            variant="outline"
            size="icon"
            onClick={() => onAddTile("up")}
            className="h-8 w-8 md:h-10 md:w-10 bg-card/80 backdrop-blur-sm border-cyan-400/30 hover:border-cyan-400 hover:bg-cyan-400/10 text-cyan-400"
          >
            <ChevronUp className="h-4 w-4 md:h-5 md:w-5" />
          </Button>
        </div>

        <div className="absolute bottom-14 md:bottom-4 left-1/2 -translate-x-1/2 z-10">
          <Button
            variant="outline"
            size="icon"
            onClick={() => onAddTile("down")}
            className="h-8 w-8 md:h-10 md:w-10 bg-card/80 backdrop-blur-sm border-cyan-400/30 hover:border-cyan-400 hover:bg-cyan-400/10 text-cyan-400"
          >
            <ChevronDown className="h-4 w-4 md:h-5 md:w-5" />
          </Button>
        </div>

        <div className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-10">
          <Button
            variant="outline"
            size="icon"
            onClick={() => onAddTile("left")}
            className="h-8 w-8 md:h-10 md:w-10 bg-card/80 backdrop-blur-sm border-cyan-400/30 hover:border-cyan-400 hover:bg-cyan-400/10 text-cyan-400"
          >
            <ChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
          </Button>
        </div>

        <div className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-10">
          <Button
            variant="outline"
            size="icon"
            onClick={() => onAddTile("right")}
            className="h-8 w-8 md:h-10 md:w-10 bg-card/80 backdrop-blur-sm border-cyan-400/30 hover:border-cyan-400 hover:bg-cyan-400/10 text-cyan-400"
          >
            <ChevronRight className="h-4 w-4 md:h-5 md:w-5" />
          </Button>
        </div>

        <div className="absolute bottom-16 md:bottom-4 right-2 md:right-4 flex flex-col gap-2 z-10">
          <Button
            variant="outline"
            size="icon"
            onClick={onCenterCamera}
            className="h-8 w-8 md:h-10 md:w-10 bg-card/80 backdrop-blur-sm border-cyan-400/30 hover:border-cyan-400 hover:bg-cyan-400/10 text-cyan-400"
            title="Center on current player"
          >
            <Crosshair className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setZoom((prev) => Math.min(prev * 1.2, 2))}
            className="h-8 w-8 md:h-10 md:w-10 bg-card/80 backdrop-blur-sm border-border hover:border-violet-400 hover:bg-violet-400/10 text-violet-400"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setZoom((prev) => Math.max(prev * 0.8, 0.3))}
            className="h-8 w-8 md:h-10 md:w-10 bg-card/80 backdrop-blur-sm border-border hover:border-violet-400 hover:bg-violet-400/10 text-violet-400"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
        </div>

        <div className="hidden md:flex absolute bottom-4 left-4 items-center gap-2 text-xs text-muted-foreground z-10">
          <Move className="h-3 w-3" />
          <span>Drag to pan</span>
        </div>
      </div>
    )
  },
)

GameViewport.displayName = "GameViewport"

function GameTile({ tile, x, y }: { tile: Tile; x: number; y: number }) {
  const getStyles = () => {
    switch (tile.type) {
      case "start":
        return "bg-cyan-500/30 border-cyan-400 glow-cyan text-cyan-400"
      case "end":
        return "bg-violet-500/30 border-violet-400 glow-violet text-violet-400"
      case "special":
        return "bg-violet-500/20 border-violet-400/50 text-violet-400"
      default:
        return "bg-card border-border hover:border-cyan-400/50 text-muted-foreground"
    }
  }

  const getLabel = () => {
    switch (tile.type) {
      case "start":
        return "S"
      case "end":
        return "E"
      case "special":
        return "★"
      default:
        return ""
    }
  }

  return (
    <div
      className={`absolute w-16 h-16 rounded-lg border-2 flex items-center justify-center font-bold text-lg transition-all duration-300 ${getStyles()}`}
      style={{
        left: x,
        top: y,
      }}
    >
      {getLabel()}
      {/* Coordinate display for debugging */}
      <span className="absolute bottom-0.5 right-1 text-[8px] opacity-40 font-mono">
        {tile.x},{tile.y}
      </span>
    </div>
  )
}

function PlayerToken({
  player,
  x,
  y,
  isActive,
  playerIndex,
}: {
  player: Player
  x: number
  y: number
  isActive: boolean
  playerIndex: number
}) {
  const colorClass = player.color === "cyan" ? "bg-cyan-400 border-cyan-300" : "bg-violet-400 border-violet-300"
  const glowClass =
    player.color === "cyan" ? "shadow-[0_0_12px_rgba(34,211,238,0.8)]" : "shadow-[0_0_12px_rgba(168,85,247,0.8)]"

  // Offset tokens slightly so both are visible on the same tile
  const offset = playerIndex === 0 ? -8 : 8

  return (
    <div
      className={`absolute w-6 h-6 rounded-full border-2 transition-all duration-300 ${colorClass} ${isActive ? glowClass : ""} ${isActive ? "scale-110" : "scale-100"}`}
      style={{
        left: x + TILE_SIZE / 2 - 12 + offset,
        top: y + TILE_SIZE / 2 - 12,
        zIndex: isActive ? 10 : 5,
      }}
    >
      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-background">
        {player.id}
      </span>
    </div>
  )
}
