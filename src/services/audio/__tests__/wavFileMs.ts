// A Jest-only helper: it reads the real files from disk, which the app never does.
/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const AUDIO_DIR = join(__dirname, '../../../../assets/audio');

/** A PCM .wav file's length in ms, read from its header: the data chunk's size over the byte rate. */
export function wavFileMs(fileName: string): number {
  const file = readFileSync(join(AUDIO_DIR, fileName));
  let byteRate: number | null = null;
  // Chunks follow the 12-byte RIFF header, each an id, a size, and its body padded to even length.
  for (let offset = 12; offset + 8 <= file.length;) {
    const id = file.toString('ascii', offset, offset + 4);
    const size = file.readUInt32LE(offset + 4);
    if (id === 'fmt ') {
      byteRate = file.readUInt32LE(offset + 16);
    } else if (id === 'data') {
      if (byteRate === null) {
        throw new Error(`${fileName} has its data chunk before its fmt chunk`);
      }
      return (size / byteRate) * 1000;
    }
    offset += 8 + size + (size % 2);
  }
  throw new Error(`${fileName} has no data chunk`);
}
