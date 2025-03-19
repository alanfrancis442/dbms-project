import { Navigation } from "@/components/navigation";
import { ThemeProvider } from "@/components/theme-provider";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <main>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <Navigation />
        {children}
      </ThemeProvider>
    </main>
  );
}
