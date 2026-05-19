// Crockford-ish alphabet: no 0/O/1/I/L/U/V to avoid misreads.
const ALPHABET = 'ABCDEFGHJKMNPQRSTWXYZ23456789';

export function generateRoomCode(length = 6): string {
  let out = '';
  for (let i = 0; i < length; i++) {
    out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return out;
}
