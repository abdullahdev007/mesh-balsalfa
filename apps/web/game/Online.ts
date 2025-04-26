import { Socket } from "socket.io-client";
import { ClientEvents, ServerEvents, RoomInfo } from "@repo/shared";
import toast from "react-hot-toast";
import { Topic, TopicCategory } from "@repo/game-core";
import translateCategory from "@repo/game-core/dist/utils/translateCategory";


const UNEXPECTED_ERROR_MSG = "حدث شيء خاطئ يرجى المحاولة مرة أخرى";
export class OnlineGameEngine {
  public roomInfo?: RoomInfo;
  private isConnected = false;
  private onRoomInfoChange?: (roomInfo: RoomInfo) => void;
  private onCategoryChange?: (category: TopicCategory) => void;
  private socket: Socket;
  public choosedCategory: TopicCategory = "animals";

  constructor(socket: Socket) {
    this.socket = socket;
    this.setupListeners();
  }

  private setupListeners() {
    this.socket.on("connect", () => {
      this.isConnected = true;
    });

    this.socket.on("disconnect", () => {
      this.isConnected = false;
    });

    this.socket.on("connect_error", (err: Error) => {
      this.showError(err.message || UNEXPECTED_ERROR_MSG);
      console.error(err);
    });

    this.socket.on(ServerEvents.ROOM_CREATED, ({ roomInfo }: { roomInfo: RoomInfo }) => {
      this.updateRoomInfo(roomInfo);
      toast.success(`تم إنشاء غرفة بمعرف: ${roomInfo.id}`);
    });

    this.socket.on(ServerEvents.TOPIC_CATEGORY_UPDATED, ({ category }: { category: TopicCategory }) => {
      toast.success(`تم تحديث السالفة الى ${translateCategory(category)}`);

      this.choosedCategory = category;
      this.updateCategory(category); // Update category whenever the category is changed
    });

    this.socket.on(ServerEvents.TOPICS_UPDATED, ({ topics }: { topics: Topic[] }) => {
      if (!this.roomInfo) return;
      if(this.roomInfo.adminID !== this.socket.id) {
        toast.success("تم تحديث السوالف بنجاح")
      }else {
        toast.success("تم تحديث السوالف يمكنك الاطلاع عليها")
      }
      this.updateRoomInfo({
        ...this.roomInfo,
        topics: [...topics],
      });
    });
  }

  private updateRoomInfo(newInfo: RoomInfo) {
    this.roomInfo = newInfo;
    this.onRoomInfoChange?.(this.roomInfo);
  }

  private updateCategory(newCategory: TopicCategory) {
    this.choosedCategory = newCategory;
    this.onCategoryChange?.(this.choosedCategory); // Notify about category change
  }

  private showError(message: string) {
    toast.error(message || UNEXPECTED_ERROR_MSG);
  }

  public createRoom() {
    if (!this.socket?.connected) {
      this.showError(UNEXPECTED_ERROR_MSG);
      return;
    }

    this.socket.emit(ClientEvents.CREATE_ROOM, (res: { roomId?: string }) => {
      if (res.roomId) {
        toast.success(`تم إنشاء الغرفة: ${res.roomId}`);
      } else {
        this.showError(UNEXPECTED_ERROR_MSG);
      }
    });
  }

  public getIsConnected(): boolean {
    return this.isConnected;
  }

  public chooseCategory(category: TopicCategory) {
    if (!this.socket?.connected) {
      this.showError(UNEXPECTED_ERROR_MSG);
      return;
    }

    this.socket.emit(ClientEvents.UPDATE_TOIC_CATEGORY, category);
  }

  public setRoomInfoListener(callback: (info: RoomInfo) => void) {
    this.onRoomInfoChange = callback;
    if (this.roomInfo) {
      callback(this.roomInfo); // immediately push current roomInfo if available
    }
  }

  public setCategoryListener(callback: (category: TopicCategory) => void) {
    this.onCategoryChange = callback;
    if (this.choosedCategory) {
      callback(this.choosedCategory); // immediately push current category if available
    }
  }

  public addTopic(topic: Omit<Topic, "id">) {
    if (!this.socket?.connected) {
      this.showError(UNEXPECTED_ERROR_MSG);
      return;
    }

    this.socket.emit(ClientEvents.ADD_TOPIC, topic);
  }

  public removeTopic(topicID: string) {
    if (!this.socket?.connected) {
      this.showError(UNEXPECTED_ERROR_MSG);
      return;
    }

    this.socket.emit(ClientEvents.REMOVE_TOPIC, topicID);
  }

  public updateTopic(newTopic: Topic) {
    if (!this.socket?.connected) {
      this.showError(UNEXPECTED_ERROR_MSG);
      return;
    }

    this.socket.emit(ClientEvents.UPDATE_TOPIC, newTopic);
  }

  public cleanup() {
    this.socket.disconnect();
    this.socket.removeAllListeners();
  }
}
