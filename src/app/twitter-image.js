import OpenGraphImage, { alt as ogAlt, size as ogSize, contentType as ogType } from "./opengraph-image";

export const alt = ogAlt;
export const size = ogSize;
export const contentType = ogType;

export default function TwitterImage() {
  return OpenGraphImage();
}
