import { FileText, FileSpreadsheet, Presentation } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface DocSubType {
  icon: LucideIcon;
  label: string;
  gradientFrom: string;
  gradientTo: string;
  iconColor: string;
  iconHoverColor: string;
}

export function getDocSubType(url: string | null): DocSubType {
  if (url) {
    if (/sheets\.google\.com/i.test(url)) {
      return {
        icon: FileSpreadsheet,
        label: "Google Sheets",
        gradientFrom: "from-green-500/15",
        gradientTo: "to-green-700/10",
        iconColor: "text-green-400/70",
        iconHoverColor: "group-hover:text-green-400",
      };
    }
    if (/slides\.google\.com/i.test(url)) {
      return {
        icon: Presentation,
        label: "Google Slides",
        gradientFrom: "from-yellow-500/15",
        gradientTo: "to-yellow-700/10",
        iconColor: "text-yellow-400/70",
        iconHoverColor: "group-hover:text-yellow-400",
      };
    }
  }
  return {
    icon: FileText,
    label: "Google Doc",
    gradientFrom: "from-blue-500/15",
    gradientTo: "to-blue-700/10",
    iconColor: "text-blue-400/70",
    iconHoverColor: "group-hover:text-blue-400",
  };
}
