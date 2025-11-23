import { Copy, Download, RefreshCw, Volume2, StopCircle, Check, FileText, Image as ImageIcon, FileType } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { PdfExportModal } from "@/components/PdfExportModal";
import { textToDocx } from "@/utils/textToDocx";

interface OcrResultProps {
    text: string;
    onClear: () => void;
    onTextChange: (text: string) => void;
}

export function OcrResult({ text, onClear, onTextChange }: OcrResultProps) {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const [showPdfModal, setShowPdfModal] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        const handleSpeechEnd = () => setIsSpeaking(false);
        window.speechSynthesis.addEventListener("end", handleSpeechEnd);
        window.speechSynthesis.addEventListener("cancel", handleSpeechEnd);

        return () => {
            window.speechSynthesis.removeEventListener("end", handleSpeechEnd);
            window.speechSynthesis.removeEventListener("cancel", handleSpeechEnd);
        };
    }, []);

    if (!text) return null;

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(text);
            setIsCopied(true);
            toast.success("Text copied to clipboard");
            setTimeout(() => setIsCopied(false), 2000);
        } catch (err) {
            toast.error("Failed to copy text");
        }
    };

    const handleSpeak = () => {
        if (isSpeaking) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
            return;
        }

        const utterance = new SpeechSynthesisUtterance(text);
        // Try to detect language or default to Hindi/English
        // Simple heuristic: check if contains Devanagari
        const hasDevanagari = /[\u0900-\u097F]/.test(text);
        utterance.lang = hasDevanagari ? "hi-IN" : "en-US";

        window.speechSynthesis.speak(utterance);
        setIsSpeaking(true);
    };

    const handleTxtDownload = () => {
        const blob = new Blob([text], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `ocr-result-${Date.now()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success("Text file downloaded");
    };

    const handleWordDownload = async () => {
        try {
            const blob = await textToDocx(text, "Extracted Text");
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `ocr-result-${Date.now()}.docx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            toast.success("Word document downloaded");
        } catch (error) {
            console.error("Word export error:", error);
            toast.error("Failed to export to Word");
        }
    };

    const handleImageDownload = async () => {
        if (!textareaRef.current) return;

        try {
            const canvas = await html2canvas(textareaRef.current, {
                backgroundColor: "#ffffff",
                scale: 2,
            });

            const url = canvas.toDataURL("image/png");
            const a = document.createElement("a");
            a.href = url;
            a.download = `ocr-result-${Date.now()}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            toast.success("Image downloaded");
        } catch (error) {
            console.error("Image export error:", error);
            toast.error("Failed to export as image");
        }
    };

    return (
        <>
            <Card className="w-full mt-6 border-primary/20 shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <span className="text-primary">Extracted Text</span>
                        <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                            {text.length} chars
                        </span>
                    </CardTitle>
                    <div className="flex items-center gap-1 flex-wrap justify-end">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={handleSpeak}
                                        className={isSpeaking ? "text-primary animate-pulse" : ""}
                                    >
                                        {isSpeaking ? <StopCircle size={18} /> : <Volume2 size={18} />}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{isSpeaking ? "Stop Reading" : "Read Aloud"}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" onClick={handleCopy}>
                                        {isCopied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Copy to Clipboard</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        <div className="w-px h-6 bg-border mx-1" />

                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" onClick={() => setShowPdfModal(true)}>
                                        <FileText size={18} />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Export as PDF</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" onClick={handleWordDownload}>
                                        <FileType size={18} />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Export as Word</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" onClick={handleImageDownload}>
                                        <ImageIcon size={18} />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Export as Image</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" onClick={handleTxtDownload}>
                                        <Download size={18} />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Download as Text</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        <div className="w-px h-6 bg-border mx-1" />

                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={onClear}
                                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                    >
                                        <RefreshCw size={18} />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Clear Result</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                </CardHeader>
                <CardContent>
                    <Textarea
                        ref={textareaRef}
                        value={text}
                        onChange={(e) => onTextChange(e.target.value)}
                        className="min-h-[300px] font-mono text-base leading-relaxed resize-y bg-muted/30 focus:bg-background transition-colors p-4"
                        placeholder="Extracted text will appear here..."
                    />
                </CardContent>
            </Card>

            <PdfExportModal
                isOpen={showPdfModal}
                onClose={() => setShowPdfModal(false)}
                text={text}
            />
        </>
    );
}
