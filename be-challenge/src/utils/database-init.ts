import FirebaseService from "../services/firebase";

interface CollectionSchema {
  name: string;
  description: string;
  sampleDocument?: any;
}

const COLLECTIONS: CollectionSchema[] = [
  {
    name: "owners",
    description: "Store owner/manager information and authentication data",
    sampleDocument: {
      phoneNumber: "",
      accessCode: "",
      createdAt: null,
      lastLogin: null,
    },
  },
  {
    name: "employees",
    description: "Store employee information and authentication data",
    sampleDocument: {
      name: "",
      email: "",
      department: "",
      accessCode: "",
      isActive: true,
      createdAt: null,
      lastLogin: null,
      createdBy: "",
    },
  },
  {
    name: "chat_messages",
    description: "Store chat messages between owners and employees",
    sampleDocument: {
      senderId: "",
      receiverId: "",
      message: "",
      timestamp: null,
      messageType: "owner-to-employee",
      isRead: false,
    },
  },
];

class DatabaseInitializer {
  private firebaseService: FirebaseService;

  constructor() {
    this.firebaseService = FirebaseService.getInstance();
  }

  public async initializeCollections(): Promise<void> {
    console.log("Starting database initialization...");

    try {
      const connectionTest = await this.firebaseService.testConnection();
      if (!connectionTest) {
        throw new Error("Firebase connection test failed");
      }

      for (const collection of COLLECTIONS) {
        await this.initializeCollection(collection);
      }

      console.log("Database initialization completed successfully");
    } catch (error) {
      console.error("Database initialization failed:", error);
      throw error;
    }
  }

  private async initializeCollection(schema: CollectionSchema): Promise<void> {
    try {
      console.log(`Initializing collection: ${schema.name}`);

      const db = this.firebaseService.getFirestore();
      const collectionRef = db.collection(schema.name);

      const snapshot = await collectionRef.limit(1).get();

      if (snapshot.empty) {
        console.log(
          `Collection ${schema.name} is empty, creating initial structure...`
        );

        await collectionRef.doc("_metadata").set({
          description: schema.description,
          createdAt: new Date(),
          version: "1.0.0",
          schema: schema.sampleDocument || {},
        });

        console.log(`Collection ${schema.name} initialized with metadata`);
      } else {
        console.log(
          `Collection ${schema.name} already exists with ${snapshot.size} document(s)`
        );
      }
    } catch (error) {
      console.error(`Failed to initialize collection ${schema.name}:`, error);
      throw error;
    }
  }

  public async createIndexes(): Promise<void> {
    console.log("Creating database indexes...");

    try {
      const db = this.firebaseService.getFirestore();

      const recommendedIndexes = [
        {
          collection: "owners",
          fields: ["phoneNumber"],
          description: "Index for owner phone number lookups",
        },
        {
          collection: "employees",
          fields: ["email"],
          description: "Index for employee email lookups",
        },
        {
          collection: "employees",
          fields: ["createdBy", "isActive"],
          description: "Composite index for employee queries by owner",
        },
        {
          collection: "chat_messages",
          fields: ["senderId", "receiverId", "timestamp"],
          description: "Composite index for chat message queries",
        },
        {
          collection: "chat_messages",
          fields: ["receiverId", "isRead", "timestamp"],
          description: "Index for unread message queries",
        },
      ];

      console.log("Recommended indexes for optimal performance:");
      recommendedIndexes.forEach((index) => {
        console.log(
          `- ${index.collection}: ${index.fields.join(", ")} (${
            index.description
          })`
        );
      });

      console.log(
        "Note: Indexes should be created through Firebase Console or CLI"
      );
      console.log("Database indexes documentation completed");
    } catch (error) {
      console.error("Failed to document indexes:", error);
      throw error;
    }
  }

  public async validateDatabase(): Promise<boolean> {
    console.log("Validating database structure...");

    try {
      const db = this.firebaseService.getFirestore();
      let isValid = true;

      for (const collection of COLLECTIONS) {
        try {
          const collectionRef = db.collection(collection.name);
          const snapshot = await collectionRef.limit(1).get();

          console.log(
            `✓ Collection ${collection.name}: ${
              snapshot.empty ? "Empty" : "Has data"
            }`
          );
        } catch (error) {
          console.error(`✗ Collection ${collection.name}: Error - ${error}`);
          isValid = false;
        }
      }

      try {
        const testCollection = db.collection("_test_validation");

        const testDoc = await testCollection.add({
          test: true,
          timestamp: new Date(),
        });
        console.log("✓ Create operation: Success");

        const doc = await testDoc.get();
        if (doc.exists) {
          console.log("✓ Read operation: Success");
        }

        await testDoc.update({ updated: true });
        console.log("✓ Update operation: Success");

        await testDoc.delete();
        console.log("✓ Delete operation: Success");

        await testCollection
          .doc("_cleanup")
          .set({ note: "Test collection for validation" });
      } catch (error) {
        console.error("✗ CRUD operations test failed:", error);
        isValid = false;
      }

      if (isValid) {
        console.log("Database validation completed successfully");
      } else {
        console.log(
          "Database validation failed - please check the errors above"
        );
      }

      return isValid;
    } catch (error) {
      console.error("Database validation error:", error);
      return false;
    }
  }

  public async getDatabaseStats(): Promise<any> {
    try {
      const db = this.firebaseService.getFirestore();
      const stats: any = {
        collections: {},
        totalDocuments: 0,
        timestamp: new Date().toISOString(),
      };

      for (const collection of COLLECTIONS) {
        try {
          const snapshot = await db.collection(collection.name).get();
          stats.collections[collection.name] = {
            documentCount: snapshot.size,
            description: collection.description,
          };
          stats.totalDocuments += snapshot.size;
        } catch (error) {
          stats.collections[collection.name] = {
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      }

      return stats;
    } catch (error) {
      console.error("Failed to get database stats:", error);
      throw error;
    }
  }
}

export default DatabaseInitializer;
