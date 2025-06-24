const express = require("express");
const socketIo = require("socket.io");
const path = require("path");
const models = require("./models");

const app = express();

// Middleware
app.use(require("cors")());
app.use(express.json());

// Serve static files if needed (optional)
app.use(express.static(path.join(__dirname, "public")));

let io;

// This function will be called by Passenger
const startApp = (server) => {
  io = socketIo(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  let connectedUsers = 0;

  io.on("connection", async (socket) => {
    connectedUsers++;
    console.log("✅ A user connected");

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
};

// Export for Passenger to pick up
module.exports = app;

// Check if run directly or by Passenger
if (require.main === module) {
  const port = process.env.PORT || 3000;
  const server = app.listen(port, () =>
    console.log(`🚀 Server running on port ${port}`)
  );
  startApp(server);
}
