export function aspectRatioFit(screenWidth: number, screenHeight: number, gameWidth: number, gameHeight: number) {
  const widthRatio = screenWidth / gameWidth;
  const heightRatio = screenHeight / gameHeight;
  const bestRatio = Math.min(widthRatio, heightRatio);
  return bestRatio;
}