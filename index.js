const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const app = express();
const models = require("./models");

app.use(cors());

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

let connectedUsers = 0;

io.on("connection", async (socket) => {
  connectedUsers++;
  console.log("✅ A user connected");

  // Send message history to the new user
  const messages = await models.Message.findAll({
    order: [["timestamp", "ASC"]],
    include: [{ model: models.Message, as: "repliedMessage" }],
    limit: 100,
  });
  socket.emit("messageHistory", messages);

  io.emit("userCount", connectedUsers);

  socket.on("message", async (msg) => {
    console.log("📨 Message received:", msg);

    const savedMessage = await models.Message.create({
      userId: msg.userId,
      name: msg.name,
      profileImageUrl: msg.profileImageUrl || "",
      message: msg.message,
      timestamp: new Date(),
      replyToMessageId: msg.replyToMessageId || null,
    });

    // Optionally fetch replied message if needed in frontend
    let fullMessage = savedMessage.toJSON();

    if (msg.replyToMessageId) {
      const repliedMessage = await models.Message.findByPk(
        msg.replyToMessageId
      );
      if (repliedMessage) {
        fullMessage.repliedMessage = repliedMessage;
      }
    }

    io.emit("message", fullMessage);
  });

  socket.on("disconnect", () => {
    connectedUsers--;
    console.log("❌ A user disconnected");
    io.emit("userCount", connectedUsers);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
