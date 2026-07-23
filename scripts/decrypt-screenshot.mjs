import crypto from "node:crypto";
import fs from "node:fs/promises";

const [inputPath, outputPath, keyHex] = process.argv.slice(2);
if (!inputPath || !outputPath || !/^[0-9a-f]{128}$/i.test(keyHex || "")) {
  throw new Error("Usage: node decrypt-screenshot.mjs <input.enc> <output.png> <128-hex-key>");
}

const sealed = await fs.readFile(inputPath);
const key = Buffer.from(keyHex, "hex");
const tag = sealed.subarray(0, 32);
const payload = sealed.subarray(32);
const expected = crypto.createHmac("sha256", key.subarray(32)).update(payload).digest();
if (!crypto.timingSafeEqual(tag, expected)) throw new Error("Screenshot authentication failed.");

const iv = payload.subarray(0, 16);
const cipher = payload.subarray(16);
const decipher = crypto.createDecipheriv("aes-256-cbc", key.subarray(0, 32), iv);
await fs.writeFile(outputPath, Buffer.concat([decipher.update(cipher), decipher.final()]));
console.log(outputPath);
