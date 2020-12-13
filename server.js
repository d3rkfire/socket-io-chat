const express = require("express");
const app = express();
const server = app.use(express.static(__dirname + "/public")).listen(80);
const io = require("socket.io")(server);


class SocketInfo {
    constructor(name, chatroom, socket) {
        this.name = name;
        this.chatroom = chatroom;
        this.socket = socket;
    }
}
var onlineUsers = [];
io.on("connection", (socket) => {
    var chatroom = null;
    // Joining Room
    socket.on("join-request", (data) => {
        socket.join(data.chatroom);
        chatroom = data.chatroom;
        onlineUsers.push(new SocketInfo(data.name, data.chatroom, socket));

        var roomMembers = [];
        for (var i = 0; i < onlineUsers.length; i++)
            if (onlineUsers[i].chatroom == chatroom)
                roomMembers.push(onlineUsers[i].name);

        io.in(chatroom).emit("join-announcement", {
            "name": data.name,
            "online": roomMembers
        });
    });

    // Leaving Room
    socket.on("disconnect", (reason) => {
        if (chatroom) {
            var socketInfo = null;
            for (var i = 0; i < onlineUsers.length; i++)
                if (onlineUsers[i].socket.id == socket.id) {
                    socketInfo = onlineUsers.splice(i, 1)[0];
                    break;
                }

            var roomMembers = [];
            for (var i = 0; i < onlineUsers.length; i++)
                if (onlineUsers[i].chatroom == chatroom)
                    roomMembers.push(onlineUsers[i].name);

            io.in(chatroom).emit("leave-announcement", {
                "name": socketInfo.name,
                "online": roomMembers
            });
        }
    });

    // Messaging
    socket.on("send-message", (data) => {
        if (chatroom) io.in(chatroom).emit("new-message", data);
    });
});