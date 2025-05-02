// apps/web/src/services/online/OnlineGameSystem.ts
import { io, Socket } from "socket.io-client";
import { ServerEvents, ClientEvents } from "@repo/shared";
import { Topic, TopicCategory } from "@repo/game-core";
import { RoomInfo } from "@repo/shared";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

export const OnlineEngineEvents = {
  TOPICS_UPDATED: "topics:updated",
  TOPIC_CATEGORY_UPDATED: "topic_category:updated",
  PLAYERS_UPDATED: "players:updated",
};

export class OnlineGameSystem {
  private socket: Socket;
  private router: ReturnType<typeof useRouter>;
  private listeners: Map<string, Set<Function>> = new Map();
  public topics: Topic[] = [];
  public selectedCategory: TopicCategory = "animals";
  public roomID: string | null = null;
  public players: { username: string; id: string }[] = [];
  public isAdmin: boolean = false;

  constructor(username: string, router: ReturnType<typeof useRouter>) {
    this.socket = io(process.env.NEXT_PUBLIC_SERVER_URL!, {
      query: { username },
    });
    this.router = router;

    // Handle room created event
    this.socket.on(ServerEvents.ROOM_CREATED, (roomInfo: RoomInfo) => {
      this.topics = roomInfo.topics || [];
      this.roomID = roomInfo.id;
      this.players = roomInfo.players;
      this.emit(OnlineEngineEvents.TOPICS_UPDATED, this.topics);
      this.emit(OnlineEngineEvents.PLAYERS_UPDATED, roomInfo.players);
      this.isAdmin = roomInfo.adminID === this.socket.id;
    });

    // Handle topics updates
    this.socket.on(
      ServerEvents.TOPICS_UPDATED,
      (response: { topics: Topic[] }) => {
        this.topics = response.topics || [];
        this.emit(OnlineEngineEvents.TOPICS_UPDATED, this.topics);
      }
    );

    // Handle category update
    this.socket.on(
      ServerEvents.TOPIC_CATEGORY_UPDATED,
      (response: { category: TopicCategory }) => {
        this.selectedCategory = response.category;
        this.emit(OnlineEngineEvents.TOPIC_CATEGORY_UPDATED, response.category);
      }
    );

    // Handle username update
    this.socket.on(
      ServerEvents.USERNAME_UPDATED,
      (response: { username: string }) => {
        this.socket.io.opts.query = { username: response.username };
      }
    );

    // Handle player joined event
    this.socket.on(
      ServerEvents.PLAYER_JOINED,
      (response: { player: { id: string; username: string } }) => {
        this.players.push(response.player);
        this.emit(OnlineEngineEvents.PLAYERS_UPDATED, this.players);
      }
    );

    // Handle player left event
    this.socket.on(
      ServerEvents.PLAYER_LEFT,
      ( playerID: string) => {
        this.players = this.players.filter((player) => player.id !== playerID);
        this.emit(OnlineEngineEvents.PLAYERS_UPDATED, this.players); 
      }
    );
  
    // Handle room destroyed event
    this.socket.on(
      ServerEvents.ROOM_DESTROYED,
      (response: { roomId: string; message: string }) => {
        this.cleanupGameEngine();
        toast.error(response.message);
        this.router.push("/");
      }
    );
  }

  // Category management

  async selectCategory(category: TopicCategory) {
    if (category === this.selectedCategory) return;

    return new Promise((resolve) => {
      this.socket.emit(ClientEvents.UPDATE_TOPIC_CATEGORY, category, resolve);
    });
  }

  // Room management
  async createRoom(options?: any) {
    return new Promise((resolve) => {
      this.socket.emit(ClientEvents.CREATE_ROOM, options, resolve);
    });
  }

  async joinRoom(roomID: string) {
    return new Promise((resolve) => {
      this.socket.emit(ClientEvents.JOIN_ROOM, roomID, (response: any) => {
        if (!response.success) {
          const errorMessage =
            response.error?.message || "فشل في الانضمام إلى الغرفة";
          toast.error(errorMessage);
          console.error("Failed to join room:", response.error);
          resolve(false);
        } else {
          this.topics = response.roomInfo.topics || [];
          this.roomID = response.roomInfo.id;
          this.players = response.roomInfo.players;
          this.emit(OnlineEngineEvents.TOPICS_UPDATED, this.topics);
          this.emit(OnlineEngineEvents.PLAYERS_UPDATED, this.players);

          // Use Next.js router for navigation
          this.router.push("/lobby/online");

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

          // Navigate back to home
          this.router.push("/");

          resolve(true);
        }
      });
    });
  }

  // Topic management

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

  // player management
  async updateUsername(newUsername: string) {
    return new Promise((resolve) => {
      this.socket.emit(
        ClientEvents.UPDATE_USERNAME,
        { username: newUsername },
        resolve
      );
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

  // cleanup

  private cleanupGameEngine() {
    // Reset room state
    this.topics = [];
    this.roomID = null;
    this.players = [];
    this.isAdmin = false;
    this.selectedCategory = "animals";

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
