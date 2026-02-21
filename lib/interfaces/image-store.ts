export interface IImageStore {
  store(imageUrl: string): Promise<string>;
}
