import { LinkDetectionResult } from "@/lib/types";

export interface ILinkDetector {
  detect(url: string): LinkDetectionResult;
}
