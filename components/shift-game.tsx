"use client"

import { useState, useCallback, useRef } from "react"
import { Book } from "lucide-react"
import { TopBar } from "./game/top-bar"
import { GameViewport, type GameViewportRef } from "./game/game-viewport"
import { RuleBook } from "./game/rule-book"
import { RuleBuilderModal, type BuiltRule } from "./game/rule-builder-modal"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"

export interface Tile {
  id: string
  x: number
  y: number
  type: "normal" | "special" | "start" | "end"
}

export interface Player {
  id: number
  name: string
  avatar: string
  score: number
  color: "cyan" | "violet"
  position: { x: number; y: number }
}

const initialTiles: Tile[] = Array.from({ length: 20 }, (_, i) => ({
  id: `tile-${i}`,
  x: i - 10,
  y: 0,
  type: i === 0 ? "start" : i === 19 ? "end" : i % 5 === 0 ? "special" : "normal",
}))

const initialPlayers: Player[] = [
  { id: 1, name: "Player 1", avatar: "/cyberpunk-avatar-1.png", score: 0, color: "cyan", position: { x: -10, y: 0 } },
  {
    id: 2,
    name: "Player 2",
    avatar: "/cyberpunk-avatar-2.png",
    score: 150,
    color: "violet",
    position: { x: -10, y: 0 },
  },
]

const initialRules: BuiltRule[] = [
  {
    id: "1",
    title: "Movement",
    trigger: { type: "roll_dice", value: "" },
    conditions: [],
    actions: [{ type: "move_forward", value: "dice" }],
  },
  {
    id: "2",
    title: "SHIFT Action",
    trigger: { type: "land_on_tile", value: "special" },
    conditions: [],
    actions: [{ type: "add_tile", value: "1" }],
  },
  {
    id: "3",
    title: "Cyan Bonus",
    trigger: { type: "land_on_tile", value: "special" },
    conditions: [{ type: "tile_type", operator: "equals", value: "cyan" }],
    actions: [{ type: "add_score", value: "50" }],
  },
  {
    id: "4",
    title: "Violet Bonus",
    trigger: { type: "land_on_tile", value: "special" },
    conditions: [{ type: "tile_type", operator: "equals", value: "violet" }],
    actions: [{ type: "add_score", value: "100" }],
  },
  {
    id: "5",
    title: "Victory Condition",
    trigger: { type: "turn_end", value: "" },
    conditions: [{ type: "player_score", operator: "greater_than", value: "500" }],
    actions: [{ type: "extra_turn", value: "" }],
  },
  {
    id: "6",
    title: "End Tile Win",
    trigger: { type: "land_on_tile", value: "end" },
    conditions: [],
    actions: [{ type: "add_score", value: "500" }],
  },
]

export default function ShiftGame() {
  const [tiles, setTiles] = useState<Tile[]>(initialTiles)
  const [players, setPlayers] = useState<Player[]>(initialPlayers)
  const [currentTurn, setCurrentTurn] = useState(1)
  const [diceValue, setDiceValue] = useState<number | null>(null)
  const [isRolling, setIsRolling] = useState(false)
  const [rules, setRules] = useState<BuiltRule[]>(initialRules)
  const [ruleBuilderOpen, setRuleBuilderOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<BuiltRule | null>(null)
  const [mobileRuleBookOpen, setMobileRuleBookOpen] = useState(false)
  const viewportRef = useRef<GameViewportRef>(null)

  const rollDice = useCallback(() => {
    if (isRolling) return
    setIsRolling(true)

    let rolls = 0
    const interval = setInterval(() => {
      setDiceValue(Math.floor(Math.random() * 6) + 1)
      rolls++
      if (rolls >= 10) {
        clearInterval(interval)
        const finalValue = Math.floor(Math.random() * 6) + 1
        setDiceValue(finalValue)
        setIsRolling(false)

        setPlayers((prev) => prev.map((p) => (p.id === currentTurn ? { ...p, score: p.score + finalValue * 10 } : p)))
        setCurrentTurn((prev) => (prev === 1 ? 2 : 1))
      }
    }, 100)
  }, [isRolling, currentTurn])

  const addTile = useCallback((direction: "up" | "down" | "left" | "right") => {
    setTiles((prev) => {
      const bounds = prev.reduce(
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

      let newX: number, newY: number
      switch (direction) {
        case "up":
          newX = Math.floor((bounds.minX + bounds.maxX) / 2)
          newY = bounds.minY - 1
          break
        case "down":
          newX = Math.floor((bounds.minX + bounds.maxX) / 2)
          newY = bounds.maxY + 1
          break
        case "left":
          newX = bounds.minX - 1
          newY = 0
          break
        case "right":
          newX = bounds.maxX + 1
          newY = 0
          break
      }

      const newTile: Tile = {
        id: `tile-${Date.now()}`,
        x: newX,
        y: newY,
        type: Math.random() > 0.7 ? "special" : "normal",
      }

      return [...prev, newTile]
    })
  }, [])

  const centerOnPlayer = useCallback(() => {
    const currentPlayer = players.find((p) => p.id === currentTurn)
    if (currentPlayer && viewportRef.current) {
      viewportRef.current.centerOnTile(currentPlayer.position.x, currentPlayer.position.y)
    }
  }, [players, currentTurn])

  const handleSaveRule = useCallback((rule: BuiltRule) => {
    setRules((prev) => {
      const existingIndex = prev.findIndex((r) => r.id === rule.id)
      if (existingIndex >= 0) {
        const updated = [...prev]
        updated[existingIndex] = rule
        return updated
      }
      return [...prev, rule]
    })
    setEditingRule(null)
  }, [])

  const handleEditRule = useCallback((rule: BuiltRule) => {
    setEditingRule(rule)
    setRuleBuilderOpen(true)
  }, [])

  const handleDeleteRule = useCallback((id: string) => {
    setRules((prev) => prev.filter((r) => r.id !== id))
  }, [])

  const handleAddRule = useCallback(() => {
    setEditingRule(null)
    setRuleBuilderOpen(true)
  }, [])

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-background">
      <TopBar
        currentTurn={currentTurn}
        players={players}
        diceValue={diceValue}
        isRolling={isRolling}
        onRollDice={rollDice}
      />

      <div className="flex-1 flex min-h-0 overflow-hidden">
        <div className="flex-1 min-w-0 relative">
          <GameViewport
            ref={viewportRef}
            tiles={tiles}
            players={players}
            currentTurn={currentTurn}
            onAddTile={addTile}
            onCenterCamera={centerOnPlayer}
          />
        </div>

        <aside className="hidden lg:flex lg:w-80 lg:shrink-0">
          <RuleBook
            rules={rules}
            onEditRule={handleEditRule}
            onDeleteRule={handleDeleteRule}
            onAddRule={handleAddRule}
          />
        </aside>
      </div>

      <Button
        onClick={() => setMobileRuleBookOpen(true)}
        className="lg:hidden fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-cyan-500 hover:bg-cyan-400 text-background shadow-lg shadow-cyan-500/30"
        size="icon"
      >
        <Book className="h-6 w-6" />
        <span className="sr-only">Open Rule Book</span>
      </Button>

      <Sheet open={mobileRuleBookOpen} onOpenChange={setMobileRuleBookOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0 border-l border-border">
          <SheetHeader className="sr-only">
            <SheetTitle>Rule Book</SheetTitle>
          </SheetHeader>
          <RuleBook
            rules={rules}
            onEditRule={(rule) => {
              setMobileRuleBookOpen(false)
              handleEditRule(rule)
            }}
            onDeleteRule={handleDeleteRule}
            onAddRule={() => {
              setMobileRuleBookOpen(false)
              handleAddRule()
            }}
          />
        </SheetContent>
      </Sheet>

      <RuleBuilderModal
        open={ruleBuilderOpen}
        onOpenChange={setRuleBuilderOpen}
        onSaveRule={handleSaveRule}
        editingRule={editingRule}
      />
    </div>
  )
}
