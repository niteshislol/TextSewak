import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Languages,
  FileText,
  History,
  UploadCloud,
  Cpu,
  Copy,
  ArrowRight,
  Sun,
  Moon,
} from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
// --- Import Particles ---
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";
import type { Container, Engine } from "tsparticles-engine";
// --- Import TypeIt ---
// import TypeIt from "typeit-react";

export default function LandingPage() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const handleLaunchApp = () => {
    navigate("/app");
  };

  // --- Particles Functions ---
  const particlesInit = useCallback(async (engine: Engine) => {
    await loadSlim(engine);
  }, []);

  const particlesLoaded = useCallback(
    async (container: Container | undefined) => {
      // console.log("Particles loaded");
    },
    []
  );

  // --- Particles Options ---
  const particleOptions = {
    fullScreen: {
      enable: true,
      zIndex: 0, // In React, we set zIndex here, and 0 is fine if the content div is z-10
    },
    particles: {
      number: {
        value: 100,
        density: {
          enable: true,
          value_area: 800,
        },
      },
      color: {
        // Use a color that works in both light and dark mode, or dynamically change it
        value: "#888888",
      },
      shape: {
        type: "char",
        options: {
          char: {
            value: [
              "क", "ख", "ग", "अ", "B", "C", "1", "2", "3", "A", "इ", "ॐ",
            ],
            font: "Verdana",
            style: "",
            weight: "400",
            fill: true,
          },
        },
      },
      opacity: {
        value: 0.5,
        random: true,
      },
      size: {
        value: 16,
        random: true,
      },
      move: {
        enable: true,
        direction: "bottom" as const,
        speed: 2,
        out_mode: "out" as const,
        straight: true,
      },
      line_linked: {
        enable: false,
      },
    },
    interactivity: {
      events: {
        onhover: {
          enable: false,
        },
        onclick: {
          enable: false,
        },
      },
    },
    retina_detect: true,
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* --- Particles Background --- */}
      <Particles
        id="tsparticles"
        init={particlesInit}
        loaded={particlesLoaded}
        options={particleOptions}
      />

      {/* Main content, positioned above the particles */}
      <div className="relative z-10">
        {/* Navbar */}
        <nav className="container mx-auto flex items-center justify-between border-b border-border bg-background/50 px-4 py-6 backdrop-blur-sm">
          <div className="text-2xl font-bold text-primary">Textसेवक</div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="rounded-lg border border-border p-2 transition-colors duration-200 hover:bg-secondary"
              aria-label="Toggle theme"
            >
              {theme === "light" ? (
                <Moon className="h-5 w-5 text-foreground" />
              ) : (
                <Sun className="h-5 w-5 text-foreground" />
              )}
            </button>
            <button
              onClick={handleLaunchApp}
              className="rounded-lg bg-primary px-6 py-2 font-semibold text-primary-foreground transition-colors duration-300 hover:bg-primary/90"
            >
              Launch App
            </button>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="container mx-auto px-4 py-20 text-center">
          <div>
            <h1 className="pb-2 text-5xl font-bold leading-tight text-transparent bg-gradient-to-r from-primary to-yellow-500 bg-clip-text dark:to-yellow-400 md:text-6xl">
              Unlock the Text Trapped in Your Files
            </h1>
            <p className="mx-auto mb-10 max-w-3xl text-xl text-muted-foreground md:text-2xl min-h-[56px] md:min-h-[64px]">
              {/* --- TypeIt React Component (Removed for preview) --- */}
              Textसेवक's AI accurately extracts the text you need.
              {/* <TypeIt
                options={{
                  speed: 50,
                  deleteSpeed: 30,
                  lifeLike: true,
                  loop: true,
                  cursor: true,
                  breakLines: false,
                }}
                getBeforeInit={(instance) => {
                  instance
                    .type("From messy PDFs and blurry images...")
                    .pause(1500)
                    .delete()
                    .type("To handwritten notes and scanned documents...")
                    .pause(1500)
                    .delete()
                    .type("Textसेवक's AI accurately extracts the text you need.")
                    .pause(1500);
                  return instance;
                }}
              />
              */}
            </p>
            <button
              onClick={handleLaunchApp}
              className="inline-flex transform items-center gap-2 rounded-lg bg-primary px-8 py-4 text-lg font-bold text-primary-foreground shadow-lg transition-all duration-300 hover:scale-105 hover:bg-primary/90"
            >
              Start Extracting Now
              <ArrowRight size={20} />
            </button>
          </div>
        </section>

        {/* Features Section */}
        <section className="container mx-auto px-4 py-16">
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-3">
            <div className="rounded-lg border border-border bg-card p-6 transition-colors hover:border-primary">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-lg bg-primary/20 dark:bg-primary/20">
                <Languages size={32} className="text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-foreground">
                Multi-Language Support
              </h3>
              <p className="text-muted-foreground">
                Extracts text in Hindi, English, and more.
              </p>
            </div>

            <div className="rounded-lg border border-border bg-card p-6 transition-colors hover:border-primary">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-lg bg-primary/20 dark:bg-primary/20">
                <FileText size={32} className="text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-foreground">
                Any File Type
              </h3>
              <p className="text-muted-foreground">
                Supports PDF, DOCX, JPG, and camera photos.
              </p>
            </div>

            <div className="rounded-lg border border-border bg-card p-6 transition-colors hover:border-primary">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-lg bg-primary/20 dark:bg-primary/20">
                <History size={32} className="text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-foreground">
                Secure Document History
              </h3>
              <p className="text-muted-foreground">
                Access all your past extractions securely.
              </p>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="container mx-auto px-4 py-16">
          <h2 className="mb-12 text-center text-3xl font-bold text-foreground md:text-4xl">
            How It Works
          </h2>
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary to-yellow-500">
                <UploadCloud
                  size={40}
                  className="text-white dark:text-gray-900"
                />
              </div>
              <div className="mb-2 text-2xl font-bold text-primary">1. Upload</div>
              <p className="text-muted-foreground">
                Drag and drop any file or snap a photo.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary to-yellow-500">
                <Cpu size={40} className="text-white dark:text-gray-900" />
              </div>
              <div className="mb-2 text-2xl font-bold text-primary">2. Extract</div>
              <p className="text-muted-foreground">
                Our AI analyzes and digitizes the text.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary to-yellow-500">
                <Copy size={40} className="text-white dark:text-gray-900" />
              </div>
              <div className="mb-2 text-2xl font-bold text-primary">3. Done</div>
              <p className="text-muted-foreground">
                Copy, download, or search your new text.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4 py-16 text-center">
          <div className="rounded-2xl border border-border bg-card p-12">
            <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
              Ready to Extract Your Text?
            </h2>
            <p className="mb-8 text-xl text-muted-foreground">
              Join thousands of users who trust Textसेवक for accurate text
              extraction.
            </p>
            <button
              onClick={handleLaunchApp}
              className="inline-flex transform items-center gap-2 rounded-lg bg-primary px-8 py-4 text-lg font-bold text-primary-foreground shadow-lg transition-all duration-300 hover:scale-105 hover:bg-primary/90"
            >
              Get Started Now
              <ArrowRight size={20} />
            </button>
          </div>
        </section>

        {/* Footer */}
        <footer className="container mx-auto border-t border-border bg-background/50 px-4 py-8 text-center text-muted-foreground">
          <p>© 2025 Textसेवक. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}
