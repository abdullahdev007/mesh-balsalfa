const { Server, Socket } = require('socket.io');

export const setupSocket = (io: typeof Server) => {
    io.on("connection", (socket: typeof Socket) => {
        console.log(`Player connected: ${socket.id}`);


        socket.on("disconnect", () => {
            console.log(`Player disconnected: ${socket.id}`);
        });
    });
};
