import type { SpaceData } from "@/lib/types";
import type { SurfaceTheme } from "@/lib/config/themes";

export interface RendererProps {
  space: SpaceData;
  theme: SurfaceTheme;
}
