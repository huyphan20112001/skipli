import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import FirebaseService from "./services/firebase";
import { SocketService } from "./services/socket";
import { logger, requestLogger } from "./utils/logger";
import { errorHandler, notFoundHandler } from "./middleware/error-handler";
import apiRoutes from "./routes";

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const socketService = new SocketService(io);

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(requestLogger);

app.use("/api", apiRoutes);

app.get("/health", async (req, res) => {
  try {
    const firebaseService = FirebaseService.getInstance();
    const firebaseStatus = await firebaseService.testConnection();

    res.status(200).json({
      status: "OK",
      message: "Employee Task Management Backend is running",
      timestamp: new Date().toISOString(),
      services: {
        firebase: firebaseStatus ? "connected" : "disconnected",
        socketio: "active",
      },
    });
  } catch (error) {
    res.status(503).json({
      status: "Service Unavailable",
      message: "Health check failed",
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 2001;

async function startServer() {
  let firebaseReady = false;

  try {
    logger.info("Initializing Firebase connection...");
    const firebaseService = FirebaseService.getInstance();

    const connectionTest = await firebaseService.testConnection();
    if (!connectionTest) {
      logger.warn(
        "Firebase connection test failed - server will start but database operations may fail"
      );
      logger.warn("Please configure Firebase credentials in your .env file");
    } else {
      logger.info("Firebase connection successful");
      firebaseReady = true;
    }
  } catch (error) {
    logger.error(
      "Firebase initialization failed - server will start in limited mode",
      { error: error instanceof Error ? error.message : error }
    );
    logger.warn(
      "Please check FIREBASE_SETUP.md for configuration instructions"
    );
  }

  server.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
    logger.info(`Health check available at http://localhost:${PORT}/health`);

    if (firebaseReady) {
      logger.info("Firebase Admin SDK initialized and ready");
    } else {
      logger.warn(
        "Firebase not configured - some features will be unavailable"
      );
      logger.info("See FIREBASE_SETUP.md for setup instructions");
    }
  });
}

startServer();

export { app, io, socketService };
