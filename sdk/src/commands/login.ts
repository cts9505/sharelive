import fetch from 'node-fetch';
import { saveConfig } from '../config';
import readline from 'readline';

const SERVER_URL = process.env.SHARELIVE_URL || 'https://tunnel.sharelive.site';

function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

function promptPassword(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    const stdin = process.stdin;
    const isRaw = (stdin as any).isRaw;

    if (stdin.isTTY) {
      (stdin as any).setRawMode(true);
    }

    process.stdout.write(question);
    let password = '';

    const onData = (char: Buffer) => {
      const c = char.toString();

      if (c === '\n' || c === '\r' || c === '\u0004') {
        // Enter pressed
        process.stdout.write('\n');
        if (stdin.isTTY) {
          (stdin as any).setRawMode(isRaw);
        }
        stdin.removeListener('data', onData);
        rl.close();
        resolve(password);
      } else if (c === '\u0003') {
        // Ctrl-C
        process.exit();
      } else if (c === '\u007f') {
        // Backspace
        if (password.length > 0) {
          password = password.slice(0, -1);
          process.stdout.write('\b \b');
        }
      } else {
        password += c;
        process.stdout.write('*');
      }
    };

    stdin.on('data', onData);
  });
}

export async function loginCommand() {
  console.log('🔐 ShareLive Login\n');

  const email = await prompt('Email: ');
  const password = await promptPassword('Password: ');

  console.log('\n⏳ Logging in...\n');

  try {
    const response = await fetch(`${SERVER_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error: any = await response.json();
      console.error(`❌ Login failed: ${error.error || 'Unknown error'}`);
      process.exit(1);
    }

    const data: any = await response.json();

    // Save token
    saveConfig({
      token: data.token,
      email: data.user.email,
      serverUrl: SERVER_URL,
    });

    console.log(`✅ Logged in as ${data.user.email}`);
    console.log('🎉 You can now create authenticated tunnels!\n');
  } catch (error: any) {
    console.error(`❌ Login failed: ${error.message}`);
    process.exit(1);
  }
}
