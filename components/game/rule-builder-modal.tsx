"use client"

import { useState, useMemo } from "react"
import { Blocks, Zap, HelpCircle, Play, X, Plus, Trash2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Types for rule building blocks
interface TriggerBlock {
  type: string
  value: string
}

interface ConditionBlock {
  type: string
  operator: string
  value: string
}

interface ActionBlock {
  type: string
  value: string
}

export interface BuiltRule {
  id: string
  title: string
  trigger: TriggerBlock
  conditions: ConditionBlock[]
  actions: ActionBlock[]
}

interface RuleBuilderModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaveRule: (rule: BuiltRule) => void
  editingRule?: BuiltRule | null
}

// Block options
const triggerOptions = [
  { value: "land_on_tile", label: "Player lands on a tile" },
  { value: "roll_dice", label: "Player rolls the dice" },
  { value: "turn_start", label: "Turn starts" },
  { value: "turn_end", label: "Turn ends" },
  { value: "pass_tile", label: "Player passes a tile" },
]

const tileTypeOptions = [
  { value: "any", label: "Any tile" },
  { value: "normal", label: "Normal tile" },
  { value: "special", label: "Special tile" },
  { value: "start", label: "Start tile" },
  { value: "end", label: "End tile" },
]

const conditionTypeOptions = [
  { value: "player_score", label: "Player score" },
  { value: "dice_value", label: "Dice value" },
  { value: "tile_type", label: "Tile type" },
  { value: "turn_number", label: "Turn number" },
  { value: "player_position", label: "Player position" },
]

const operatorOptions = [
  { value: "equals", label: "equals" },
  { value: "greater_than", label: "is greater than" },
  { value: "less_than", label: "is less than" },
  { value: "not_equals", label: "is not" },
]

const actionTypeOptions = [
  { value: "add_score", label: "Add to score" },
  { value: "subtract_score", label: "Subtract from score" },
  { value: "move_forward", label: "Move forward" },
  { value: "move_backward", label: "Move backward" },
  { value: "skip_turn", label: "Skip next turn" },
  { value: "extra_turn", label: "Grant extra turn" },
  { value: "add_tile", label: "Add new tile" },
]

export function RuleBuilderModal({ open, onOpenChange, onSaveRule, editingRule }: RuleBuilderModalProps) {
  const [title, setTitle] = useState(editingRule?.title || "")
  const [trigger, setTrigger] = useState<TriggerBlock>(editingRule?.trigger || { type: "land_on_tile", value: "any" })
  const [conditions, setConditions] = useState<ConditionBlock[]>(editingRule?.conditions || [])
  const [actions, setActions] = useState<ActionBlock[]>(editingRule?.actions || [{ type: "add_score", value: "50" }])

  // Generate plain English preview
  const rulePreview = useMemo(() => {
    const triggerLabel = triggerOptions.find((t) => t.value === trigger.type)?.label || trigger.type
    const tileLabel = tileTypeOptions.find((t) => t.value === trigger.value)?.label || trigger.value

    let preview = `WHEN ${triggerLabel}`
    if (trigger.type === "land_on_tile" || trigger.type === "pass_tile") {
      preview += ` (${tileLabel})`
    }

    if (conditions.length > 0) {
      preview += "\nIF "
      preview += conditions
        .map((c) => {
          const condLabel = conditionTypeOptions.find((ct) => ct.value === c.type)?.label || c.type
          const opLabel = operatorOptions.find((o) => o.value === c.operator)?.label || c.operator
          return `${condLabel} ${opLabel} ${c.value}`
        })
        .join(" AND ")
    }

    preview += "\nTHEN "
    preview += actions
      .map((a) => {
        const actionLabel = actionTypeOptions.find((at) => at.value === a.type)?.label || a.type
        if (a.type === "skip_turn" || a.type === "extra_turn") {
          return actionLabel
        }
        return `${actionLabel} ${a.value}`
      })
      .join(", ")

    return preview
  }, [trigger, conditions, actions])

  const addCondition = () => {
    setConditions([...conditions, { type: "dice_value", operator: "greater_than", value: "3" }])
  }

  const removeCondition = (index: number) => {
    setConditions(conditions.filter((_, i) => i !== index))
  }

  const updateCondition = (index: number, field: keyof ConditionBlock, value: string) => {
    const updated = [...conditions]
    updated[index] = { ...updated[index], [field]: value }
    setConditions(updated)
  }

  const addAction = () => {
    setActions([...actions, { type: "add_score", value: "50" }])
  }

  const removeAction = (index: number) => {
    if (actions.length > 1) {
      setActions(actions.filter((_, i) => i !== index))
    }
  }

  const updateAction = (index: number, field: keyof ActionBlock, value: string) => {
    const updated = [...actions]
    updated[index] = { ...updated[index], [field]: value }
    setActions(updated)
  }

  const handleSave = () => {
    if (!title.trim()) return

    const rule: BuiltRule = {
      id: editingRule?.id || `rule-${Date.now()}`,
      title: title.trim(),
      trigger,
      conditions,
      actions,
    }
    onSaveRule(rule)
    onOpenChange(false)

    // Reset form
    setTitle("")
    setTrigger({ type: "land_on_tile", value: "any" })
    setConditions([])
    setActions([{ type: "add_score", value: "50" }])
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-background border-border max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Blocks className="h-5 w-5 text-cyan-400" />
            Rule Builder
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6 py-4">
            {/* Rule Title */}
            <div className="space-y-2">
              <Label htmlFor="rule-title" className="text-muted-foreground">
                Rule Name
              </Label>
              <Input
                id="rule-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter rule name..."
                className="bg-secondary/50 border-border focus:border-cyan-400"
              />
            </div>

            {/* WHEN - Trigger Block */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-yellow-400" />
                <span className="font-semibold text-yellow-400">WHEN</span>
                <span className="text-xs text-muted-foreground">(Trigger)</span>
              </div>
              <div className="rounded-lg border-2 border-yellow-400/50 bg-yellow-400/5 p-4 space-y-3">
                <div className="flex flex-wrap gap-3">
                  <Select value={trigger.type} onValueChange={(value) => setTrigger({ ...trigger, type: value })}>
                    <SelectTrigger className="w-[200px] bg-secondary border-yellow-400/30 focus:border-yellow-400">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {triggerOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {(trigger.type === "land_on_tile" || trigger.type === "pass_tile") && (
                    <Select value={trigger.value} onValueChange={(value) => setTrigger({ ...trigger, value })}>
                      <SelectTrigger className="w-[160px] bg-secondary border-yellow-400/30 focus:border-yellow-400">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {tileTypeOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
            </div>

            {/* IF - Condition Blocks */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-blue-400" />
                  <span className="font-semibold text-blue-400">IF</span>
                  <span className="text-xs text-muted-foreground">(Conditions - Optional)</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={addCondition}
                  className="h-7 text-blue-400 hover:text-blue-300 hover:bg-blue-400/10"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Condition
                </Button>
              </div>

              <div className="space-y-2">
                {conditions.length === 0 ? (
                  <div className="rounded-lg border-2 border-dashed border-blue-400/30 bg-blue-400/5 p-4 text-center text-sm text-muted-foreground">
                    No conditions - rule will always trigger
                  </div>
                ) : (
                  conditions.map((condition, index) => (
                    <div key={index} className="rounded-lg border-2 border-blue-400/50 bg-blue-400/5 p-4">
                      <div className="flex flex-wrap items-center gap-3">
                        {index > 0 && <span className="text-xs font-semibold text-blue-400">AND</span>}
                        <Select value={condition.type} onValueChange={(value) => updateCondition(index, "type", value)}>
                          <SelectTrigger className="w-[160px] bg-secondary border-blue-400/30 focus:border-blue-400">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {conditionTypeOptions.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Select
                          value={condition.operator}
                          onValueChange={(value) => updateCondition(index, "operator", value)}
                        >
                          <SelectTrigger className="w-[140px] bg-secondary border-blue-400/30 focus:border-blue-400">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {operatorOptions.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Input
                          value={condition.value}
                          onChange={(e) => updateCondition(index, "value", e.target.value)}
                          className="w-[100px] bg-secondary border-blue-400/30 focus:border-blue-400"
                          placeholder="Value"
                        />

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeCondition(index)}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* THEN - Action Blocks */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Play className="h-4 w-4 text-green-400" />
                  <span className="font-semibold text-green-400">THEN</span>
                  <span className="text-xs text-muted-foreground">(Actions)</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={addAction}
                  className="h-7 text-green-400 hover:text-green-300 hover:bg-green-400/10"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Action
                </Button>
              </div>

              <div className="space-y-2">
                {actions.map((action, index) => (
                  <div key={index} className="rounded-lg border-2 border-green-400/50 bg-green-400/5 p-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <Select value={action.type} onValueChange={(value) => updateAction(index, "type", value)}>
                        <SelectTrigger className="w-[180px] bg-secondary border-green-400/30 focus:border-green-400">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {actionTypeOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {action.type !== "skip_turn" && action.type !== "extra_turn" && (
                        <Input
                          value={action.value}
                          onChange={(e) => updateAction(index, "value", e.target.value)}
                          className="w-[100px] bg-secondary border-green-400/30 focus:border-green-400"
                          placeholder="Value"
                        />
                      )}

                      {actions.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeAction(index)}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="space-y-2">
              <Label className="text-muted-foreground">Rule Preview</Label>
              <Textarea
                readOnly
                value={rulePreview}
                className="min-h-[100px] bg-secondary/30 border-border text-sm font-mono resize-none"
              />
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2 pt-4 border-t border-border">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-muted-foreground">
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!title.trim()}
            className="bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 border border-cyan-400/50"
          >
            <Blocks className="h-4 w-4 mr-2" />
            Save Rule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
