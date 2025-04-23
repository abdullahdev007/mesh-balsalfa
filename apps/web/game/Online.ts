import { Socket } from "socket.io-client";
import { ClientEvents, ServerEvents, RoomInfo } from "@repo/shared";
import toast from "react-hot-toast";

const UNEXPECTED_ERROR_MSG = "حدث شيء خاطئ يرجى المحاولة مرة أخرى";

export class OnlineGameEngine {
  public roomInfo?: RoomInfo;
  private isConnected = false;
  private onRoomInfoChange?: (roomInfo: RoomInfo) => void;

  constructor(private socket: Socket) {
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
      toast.error(UNEXPECTED_ERROR_MSG);
      console.error(err);
    });

    this.socket.on(ServerEvents.ROOM_CREATED, ({ roomInfo }: { roomInfo: RoomInfo }) => {
      this.roomInfo = roomInfo;
      this.onRoomInfoChange?.(roomInfo);
      console.log(roomInfo.topics);
      
      toast.success(`Room created: ${roomInfo.id}`);
    });
  }

  public createRoom() {
    if (!this.socket) {
      toast.error(UNEXPECTED_ERROR_MSG);
      return;
    }

    this.socket.emit(ClientEvents.CREATE_ROOM, (res: { roomId?: string }) => {
      if (res.roomId) {
        toast.success(`Room created: ${res.roomId}`);
      } else {
        toast.error(UNEXPECTED_ERROR_MSG);
      }
    });
  }

  public getRoomInfo(roomID: string, callback: (info?: RoomInfo) => void) {
    if (!this.socket) return;

    this.socket.emit(ClientEvents.GET_ROOM_INFO, roomID, (res: { data?: RoomInfo; error?: string }) => {

      if (res.error) {
        toast.error(res.error);
        return callback(undefined);
      }

      callback(res.data);
    });
  }

  public getRoom(): RoomInfo | undefined {
    return this.roomInfo;
  }

  public getIsConnected(): boolean {
    return this.isConnected;
  }

  public setRoomInfoListener(callback: (info: RoomInfo) => void) {
    this.onRoomInfoChange = callback;
  }

  public cleanup() {
    this.socket.disconnect();
    this.socket.removeAllListeners();
  }
}
