import {
  Home,
  Video,
  Calculator,
  FileText,
  Code,
  Briefcase,
  GraduationCap,
  Users,
  Globe,
  Lightbulb,
  Target,
  TrendingUp,
  BookOpen,
  type LucideIcon,
} from "lucide-react";

interface IconAndColor {
  icon: LucideIcon;
  bgColor: string;
  iconColor: string;
}

/** Returns an icon + color pair based on resource category and title keywords. */
export const getIconAndColor = (category: string, title: string): IconAndColor => {
  const lowerCategory = category.toLowerCase();
  const lowerTitle = title.toLowerCase();

  // Check title keywords first for more specific matches
  if (lowerTitle.includes('rental') || lowerTitle.includes('property') || lowerTitle.includes('housing')) {
    return { icon: Home, bgColor: 'bg-blue-500/15', iconColor: 'text-blue-400' };
  }
  if (lowerTitle.includes('cost of living') || lowerTitle.includes('living index')) {
    return { icon: Video, bgColor: 'bg-emerald-500/15', iconColor: 'text-emerald-400' };
  }
  if (lowerTitle.includes('salary') || lowerTitle.includes('calculator') || lowerTitle.includes('tax')) {
    return { icon: Calculator, bgColor: 'bg-amber-500/15', iconColor: 'text-amber-400' };
  }
  if (lowerTitle.includes('visa') || lowerTitle.includes('immigration')) {
    return { icon: FileText, bgColor: 'bg-cyan-500/15', iconColor: 'text-cyan-300' };
  }

  // Fall back to category-based icons
  if (lowerCategory.includes('finance') || lowerCategory.includes('money')) {
    return { icon: TrendingUp, bgColor: 'bg-emerald-500/15', iconColor: 'text-emerald-400' };
  }
  if (lowerCategory.includes('code') || lowerCategory.includes('programming') || lowerCategory.includes('technical')) {
    return { icon: Code, bgColor: 'bg-indigo-500/15', iconColor: 'text-indigo-400' };
  }
  if (lowerCategory.includes('career') || lowerCategory.includes('job')) {
    return { icon: Briefcase, bgColor: 'bg-orange-500/15', iconColor: 'text-orange-400' };
  }
  if (lowerCategory.includes('learning') || lowerCategory.includes('education')) {
    return { icon: GraduationCap, bgColor: 'bg-cyan-500/15', iconColor: 'text-cyan-400' };
  }
  if (lowerCategory.includes('community') || lowerCategory.includes('network')) {
    return { icon: Users, bgColor: 'bg-pink-500/15', iconColor: 'text-pink-400' };
  }
  if (lowerCategory.includes('relocation') || lowerCategory.includes('expat')) {
    return { icon: Globe, bgColor: 'bg-cyan-500/15', iconColor: 'text-cyan-300' };
  }
  if (lowerCategory.includes('guide') || lowerCategory.includes('tutorial')) {
    return { icon: Lightbulb, bgColor: 'bg-yellow-500/15', iconColor: 'text-yellow-400' };
  }
  if (lowerCategory.includes('tool')) {
    return { icon: Target, bgColor: 'bg-red-500/15', iconColor: 'text-red-400' };
  }

  // Default
  return { icon: BookOpen, bgColor: 'bg-neutral-500/15', iconColor: 'text-neutral-400' };
};

/** Splits a category string into uppercase tag labels. */
export const getTags = (category: string): string[] => {
  const tags = category.split(/[,\/&]/).map(t => t.trim().toUpperCase()).filter(Boolean);
  return tags.length > 0 ? tags : [category.toUpperCase()];
};
