import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(express.static('public'));

// 游戏配置
const GAME_CONFIG = {
    MAX_PLAYERS: 2,
    START_HEALTH: 30,
    START_POINTS: 3,
    MAX_POINTS: 10,
    POINTS_PER_TURN: 3,
    INITIAL_HAND_SIZE: 5,
    MAX_HAND_SIZE: 10,
    DECK_SIZE: 20
};

// 卡牌数据 - 纯化学元素
const CARDS = {
    // 碱金属族 - 遇水立即反应
    'Li': {
        id: 'Li', symbol: 'Li', name: '锂', type: 'alkali_metal',
        cost: 2, attack: 2, health: 2, reactivity: 7,
        description: '轻金属 | 遇水立即反应爆炸'
    },
    'Na': {
        id: 'Na', symbol: 'Na', name: '钠', type: 'alkali_metal',
        cost: 3, attack: 3, health: 2, reactivity: 9,
        description: '活泼金属 | 遇水立即剧烈反应'
    },
    'K': {
        id: 'K', symbol: 'K', name: '钾', type: 'alkali_metal',
        cost: 4, attack: 4, health: 2, reactivity: 10,
        description: '极活泼 | 遇水立即爆炸'
    },
    // 碱土金属
    'Mg': {
        id: 'Mg', symbol: 'Mg', name: '镁', type: 'alkaline_earth',
        cost: 3, attack: 3, health: 3, reactivity: 5,
        description: '燃烧发出强光 | 遇水缓慢反应'
    },
    'Ca': {
        id: 'Ca', symbol: 'Ca', name: '钙', type: 'alkaline_earth',
        cost: 3, attack: 2, health: 4, reactivity: 5,
        description: '骨骼主要成分 | 遇水反应'
    },
    // 卤素族
    'F': {
        id: 'F', symbol: 'F', name: '氟', type: 'halogen',
        cost: 3, attack: 5, health: 1, reactivity: 10,
        description: '最强氧化剂 | 剧烈反应'
    },
    'Cl': {
        id: 'Cl', symbol: 'Cl', name: '氯', type: 'halogen',
        cost: 3, attack: 4, health: 2, reactivity: 8,
        description: '黄绿色气体 | 与水反应'
    },
    'Br': {
        id: 'Br', symbol: 'Br', name: '溴', type: 'halogen',
        cost: 4, attack: 4, health: 2, reactivity: 7,
        description: '唯一液态非金属 | 微溶于水'
    },
    'I': {
        id: 'I', symbol: 'I', name: '碘', type: 'halogen',
        cost: 4, attack: 3, health: 3, reactivity: 6,
        description: '紫色固体 | 难溶于水'
    },
    // 稀有气体 - 不反应
    'He': {
        id: 'He', symbol: 'He', name: '氦', type: 'noble_gas',
        cost: 2, attack: 0, health: 6, reactivity: 0,
        description: '惰性气体 | 完全不反应'
    },
    'Ne': {
        id: 'Ne', symbol: 'Ne', name: '氖', type: 'noble_gas',
        cost: 3, attack: 0, health: 7, reactivity: 0,
        description: '霓虹灯发光 | 不反应'
    },
    'Ar': {
        id: 'Ar', symbol: 'Ar', name: '氩', type: 'noble_gas',
        cost: 3, attack: 0, health: 8, reactivity: 0,
        description: '焊接保护气 | 不反应'
    },
    // 过渡金属
    'Fe': {
        id: 'Fe', symbol: 'Fe', name: '铁', type: 'transition_metal',
        cost: 4, attack: 4, health: 5, reactivity: 4,
        description: '工业基础 | 潮湿环境生锈'
    },
    'Cu': {
        id: 'Cu', symbol: 'Cu', name: '铜', type: 'transition_metal',
        cost: 4, attack: 3, health: 5, reactivity: 3,
        description: '导电性极佳 | 生绿锈'
    },
    'Zn': {
        id: 'Zn', symbol: 'Zn', name: '锌', type: 'transition_metal',
        cost: 3, attack: 3, health: 4, reactivity: 4,
        description: '镀锌防锈 | 与酸反应'
    },
    'Ag': {
        id: 'Ag', symbol: 'Ag', name: '银', type: 'noble_metal',
        cost: 5, attack: 4, health: 5, reactivity: 2,
        description: '贵金属 | 不易反应'
    },
    'Au': {
        id: 'Au', symbol: 'Au', name: '金', type: 'noble_metal',
        cost: 7, attack: 5, health: 7, reactivity: 1,
        description: '最惰性金属 | 几乎不反应'
    },
    // 非金属
    'C': {
        id: 'C', symbol: 'C', name: '碳', type: 'nonmetal',
        cost: 3, attack: 2, health: 4, reactivity: 3,
        description: '生命骨架 | 高温可燃'
    },
    'O': {
        id: 'O', symbol: 'O', name: '氧', type: 'nonmetal',
        cost: 3, attack: 3, health: 3, reactivity: 7,
        description: '助燃 | 氧化剂'
    },
    'H': {
        id: 'H', symbol: 'H', name: '氢', type: 'nonmetal',
        cost: 1, attack: 1, health: 2, reactivity: 8,
        description: '最轻元素 | 易燃易爆'
    },
    'N': {
        id: 'N', symbol: 'N', name: '氮', type: 'nonmetal',
        cost: 3, attack: 1, health: 5, reactivity: 2,
        description: '大气主要成分 | 惰性'
    },
    'S': {
        id: 'S', symbol: 'S', name: '硫', type: 'nonmetal',
        cost: 3, attack: 3, health: 3, reactivity: 5,
        description: '黄色固体 | 可燃'
    },
    'P': {
        id: 'P', symbol: 'P', name: '磷', type: 'nonmetal',
        cost: 3, attack: 3, health: 2, reactivity: 8,
        description: '白磷易燃 | 发磷光'
    },
    // 化合物 - 水是反应物
    'H2O': {
        id: 'H2O', name: '水', symbol: 'H₂O', type: 'compound',
        cost: 2, attack: 0, health: 3, reactivity: 0,
        description: '2H+O | 与碱金属立即反应爆炸 | 与卤素反应'
    },
    'NaCl': {
        id: 'NaCl', name: '食盐', symbol: 'NaCl', type: 'compound',
        cost: 2, value: 2, description: 'Na+Cl | 增加攻击力'
    },
    'CO2': {
        id: 'CO2', name: '二氧化碳', symbol: 'CO₂', type: 'compound',
        cost: 3, value: 3, description: 'C+2O | 造成伤害'
    }
};

// 玩家类
class Player {
    constructor(socketId, name) {
        this.socketId = socketId;
        this.name = name;
        this.health = GAME_CONFIG.START_HEALTH;
        this.armor = 0;
        this.points = { 
            current: GAME_CONFIG.START_POINTS, 
            max: GAME_CONFIG.START_POINTS
        };
        this.deck = [];
        this.hand = [];
        this.board = [];
        this.activeEffects = [];
    }

    initDeck() {
        const cardPool = ['Li', 'Na', 'K', 'Mg', 'Ca', 'F', 'Cl', 'Br', 'I', 
                         'He', 'Ne', 'Ar', 'Fe', 'Cu', 'Zn', 'Ag', 'Au',
                         'C', 'O', 'H', 'N', 'S', 'P', 'H2O', 'NaCl', 'CO2'];
        for (let i = 0; i < GAME_CONFIG.DECK_SIZE; i++) {
            const cardId = cardPool[Math.floor(Math.random() * cardPool.length)];
            this.deck.push({ ...CARDS[cardId] });
        }
        this.shuffleDeck();
    }

    shuffleDeck() {
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    }

    drawCard() {
        if (this.deck.length === 0) return null;
        if (this.hand.length >= GAME_CONFIG.MAX_HAND_SIZE) return null;
        const card = this.deck.pop();
        this.hand.push(card);
        return card;
    }

    takeDamage(amount) {
        let remaining = amount;
        if (this.armor > 0) {
            const absorb = Math.min(this.armor, remaining);
            this.armor -= absorb;
            remaining -= absorb;
        }
        this.health -= remaining;
        if (this.health < 0) this.health = 0;
        return { actual: amount - remaining, remaining };
    }

    heal(amount) {
        this.health = Math.min(GAME_CONFIG.START_HEALTH, this.health + amount);
        return amount;
    }

    addArmor(amount) {
        this.armor += amount;
        return this.armor;
    }

    spendPoints(amount) {
        if (this.points.current < amount) return false;
        this.points.current -= amount;
        return true;
    }

    startTurn() {
        this.points.current = Math.min(this.points.max + GAME_CONFIG.POINTS_PER_TURN, GAME_CONFIG.MAX_POINTS);
        if (this.points.max < GAME_CONFIG.MAX_POINTS) {
            this.points.max = Math.min(this.points.max + 1, GAME_CONFIG.MAX_POINTS);
        }
        this.board.forEach(m => m.hasAttacked = false);
        this.drawCard();
    }
}

// 房间类
class GameRoom {
    constructor(roomId) {
        this.roomId = roomId;
        this.players = [];
        this.currentTurn = 0;
        this.turnNumber = 1;
        this.gameState = 'waiting';
    }

    addPlayer(socketId, name) {
        if (this.players.length >= 2) return false;
        const player = new Player(socketId, name);
        player.initDeck();
        for (let i = 0; i < GAME_CONFIG.INITIAL_HAND_SIZE; i++) {
            player.drawCard();
        }
        this.players.push(player);
        return true;
    }

    removePlayer(socketId) {
        this.players = this.players.filter(p => p.socketId !== socketId);
    }

    startGame() {
        if (this.players.length !== 2) return false;
        this.gameState = 'playing';
        this.currentTurn = 0;
        this.turnNumber = 1;
        this.players[0].startTurn();
        return true;
    }

    getCurrentPlayer() {
        return this.players[this.currentTurn];
    }

    getOpponent(socketId) {
        return this.players.find(p => p.socketId !== socketId);
    }

    playCard(socketId, cardIndex) {
        const player = this.players.find(p => p.socketId === socketId);
        if (!player) return { success: false, error: '玩家不存在' };
        if (this.getCurrentPlayer().socketId !== socketId) return { success: false, error: '不是你的回合' };
        if (cardIndex >= player.hand.length) return { success: false, error: '卡牌不存在' };

        const card = player.hand[cardIndex];
        if (player.points.current < card.cost) return { success: false, error: '行动点数不足' };

        player.points.current -= card.cost;
        player.hand.splice(cardIndex, 1);

        let result = { success: true, card: card };

        // 化合物效果
        if (card.type === 'compound') {
            const opponent = this.getOpponent(socketId);
            if (card.id === 'H2O') {
                // 水作为反应物，先检查对手场上是否有碱金属
                let hasAlkaliMetal = false;
                let alkaliMetal = null;
                for (const opp of opponent.board) {
                    if (opp.type === 'alkali_metal') {
                        hasAlkaliMetal = true;
                        alkaliMetal = opp;
                        break;
                    }
                }
                
                if (hasAlkaliMetal && alkaliMetal) {
                    // 立即发生爆炸反应，不召唤水
                    opponent.takeDamage(5);
                    player.takeDamage(2);
                    
                    // 移除碱金属
                    const idx = opponent.board.findIndex(m => m.id === alkaliMetal.id);
                    if (idx !== -1) opponent.board.splice(idx, 1);
                    
                    result.effect = `水遇到${alkaliMetal.name}立即爆炸！`;
                    result.reaction = {
                        type: 'explosion',
                        message: `💥 水遇到${alkaliMetal.name}剧烈爆炸！造成5点伤害！你受到2点波及！${alkaliMetal.name}被消耗！`
                    };
                } else {
                    // 没有碱金属，正常召唤水
                    const minion = {
                        id: `H2O_${Date.now()}_${Math.random()}`,
                        name: '水',
                        symbol: 'H₂O',
                        attack: 0,
                        health: 3,
                        maxHealth: 3,
                        type: 'compound',
                        hasAttacked: false
                    };
                    player.board.push(minion);
                    result.effect = `召唤了 水！`;
                    
                    // 检查玩家自己场上是否有碱金属（自己场上的碱金属遇到水也会反应）
                    let selfAlkali = null;
                    for (const m of player.board) {
                        if (m !== minion && m.type === 'alkali_metal') {
                            selfAlkali = m;
                            break;
                        }
                    }
                    
                    if (selfAlkali) {
                        // 自己场上的碱金属和水反应
                        opponent.takeDamage(5);
                        player.takeDamage(2);
                        
                        // 移除碱金属和水
                        const alkaliIdx = player.board.findIndex(m => m.id === selfAlkali.id);
                        if (alkaliIdx !== -1) player.board.splice(alkaliIdx, 1);
                        const waterIdx = player.board.findIndex(m => m.id === minion.id);
                        if (waterIdx !== -1) player.board.splice(waterIdx, 1);
                        
                        result.reaction = {
                            type: 'explosion',
                            message: `💥 你场上的${selfAlkali.name}与水反应爆炸！造成5点伤害！你受到2点波及！${selfAlkali.name}和水被消耗！`
                        };
                    }
                }
            } else if (card.id === 'NaCl') {
                if (player.board.length > 0) {
                    player.board[0].attack += card.value;
                    result.effect = `${player.board[0].name}攻击力+${card.value}！`;
                } else {
                    result.effect = `使用了${card.name}，但没有随从可增强`;
                }
            } else if (card.id === 'CO2') {
                const dmg = opponent.takeDamage(card.value);
                result.effect = `造成${dmg.actual}点伤害！`;
            }
        } 
        // 随从
        else {
            // 如果是碱金属，先检查对手场上是否有水
            let hasWater = false;
            let waterCard = null;
            for (const opp of this.getOpponent(socketId).board) {
                if (opp.id === 'H2O') {
                    hasWater = true;
                    waterCard = opp;
                    break;
                }
            }
            
            // 同时检查自己场上是否有水（自己场上的碱金属和自己场上的水也会反应）
            let selfWater = null;
            for (const m of player.board) {
                if (m.id === 'H2O') {
                    selfWater = m;
                    break;
                }
            }
            
            if (card.type === 'alkali_metal' && hasWater && waterCard) {
                // 碱金属遇到对手的水，立即爆炸
                const opponent = this.getOpponent(socketId);
                opponent.takeDamage(5);
                player.takeDamage(2);
                
                // 移除水
                const waterIdx = opponent.board.findIndex(m => m.id === waterCard.id);
                if (waterIdx !== -1) opponent.board.splice(waterIdx, 1);
                
                result.effect = `${card.name}遇到水立即爆炸！`;
                result.reaction = {
                    type: 'explosion',
                    message: `💥 ${card.name}遇到水剧烈爆炸！造成5点伤害！你受到2点波及！水被消耗！`
                };
            } 
            else if (card.type === 'alkali_metal' && selfWater) {
                // 碱金属遇到自己场上的水，立即爆炸
                const opponent = this.getOpponent(socketId);
                opponent.takeDamage(5);
                player.takeDamage(2);
                
                // 移除水
                const waterIdx = player.board.findIndex(m => m.id === selfWater.id);
                if (waterIdx !== -1) player.board.splice(waterIdx, 1);
                
                result.effect = `${card.name}遇到水立即爆炸！`;
                result.reaction = {
                    type: 'explosion',
                    message: `💥 ${card.name}遇到水剧烈爆炸！造成5点伤害！你受到2点波及！水被消耗！`
                };
            }
            else {
                // 正常召唤
                const minion = {
                    id: `${card.id}_${Date.now()}_${Math.random()}`,
                    name: card.name,
                    symbol: card.symbol,
                    attack: card.attack,
                    health: card.health,
                    maxHealth: card.health,
                    type: card.type,
                    hasAttacked: false
                };
                player.board.push(minion);
                result.effect = `召唤了 ${card.name}！`;
                
                // 检查其他化学反应
                const opponent = this.getOpponent(socketId);
                const reaction = this.checkOtherReactions(player, opponent);
                if (reaction) {
                    result.reaction = reaction;
                }
            }
        }

        const opponent = this.getOpponent(socketId);
        if (opponent.health <= 0) {
            this.gameState = 'ended';
            result.gameEnded = true;
            result.winner = player.name;
        }

        return result;
    }

    checkOtherReactions(player, opponent) {
        // 检查卤素 + 过渡金属 = 腐蚀
        for (const minion of player.board) {
            if (minion.type === 'halogen') {
                for (const opp of opponent.board) {
                    if (opp.type === 'transition_metal') {
                        opp.health -= 2;
                        if (opp.health <= 0) {
                            const idx = opponent.board.findIndex(m => m.id === opp.id);
                            if (idx !== -1) opponent.board.splice(idx, 1);
                        }
                        return {
                            type: 'corrosion',
                            message: `🦠 ${minion.name}腐蚀了${opp.name}，造成2点伤害！`
                        };
                    }
                }
            }
        }
        
        // 检查卤素 + 水 = 次氯酸
        for (const minion of player.board) {
            if (minion.type === 'halogen') {
                for (const opp of opponent.board) {
                    if (opp.id === 'H2O') {
                        opponent.takeDamage(3);
                        const waterIdx = opponent.board.findIndex(m => m.id === opp.id);
                        if (waterIdx !== -1) opponent.board.splice(waterIdx, 1);
                        return {
                            type: 'corrosion',
                            message: `🧪 ${minion.name}与水反应生成次氯酸！造成3点伤害！水被消耗！`
                        };
                    }
                }
            }
        }
        
        return null;
    }

    attack(socketId, attackerId, targetType, targetId) {
        const player = this.players.find(p => p.socketId === socketId);
        if (!player) return { success: false, error: '玩家不存在' };
        if (this.getCurrentPlayer().socketId !== socketId) return { success: false, error: '不是你的回合' };

        const attacker = player.board.find(m => m.id === attackerId);
        if (!attacker) return { success: false, error: '攻击者不存在' };
        if (attacker.hasAttacked) return { success: false, error: '已攻击过' };

        const opponent = this.getOpponent(socketId);
        let damage = 0;

        if (targetType === 'player') {
            const result = opponent.takeDamage(attacker.attack);
            damage = result.actual;
        } else {
            const target = opponent.board.find(m => m.id === targetId);
            if (!target) return { success: false, error: '目标不存在' };
            target.health -= attacker.attack;
            attacker.health -= target.attack;
            damage = attacker.attack;
            
            if (target.health <= 0) {
                const idx = opponent.board.findIndex(m => m.id === targetId);
                if (idx !== -1) opponent.board.splice(idx, 1);
            }
            if (attacker.health <= 0) {
                const idx = player.board.findIndex(m => m.id === attackerId);
                if (idx !== -1) player.board.splice(idx, 1);
            }
        }

        attacker.hasAttacked = true;

        if (opponent.health <= 0) {
            this.gameState = 'ended';
            return { success: true, damage, gameEnded: true, winner: player.name };
        }

        return { success: true, damage };
    }

    endTurn(socketId) {
        if (this.getCurrentPlayer().socketId !== socketId) return false;
        this.currentTurn = (this.currentTurn + 1) % 2;
        this.turnNumber++;
        this.getCurrentPlayer().startTurn();
        return true;
    }

    getGameState(socketId) {
        const player = this.players.find(p => p.socketId === socketId);
        const opponent = this.getOpponent(socketId);
        if (!player || !opponent) return null;

        return {
            gameState: this.gameState,
            isMyTurn: this.getCurrentPlayer().socketId === socketId,
            turnNumber: this.turnNumber,
            me: {
                name: player.name,
                health: player.health,
                armor: player.armor,
                points: player.points,
                hand: player.hand,
                board: player.board,
                deckSize: player.deck.length,
                activeEffects: player.activeEffects
            },
            opponent: {
                name: opponent.name,
                health: opponent.health,
                armor: opponent.armor,
                points: opponent.points,
                handSize: opponent.hand.length,
                board: opponent.board,
                deckSize: opponent.deck.length,
                activeEffects: opponent.activeEffects
            }
        };
    }
}

const rooms = new Map();
const playerRooms = new Map();

io.on('connection', (socket) => {
    console.log(`🎮 玩家连接: ${socket.id}`);

    socket.on('createRoom', (playerName) => {
        const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
        const room = new GameRoom(roomId);
        const success = room.addPlayer(socket.id, playerName);
        if (success) {
            rooms.set(roomId, room);
            playerRooms.set(socket.id, roomId);
            socket.join(roomId);
            socket.emit('roomCreated', { roomId });
            console.log(`🔬 创建房间: ${roomId} - 玩家: ${playerName}`);
        }
    });

    socket.on('joinRoom', ({ roomId, playerName }) => {
        const upperRoomId = roomId.toUpperCase();
        console.log(`🔍 ${playerName} 尝试加入房间: ${upperRoomId}`);
        
        const room = rooms.get(upperRoomId);
        if (!room) {
            socket.emit('error', '房间不存在');
            return;
        }
        if (room.gameState !== 'waiting') {
            socket.emit('error', '游戏已开始');
            return;
        }
        if (room.players.length >= 2) {
            socket.emit('error', '房间已满');
            return;
        }
        
        const success = room.addPlayer(socket.id, playerName);
        if (!success) {
            socket.emit('error', '加入房间失败');
            return;
        }
        
        playerRooms.set(socket.id, upperRoomId);
        socket.join(upperRoomId);
        socket.emit('roomJoined', { roomId: upperRoomId });
        
        socket.to(upperRoomId).emit('playerJoined', {
            players: room.players.map(p => ({ name: p.name }))
        });

        console.log(`✅ ${playerName} 加入了房间 ${upperRoomId}`);

        if (room.players.length === 2) {
            console.log(`🎮 房间 ${upperRoomId} 游戏开始！`);
            room.startGame();
            room.players.forEach(p => {
                io.to(p.socketId).emit('gameStarted', { gameState: room.getGameState(p.socketId) });
            });
        }
    });

    socket.on('playCard', ({ roomId, cardIndex }) => {
        const room = rooms.get(roomId);
        if (!room) return;
        
        const result = room.playCard(socket.id, cardIndex);
        if (result.success) {
            room.players.forEach(p => {
                io.to(p.socketId).emit('gameStateUpdate', room.getGameState(p.socketId));
            });
            io.to(roomId).emit('actionNotification', {
                player: socket.id,
                action: 'playCard',
                card: result.card,
                effect: result.effect
            });
            if (result.reaction) {
                io.to(roomId).emit('chemicalReaction', result.reaction);
            }
            if (result.gameEnded) {
                io.to(roomId).emit('gameEnded', { winner: result.winner });
            }
        } else {
            socket.emit('error', result.error);
        }
    });

    socket.on('attack', ({ roomId, attackerId, targetType, targetId }) => {
        const room = rooms.get(roomId);
        if (!room) return;
        
        const result = room.attack(socket.id, attackerId, targetType, targetId);
        if (result.success) {
            room.players.forEach(p => {
                io.to(p.socketId).emit('gameStateUpdate', room.getGameState(p.socketId));
            });
            io.to(roomId).emit('actionNotification', {
                player: socket.id,
                action: 'attack',
                damage: result.damage
            });
            if (result.gameEnded) {
                io.to(roomId).emit('gameEnded', { winner: result.winner });
            }
        } else {
            socket.emit('error', result.error);
        }
    });

    socket.on('endTurn', ({ roomId }) => {
        const room = rooms.get(roomId);
        if (!room) return;
        
        if (room.endTurn(socket.id)) {
            room.players.forEach(p => {
                io.to(p.socketId).emit('gameStateUpdate', room.getGameState(p.socketId));
            });
            io.to(roomId).emit('actionNotification', {
                player: socket.id,
                action: 'endTurn'
            });
        }
    });

    socket.on('getGameState', ({ roomId }) => {
        const room = rooms.get(roomId);
        if (room) {
            socket.emit('gameStateUpdate', room.getGameState(socket.id));
        }
    });

    socket.on('disconnect', () => {
        console.log(`👋 玩家断开: ${socket.id}`);
        const roomId = playerRooms.get(socket.id);
        if (roomId) {
            const room = rooms.get(roomId);
            if (room) {
                io.to(roomId).emit('playerDisconnected', { playerId: socket.id });
                room.removePlayer(socket.id);
                if (room.players.length === 0) {
                    rooms.delete(roomId);
                    console.log(`🗑️ 删除空房间: ${roomId}`);
                }
            }
            playerRooms.delete(socket.id);
        }
    });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
    console.log(`
    🧪 纸片化学 - 元素卡牌对战游戏
    ═══════════════════════════════════
    📡 服务器运行在: http://localhost:${PORT}
    🔬 房间已就绪，等待玩家加入...
    💡 碱金属遇到水会立即反应，不能共存！
    `);
});