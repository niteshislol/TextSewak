import { useState, useEffect } from "react";
import { uploadToImgBB } from "@/utils/imgbb";
import { useAuth } from "./use-auth";
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  deleteDoc,
  doc,
  writeBatch,
  updateDoc,
  increment,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface DocumentHistoryItem {
  id: string;
  fileName: string;
  language: string;
  extractedText: string;
  textPreview: string;
  thumbnailUrl: string | null;
  createdAt: number;
  fileType: string;
}

const MAX_HISTORY_ITEMS = 50;
const COLLECTION_NAME = "document_history";

export function useDocumentHistory() {
  const [history, setHistory] = useState<DocumentHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setHistory([]);
      return;
    }

    let isMounted = true;
    let unsubscribe: (() => void) | null = null;

    const setupListener = () => {
      try {
        const q = query(
          collection(db, COLLECTION_NAME),
          where("userId", "==", user.id),
          orderBy("createdAt", "desc"),
        );

        unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            if (!isMounted) return;

            const items: DocumentHistoryItem[] = [];
            snapshot.forEach((doc) => {
              const data = doc.data();
              items.push({
                id: doc.id,
                fileName: data.fileName,
                language: data.language,
                extractedText: data.extractedText,
                textPreview: data.textPreview,
                thumbnailUrl: data.thumbnailUrl || null,
                createdAt: data.createdAt,
                fileType: data.fileType,
              });
            });
            setHistory(items.slice(0, MAX_HISTORY_ITEMS));
          },
          (error: any) => {
            if (!isMounted) return;
            console.error("Failed to load history:", error);
          },
        );
      } catch (error) {
        if (!isMounted) return;
        console.error("Failed to setup listener:", error);
      }
    };

    setupListener();

    return () => {
      isMounted = false;
      if (unsubscribe) {
        try {
          unsubscribe();
        } catch (error) {
          console.error("Error unsubscribing from listener:", error);
        }
      }
    };
  }, [user]);

  const saveToHistory = async (
    file: File | null,
    extractedText: string,
    language: string,
  ) => {
    if (!user) {
      console.error("User not authenticated");
      return null;
    }

    setIsLoading(true);
    try {
      const textPreview = extractedText.substring(0, 150) + "...";
      let thumbnailUrl: string | null = null;

      if (file && file.type.startsWith("image/")) {
        const uploadResult = await uploadToImgBB(file, user.id);
        if (uploadResult) {
          thumbnailUrl = uploadResult.url;
        }
      }

      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        userId: user.id,
        fileName: file?.name || "Unknown",
        language,
        extractedText,
        textPreview,
        thumbnailUrl,
        fileType: file?.type || "unknown",
        createdAt: Date.now(),
      });

      await updateDoc(doc(db, "users", user.id), {
        historyCount: increment(1),
      });

      const newItem: DocumentHistoryItem = {
        id: docRef.id,
        fileName: file?.name || "Unknown",
        language,
        extractedText,
        textPreview,
        thumbnailUrl,
        createdAt: Date.now(),
        fileType: file?.type || "unknown",
      };

      return newItem;
    } catch (error) {
      console.error("Failed to save to history:", error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteFromHistory = async (id: string) => {
    if (!user) return;

    try {
      await deleteDoc(doc(db, COLLECTION_NAME, id));
      await updateDoc(doc(db, "users", user.id), {
        historyCount: increment(-1),
      });
    } catch (error) {
      console.error("Failed to delete history item:", error);
    }
  };

  const clearHistory = async () => {
    if (!user) return;

    try {
      const batch = writeBatch(db);
      history.forEach((item) => {
        batch.delete(doc(db, COLLECTION_NAME, item.id));
      });
      await batch.commit();
    } catch (error) {
      console.error("Failed to clear history:", error);
    }
  };

  const getHistoryItem = (id: string) => {
    return history.find((item) => item.id === id);
  };

  return {
    history,
    isLoading,
    saveToHistory,
    deleteFromHistory,
    clearHistory,
    getHistoryItem,
  };
}
