import { Globe } from "lucide-react";

interface LanguageSelectorProps {
  language: string;
  setLanguage: (lang: string) => void;
  disabled?: boolean;
}

const LANGUAGES = [
  { code: "hin", label: "Hindi (हिंदी)" },
  { code: "eng", label: "English" },
  { code: "mar", label: "Marathi (मराठी)" },
  { code: "guj", label: "Gujarati (ગુજરાતી)" },
  { code: "ben", label: "Bengali (বাংলা)" },
  { code: "tam", label: "Tamil (தமிழ்)" },
  { code: "tel", label: "Telugu (తెలుగు)" },
  { code: "hindi-original", label: "Hindi (Original)" },
];

export function LanguageSelector({
  language,
  setLanguage,
  disabled = false,
}: LanguageSelectorProps) {
  return (
    <div className="w-full sm:w-auto">
      <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
        <Globe size={18} />
        Select Language
      </label>
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
        disabled={disabled}
        className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        {LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.label}
          </option>
        ))}
      </select>
    </div>
  );
}
