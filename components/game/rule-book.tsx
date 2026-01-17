"use client"
import { Book, Pencil, Trash2, Plus, Zap, HelpCircle, Play } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Rule, TriggerType, ActionType } from "@/src/types/rules"

interface RuleBookProps {
  rules: Rule[]
  onEditRule: (rule: Rule) => void
  onDeleteRule: (id: string) => void
  onAddRule: () => void
}

// Helper to generate description from rule
function generateDescription(rule: Rule): string {
  const triggerLabels: Record<string, string> = {
    [TriggerType.ON_LAND]: "Player lands on a tile",
    [TriggerType.ON_DICE_ROLL]: "Player rolls the dice",
    [TriggerType.ON_TURN_START]: "Turn starts",
    [TriggerType.ON_MOVE_START]: "Player starts moving",
    [TriggerType.ON_PASS_OVER]: "Player passes over a tile",
  }

  const actionLabels: Record<string, string> = {
    [ActionType.MODIFY_SCORE]: "modify score",
    [ActionType.MOVE_RELATIVE]: "move relative",
    [ActionType.TELEPORT]: "teleport",
    [ActionType.SKIP_TURN]: "skip next turn",
  }

  let desc = triggerLabels[rule.trigger.type] || rule.trigger.type
  if ((rule.trigger.type === TriggerType.ON_LAND || rule.trigger.type === TriggerType.ON_PASS_OVER) && rule.trigger.value !== undefined) {
    desc += ` (Tile Index: ${rule.trigger.value})`
  } else if (rule.trigger.type === TriggerType.ON_DICE_ROLL && rule.trigger.value !== undefined) {
      desc += ` (Dice Value: ${rule.trigger.value})`
  }

  desc += ", then "
  desc += rule.effects
    .map((a) => {
      const label = actionLabels[a.type] || a.type
      if (a.type === ActionType.SKIP_TURN) return `${label} (${a.target})`
      return `${label} ${a.value} (${a.target})`
    })
    .join(", ")

  return desc + "."
}

export function RuleBook({ rules, onEditRule, onDeleteRule, onAddRule }: RuleBookProps) {
  return (
    <div className="w-full h-full lg:h-[calc(100vh-5rem)] border-l border-border bg-card/30 backdrop-blur-sm flex flex-col">
      {/* Header */}
      <div className="shrink-0 p-4 border-b border-border flex items-center justify-between bg-background/50">
        <div className="flex items-center gap-2">
          <Book className="h-5 w-5 text-cyan-400" />
          <h2 className="font-bold text-lg">Rule Book</h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onAddRule}
          className="h-8 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/10"
        >
          <Plus className="h-4 w-4 mr-1" />
          New
        </Button>
      </div>

      {/* Scrollable rules */}
      <div className="flex-1 min-h-0">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-3">
            {rules.map((rule, index) => (
              <Card key={rule.id} className="bg-secondary/50 border-border hover:border-cyan-400/30 transition-colors">
                <CardHeader className="p-3 pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span className="text-cyan-400 font-mono">{String(index + 1).padStart(2, "0")}</span>
                      {rule.title}
                    </span>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-cyan-400"
                        onClick={() => onEditRule(rule)}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                        onClick={() => onDeleteRule(rule.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0 space-y-2">
                  <div className="flex flex-wrap gap-1">
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-yellow-400/10 text-yellow-400 border border-yellow-400/30">
                      <Zap className="h-2.5 w-2.5" />
                      WHEN
                    </span>
                    {rule.conditions.length > 0 && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-400/10 text-blue-400 border border-blue-400/30">
                        <HelpCircle className="h-2.5 w-2.5" />
                        IF ({rule.conditions.length})
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-400/10 text-green-400 border border-green-400/30">
                      <Play className="h-2.5 w-2.5" />
                      THEN ({rule.effects.length})
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{generateDescription(rule)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Footer hint */}
      <div className="shrink-0 p-3 border-t border-border text-center bg-background/50">
        <p className="text-xs text-muted-foreground">
          <span className="text-violet-400">{rules.length}</span> rules defined
        </p>
      </div>
    </div>
  )
}
