import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ArrowLeft, Loader2, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  deleteDoc,
  doc,
} from "firebase/firestore";

interface HistoryItem {
  id: string;
  fileName: string;
  language: string;
  extractedText: string;
  textPreview: string;
  thumbnailUrl: string | null;
  createdAt: number;
  fileType: string;
}

export default function AdminUserDetail() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string>("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      navigate("/admin/dashboard");
      return;
    }

    let isMounted = true;
    let userUnsubscribe: (() => void) | null = null;
    let historyUnsubscribe: (() => void) | null = null;

    const setupListeners = () => {
      try {
        // Get user info
        const usersRef = collection(db, "users");
        const userQuery = query(usersRef, where("userId", "==", userId));

        userUnsubscribe = onSnapshot(
          userQuery,
          (snapshot) => {
            if (!isMounted) return;
            if (!snapshot.empty) {
              setUserEmail(snapshot.docs[0].data().email);
            }
          },
          (error: any) => {
            if (!isMounted) return;
            console.error("Failed to load user:", error);
          },
        );

        // Get user's history
        const historyRef = collection(db, "document_history");
        const historyQuery = query(
          historyRef,
          where("userId", "==", userId),
          orderBy("createdAt", "desc"),
        );

        historyUnsubscribe = onSnapshot(
          historyQuery,
          (snapshot) => {
            if (!isMounted) return;

            const items: HistoryItem[] = [];
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
            setHistory(items);
            setIsLoading(false);
          },
          (error: any) => {
            if (!isMounted) return;
            console.error("Failed to load history:", error);
            if (error.code !== "permission-denied") {
              toast.error("Failed to load history");
            }
            setIsLoading(false);
          },
        );
      } catch (error) {
        if (!isMounted) return;
        console.error("Failed to setup listeners:", error);
        setIsLoading(false);
      }
    };

    setupListeners();

    return () => {
      isMounted = false;
      if (userUnsubscribe) {
        try {
          userUnsubscribe();
        } catch (error) {
          console.error("Error unsubscribing from user listener:", error);
        }
      }
      if (historyUnsubscribe) {
        try {
          historyUnsubscribe();
        } catch (error) {
          console.error("Error unsubscribing from history listener:", error);
        }
      }
    };
  }, [userId, navigate]);

  const handleDeleteItem = async (itemId: string) => {
    if (!window.confirm("Are you sure you want to delete this item?")) {
      return;
    }

    try {
      await deleteDoc(doc(db, "document_history", itemId));
      toast.success("Item deleted");
    } catch (error) {
      console.error("Failed to delete:", error);
      toast.error("Failed to delete item");
    }
  };

  const getLanguageName = (code: string) => {
    const languages: { [key: string]: string } = {
      eng: "English",
      hin: "Hindi",
      mar: "Marathi",
      guj: "Gujarati",
      ben: "Bengali",
      tam: "Tamil",
      tel: "Telugu",
    };
    return languages[code] || code.toUpperCase();
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <div className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate("/admin/dashboard")}
            className="flex items-center gap-2 px-4 py-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ArrowLeft size={18} />
            Back
          </button>
          <div>
            <h1 className="text-2xl font-bold">User Details</h1>
            <p className="text-muted-foreground">{userEmail}</p>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">
            OCR History ({history.length})
          </h2>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={32} className="animate-spin text-primary" />
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground bg-card border border-border rounded-lg">
              No OCR history for this user
            </div>
          ) : (
            <div className="grid gap-4">
              {history.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-card border border-border rounded-lg overflow-hidden"
                >
                  <div
                    onClick={() =>
                      setExpandedId(expandedId === item.id ? null : item.id)
                    }
                    className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          {item.thumbnailUrl && (
                            <img
                              src={item.thumbnailUrl}
                              alt="thumbnail"
                              className="w-12 h-12 rounded object-cover"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold truncate">
                              {item.fileName}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(item.createdAt).toLocaleDateString(
                                "en-US",
                                {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )}{" "}
                              • Language: {getLanguageName(item.language)}
                            </p>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteItem(item.id);
                        }}
                        className="p-2 hover:bg-destructive/10 rounded-lg text-destructive transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  {expandedId === item.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-border bg-muted/30 p-4"
                    >
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-muted-foreground">
                          Extracted Text:
                        </p>
                        <div className="bg-background border border-border rounded p-3 max-h-64 overflow-y-auto">
                          <p className="text-sm whitespace-pre-wrap break-words font-mono">
                            {item.extractedText}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
