import { useEffect, useState } from "react";
import io, { Socket } from "socket.io-client";
import getUsername from "../utils/generateRandomUsername";

const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const username = getUsername();

    const socketConnection = io(process.env.NEXT_PUBLIC_SERVER_URL, {
      transports: ["websocket"],
      query: { username },
    });

    setSocket(socketConnection);

    return () => {
      socketConnection.disconnect();
    };
  }, []);

  return socket;
};

export default useSocket;
