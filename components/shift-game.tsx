"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { Book, Wifi, WifiOff, Users, Hash, LogIn, Bell, Radio } from "lucide-react"
import { socket } from "@/services/socket"
import { toast, Toaster } from "sonner"

// Components
import { TopBar } from "./game/top-bar"
import { GameViewport, type GameViewportRef } from "./game/game-viewport"
import { RuleBook } from "./game/rule-book"
import { RuleBuilderModal, type BuiltRule } from "./game/rule-builder-modal"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"

// --- Interfaces ---
export interface Tile { id: string; x: number; y: number; type: "normal" | "special" | "start" | "end" }
export interface Player { id: number | string; name: string; avatar: string; score: number; color: "cyan" | "violet"; position: { x: number; y: number } }

// --- Server Interfaces (pour mapping) ---
interface ServerTile {
    id: string;
    type: 'start' | 'end' | 'special' | 'normal';
    index: number;
}

interface ServerPlayer {
    id: string;
    color: 'cyan' | 'violet';
    position: number;
    score: number;
}

interface ServerGameState {
    roomId: string;
    tiles: ServerTile[];
    players: ServerPlayer[];
    currentTurn: string;
}

// --- Initial Data ---
// Initialisation avec des placeholders pour éviter les crashs au premier rendu avant la synchro
const initialTiles: Tile[] = Array.from({ length: 20 }, (_, i) => ({
    id: `tile-${i}`, x: i - 10, y: 0, type: i === 0 ? "start" : i === 19 ? "end" : i % 5 === 0 ? "special" : "normal",
}))

const initialPlayers: Player[] = []

const initialRules: BuiltRule[] = [
    { id: "1", title: "Movement", trigger: { type: "roll_dice", value: "" }, conditions: [], actions: [{ type: "move_forward", value: "dice" }] },
]

export default function ShiftGame() {
    // --- Game State ---
    const [tiles, setTiles] = useState<Tile[]>(initialTiles)
    const [players, setPlayers] = useState<Player[]>(initialPlayers)
    const [currentTurn, setCurrentTurn] = useState<number | string>(1)
    const [diceValue, setDiceValue] = useState<number | null>(null)
    const [isRolling, setIsRolling] = useState(false)
    const [rules, setRules] = useState<BuiltRule[]>(initialRules)

    // --- Socket & Room State ---
    const [isConnected, setIsConnected] = useState(socket.connected)
    const [roomInput, setRoomInput] = useState("")
    const [activeRoom, setActiveRoom] = useState<string | null>(null)

    // --- UI State ---
    const [ruleBuilderOpen, setRuleBuilderOpen] = useState(false)
    const [editingRule, setEditingRule] = useState<BuiltRule | null>(null)
    const [mobileRuleBookOpen, setMobileRuleBookOpen] = useState(false)
    const viewportRef = useRef<GameViewportRef>(null)

    // --- Helper: Map Server Index to Coordinates ---
    // Cette fonction traduit l'index linéaire (0-19) du serveur en coordonnées {x, y}
    // en se basant sur la disposition actuelle des tuiles côté client.
    const getCoordinatesFromIndex = useCallback((index: number, currentTiles: Tile[]) => {
        // Sécurité : si l'index est hors limites, on retourne la position de la première tuile ou (0,0)
        if (index < 0 || index >= currentTiles.length) {
            return currentTiles[0] ? { x: currentTiles[0].x, y: currentTiles[0].y } : { x: 0, y: 0 };
        }
        const targetTile = currentTiles[index]; // On suppose que l'ordre du tableau tiles correspond aux index 0-19
        return { x: targetTile.x, y: targetTile.y };
    }, []);

    // --- Socket Logic avec Logs de Debugging ---
    useEffect(() => {
        socket.connect()

        function onConnect() {
            console.log("✅ Connecté au serveur Socket.io");
            setIsConnected(true)
            toast.success("Connecté au serveur SHIFT")
        }

        function onDisconnect() {
            console.log("❌ Déconnecté du serveur");
            setIsConnected(false)
            setActiveRoom(null)
            toast.error("Déconnecté du serveur")
        }

        function onRoomJoined(roomId: string) {
            console.log("🏠 Confirmation de salle rejointe :", roomId);
            setActiveRoom(roomId)
            toast.info(`Salle rejointe : ${roomId}`)
        }

        function onGameStateSync(gameState: ServerGameState) {
            console.log("🔄 Synchronisation de l'état du jeu :", gameState);

            // 1. Mise à jour des Joueurs
            const syncedPlayers: Player[] = gameState.players.map((p, idx) => {
                // Hack temporaire : on utilise initialTiles pour mapper les coords
                const coords = initialTiles[p.position] ? { x: initialTiles[p.position].x, y: initialTiles[p.position].y } : { x: 0, y: 0 };

                return {
                    id: p.id,
                    name: `Player ${idx + 1}`,
                    avatar: `/cyberpunk-avatar-${(idx % 2) + 1}.png`,
                    score: p.score,
                    color: p.color,
                    position: coords
                };
            });

            setPlayers(syncedPlayers);
            if (gameState.currentTurn) {
                setCurrentTurn(gameState.currentTurn);
            }
            toast.success("État du jeu synchronisé !");
        }

        function onDiceResult(data: { diceValue: number, players: ServerPlayer[], currentTurn: string }) {
            console.log("🎲 Résultat du dé reçu :", data);
            
            // 1. Animation du dé
            setIsRolling(true);
            let rolls = 0;
            const interval = setInterval(() => {
                setDiceValue(Math.floor(Math.random() * 6) + 1);
                rolls++;
                if (rolls >= 10) {
                    clearInterval(interval);
                    setDiceValue(data.diceValue);
                    setIsRolling(false);
                    
                    // 2. Mise à jour des joueurs et du tour APRES l'animation
                    const syncedPlayers: Player[] = data.players.map((p, idx) => {
                        const coords = initialTiles[p.position] ? { x: initialTiles[p.position].x, y: initialTiles[p.position].y } : { x: 0, y: 0 };
                        return {
                            id: p.id,
                            name: `Player ${idx + 1}`,
                            avatar: `/cyberpunk-avatar-${(idx % 2) + 1}.png`,
                            score: p.score,
                            color: p.color,
                            position: coords
                        };
                    });
                    setPlayers(syncedPlayers);
                    setCurrentTurn(data.currentTurn);
                    
                    toast.info(`Résultat du dé : ${data.diceValue}`, {
                        icon: "🎲"
                    });
                }
            }, 50);
        }

        function onError(data: { message: string }) {
            toast.error(data.message);
        }

        function onPlayerJoined(data: { id: string, message: string }) {
            console.log("👥 Un joueur a rejoint :", data.id);
            toast(data.message, {
                description: `ID: ${data.id.substring(0, 6)}...`,
                icon: <Users className="h-4 w-4 text-cyan-500" />,
            })
        }

        function onPongResponse(data: { message: string, serverTime: string }) {
            console.log("🏓 Pong reçu du serveur :", data);
            toast.success(data.message, {
                description: `Réponse reçue à ${data.serverTime}`,
                icon: <Radio className="h-4 w-4" />
            })
        }

        function onIncomingShout(data: { senderId: string, message: string }) {
            console.log("📣 Shout reçu :", data.message);
            if (data.senderId !== socket.id) {
                toast(`Message de la salle`, {
                    description: `${data.senderId.substring(0, 4)} dit : ${data.message}`,
                    icon: <Bell className="h-4 w-4 text-yellow-500" />,
                })
            }
        }

        socket.on("connect", onConnect)
        socket.on("disconnect", onDisconnect)
        socket.on("room_joined", onRoomJoined)
        socket.on("game_state_sync", onGameStateSync)
        socket.on("dice_result", onDiceResult) // ✅ Nouvel écouteur
        socket.on("error", onError) // ✅ Gestion des erreurs
        socket.on("player_joined_room", onPlayerJoined)
        socket.on("pong_response", onPongResponse)
        socket.on("incoming_shout", onIncomingShout)

        return () => {
            socket.off("connect", onConnect)
            socket.off("disconnect", onDisconnect)
            socket.off("room_joined", onRoomJoined)
            socket.off("game_state_sync", onGameStateSync)
            socket.off("dice_result", onDiceResult)
            socket.off("error", onError)
            socket.off("player_joined_room", onPlayerJoined)
            socket.off("pong_response", onPongResponse)
            socket.off("incoming_shout", onIncomingShout)
            socket.disconnect()
        }
    }, [])

    // --- Handlers ---
    const handleJoinRoom = () => {
        if (roomInput.trim()) {
            console.log("📤 Émission join_room :", roomInput.trim());
            socket.emit("join_room", roomInput.trim())
        }
    }

    const triggerPing = () => {
        console.log("📤 Émission ping_test");
        socket.emit("ping_test")
    }

    const triggerShout = () => {
        if (activeRoom) {
            console.log("📤 Émission send_shout dans :", activeRoom);
            socket.emit("send_shout", { roomId: activeRoom, message: "Alerte SHIFT !" })
            toast.info("Votre message a été diffusé à la salle.")
        }
    }

    const rollDice = useCallback(() => {
        if (isRolling || !activeRoom) return;
        
        // Vérification locale pour UX (le serveur fera la vérification finale)
        if (currentTurn !== socket.id) {
            toast.warning("Ce n'est pas votre tour !");
            return;
        }

        console.log("🎲 Demande de lancer de dé envoyée au serveur");
        socket.emit("roll_dice", { roomId: activeRoom });
        
        // On ne lance plus l'animation ici, on attend la réponse du serveur
    }, [isRolling, activeRoom, currentTurn])

    const addTile = useCallback((direction: "up" | "down" | "left" | "right") => {
        setTiles((prev) => {
            const bounds = prev.reduce((acc, tile) => ({
                minX: Math.min(acc.minX, tile.x),
                maxX: Math.max(acc.maxX, tile.x),
                minY: Math.min(acc.minY, tile.y),
                maxY: Math.max(acc.maxY, tile.y),
            }), { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity })

            let newX = 0, newY = 0
            if (direction === "up") { newX = Math.floor((bounds.minX + bounds.maxX) / 2); newY = bounds.minY - 1 }
            else if (direction === "down") { newX = Math.floor((bounds.minX + bounds.maxX) / 2); newY = bounds.maxY + 1 }
            else if (direction === "left") { newX = bounds.minX - 1; newY = 0 }
            else { newX = bounds.maxX + 1; newY = 0 }

            return [...prev, { id: `tile-${Date.now()}`, x: newX, y: newY, type: Math.random() > 0.7 ? "special" : "normal" }]
        })
    }, [])

    const centerOnPlayer = useCallback(() => {
        const currentPlayer = players.find((p) => p.id === currentTurn)
        if (currentPlayer && viewportRef.current) {
            viewportRef.current.centerOnTile(currentPlayer.position.x, currentPlayer.position.y)
        }
    }, [players, currentTurn])

    const handleSaveRule = (rule: BuiltRule) => {
        setRules((prev) => {
            const existingIndex = prev.findIndex((r) => r.id === rule.id)
            if (existingIndex >= 0) {
                const updated = [...prev]; updated[existingIndex] = rule; return updated
            }
            return [...prev, rule]
        })
        setEditingRule(null)
    }

    return (
        <div className="h-screen w-screen flex flex-col overflow-hidden bg-background text-foreground">
            {/* ✅ Ajout du Toaster pour rendre les notifications visibles */}
            <Toaster position="bottom-right" theme="dark" richColors />

            <header className="relative z-50 bg-background/95 backdrop-blur border-b border-border/50 px-4 py-2 flex items-center justify-between shadow-2xl shadow-cyan-500/5">
                <div className="flex items-center gap-6">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black tracking-[0.2em] text-muted-foreground uppercase leading-none mb-1">Infrastructure</span>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-black tracking-tighter italic bg-gradient-to-r from-white to-muted-foreground bg-clip-text text-transparent text-white">SHIFT</h1>
                            <Badge variant={isConnected ? "outline" : "destructive"} className={`h-5 gap-1.5 px-2 transition-all duration-500 ${isConnected ? 'text-cyan-400 border-cyan-500/30 bg-cyan-500/5' : ''}`}>
                                {isConnected ? <Wifi className="h-3 w-3 animate-pulse" /> : <WifiOff className="h-3 w-3" />}
                                <span className="text-[10px] uppercase font-black tracking-tight">
                                    {isConnected ? (activeRoom ? `Room: ${activeRoom}` : "Online") : "Offline"}
                                </span>
                            </Badge>
                        </div>
                    </div>

                    {!activeRoom && isConnected && (
                        <div className="hidden md:flex items-center gap-2 ml-4 bg-muted/20 p-1.5 rounded-xl border border-border/40 backdrop-blur-xl">
                            <Hash className="h-4 w-4 text-muted-foreground ml-2" />
                            <Input
                                placeholder="Code de salle..."
                                value={roomInput}
                                onChange={(e) => setRoomInput(e.target.value)}
                                className="h-8 w-40 bg-transparent border-none focus-visible:ring-0 text-xs font-medium placeholder:text-muted-foreground/50 text-white"
                                onKeyDown={(e) => e.key === "Enter" && handleJoinRoom()}
                            />
                            <Button size="sm" onClick={handleJoinRoom} className="h-8 px-4 bg-cyan-600 hover:bg-cyan-500 text-[10px] uppercase font-black tracking-widest transition-all hover:shadow-[0_0_15px_rgba(8,145,178,0.4)]">
                                <LogIn className="h-3 w-3 mr-2" /> Rejoindre
                            </Button>
                        </div>
                    )}

                    {activeRoom && (
                        <div className="hidden lg:flex items-center gap-2 ml-4 border-l border-border/50 pl-6">
                            <Button variant="outline" size="sm" onClick={triggerPing} className="h-8 border-border/40 bg-background/50 text-[10px] uppercase font-bold hover:bg-cyan-500/10 text-white">
                                <Radio className="h-3 w-3 mr-2 text-cyan-500" /> Ping Test
                            </Button>
                            <Button variant="outline" size="sm" onClick={triggerShout} className="h-8 border-border/40 bg-background/50 text-[10px] uppercase font-bold hover:bg-yellow-500/10 text-white">
                                <Bell className="h-3 w-3 mr-2 text-yellow-500" /> Broadcast Shout
                            </Button>
                        </div>
                    )}
                </div>

                <TopBar currentTurn={currentTurn} players={players} diceValue={diceValue} isRolling={isRolling} onRollDice={rollDice} />
            </header>

            <div className="flex-1 flex min-h-0 overflow-hidden relative">
                <div className="flex-1 min-w-0 relative">
                    <GameViewport ref={viewportRef} tiles={tiles} players={players} currentTurn={currentTurn} onAddTile={addTile} onCenterCamera={centerOnPlayer} />
                </div>
                <aside className="hidden lg:flex lg:w-85 lg:shrink-0 border-l border-border/50 bg-background/60 backdrop-blur-md">
                    <RuleBook rules={rules} onEditRule={(rule) => { setEditingRule(rule); setRuleBuilderOpen(true); }} onDeleteRule={(id) => setRules(prev => prev.filter(r => r.id !== id))} onAddRule={() => { setEditingRule(null); setRuleBuilderOpen(true); }} />
                </aside>
            </div>

            <Button onClick={() => setMobileRuleBookOpen(true)} className="lg:hidden fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-cyan-500 hover:bg-cyan-400 text-background shadow-[0_0_20px_rgba(6,182,212,0.4)] border-4 border-background" size="icon">
                <Book className="h-6 w-6" />
            </Button>

            <Sheet open={mobileRuleBookOpen} onOpenChange={setMobileRuleBookOpen}>
                <SheetContent side="right" className="w-full sm:max-w-md p-0 border-l border-border/50 bg-background/95 backdrop-blur-2xl">
                    <SheetHeader className="p-6 border-b border-border/50">
                        <SheetTitle className="flex items-center gap-3 text-xl font-black italic tracking-tighter text-white">
                            <Book className="h-6 w-6 text-cyan-500" /> RULE BOOK
                        </SheetTitle>
                    </SheetHeader>
                    <RuleBook rules={rules} onEditRule={(rule) => { setMobileRuleBookOpen(false); setEditingRule(rule); setRuleBuilderOpen(true); }} onDeleteRule={(id) => setRules(prev => prev.filter(r => r.id !== id))} onAddRule={() => { setMobileRuleBookOpen(false); setEditingRule(null); setRuleBuilderOpen(true); }} />
                </SheetContent>
            </Sheet>

            <RuleBuilderModal open={ruleBuilderOpen} onOpenChange={setRuleBuilderOpen} onSaveRule={handleSaveRule} editingRule={editingRule} />
        </div>
    )
}