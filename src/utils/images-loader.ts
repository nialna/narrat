import { Config } from "@/types/config";

export const images: {
  [key: string]: HTMLImageElement;
} = {};
let imagesToLoad = 0;
let imagesLoaded = 0;

export function loadImages(config: Config): Promise<void> {
  console.log(`Loading images`);
  return new Promise((resolve, reject) => {
    for (const key in config.images) {
      const path = config.images[key];
      loadImage(key, path, resolve, reject);
    }
  });
}

export function loadImage(key: string, path: string, resolver: any, rejecter: any) {
  imagesToLoad++;
  console.log(`Loading image ${key} at ${path}`);
  const image = new Image();
  image.onload = () => {
    imagesLoaded += 1;
    images[key] = image;
    console.log(`Loaded image ${key} successfully`);
    if (imagesLoaded >= imagesToLoad) {
      console.log(`All images loaded`);
      resolver();
    }
  };
  image.onerror = (e) => {
    console.log(`Error loading image ${key}`);
    rejecter(e);
  };
  image.src = path;
}