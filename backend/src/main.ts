import { app } from './app.js';
import { env } from './config/env.js';
import { prisma } from './config/database.js';

await prisma.$connect();
const server = app.listen(env.PORT, env.HOST, () =>
  console.log('PayTrack API: http://localhost:' + env.PORT),
);

let stopping = false;
async function shutdown() {
  if (stopping) return;
  stopping = true;

  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 12_000).unref();
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
