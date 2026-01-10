import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { DocumentHistory as DocumentHistoryComponent } from "@/components/DocumentHistory";
import { useDocumentHistory } from "@/hooks/use-document-history";
import { motion } from "framer-motion";
import { History as HistoryIcon, Trash2 } from "lucide-react";

export default function HistoryPage() {
    const { history, deleteFromHistory, clearHistory } = useDocumentHistory();

    return (
        <div className="min-h-screen flex flex-col bg-background text-foreground">
            <Header />

            <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-36 pb-12">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                >
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-border pb-6">
                        <div className="space-y-1">
                            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                                <HistoryIcon className="h-8 w-8 text-primary" />
                                Document History
                            </h1>
                            <p className="text-muted-foreground">
                                View and manage your previously scanned documents and extracted text.
                            </p>
                        </div>

                        {history.length > 0 && (
                            <button
                                onClick={clearHistory}
                                className="px-4 py-2 bg-destructive/10 text-destructive hover:bg-destructive/20 rounded-lg flex items-center gap-2 transition-colors font-medium text-sm"
                            >
                                <Trash2 size={16} />
                                Clear All History
                            </button>
                        )}
                    </div>

                    <div className="mt-8">
                        <DocumentHistoryComponent
                            history={history}
                            onDelete={deleteFromHistory}
                            onClearAll={clearHistory} // Passed but button hidden in component if handled here, or keep both.
                        // The component might have its own header, let's see. 
                        // Based on Index.tsx, it seems DocumentHistory handles list rendering.
                        />
                    </div>
                </motion.div>
            </main>

            <Footer />
        </div>
    );
}
