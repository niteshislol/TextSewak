import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Mic, FileText, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Document, Packer, Paragraph, TextRun } from "docx";
import { saveAs } from "file-saver";
import { Download } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const templates: Record<string, { label: string; placeholder: string; subject: string; catName: string; descPlaceholder: string }> = {
    lost: { label: "खोई वस्तु (Lost Item)", placeholder: "Ex: काला लेदर बैग", subject: "खोई हुई वस्तु के संबंध में शिकायत पत्र।", catName: "खोई हुई वस्तु", descPlaceholder: "..." },
    theft: { label: "चोरी हुई वस्तु (Stolen Item)", placeholder: "Ex: बाइक / सोने की चेन", subject: "चोरी की घटना की FIR।", catName: "चोरी", descPlaceholder: "..." },
    accident: { label: "गाड़ी नंबर (Vehicle)", placeholder: "Ex: DL-1234", subject: "सड़क दुर्घटना।", catName: "सड़क दुर्घटना", descPlaceholder: "..." },
    fight: {
        label: "आरोपी का नाम (Accused Name)",
        placeholder: "Ex: पड़ोसी सुरेश और उसके साथी",
        subject: "मार-पीट और लड़ाई-झगड़े के संबंध में शिकायत।",
        catName: "मार-पीट / लड़ाई-झगड़ा",
        descPlaceholder: "उक्त व्यक्तियों ने मुझे रोका और बिना किसी कारण के मेरे साथ गाली-गलौज और मार-पीट शुरू कर दी..."
    },
    noise: {
        label: "परेशानी का कारण (Source of Noise)",
        placeholder: "Ex: देर रात तक डीजे बजाना",
        subject: "धवनि प्रदूषण और शोर-शराबे की शिकायत।",
        catName: "सार्वजनिक उपद्रव (Noise)",
        descPlaceholder: "पड़ोस में देर रात 2 बजे तक तेज़ आवाज़ में डीजे बजाया जा रहा है जिससे मुझे और मेरे बुजुर्ग माता-पिता को परेशानी हो रही है..."
    },
    missing: {
        label: "गुमशुदा व्यक्ति का नाम (Name of Person)",
        placeholder: "Ex: मेरा बेटा राहुल, उम्र 10 वर्ष",
        subject: "गुमशुदा व्यक्ति की तलाश हेतु प्रार्थना पत्र।",
        catName: "गुमशुदा व्यक्ति",
        descPlaceholder: "वह शाम 5 बजे खेलने गया था और तब से वापस नहीं लौटा। उसका रंग गेहुंआ है और उसने नीली शर्ट पहनी है..."
    },
    domestic: {
        label: "आरोपी का नाम (Accused Name)",
        placeholder: "Ex: पति / ससुराल वाले",
        subject: "घरेलू हिंसा से सुरक्षा हेतु शिकायत पत्र।",
        catName: "घरेलू हिंसा",
        descPlaceholder: "मेरे ससुराल वाले मुझे दहेज़ के लिए प्रताड़ित करते हैं और आए दिन मेरे साथ मार-पीट करते हैं..."
    },
    harassment: {
        label: "आरोपी / विवरण (Accused/Details)",
        placeholder: "Ex: बस स्टॉप पर खड़े कुछ लड़के",
        subject: "छेड़छाड़ और यौन उत्पीड़न के खिलाफ शिकायत।",
        catName: "यौन उत्पीड़न / छेड़छाड़",
        descPlaceholder: "जब मैं ऑफिस से लौट रही थी, तो कुछ लड़कों ने मेरा पीछा किया और अश्लील टिप्पणियां कीं..."
    },
    threat: {
        label: "धमकी देने वाला (Threatener)",
        placeholder: "Ex: अज्ञात कॉलर / पड़ोसी",
        subject: "जान से मारने की धमकी मिलने के संबंध में।",
        catName: "धमकी / जान का खतरा",
        descPlaceholder: "मुझे मोबाइल नंबर 9XXXXX से कॉल आया और सामने वाले व्यक्ति ने मुझे जान से मारने की धमकी दी..."
    },
    fraud: {
        label: "धोखाधड़ी का प्रकार (Fraud Type)",
        placeholder: "Ex: नौकरी के नाम पर पैसे लेना",
        subject: "धोखाधड़ी और ठगी की शिकायत दर्ज करने हेतु।",
        catName: "धोखाधड़ी (420 IPC/BNS)",
        descPlaceholder: "उसने मुझे विदेश में नौकरी दिलाने का झांसा देकर मुझसे 1 लाख रुपये ले लिए और अब फोन नहीं उठा रहा है..."
    },
    cyber: {
        label: "तरीका (Method)",
        placeholder: "Ex: बैंक खाते से ऑनलाइन पैसे कटना",
        subject: "साइबर अपराध / ऑनलाइन ठगी की शिकायत।",
        catName: "साइबर अपराध",
        descPlaceholder: "मेरे मोबाइल पर एक लिंक आया, जिस पर क्लिक करते ही मेरे बैंक खाते से 50,000 रुपये कट गए..."
    },
    land: {
        label: "विवादित संपत्ति (Property)",
        placeholder: "Ex: गांव की पुश्तैनी जमीन",
        subject: "जमीन विवाद और अवैध कब्जे की शिकायत।",
        catName: "जमीन विवाद",
        descPlaceholder: "दबंगों ने मेरे खेत की मेढ़ तोड़कर मेरी जमीन पर अवैध कब्जा करने की कोशिश की..."
    }
};

export default function Generate() {
    const [category, setCategory] = useState("lost");
    const [formData, setFormData] = useState({
        station: "",
        stationAddr: "",
        name: "",
        address: "",
        date: "",
        place: "",
        item: "",
        details: "",
        mobile: ""
    });
    const [listeningField, setListeningField] = useState<string | null>(null);

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const startDictation = async (field: string) => {
        setListeningField(field);
        try {
            const response = await fetch("http://localhost:5056/listen");
            const data = await response.json();
            if (data.error) {
                toast.error("Error: " + data.error);
            } else if (data.text) {
                setFormData(prev => ({
                    ...prev,
                    [field]: prev[field as keyof typeof prev] ? prev[field as keyof typeof prev] + " " + data.text : data.text
                }));
                toast.success("Text recognized!");
            } else {
                toast.info("No speech recognized.");
            }
        } catch (err) {
            toast.error("Connection failed! Make sure offline_app.py is running on port 5056.");
            console.error(err);
        } finally {
            setListeningField(null);
        }
    };

    const copyToClipboard = () => {
        const text = document.getElementById("letterContent")?.innerText;
        if (text) {
            navigator.clipboard.writeText(text);
            toast.success("Complaint text copied to clipboard!");
        }
    };

    const generateContent = () => {
        const today = new Date().toLocaleDateString('en-GB');
        const currentTemplate = templates[category];

        return `सेवा में,
श्रीमान थाना प्रभारी महोदय,
${formData.station || "[थाने का नाम]"},
${formData.stationAddr || "[थाने का पता]"}

विषय: ${currentTemplate.subject}

महोदय,

सविनय निवेदन है कि मैं ${formData.name || "[आपका नाम]"}, निवासी ${formData.address || "[आपका पता]"} हूँ।

श्रीमान, आपको सूचित करना चाहता हूँ कि दिनांक ${formData.date || "[तारीख]"} को ${formData.place || "[स्थान]"} पर मेरे साथ एक घटना घटी।
घटना का प्रकार: ${currentTemplate.catName} है।

घटना का विस्तृत विवरण इस प्रकार है:
${formData.details || "[विवरण]"}

विशेष जानकारी / वस्तु का विवरण: ${formData.item || "[वस्तु का नाम]"}

अतः आपसे विनम्र निवेदन है कि कृपया मेरी इस शिकायत को दर्ज करें और उचित कार्यवाही करें।

सधन्यवाद,

${formData.name || "[आपका नाम]"}
मोबाइल: ${formData.mobile || "[मोबाइल]"}
दिनांक: ${today}`;
    };

    const downloadTxt = () => {
        const content = generateContent();
        const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
        saveAs(blob, "complaint.txt");
        toast.success("Downloaded as Text file!");
    };

    const downloadDocx = async () => {
        const content = generateContent();
        const lines = content.split("\n");

        const doc = new Document({
            sections: [{
                properties: {},
                children: lines.map(line => new Paragraph({
                    children: [new TextRun({
                        text: line,
                        font: "Tiro Devanagari Hindi",
                        size: 32 // 16pt
                    })],
                    spacing: { after: 100 }
                }))
            }]
        });

        const blob = await Packer.toBlob(doc);
        saveAs(blob, "complaint.docx");
        toast.success("Downloaded as DOCX!");
    };

    const currentTemplate = templates[category];
    const today = new Date().toLocaleDateString('en-GB');

    return (
        <div className="min-h-screen flex flex-col bg-background text-foreground">
            <Header />
            <main className="flex-1 pt-24 pb-12">
                <div className="container mx-auto p-6 max-w-7xl animate-fade-in">
                    <div className="flex flex-col gap-6">
                        <div className="text-center space-y-2">
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center justify-center gap-2">
                                🚔 FIR Complaint Generator
                                <span className="text-sm font-normal px-2 py-1 bg-green-100 text-green-800 rounded-full border border-green-200">
                                    Offline Mode
                                </span>
                            </h1>
                            <p className="text-gray-500 dark:text-gray-400">Generate professional police complaints in Hindi using voice or text</p>
                        </div>

                        <div className="grid lg:grid-cols-2 gap-8">
                            {/* Form Section */}
                            <div className="space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Complaint Details</CardTitle>
                                        <CardDescription>Select category and provide incident details</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>Category</Label>
                                            <Select value={category} onValueChange={setCategory}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {Object.entries(templates).map(([key, temp]) => (
                                                        <SelectItem key={key} value={key}>{temp.catName} ({key})</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="grid gap-4">
                                            {[
                                                { id: "station", label: "📍 Police Station (थाना)", placeholder: "Ex: New Delhi Station" },
                                                { id: "stationAddr", label: "🏢 Station Address (थाने का पता)", placeholder: "Ex: Connaught Place" },
                                                { id: "name", label: "👤 Your Name (आपका नाम)", placeholder: "Ex: Ramesh Kumar" },
                                                { id: "address", label: "🏠 Your Address (आपका पता)", placeholder: "Ex: Sector 12, Noida" },
                                                { id: "place", label: "📍 Place of Incident (घटना स्थल)", placeholder: "Ex: Metro Station" },
                                            ].map((field) => (
                                                <div key={field.id} className="space-y-2">
                                                    <Label>{field.label}</Label>
                                                    <div className="flex gap-2">
                                                        <Input
                                                            value={formData[field.id as keyof typeof formData]}
                                                            onChange={(e) => handleInputChange(field.id, e.target.value)}
                                                            placeholder={field.placeholder}
                                                        />
                                                        <Button
                                                            variant={listeningField === field.id ? "destructive" : "outline"}
                                                            size="icon"
                                                            onClick={() => startDictation(field.id)}
                                                            className={listeningField === field.id ? "animate-pulse" : ""}
                                                        >
                                                            <Mic className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}

                                            <div className="space-y-2">
                                                <Label>📅 Date of Incident (तारीख)</Label>
                                                <Input
                                                    type="date"
                                                    value={formData.date}
                                                    onChange={(e) => handleInputChange("date", e.target.value)}
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label>🎒 {currentTemplate.label}</Label>
                                                <div className="flex gap-2">
                                                    <Input
                                                        value={formData.item}
                                                        onChange={(e) => handleInputChange("item", e.target.value)}
                                                        placeholder={currentTemplate.placeholder}
                                                    />
                                                    <Button
                                                        variant={listeningField === "item" ? "destructive" : "outline"}
                                                        size="icon"
                                                        onClick={() => startDictation("item")}
                                                        className={listeningField === "item" ? "animate-pulse" : ""}
                                                    >
                                                        <Mic className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label>📝 Incident Details (विवरण)</Label>
                                                <div className="flex gap-2">
                                                    <Textarea
                                                        value={formData.details}
                                                        onChange={(e) => handleInputChange("details", e.target.value)}
                                                        placeholder={currentTemplate.descPlaceholder}
                                                        rows={4}
                                                    />
                                                    <Button
                                                        variant={listeningField === "details" ? "destructive" : "outline"}
                                                        size="icon"
                                                        onClick={() => startDictation("details")}
                                                        className={listeningField === "details" ? "animate-pulse" : ""}
                                                    >
                                                        <Mic className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label>📱 Mobile Number</Label>
                                                <div className="flex gap-2">
                                                    <Input
                                                        value={formData.mobile}
                                                        onChange={(e) => handleInputChange("mobile", e.target.value)}
                                                        placeholder="Ex: 9876543210"
                                                    />
                                                    <Button
                                                        variant={listeningField === "mobile" ? "destructive" : "outline"}
                                                        size="icon"
                                                        onClick={() => startDictation("mobile")}
                                                        className={listeningField === "mobile" ? "animate-pulse" : ""}
                                                    >
                                                        <Mic className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Preview Section */}
                            <div className="space-y-6">
                                <Card className="sticky top-24 h-fit">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-xl font-mono">Live Preview</CardTitle>
                                        <div className="flex gap-2">
                                            <Button variant="outline" size="sm" onClick={downloadTxt} title="Save as Text">
                                                <FileText className="h-4 w-4 mr-2" />
                                                TXT
                                            </Button>
                                            <Button variant="outline" size="sm" onClick={downloadDocx} title="Save as Word">
                                                <Download className="h-4 w-4 mr-2" />
                                                DOCX
                                            </Button>
                                            <Button variant="outline" size="sm" onClick={copyToClipboard} title="Copy to Clipboard">
                                                <Copy className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div
                                            id="letterContent"
                                            className="bg-muted p-6 rounded-lg font-mono whitespace-pre-wrap text-sm leading-relaxed border-2 border-dashed border-gray-200 dark:border-gray-700"
                                        >
                                            {generateContent()}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
