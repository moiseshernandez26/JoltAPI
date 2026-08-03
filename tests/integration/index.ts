import * as path from 'path';
import * as fs from 'fs';
import Mocha from 'mocha';

/**
 * Mocha entry point loaded *inside* the Extension Development Host by
 * `--extensionTestsPath`. Everything it runs has a live `vscode` API available, which is
 * what separates these from the pure-logic suites under `tests/unit` (plain node + mocha).
 *
 * Only files ending in `.itest.js` are picked up, so the unit runner's `.test.js` glob never
 * tries to load a file that imports `vscode` outside the host.
 */
export function run(): Promise<void> {
  const mocha = new Mocha({ ui: 'tdd', color: true, timeout: 20000 });
  const testsRoot = __dirname;

  for (const file of fs.readdirSync(testsRoot)) {
    if (file.endsWith('.itest.js')) {
      mocha.addFile(path.resolve(testsRoot, file));
    }
  }

  return new Promise((resolve, reject) => {
    try {
      mocha.run((failures) => {
        if (failures > 0) {
          reject(new Error(`${failures} integration test(s) failed.`));
        } else {
          resolve();
        }
      });
    } catch (err) {
      reject(err);
    }
  });
}
