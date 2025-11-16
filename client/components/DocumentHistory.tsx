import { useState } from "react";
import { Trash2, Eye, Search, Trash } from "lucide-react";
import { motion } from "framer-motion";
import { DocumentHistoryItem } from "@/hooks/use-document-history";
import { HistoryDetailModal } from "./HistoryDetailModal";

interface DocumentHistoryProps {
  history: DocumentHistoryItem[];
  onDelete: (id: string) => void;
  onClearAll: () => void;
}

export function DocumentHistory({
  history,
  onDelete,
  onClearAll,
}: DocumentHistoryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<DocumentHistoryItem | null>(
    null,
  );

  const filteredHistory = history.filter(
    (item) =>
      item.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.textPreview.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (history.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full mt-8"
      >
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Document History
        </h2>
        <div className="bg-card border border-dashed border-border rounded-lg p-12 text-center">
          <p className="text-muted-foreground">
            No documents extracted yet. Start by uploading a file to see your
            history here.
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full mt-8"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">
          Document History ({history.length})
        </h2>
        {history.length > 0 && (
          <button
            onClick={onClearAll}
            className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-destructive text-destructive hover:bg-destructive/10 transition-colors"
          >
            <Trash size={16} />
            <span>Clear All</span>
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="relative mb-4">
        <Search
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
          size={18}
        />
        <input
          type="text"
          placeholder="Search history by filename or content..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* History List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredHistory.length > 0 ? (
          filteredHistory.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-card border border-border rounded-lg p-4 hover:border-primary/50 transition-colors"
            >
              <div className="flex items-start gap-4">
                {/* Thumbnail */}
                {item.thumbnailUrl && (
                  <img
                    src={item.thumbnailUrl}
                    alt={item.fileName}
                    className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                  />
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-foreground truncate">
                    {item.fileName}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(item.createdAt).toLocaleDateString()}{" "}
                    {new Date(item.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Language:{" "}
                    <span className="capitalize">{item.language}</span>
                  </p>
                  <p className="text-sm text-foreground/70 mt-2 line-clamp-2">
                    {item.textPreview}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => setSelectedItem(item)}
                    title="View extracted text"
                    className="p-2 rounded-lg hover:bg-secondary transition-colors text-primary hover:text-primary/80"
                  >
                    <Eye size={18} />
                  </button>
                  <button
                    onClick={() => onDelete(item.id)}
                    title="Delete from history"
                    className="p-2 rounded-lg hover:bg-destructive/10 transition-colors text-destructive hover:text-destructive/80"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No results found for "{searchQuery}"
          </div>
        )}
      </div>

      {/* History Detail Modal */}
      {selectedItem && (
        <HistoryDetailModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </motion.div>
  );
}
