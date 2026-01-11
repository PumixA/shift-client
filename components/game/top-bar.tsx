"use client"

import { Dices, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { Player } from "@/components/shift-game"
import { socket } from "@/services/socket"

interface TopBarProps {
  currentTurnId: string
  players: Player[]
  diceValue: number | null
  isRolling: boolean
  onRollDice: () => void
  gameStatus: 'playing' | 'finished'
}

export function TopBar({ currentTurnId, players, diceValue, isRolling, onRollDice, gameStatus }: TopBarProps) {
  // Sécurisation : si players est vide, on affiche un état de chargement ou vide
  if (!players || players.length === 0) {
    return (
      <header className="sticky top-0 z-50 h-20 shrink-0 border-b border-border bg-background/95 backdrop-blur-sm flex items-center justify-center px-4 md:px-6">
        <span className="text-muted-foreground animate-pulse">Waiting for players...</span>
      </header>
    )
  }

  // Vérification stricte : c'est mon tour si l'ID du tour correspond à mon ID de socket
  const isMyTurn = currentTurnId === socket.id;
  
  // Trouver le joueur dont c'est le tour pour afficher son nom
  const currentPlayer = players.find(p => p.id === currentTurnId);

  return (
    <header className="sticky top-0 z-50 h-20 shrink-0 border-b border-border bg-background/95 backdrop-blur-sm supports-[backdrop-filter]:bg-background/80 flex items-center justify-between px-4 md:px-6">
      {/* Left - Player 1 */}
      {players[0] && <PlayerCard player={players[0]} isActive={currentTurnId === players[0].id} />}

      {/* Center - Turn & Dice */}
      <div className="flex items-center gap-3 md:gap-6">
        <div className="text-center hidden sm:block">
          <p className="text-xs text-muted-foreground uppercase tracking-widest">Current Turn</p>
          <p className={`text-lg font-bold ${currentTurnId === (players[0]?.id) ? "text-cyan-400" : "text-violet-400"}`}>
            {currentPlayer ? currentPlayer.name : "Unknown"}
          </p>
        </div>

        {gameStatus === 'finished' ? (
          <div className="h-12 md:h-14 px-4 md:px-8 flex items-center justify-center bg-red-500/10 rounded-md border border-red-500/50">
             <span className="text-sm md:text-base text-red-400 font-bold animate-pulse">GAME OVER</span>
          </div>
        ) : isMyTurn ? (
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
        ) : (
          <div className="h-12 md:h-14 px-4 md:px-8 flex items-center justify-center bg-muted/20 rounded-md border border-border/50">
             <span className="text-sm md:text-base text-muted-foreground animate-pulse">Waiting for opponent...</span>
          </div>
        )}

        {diceValue !== null && !isRolling && (
          <div className="hidden xs:flex items-center gap-1 text-violet-400">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm">+{diceValue * 10} pts</span>
          </div>
        )}
      </div>

      {/* Right - Player 2 */}
      {players[1] && <PlayerCard player={players[1]} isActive={currentTurnId === players[1].id} />}
    </header>
  )
}

function PlayerCard({ player, isActive }: { player: Player; isActive: boolean }) {
  // Sécurisation supplémentaire au cas où player serait undefined malgré le check parent
  if (!player) return null;

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
        <AvatarFallback className={textColor}>{player.name ? player.name[0] : "?"}</AvatarFallback>
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
