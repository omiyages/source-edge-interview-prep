
// ABOUTME: Layout header component with theme toggle functionality
// ABOUTME: Provides consistent header across pages with theme switching capability
import { ThemeToggle } from "@/components/ui/theme-toggle";

interface LayoutHeaderProps {
  title?: string;
  children?: React.ReactNode;
}

export function LayoutHeader({ title, children }: LayoutHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex-1">
        {title && <h1 className="text-3xl font-bold text-foreground">{title}</h1>}
        {children}
      </div>
      <ThemeToggle />
    </div>
  );
}
