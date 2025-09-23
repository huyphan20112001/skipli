import dotenv from "dotenv";
import DatabaseInitializer from "../utils/database-init";
import FirebaseService from "../services/firebase";

dotenv.config();

async function main() {
  console.log("=".repeat(60));
  console.log("Firebase Database Initialization Script");
  console.log("=".repeat(60));

  try {
    console.log("\n1. Initializing Firebase connection...");
    const firebaseService = FirebaseService.getInstance();

    console.log("\n2. Testing Firebase connection...");
    const connectionTest = await firebaseService.testConnection();
    if (!connectionTest) {
      throw new Error("Firebase connection test failed");
    }
    console.log("✓ Firebase connection successful");

    console.log("\n3. Initializing database collections...");
    const dbInitializer = new DatabaseInitializer();
    await dbInitializer.initializeCollections();

    console.log("\n4. Documenting recommended indexes...");
    await dbInitializer.createIndexes();

    console.log("\n5. Validating database structure...");
    const isValid = await dbInitializer.validateDatabase();

    if (!isValid) {
      throw new Error("Database validation failed");
    }

    console.log("\n6. Getting database statistics...");
    const stats = await dbInitializer.getDatabaseStats();
    console.log("\nDatabase Statistics:");
    console.log(JSON.stringify(stats, null, 2));

    console.log("\n" + "=".repeat(60));
    console.log("✓ Database initialization completed successfully!");
    console.log("=".repeat(60));

    process.exit(0);
  } catch (error) {
    console.error("\n" + "=".repeat(60));
    console.error("✗ Database initialization failed!");
    console.error("Error:", error instanceof Error ? error.message : error);
    console.error("=".repeat(60));

    if (error instanceof Error && error.stack) {
      console.error("\nStack trace:");
      console.error(error.stack);
    }

    process.exit(1);
  }
}

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});

if (require.main === module) {
  main();
}
