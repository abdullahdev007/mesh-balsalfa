// apps/web/src/services/online/OnlineGameSystem.ts
import { io, Socket } from "socket.io-client";
import { ServerEvents, ClientEvents } from "@repo/shared";
import {
  GamePhase,
  Player,
  Question,
  Round,
  Topic,
  TopicCategory,
} from "@repo/game-core";
import { RoomInfo } from "@repo/shared";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export const OnlineEngineEvents = {
  TOPICS_UPDATED: "topics:updated",
  TOPIC_CATEGORY_UPDATED: "topic_category:updated",
  PLAYERS_UPDATED: "players:updated",
  ROUNDS_UPDATED: "rounds:updated",
  ROUND_STARTED: "round:started",
  PHASE_CHANGED: "phase:changed",
  ROUND_ENDED: "round:ended",
  NEW_QUESTION: "round:new_question",
  FREE_QUESTION_ASKED: "round:free_question",
  FREE_QUESTION_ASK_DONE: "round:free_question_done",
  TOPIC_GUESSED: "round:topic_guessed",
  CONNECTION_STATUS: "connection:status",
};

export class OnlineGameSystem {
  private pingInterval: NodeJS.Timeout | null = null;

  private static readonly ROLE_ASSIGNMENT_WAITING_TOAST_ID =
    "role_assignment_waiting" as const;

  private static readonly VOTING_WAITING_TOAST_ID = "voting_waiting" as const;

  private waitingForRoleAssignment: boolean = false;
  private waitingForVoting: boolean = false;

  private socket: Socket;
  private router: ReturnType<typeof useRouter>;
  public isServerConnected: boolean = false;
  private showStatusModal: boolean = true;

  // Fix listeners type
  private listeners: Map<string, Set<Function>> = new Map();
  public topics: Topic[] = [];
  public selectedCategory: TopicCategory = "animals";
  public roomID: string | null = null;
  public players: Player[] = [];
  public rounds: Round[] = [];
  public isAdmin: boolean = false;

  public currentRound: Round | null = null;
  public currentPhase: GamePhase | null = null;
  public playerID: string | null = null;

  constructor(username: string, router: ReturnType<typeof useRouter>) {
    this.socket = io(process.env.NEXT_PUBLIC_SERVER_URL!, {
      query: { username },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 2000
    });

    this.router = router;

    // Handle successful connection
    this.socket.on('connect', () => {      
      const wasDisconnected = !this.isServerConnected;
      this.isServerConnected = true;
      this.showStatusModal = false;
      
      if (wasDisconnected) {
        this.startPingInterval()
        this.emitConnectionStatus();
      }
    });

    // Handle connection error
    this.socket.on('connect_error', () => {
      const wasConnected = this.isServerConnected;
      this.isServerConnected = false;
      this.showStatusModal = true;
      
      if (wasConnected) {
        if(this.pingInterval)
          clearInterval(this.pingInterval);
        this.emitConnectionStatus();
      }
    });

    // Handle disconnection
    this.socket.on('disconnect', () => {
      const wasConnected = this.isServerConnected;
      this.isServerConnected = false;
      this.showStatusModal = true;
      if (this.pingInterval) {
        clearInterval(this.pingInterval);
        this.pingInterval = null;
      }
      
      if (wasConnected) {
        if(this.pingInterval)
          clearInterval(this.pingInterval);
        this.emitConnectionStatus();
      }
    });

    this.socket.on(
      ServerEvents.USERNAME_UPDATED,
      (response: { username: string }) => {
        this.socket.io.opts.query = { username: response.username };
      },
    );

    this.socket.on(
      ServerEvents.ROOM_CREATED,
      (response: { roomInfo: RoomInfo; playerID: string }) => {
        const { roomInfo, playerID } = response;
        this.topics = roomInfo.topics || [];
        this.roomID = roomInfo.id;
        this.players = roomInfo.players;
        this.playerID = playerID;
        this.emit(OnlineEngineEvents.TOPICS_UPDATED, this.topics);
        this.emit(OnlineEngineEvents.PLAYERS_UPDATED, roomInfo.players);
        this.isAdmin = roomInfo.adminID === this.playerID;

        this.currentPhase = "lobby";
      },
    );

    this.socket.on(
      ServerEvents.ROOM_DESTROYED,
      (response: { roomId: string; message: string }) => {
        this.cleanupGameEngine();

        toast.dismiss(OnlineGameSystem.ROLE_ASSIGNMENT_WAITING_TOAST_ID);
        toast.dismiss(OnlineGameSystem.VOTING_WAITING_TOAST_ID);

        toast.error(response.message);
        this.router.push("/");
      },
    );

    this.socket.on(
      ServerEvents.PLAYER_JOINED,
      (response: { player: Player }) => {
        this.players.push(response.player);
        this.emit(OnlineEngineEvents.PLAYERS_UPDATED, this.players);
      },
    );

    this.socket.on(ServerEvents.PLAYER_LEFT, (playerID: string) => {
      this.players = this.players.filter((player) => player.id !== playerID);

      this.emit(OnlineEngineEvents.PLAYERS_UPDATED, this.players);
    });

    this.socket.on(ServerEvents.ROUND_DESTROYED, (messaage: string) => {
      toast.error(messaage);
      toast.dismiss(OnlineGameSystem.ROLE_ASSIGNMENT_WAITING_TOAST_ID);
      toast.dismiss(OnlineGameSystem.VOTING_WAITING_TOAST_ID);

      this.router.push("/lobby");

      this.currentRound = null;
      this.currentPhase = "lobby";
    });

    this.socket.on(
      ServerEvents.TOPICS_UPDATED,
      (response: { topics: Topic[] }) => {
        this.topics = response.topics || [];
        this.emit(OnlineEngineEvents.TOPICS_UPDATED, this.topics);
      },
    );

    this.socket.on(
      ServerEvents.TOPIC_CATEGORY_UPDATED,
      (response: { category: TopicCategory }) => {
        this.selectedCategory = response.category;
        this.emit(OnlineEngineEvents.TOPIC_CATEGORY_UPDATED, response.category);
      },
    );

    this.socket.on(ServerEvents.ROUND_STARTED, (round: Round) => {
      this.currentRound = round;

      this.emit(OnlineEngineEvents.ROUND_STARTED, round);
    });

    this.socket.on(ServerEvents.QUESTION_ASKED, (question: Question) => {
      this.emit(OnlineEngineEvents.NEW_QUESTION, question);
    });

    this.socket.on(ServerEvents.FREE_QUESTION_ASKED, (question: Question) => {
      this.emit(OnlineEngineEvents.FREE_QUESTION_ASKED, question);
    });

    this.socket.on(
      ServerEvents.FREE_QUESTION_ASK_DONE,
      (nextAskerID: string) => {
        this.emit(OnlineEngineEvents.FREE_QUESTION_ASK_DONE, nextAskerID);
      },
    );

    this.socket.on(ServerEvents.ROUND_ENDED, (roomInfo: RoomInfo) => {
      this.currentRound = null;
      this.currentPhase = "lobby";

      this.emit(OnlineEngineEvents.ROUND_ENDED, {});

      this.topics = roomInfo.topics || [];
      this.roomID = roomInfo.id;
      this.players = roomInfo.players;
      this.rounds = roomInfo.rounds;
      this.emit(OnlineEngineEvents.TOPICS_UPDATED, this.topics);
      this.emit(OnlineEngineEvents.PLAYERS_UPDATED, roomInfo.players);
    });

    this.socket.on(
      ServerEvents.PHASE_CHANGED,
      (response: { phase: GamePhase; currentRound: Round }) => {
        const { phase, currentRound } = response;

        if (phase === "show-spy")
          toast.dismiss(OnlineGameSystem.VOTING_WAITING_TOAST_ID);
        else if (phase === "questions-phase")
          toast.dismiss(OnlineGameSystem.ROLE_ASSIGNMENT_WAITING_TOAST_ID);

        this.currentPhase = phase;
        this.currentRound = currentRound;

        this.emit(OnlineEngineEvents.PHASE_CHANGED, phase);
      },
    );

    this.socket.on(
      ServerEvents.ROLE_ASSIGN_COUNTDOWN_STARTED,
      (message: string) => {
        if (!this.waitingForRoleAssignment) {
          toast.loading(message, {
            id: OnlineGameSystem.ROLE_ASSIGNMENT_WAITING_TOAST_ID,
          });
        }
      },
    );

    this.socket.on(
      ServerEvents.ROLE_ASSIGN_COUNTDOWN_COMPLETE,
      (message: string) => {
        toast.dismiss(OnlineGameSystem.ROLE_ASSIGNMENT_WAITING_TOAST_ID);
        this.waitingForRoleAssignment = false;
      },
    );

    this.socket.on(ServerEvents.VOTING_COUNTDOWN_STARTED, (message: string) => {
      if (!this.waitingForVoting) {
        toast.loading(message, {
          id: OnlineGameSystem.VOTING_WAITING_TOAST_ID,
        });
      }
    });

    this.socket.on(
      ServerEvents.VOTING_COUNTDOWN_COMPLETE,
      (message: string) => {
        toast.dismiss(OnlineGameSystem.VOTING_WAITING_TOAST_ID);
        this.waitingForVoting = false;
      },
    );

    this.socket.on(
      ServerEvents.KICKED_FROM_ROOM,
      (response: { message: string }) => {
        toast.error(response.message);
        this.cleanupGameEngine();
        this.router.push("/");
      },
    );

    this.socket.on(ServerEvents.TOPIC_GUESSED, (round: Round) => {
      this.currentRound = round;
      this.emit(OnlineEngineEvents.TOPIC_GUESSED, {
        guessedTopic: round.guessedTopic,
        correctTopic: round.topic,
      });
    });
  }


  private emitConnectionStatus() {

    this.emit(OnlineEngineEvents.CONNECTION_STATUS,{
      isConnected: this.isServerConnected,
      showModal: this.showStatusModal
    })

  }

  // Category management

  async selectCategory(category: TopicCategory) {
    if (category === this.selectedCategory) return;

    return new Promise((resolve) => {
      this.socket.emit(ClientEvents.UPDATE_TOPIC_CATEGORY, category, resolve);
    });
  }

  // Room management

  async createRoom() {
    return new Promise((resolve) => {
      this.socket.emit(ClientEvents.CREATE_ROOM, {}, resolve);
    });
  }

  async joinRoom(roomID: string) {
    if (this.players.length >= 12)
      return toast.error("لا يمكن الانضمام إلى الغرفة، الحد الأقصى هو 12 لاعب");

    return new Promise((resolve) => {
      // Check if maximum player limit is reached

      this.socket.emit(ClientEvents.JOIN_ROOM, roomID, (response: any) => {
        if (!response.success) {
          const errorMessage =
            response.error?.message || "فشل في الانضمام إلى الغرفة";
          toast.error(errorMessage);
          console.log("Failed to join room:", response.error);
          resolve(false);
        } else {
          // Show name change notification if applicable
          if (response.nameChanged) {
            toast.error(response.nameChanged);
          }

          this.topics = response.roomInfo.topics || [];
          this.roomID = response.roomInfo.id;
          this.playerID = response.playerID;
          this.players = response.roomInfo.players;
          this.rounds = response.roomInfo.rounds;
          this.currentPhase = "lobby";
          this.emit(OnlineEngineEvents.TOPICS_UPDATED, this.topics);
          this.emit(OnlineEngineEvents.ROUNDS_UPDATED, this.players);
          this.emit(OnlineEngineEvents.PLAYERS_UPDATED, this.players);

          // Use Next.js router for navigation
          this.router.push("/lobby");

          resolve(true);
        }
      });
    });
  }

  async kickPlayer(playerID: string) {
    return new Promise((resolve) => {
      this.socket.emit(ClientEvents.KICK_PLAYER, playerID, (response: any) => {
        if (!response.success) {
          const errorMessage = response.error?.message || "فشل في طرد اللاعب";
          toast.error(errorMessage);
          resolve(false);
        } else {
          toast.success("تم طرد اللاعب بنجاح");
          resolve(true);
        }
      });
    });
  }

  async leaveRoom() {
    return new Promise((resolve) => {
      this.socket.emit(ClientEvents.LEAVE_ROOM, (response: any) => {
        if (!response.success) {
          const errorMessage =
            response.error?.message || "فشل في مغادرة الغرفة";
          toast.error(errorMessage);
          console.error("Failed to leave room:", response.error);

          resolve(false);
        } else {
          this.cleanupGameEngine();


          resolve(true);
        }
      });
    });
  }

  /** Topic Management */

  async addTopic(topic: Omit<Topic, "id">) {
    return new Promise((resolve) => {
      this.socket.emit(ClientEvents.ADD_TOPIC, topic, resolve);
    });
  }

  async removeTopic(topicID: string) {
    return new Promise((resolve) => {
      this.socket.emit(ClientEvents.REMOVE_TOPIC, topicID, resolve);
    });
  }

  async updateTopic(topic: Topic) {
    return new Promise((resolve) => {
      this.socket.emit(ClientEvents.UPDATE_TOPIC, topic, resolve);
    });
  }

  // Round management

  async startRound() {
    return new Promise((resolve) => {
      this.socket.emit(ClientEvents.START_ROUND, (response: any) => {
        if (!response.success) {
          const errorMessage = response.error?.message || "فشل في بدء الجولة";
          toast.error(errorMessage);
          resolve(false);
        } else {
          resolve(true);
        }
      });
    });
  }

  async roleTaked() {
    return new Promise((resolve) => {
      this.socket.emit(
        ClientEvents.ROLE_TAKED,
        (response: { success: boolean; message: string }) => {
          if (!response.success) {
            toast.error(response.message);
            resolve(false);
          } else {
            toast.loading(response.message, {
              id: OnlineGameSystem.ROLE_ASSIGNMENT_WAITING_TOAST_ID,
            });
            this.waitingForRoleAssignment = true;
            resolve(true);
          }
        },
      );
      resolve(true);
    });
  }

  async askNextQuestion() {
    return new Promise((resolve) => {
      this.socket.emit(ClientEvents.ASK_NEXT_QUESTION, (response: any) => {
        if (!response.success) {
          const errorMessage = response.error?.message || "فشل في السؤال";
          toast.error(errorMessage);
          resolve(false);
        } else {
          resolve(true);
        }
      });
    });
  }

  async askFreeQuestion(targetPlayerID: string) {
    return new Promise((resolve) => {
      this.socket.emit(
        ClientEvents.ASK_FREE_QUESTION,
        targetPlayerID,
        (response: any) => {
          if (!response.success) {
            const errorMessage = response.error?.message || "فشل في السؤال";
            toast.error(errorMessage);
            resolve(false);
          } else {
            resolve(true);
          }
        },
      );
    });
  }

  async freeQuestionAskDone(nextAskerID: string) {
    return new Promise((resolve) => {
      this.socket.emit(
        ClientEvents.FREE_QUESTION_ASK_DONE,
        nextAskerID,
        (response: any) => {
          if (!response.success) {
            const errorMessage = response.error?.message || "فشل في السؤال";
            toast.error(errorMessage);
            resolve(false);
          } else {
            resolve(true);
          }
        },
      );
    });
  }

  async startVoting() {
    return new Promise((resolve) => {
      this.socket.emit(ClientEvents.START_VOTING, (response: any) => {
        if (!response.success) {
          const errorMessage = response.error?.message || "فشل في السؤال";
          toast.error(errorMessage);
          resolve(false);
        } else {
          resolve(true);
        }
      });
    });
  }

  async castVote(suspectID: string) {
    return new Promise((resolve) => {
      this.socket.emit(ClientEvents.CAST_VOTE, suspectID, (response: any) => {
        if (!response.success) {
          const errorMessage = response.error?.message || "فشل في السؤال";
          toast.error(errorMessage);
          resolve(false);
        } else {
          toast.loading(response.message, {
            id: OnlineGameSystem.VOTING_WAITING_TOAST_ID,
          });
          this.waitingForVoting = true;
          resolve(true);
        }
      });
    });
  }

  async startGuessTopic() {
    return new Promise((resolve) => {
      this.socket.emit(ClientEvents.START_GUESS_TOPIC, (response: any) => {
        if (!response.success) {
          toast.error(
            response.error?.message || "فشل في الانتقال إلى المرحلة التالية",
          );
          resolve(false);
        } else {
          resolve(true);
        }
      });
    });
  }

  async guessTopic(topicID: string) {
    return new Promise((resolve) => {
      this.socket.emit(ClientEvents.GUESS_TOPIC, topicID, (response: any) => {
        if (!response.success) {
          toast.error(
            response.error?.message || "فشل في ارسال توقعك ل السالفة",
          );
          resolve(false);
        } else {
          resolve(true);
        }
      });
    });
  }

  async endRound() {
    return new Promise((resolve) => {
      this.socket.emit(ClientEvents.END_ROUND, (response: any) => {
        if (!response.success) {
          toast.error(response.error?.message || "فشل في انهاء الجولة");
          resolve(false);
        } else {
          resolve(true);
        }
      });
    });
  }

  // Event system

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback?: Function) {
    if (!callback) {
      this.listeners.delete(event);
    } else {
      this.listeners.get(event)?.delete(callback);
    }
  }

  private emit(event: string, data: any) {
    this.listeners.get(event)?.forEach((cb) => cb(data));
  }

  // player management

  async updateUsername(newUsername: string) {
    return new Promise((resolve) => {
      this.socket.emit(
        ClientEvents.UPDATE_USERNAME,
        { username: newUsername },
        resolve,
      );
    });
  }

  // cleanup

  private startPingInterval() {
    this.pingInterval = setInterval(() => {
      this.socket.emit('ping');
    },14 * 60 * 1000);
  }

  // Add to your cleanup method
  public cleanupGameEngine() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    // Reset room state
    this.topics = [];
    this.roomID = null;
    this.players = [];
    this.rounds = [];
    this.isAdmin = false;
    this.selectedCategory = "animals";
    this.currentRound = null;
    this.currentPhase = null;
    this.playerID = null;
    this.waitingForRoleAssignment = false;
    this.waitingForVoting = false;

    // Clear all event listeners
    this.listeners.clear();

    // Disconnect socket if connected
    if (this.socket.connected) {
      this.socket.disconnect();
    }

    // Reconnect socket with current username
    this.socket.connect();
  }
}
