import http from "http";
import app from "./app";
import config from "./config";

const PORT = config.port;

let server: http.Server;

function startServer(): http.Server {
  server = app.listen(PORT, () => {
    console.log(`🚀 AK Pharma Backend running on port ${PORT}`);
    console.log(`📡 Environment: ${config.env}`);
    console.log(`🩺 Health check: http://localhost:${PORT}/health`);
  });

  server.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
      console.error(`\n❌ Port ${PORT} is already in use by another process.`);
      console.error(`💡 Solution: Stop any existing dev servers running on port ${PORT} or kill the process.\n`);
    } else {
      console.error("❌ Server error:", err);
    }
    process.exit(1);
  });

  return server;
}

// Graceful Shutdown Handler
function gracefulShutdown(signal: string) {
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
  if (server) {
    server.close((err) => {
      if (err) {
        console.error("❌ Error during server shutdown:", err);
        process.exit(1);
      }
      console.log("✅ HTTP server closed successfully.");
      process.exit(0);
    });

    // Force close if graceful termination hangs past 10s
    setTimeout(() => {
      console.error("⚠️ Forcefully shutting down after timeout (10s)");
      process.exit(1);
    }, 10000).unref();
  } else {
    process.exit(0);
  }
}

// Global Process Listeners for Uncaught Exceptions & Rejections
process.on("unhandledRejection", (reason: unknown) => {
  console.error("💥 UNHANDLED REJECTION! Shutting down...", reason);
  gracefulShutdown("unhandledRejection");
});

process.on("uncaughtException", (error: Error) => {
  console.error("💥 UNCAUGHT EXCEPTION! Shutting down...", error);
  process.exit(1);
});

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Start server
startServer();

export { app, server };
export default app;
