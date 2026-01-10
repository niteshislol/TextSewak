import { useState } from "react";
import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

export function HowToUse() {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button
                    variant="default"
                    size="icon"
                    className="rounded-full h-12 w-12 shadow-lg hover:shadow-xl transition-shadow"
                    title="कैसे इस्तेमाल करें"
                >
                    <HelpCircle className="h-6 w-6" />
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl">📖 TextSewak कैसे इस्तेमाल करें</DialogTitle>
                    <DialogDescription className="text-sm">
                        TextSewak का उपयोग करना बहुत आसान है। नीचे दिए गए चरणों का पालन करें:
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-6 mt-4">
                    {/* Step 1 */}
                    <div className="flex gap-4">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                            1
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-base mb-2">📄 फाइल अपलोड करें</h3>
                            <p className="text-sm text-muted-foreground">
                                <strong>दस्तावेज़:</strong> PDF या Word फाइल अपलोड करें।<br />
                                <strong>इमेज:</strong> JPG, PNG या अन्य इमेज फाइल चुनें।<br />
                                आप URL से भी इमेज लोड कर सकते हैं।
                            </p>
                        </div>
                    </div>

                    {/* Step 2 */}
                    <div className="flex gap-4">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                            2
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-base mb-2">🌐 फाइल की भाषा चुनें</h3>
                            <p className="text-sm text-muted-foreground">
                                ड्रॉपडाउन से अपनी फाइल की भाषा चुनें:<br />
                                • <strong>हिंदी (Original)</strong> - शुद्ध हिंदी के लिए<br />
                                • <strong>English</strong> - अंग्रेजी के लिए<br />
                                • अन्य भाषाएं भी उपलब्ध हैं
                            </p>
                        </div>
                    </div>

                    {/* Step 3 */}
                    <div className="flex gap-4">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                            3
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-base mb-2">⚡ Extract Text बटन दबाएं</h3>
                            <p className="text-sm text-muted-foreground">
                                "Extract Text" बटन पर क्लिक करें। TextSewak आपकी फाइल से टेक्स्ट निकाल देगा।<br />
                                <strong>टिप:</strong> धुंधली इमेज के लिए "Improve Low-Contrast/Blurry Image" ऑप्शन चेक करें।
                            </p>
                        </div>
                    </div>

                    {/* Step 4 */}
                    <div className="flex gap-4">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                            4
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-base mb-2">📋 टेक्स्ट का उपयोग करें</h3>
                            <p className="text-sm text-muted-foreground">
                                निकाले गए टेक्स्ट को:<br />
                                • <strong>कॉपी करें</strong> - क्लिपबोर्ड में कॉपी करें<br />
                                • <strong>PDF बनाएं</strong> - PDF फाइल के रूप में सेव करें<br />
                                • <strong>सुनें</strong> - टेक्स्ट को सुनें (Text-to-Speech)<br />
                                • <strong>कानूनी विश्लेषण</strong> - FIR के लिए BNS सेक्शन खोजें
                            </p>
                        </div>
                    </div>

                    {/* Additional Features */}
                    <div className="border-t pt-4 mt-4">
                        <h3 className="font-semibold text-base mb-3">🚀 अतिरिक्त सुविधाएं</h3>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li>
                                <strong>⚖️ Legal Analysis:</strong> FIR टेक्स्ट के लिए BNS सेक्शन खोजें
                            </li>
                            <li>
                                <strong>📝 Generate FIR:</strong> ऑफलाइन वॉइस से शिकायत पत्र बनाएं
                            </li>
                            <li>
                                <strong>📜 History:</strong> पुराने डॉक्यूमेंट देखें
                            </li>
                        </ul>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
