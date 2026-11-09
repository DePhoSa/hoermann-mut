
/* ===== Cloudflare Worker + Durable Object: WebSocket-Relay fuer die Bomber-Arena ===== */
const ALLOWED_ORIGINS = ['https://dephosa.github.io', 'http://localhost:8099', 'http://127.0.0.1:8099'];
const validCode = c => /^[A-HJ-NP-Z2-9]{8}$/.test(c);

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.headers.get('Upgrade') !== 'websocket') return new Response('Bomber-Arena-Relay läuft.', { status: 200 });
    const origin = request.headers.get('Origin');
    if (origin && !ALLOWED_ORIGINS.includes(origin)) return new Response('Origin nicht erlaubt', { status: 403 });
    const code = (url.searchParams.get('room') || '').toUpperCase();
    if (!validCode(code)) return new Response('Ungültiger Raumcode', { status: 400 });
    return env.ARENA_ROOM.get(env.ARENA_ROOM.idFromName(code)).fetch(request);
  }
};

export class ArenaRoom {
  constructor() { this.room = null; this.timer = null; this.last = 0; this.acc = 0; }
  async fetch(request) {
    const url = new URL(request.url);
    const create = url.searchParams.get('create') === '1';
    const name = url.searchParams.get('name') || 'Spieler';
    const code = url.searchParams.get('room').toUpperCase();
    const pair = new WebSocketPair(); const [client, ws] = Object.values(pair);
    ws.accept();
    const send = m => { try { ws.send(JSON.stringify(m)); } catch {} };
    if (create && this.room && this.room.members.size) { send({ type: 'error', message: 'Dieser Raumcode ist bereits vergeben. Erstelle einen neuen Raum.' }); ws.close(1000); return new Response(null, { status: 101, webSocket: client }); }
    if (!create && !(this.room && this.room.members.size)) { send({ type: 'error', message: 'Raum nicht gefunden. Der Raumersteller muss den Raum geöffnet lassen.' }); ws.close(1000); return new Response(null, { status: 101, webSocket: client }); }
    if (create) this.room = new Room(code);
    const id = crypto.randomUUID();
    if (!this.room.join(id, name, send)) { ws.close(1000); return new Response(null, { status: 101, webSocket: client }); }
    this.start();
    ws.addEventListener('message', e => { let m; try { m = JSON.parse(e.data); } catch { return; } this.room?.receive(id, m); });
    const gone = () => { this.room?.remove(id); if (!this.room?.members.size) this.stop(); };
    ws.addEventListener('close', gone); ws.addEventListener('error', gone);
    return new Response(null, { status: 101, webSocket: client });
  }
  start() {
    if (this.timer) return;
    this.last = Date.now(); this.acc = 0;
    this.timer = setInterval(() => {
      const now = Date.now(); this.acc += Math.min(0.25, (now - this.last) / 1000); this.last = now;
      while (this.acc >= 1 / 60) { this.room?.tick(1 / 60); this.acc -= 1 / 60; }
      this.room?.broadcast();
    }, 50);
  }
  stop() { clearInterval(this.timer); this.timer = null; this.room = null; }
}
