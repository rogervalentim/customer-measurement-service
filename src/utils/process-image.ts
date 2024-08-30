import path from "path";
import { v4 as uuidv4 } from "uuid";
import { promises as fs } from "fs";

export async function ensureDirectoryExists(dir: string) {
  try {
    await fs.access(dir);
  } catch (error) {
    await fs.mkdir(dir, { recursive: true });
  }
}

export async function processImage(
  imageBase64: string,
  imageDirectory: string
): Promise<string> {
  await ensureDirectoryExists(imageDirectory);

  const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
  const filename = `${uuidv4()}.jpg`;
  const filePath = path.join(imageDirectory, filename);

  await fs.writeFile(filePath, base64Data, "base64");

  return filename;
}
