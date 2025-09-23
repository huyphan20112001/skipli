import admin from "firebase-admin";
import dotenv from "dotenv";

dotenv.config();

interface FirebaseConfig {
  projectId: string;
  privateKeyId: string;
  privateKey: string;
  clientEmail: string;
  clientId: string;
  authUri: string;
  tokenUri: string;
}

class FirebaseService {
  private static instance: FirebaseService;
  private db: admin.firestore.Firestore;
  private isInitialized: boolean = false;

  private constructor() {
    this.initializeFirebase();
    this.db = admin.firestore();
  }

  public static getInstance(): FirebaseService {
    if (!FirebaseService.instance) {
      FirebaseService.instance = new FirebaseService();
    }
    return FirebaseService.instance;
  }

  private initializeFirebase(): void {
    try {
      if (admin.apps.length > 0) {
        console.log("Firebase Admin SDK already initialized");
        this.isInitialized = true;
        return;
      }

      const config: FirebaseConfig = {
        projectId: process.env.FIREBASE_PROJECT_ID || "",
        privateKeyId: process.env.FIREBASE_PRIVATE_KEY_ID || "",
        privateKey: process.env.FIREBASE_PRIVATE_KEY
          ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
          : "",
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL || "",
        clientId: process.env.FIREBASE_CLIENT_ID || "",
        authUri:
          process.env.FIREBASE_AUTH_URI ||
          "https://accounts.google.com/o/oauth2/auth",
        tokenUri:
          process.env.FIREBASE_TOKEN_URI ||
          "https://oauth2.googleapis.com/token",
      };

      this.validateConfig(config);

      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: config.projectId,
          privateKey: config.privateKey,
          clientEmail: config.clientEmail,
        }),
        projectId: config.projectId,
      });

      this.isInitialized = true;
      console.log("Firebase Admin SDK initialized successfully");
    } catch (error) {
      console.error("Failed to initialize Firebase Admin SDK:", error);
      throw new Error(
        `Firebase initialization failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  private validateConfig(config: FirebaseConfig): void {
    const requiredFields: (keyof FirebaseConfig)[] = [
      "projectId",
      "privateKey",
      "clientEmail",
    ];

    const missingFields = requiredFields.filter((field) => !config[field]);

    if (missingFields.length > 0) {
      throw new Error(
        `Missing required Firebase configuration: ${missingFields.join(
          ", "
        )}. Please check your .env file and ensure Firebase credentials are properly configured.`
      );
    }
  }

  public getFirestore(): admin.firestore.Firestore {
    if (!this.isInitialized) {
      throw new Error("Firebase service not initialized");
    }
    return this.db;
  }

  public async testConnection(): Promise<boolean> {
    try {
      await this.db.collection("_test").limit(1).get();
      console.log("Firebase connection test successful");
      return true;
    } catch (error) {
      console.error("Firebase connection test failed:", error);
      return false;
    }
  }

  public getCollection(
    collectionName: string
  ): admin.firestore.CollectionReference {
    return this.db.collection(collectionName);
  }

  public async createDocument(
    collectionName: string,
    data: any
  ): Promise<string> {
    try {
      const docRef = await this.db.collection(collectionName).add(data);
      return docRef.id;
    } catch (error) {
      console.error(`Error creating document in ${collectionName}:`, error);
      throw error;
    }
  }

  public async getDocument(
    collectionName: string,
    documentId: string
  ): Promise<any> {
    try {
      console.log("collectionName => ", collectionName);
      console.log("documentId => ", documentId);
      const doc = await this.db
        .collection(collectionName)
        .doc(documentId)
        .get();

      console.log("abc => ", doc);
      if (!doc.exists) {
        return null;
      }
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      console.error(`Error getting document from ${collectionName}:`, error);
      throw error;
    }
  }

  public async updateDocument(
    collectionName: string,
    documentId: string,
    data: any
  ): Promise<void> {
    try {
      await this.db.collection(collectionName).doc(documentId).update(data);
    } catch (error) {
      console.error(`Error updating document in ${collectionName}:`, error);
      throw error;
    }
  }

  public async deleteDocument(
    collectionName: string,
    documentId: string
  ): Promise<void> {
    try {
      await this.db.collection(collectionName).doc(documentId).delete();
    } catch (error) {
      console.error(`Error deleting document from ${collectionName}:`, error);
      throw error;
    }
  }
}

export default FirebaseService;
