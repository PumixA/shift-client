"use client"

import { Dices, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { Player } from "@/components/shift-game"

interface TopBarProps {
  currentTurn: number
  players: Player[]
  diceValue: number | null
  isRolling: boolean
  onRollDice: () => void
}

export function TopBar({ currentTurn, players, diceValue, isRolling, onRollDice }: TopBarProps) {
  return (
    <header className="sticky top-0 z-50 h-20 shrink-0 border-b border-border bg-background/95 backdrop-blur-sm supports-[backdrop-filter]:bg-background/80 flex items-center justify-between px-4 md:px-6">
      {/* Left - Player 1 */}
      <PlayerCard player={players[0]} isActive={currentTurn === 1} />

      {/* Center - Turn & Dice */}
      <div className="flex items-center gap-3 md:gap-6">
        <div className="text-center hidden sm:block">
          <p className="text-xs text-muted-foreground uppercase tracking-widest">Current Turn</p>
          <p className={`text-lg font-bold ${currentTurn === 1 ? "text-cyan-400" : "text-violet-400"}`}>
            {players.find((p) => p.id === currentTurn)?.name}
          </p>
        </div>

        <Button
          onClick={onRollDice}
          disabled={isRolling}
          className={`h-12 md:h-14 px-4 md:px-8 text-base md:text-lg font-bold transition-all duration-300 ${
            isRolling
              ? "animate-pulse bg-violet-500/20 text-violet-400"
              : "bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 glow-cyan-sm"
          }`}
          variant="outline"
        >
          <Dices className={`mr-2 h-5 w-5 md:h-6 md:w-6 ${isRolling ? "animate-spin" : ""}`} />
          {diceValue !== null ? diceValue : "ROLL"}
        </Button>

        {diceValue !== null && !isRolling && (
          <div className="hidden xs:flex items-center gap-1 text-violet-400">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm">+{diceValue * 10} pts</span>
          </div>
        )}
      </div>

      {/* Right - Player 2 */}
      <PlayerCard player={players[1]} isActive={currentTurn === 2} />
    </header>
  )
}

function PlayerCard({ player, isActive }: { player: Player; isActive: boolean }) {
  const glowClass = player.color === "cyan" ? "glow-cyan" : "glow-violet"
  const borderColor = player.color === "cyan" ? "border-cyan-400" : "border-violet-400"
  const textColor = player.color === "cyan" ? "text-cyan-400" : "text-violet-400"

  return (
    <div
      className={`flex items-center gap-2 md:gap-3 p-2 md:p-3 rounded-lg transition-all duration-300 ${
        isActive ? `bg-secondary/50 ${glowClass}` : "bg-transparent"
      }`}
    >
      <Avatar className={`h-10 w-10 md:h-12 md:w-12 border-2 ${isActive ? borderColor : "border-border"}`}>
        <AvatarImage src={player.avatar || "/placeholder.svg"} alt={player.name} />
        <AvatarFallback className={textColor}>{player.name[0]}</AvatarFallback>
      </Avatar>
      <div>
        <p
          className={`font-semibold text-sm md:text-base truncate max-w-[60px] md:max-w-none ${isActive ? textColor : "text-foreground"}`}
        >
          {player.name}
        </p>
        <p className="text-xs md:text-sm text-muted-foreground font-mono">{player.score} pts</p>
      </div>
    </div>
  )
}
