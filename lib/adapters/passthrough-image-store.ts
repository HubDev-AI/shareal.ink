import type { IImageStore } from "@/lib/interfaces";

export class PassthroughImageStore implements IImageStore {
  async store(imageUrl: string): Promise<string> {
    return imageUrl;
  }
}
