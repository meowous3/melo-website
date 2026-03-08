import { useThemeCycler } from "./useThemeCycler";
import { ScrollRevealProvider } from "./ScrollRevealContext";
import { BackgroundCanvas } from "./BackgroundCanvas";
import { Nav } from "./components/Nav";
import { Hero } from "./components/Hero";
import { Features } from "./components/Features";
import { DemoSection } from "./demo/DemoSection";
import { ThemeShowcase } from "./components/ThemeShowcase";
import { DownloadSection } from "./components/DownloadSection";
import { Footer } from "./components/Footer";

export function App() {
  const cycler = useThemeCycler();

  return (
    <ScrollRevealProvider>
      <BackgroundCanvas accent={cycler.theme.palette.accent} />
      <div className="app-root">
        <Nav />
        <main>
          <Hero />
          <Features />
          <DemoSection currentTheme={cycler.theme} onThemeChange={(t) => cycler.jumpTo(t)} />
          <ThemeShowcase cycler={cycler} />
          <DownloadSection />
        </main>
        <Footer />
      </div>
    </ScrollRevealProvider>
  );
}
