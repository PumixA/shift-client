"use client"

import { useState, useMemo } from "react"
import { Blocks, Zap, Play, X, Plus, Trash2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TriggerType, ActionType, Rule, RuleEffect } from "@/src/types/rules"

interface RuleBuilderModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaveRule: (rule: Rule) => void
  editingRule?: Rule | null
}

// Trigger options
const triggerOptions = [
  { value: TriggerType.ON_LAND, label: "Player lands on a tile" },
  { value: TriggerType.ON_PASS_OVER, label: "Player passes over a tile" },
  { value: TriggerType.ON_MOVE_START, label: "Player starts moving" },
  { value: TriggerType.ON_TURN_START, label: "Turn starts" },
  { value: TriggerType.ON_DICE_ROLL, label: "Dice rolled" },
]

// Action options
const actionTypeOptions = [
  { value: ActionType.MOVE_RELATIVE, label: "Move Relative (Forward/Backward)" },
  { value: ActionType.TELEPORT, label: "Teleport to Tile" },
  { value: ActionType.MODIFY_SCORE, label: "Modify Score" },
  { value: ActionType.SKIP_TURN, label: "Skip Next Turn" },
]

const targetOptions = [
  { value: 'self', label: "Self" },
  { value: 'all', label: "All Players" },
  { value: 'others', label: "Other Players" },
]

export function RuleBuilderModal({ open, onOpenChange, onSaveRule, editingRule }: RuleBuilderModalProps) {
  const [title, setTitle] = useState(editingRule?.title || "")
  const [triggerType, setTriggerType] = useState<TriggerType>(editingRule?.trigger.type || TriggerType.ON_LAND)
  const [triggerValue, setTriggerValue] = useState<string>(editingRule?.trigger.value?.toString() || "")
  
  const [effects, setEffects] = useState<RuleEffect[]>(editingRule?.effects || [{ type: ActionType.MODIFY_SCORE, value: 50, target: 'self' }])

  // Generate plain English preview
  const rulePreview = useMemo(() => {
    const triggerLabel = triggerOptions.find((t) => t.value === triggerType)?.label || triggerType
    
    let preview = `WHEN ${triggerLabel}`
    if ((triggerType === TriggerType.ON_LAND || triggerType === TriggerType.ON_PASS_OVER) && triggerValue) {
      preview += ` (Tile Index: ${triggerValue})`
    } else if (triggerType === TriggerType.ON_DICE_ROLL && triggerValue) {
        preview += ` (Dice Value: ${triggerValue})`
    }

    preview += "\nTHEN "
    preview += effects
      .map((a) => {
        const actionLabel = actionTypeOptions.find((at) => at.value === a.type)?.label || a.type
        const targetLabel = targetOptions.find((t) => t.value === a.target)?.label || a.target
        
        if (a.type === ActionType.SKIP_TURN) {
          return `${actionLabel} (${targetLabel})`
        }
        return `${actionLabel} ${a.value} (${targetLabel})`
      })
      .join(", ")

    return preview
  }, [triggerType, triggerValue, effects])

  const addEffect = () => {
    setEffects([...effects, { type: ActionType.MODIFY_SCORE, value: 50, target: 'self' }])
  }

  const removeEffect = (index: number) => {
    if (effects.length > 1) {
      setEffects(effects.filter((_, i) => i !== index))
    }
  }

  const updateEffect = (index: number, field: keyof RuleEffect, value: any) => {
    const updated = [...effects]
    // @ts-ignore
    updated[index] = { ...updated[index], [field]: value }
    setEffects(updated)
  }

  const handleSave = () => {
    if (!title.trim()) return

    const rule: Rule = {
      id: editingRule?.id || `rule-${Date.now()}`,
      title: title.trim(),
      trigger: {
        type: triggerType,
        value: triggerValue ? Number(triggerValue) : undefined
      },
      conditions: [],
      effects: effects.map(e => ({
          ...e,
          value: Number(e.value)
      })),
    }
    onSaveRule(rule)
    onOpenChange(false)

    // Reset form if not editing
    if (!editingRule) {
        setTitle("")
        setTriggerType(TriggerType.ON_LAND)
        setTriggerValue("")
        setEffects([{ type: ActionType.MODIFY_SCORE, value: 50, target: 'self' }])
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-background border-border max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Blocks className="h-5 w-5 text-cyan-400" />
            Créer une règle
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6 py-4">
            {/* Rule Title */}
            <div className="space-y-2">
              <Label htmlFor="rule-title" className="text-muted-foreground">
                Nom de la règle
              </Label>
              <Input
                id="rule-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Bonus Case Départ"
                className="bg-secondary/50 border-border focus:border-cyan-400"
              />
            </div>

            {/* WHEN - Trigger Block */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-yellow-400" />
                <span className="font-semibold text-yellow-400">QUAND</span>
                <span className="text-xs text-muted-foreground">(Déclencheur)</span>
              </div>
              <div className="rounded-lg border-2 border-yellow-400/50 bg-yellow-400/5 p-4 space-y-3">
                <div className="flex flex-wrap gap-3 items-center">
                  <Select value={triggerType} onValueChange={(value) => setTriggerType(value as TriggerType)}>
                    <SelectTrigger className="w-[250px] bg-secondary border-yellow-400/30 focus:border-yellow-400">
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

                  {(triggerType === TriggerType.ON_LAND || triggerType === TriggerType.ON_PASS_OVER) && (
                    <div className="flex items-center gap-2">
                        <Label className="text-xs text-muted-foreground whitespace-nowrap">Case spécifique (Index):</Label>
                        <Input 
                            type="number"
                            value={triggerValue} 
                            onChange={(e) => setTriggerValue(e.target.value)}
                            placeholder="Ex: 0, 19..."
                            className="w-[100px] bg-secondary border-yellow-400/30 focus:border-yellow-400"
                        />
                    </div>
                  )}
                   {triggerType === TriggerType.ON_DICE_ROLL && (
                    <div className="flex items-center gap-2">
                        <Label className="text-xs text-muted-foreground whitespace-nowrap">Valeur du dé:</Label>
                        <Input 
                            type="number"
                            value={triggerValue} 
                            onChange={(e) => setTriggerValue(e.target.value)}
                            placeholder="Ex: 6"
                            className="w-[100px] bg-secondary border-yellow-400/30 focus:border-yellow-400"
                        />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* THEN - Action Blocks */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Play className="h-4 w-4 text-green-400" />
                  <span className="font-semibold text-green-400">ALORS</span>
                  <span className="text-xs text-muted-foreground">(Effets)</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={addEffect}
                  className="h-7 text-green-400 hover:text-green-300 hover:bg-green-400/10"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Ajouter Effet
                </Button>
              </div>

              <div className="space-y-2">
                {effects.map((effect, index) => (
                  <div key={index} className="rounded-lg border-2 border-green-400/50 bg-green-400/5 p-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <Select value={effect.type} onValueChange={(value) => updateEffect(index, "type", value)}>
                        <SelectTrigger className="w-[220px] bg-secondary border-green-400/30 focus:border-green-400">
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

                      {effect.type !== ActionType.SKIP_TURN && (
                        <Input
                          type="number"
                          value={effect.value}
                          onChange={(e) => updateEffect(index, "value", e.target.value)}
                          className="w-[100px] bg-secondary border-green-400/30 focus:border-green-400"
                          placeholder="Value"
                        />
                      )}

                      <Select value={effect.target} onValueChange={(value) => updateEffect(index, "target", value)}>
                        <SelectTrigger className="w-[140px] bg-secondary border-green-400/30 focus:border-green-400">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {targetOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {effects.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeEffect(index)}
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
              <Label className="text-muted-foreground">Aperçu</Label>
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
            Annuler
          </Button>
          <Button
            onClick={handleSave}
            disabled={!title.trim()}
            className="bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 border border-cyan-400/50"
          >
            <Blocks className="h-4 w-4 mr-2" />
            Sauvegarder
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
