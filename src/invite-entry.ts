/** Operator CLI. Uses an explicit existing SQLite database; never sends invitations over the network. */
import { isAbsolute } from 'path';
import { existsSync } from 'fs';

export async function RunInvitationCLI(args: string[]): Promise<void> {
  const [command, ...pairs] = args;
  const options = new Map<string, string>();
  if (pairs.length % 2 !== 0) throw new Error('Expected option/value pairs');
  for (let i = 0; i < pairs.length; i += 2) {
    if (options.has(pairs[i])) throw new Error('Duplicate option');
    options.set(pairs[i], pairs[i + 1]);
  }
  const allowed = command === 'create' ? ['--db', '--ttl'] : ['--db', '--hash'];
  if (!['create', 'revoke', 'status'].includes(command) || [...options.keys()].some(k => !allowed.includes(k))) {
    throw new Error('Usage: create --db /ABS/existing.sqlite --ttl SECONDS | revoke/status --db /ABS/existing.sqlite --hash SHA256');
  }
  const filename = options.get('--db');
  if (!filename || !isAbsolute(filename) || !existsSync(filename)) throw new Error('An existing absolute SQLite path is required');
  const { Config } = await import('./shared/config/ServerConfig');
  Config.Config.database = { type: 'sqlite', path: filename };
  const { DatabaseManager } = await import('./DataBase/DatabaseManager');
  const { InvitationRepository } = await import('./DataBase/repositories/Player/InvitationRepository');
  await DatabaseManager.Instance.Initialize();
  try {
    const repository = new InvitationRepository();
    if (command === 'create') {
      const raw = options.get('--ttl');
      if (!raw || !/^[1-9]\d*$/.test(raw)) throw new Error('A positive TTL in seconds is required');
      const invite = await repository.Create(Number(raw));
      // This is the only plaintext output; the value cannot be retrieved later.
      process.stdout.write(JSON.stringify(invite) + '\n');
    } else {
      const hash = options.get('--hash') ?? '';
      const result = command === 'revoke' ? { revoked: await repository.Revoke(hash) } : await repository.Status(hash);
      process.stdout.write(JSON.stringify(result) + '\n');
    }
  } finally { await DatabaseManager.Instance.Shutdown(); }
}

if (require.main === module) {
  RunInvitationCLI(process.argv.slice(2)).catch(() => {
    process.stderr.write('Invitation command failed. Check arguments, database permissions and migration 020.\n');
    process.exitCode = 1;
  });
}
