export async function requestTrayOpen() {
  return { ok: true };
}

export async function requestTrayReturn() {
  return { ok: true };
}

export async function readTrayStatus() {
  return { status: 'ready' };
}
