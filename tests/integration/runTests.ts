import * as path from 'path';
import * as fs from 'fs';
import { runTests } from '@vscode/test-electron';

/**
 * Launcher for the integration suite: downloads (and caches) a real VS Code, then starts it
 * with this extension loaded and hands control to `tests/integration/index.js`.
 *
 * Run with `npm run test:integration`. Requires network access the first time, since it
 * fetches a VS Code build into `.vscode-test/`.
 */
async function main(): Promise<void> {
  try {
    const extensionDevelopmentPath = path.resolve(__dirname, '../../..');
    const extensionTestsPath = path.resolve(__dirname, './index');

    // A real folder is required: storageService resolves everything from workspaceFolders[0],
    // and with no folder open every persistence path throws instead of being exercised.
    const workspacePath = path.resolve(extensionDevelopmentPath, 'tests/fixtures/workspace');
    fs.mkdirSync(workspacePath, { recursive: true });
    fs.rmSync(path.join(workspacePath, '.joltapi'), { recursive: true, force: true });

    await runTests({
      extensionDevelopmentPath,
      extensionTestsPath,
      launchArgs: [workspacePath, '--disable-extensions', '--disable-gpu'],
    });
  } catch (err) {
    console.error('Integration tests failed to run:', err);
    process.exit(1);
  }
}

void main();
