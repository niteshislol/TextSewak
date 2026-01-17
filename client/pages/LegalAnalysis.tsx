import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom"; // For receiving state from OCR page
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Loader2, Gavel, AlertTriangle, BookOpen, Scale, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getApiUrl } from "@/config";

export default function LegalAnalysis() {
    const location = useLocation();
    const [inputText, setInputText] = useState("");
    const [language, setLanguage] = useState("hi");
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<any>(null);

    useEffect(() => {
        if (location.state && location.state.text) {
            setInputText(location.state.text);
            // Auto-analyze if navigated with text? Maybe let user click to confirm.
        }
    }, [location.state]);

    const handleAnalyze = async () => {
        if (!inputText.trim()) {
            toast.error("Please enter usage text description or FIR content.");
            return;
        }

        setIsLoading(true);
        setResult(null);

        try {
            // ... inside handleAnalyze
            const response = await fetch(getApiUrl("/api/legal/analyze"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ fir_text: inputText, language }),
            });

            if (!response.ok) {
                throw new Error("Analysis failed");
            }

            const data = await response.json();
            setResult(data);
            toast.success("Legal analysis complete");
        } catch (error) {
            console.error(error);
            toast.error("Failed to analyze. Ensure the Legal Engine is running.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-background text-foreground">
            <Header />

            <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-36 pb-12">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-8"
                >
                    <div className="text-center space-y-2">
                        <h1 className="text-3xl font-bold tracking-tight text-primary flex justify-center items-center gap-2">
                            <Scale className="h-8 w-8" />
                            BNS Legal Analyzer
                        </h1>
                        <p className="text-muted-foreground max-w-2xl mx-auto">
                            Analyze FIR texts or incident descriptions to find relevant Bharatiya Nyaya Sanhita (BNS) 2023 sections.
                        </p>
                    </div>

                    <Card className="w-full shadow-md">
                        <CardHeader>
                            <CardTitle>Case Details</CardTitle>
                            <CardDescription>Enter the incident details or FIR text below.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <textarea
                                className="w-full min-h-[200px] p-4 rounded-md border border-input bg-transparent text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="Type or paste the FIR content here..."
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                            />

                            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                                <div className="flex items-center gap-4">
                                    <label className="text-sm font-medium">Output Language:</label>
                                    <div className="flex bg-muted rounded-lg p-1">
                                        <button
                                            onClick={() => setLanguage("hi")}
                                            className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${language === "hi"
                                                ? "bg-background text-foreground shadow-sm"
                                                : "text-muted-foreground hover:text-foreground"
                                                }`}
                                        >
                                            Hindi
                                        </button>
                                        <button
                                            onClick={() => setLanguage("en")}
                                            className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${language === "en"
                                                ? "bg-background text-foreground shadow-sm"
                                                : "text-muted-foreground hover:text-foreground"
                                                }`}
                                        >
                                            English
                                        </button>
                                    </div>
                                </div>

                                <button
                                    onClick={handleAnalyze}
                                    disabled={isLoading || !inputText.trim()}
                                    className="w-full sm:w-auto px-8 py-2 bg-primary text-primary-foreground font-bold rounded-lg shadow hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Analyzing...
                                        </>
                                    ) : (
                                        <>
                                            <Gavel className="h-4 w-4" />
                                            Analyze Case
                                        </>
                                    )}
                                </button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Results Section */}
                    {result && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-6"
                        >
                            {result.custom_message && (
                                <Alert variant={result.is_fallback ? "destructive" : "default"} className="border-primary/20 bg-primary/5">
                                    <AlertTriangle className="h-4 w-4" />
                                    <AlertTitle>{result.is_fallback ? "Note (Fallback Analysis)" : "Analysis Result"}</AlertTitle>
                                    <AlertDescription className="mt-2 text-sm font-medium">
                                        {result.custom_message}
                                    </AlertDescription>
                                </Alert>
                            )}

                            {result.special_acts && result.special_acts.length > 0 && (
                                <div className="grid gap-6 md:grid-cols-1">
                                    <h2 className="text-xl font-bold flex items-center gap-2 text-orange-600 dark:text-orange-500">
                                        <Shield className="h-5 w-5" />
                                        Special Acts / विशेष अधिनियम
                                    </h2>

                                    {result.special_acts.map((act: any, idx: number) => (
                                        <Card key={idx} className="overflow-hidden border-l-4 border-l-orange-500 hover:shadow-lg transition-shadow bg-card">
                                            <CardHeader className="bg-orange-50 dark:bg-orange-950/20 pb-3">
                                                <CardTitle className="text-xl flex justify-between items-start">
                                                    <span>{act.Section}</span>
                                                    <span className="text-[10px] font-bold px-2 py-1 bg-orange-500 text-white rounded-full uppercase tracking-wider">
                                                        SPECIAL ACT
                                                    </span>
                                                </CardTitle>
                                                <CardDescription className="font-medium text-foreground/90 mt-1 text-base">
                                                    {act.section_title}
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent className="pt-4 space-y-3">
                                                <div>
                                                    <h4 className="text-sm font-semibold text-muted-foreground mb-1">Description</h4>
                                                    <p className="text-sm leading-relaxed">{act.section_desc || act.description}</p>
                                                </div>
                                                <div className="flex gap-2 mt-2">
                                                    <span className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground border">
                                                        Chapter {act.chapter}: {act.chapter_title}
                                                    </span>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}

                            {result.relevant_sections && result.relevant_sections.length > 0 && (
                                <div className="grid gap-6 md:grid-cols-1">
                                    <h2 className="text-xl font-bold flex items-center gap-2">
                                        <BookOpen className="h-5 w-5 text-primary" />
                                        Applicable BNS Sections
                                    </h2>

                                    {result.relevant_sections.map((section: any, idx: number) => (
                                        <Card key={idx} className="overflow-hidden border-l-4 border-l-primary/60 hover:shadow-lg transition-shadow">
                                            <CardHeader className="bg-muted/30 pb-3">
                                                <CardTitle className="text-lg flex justify-between items-start">
                                                    <span>Section {section.Section}</span>
                                                    <span className="text-xs font-normal px-2 py-1 bg-primary/10 text-primary rounded-full">
                                                        Chapter {section.chapter}
                                                    </span>
                                                </CardTitle>
                                                <CardDescription className="font-medium text-foreground/80 mt-1">
                                                    {section.section_title}
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent className="pt-4 space-y-3">
                                                <div>
                                                    <h4 className="text-sm font-semibold text-muted-foreground mb-1">Description</h4>
                                                    <p className="text-sm leading-relaxed">{section.section_desc}</p>
                                                </div>
                                                {section.punishment && (
                                                    <div>
                                                        <h4 className="text-sm font-semibold text-destructive/80 mb-1">Punishment</h4>
                                                        <p className="text-sm font-medium text-destructive">{section.punishment}</p>
                                                    </div>
                                                )}
                                                {section.cognizable && (
                                                    <div className="flex gap-4 text-xs mt-2">
                                                        <span className={`px-2 py-1 rounded bg-secondary ${section.cognizable === "Cognizable" ? "text-red-600" : "text-green-600"}`}>
                                                            {section.cognizable}
                                                        </span>
                                                        <span className={`px-2 py-1 rounded bg-secondary ${section.bailable === "Non-Bailable" ? "text-red-600" : "text-green-600"}`}>
                                                            {section.bailable}
                                                        </span>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}

                    <div className="mt-12 text-center">
                        <p className="text-xs text-muted-foreground">
                            Source:{" "}
                            <a
                                href="https://www.mha.gov.in/sites/default/files/250883_english_01042024.pdf"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline hover:text-primary transition-colors"
                            >
                                Official Bharatiya Nyaya Sanhita (BNS) 2023 PDF
                            </a>
                        </p>
                    </div>
                </motion.div>
            </main>
            <Footer />
        </div>
    );
}
