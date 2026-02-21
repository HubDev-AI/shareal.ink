"use client";

import { motion } from "motion/react";
import { FileText, FileSpreadsheet, Presentation, ExternalLink } from "lucide-react";
import type { RendererProps } from "./renderer-props";
import type { LucideIcon } from "lucide-react";

interface DocSubType {
  icon: LucideIcon;
  label: string;
  gradientFrom: string;
  gradientTo: string;
  iconColor: string;
  iconHoverColor: string;
}

function getDocSubType(url: string | null): DocSubType {
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

export function GoogleDocRenderer({ space }: RendererProps) {
  const sub = getDocSubType(space.originalUrl);
  const Icon = sub.icon;

  return (
    <>
      <a
        href={space.originalUrl ?? "#"}
        target="_blank"
        rel="noopener noreferrer"
        className={`group relative flex h-32 w-full items-center justify-center gap-3 rounded-t-2xl bg-gradient-to-br ${sub.gradientFrom} ${sub.gradientTo} transition-colors`}
      >
        <Icon className={`h-10 w-10 ${sub.iconColor} transition-colors ${sub.iconHoverColor}`} />
        <div className="flex flex-col">
          <span className="text-sm font-medium text-white/60 group-hover:text-white/80 transition-colors">
            {sub.label}
          </span>
        </div>
        <div className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm opacity-0 transition-opacity group-hover:opacity-100">
          <ExternalLink className="h-3.5 w-3.5 text-white" />
        </div>
      </a>

      <div className="px-6 pt-5">
        {space.title && (
          <motion.h1
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.3 }}
            className="text-[22px] font-semibold leading-tight tracking-tight text-white"
          >
            {space.originalUrl ? (
              <a href={space.originalUrl} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-cyan-200">
                {space.title}
              </a>
            ) : (
              space.title
            )}
          </motion.h1>
        )}
        {space.description && (
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            className="mt-2 whitespace-pre-line text-[15px] leading-relaxed text-white/45 line-clamp-4"
          >
            {space.description}
          </motion.p>
        )}
      </div>
    </>
  );
}
