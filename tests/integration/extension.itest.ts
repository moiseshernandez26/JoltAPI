import { strict as assert } from 'assert';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as vscode from 'vscode';
import {
  loadCollections,
  saveCollection,
  deleteCollection,
  loadVariables,
  saveVariables,
  loadProxyProfiles,
  saveProxyProfiles,
} from '../../src/services/storageService';
import type { ICollection } from '../../src/models';

const EXTENSION_ID = 'S0nder.joltapi';

function workspaceRoot(): string {
  const folders = vscode.workspace.workspaceFolders;
  assert.ok(folders && folders.length > 0, 'integration tests need a workspace folder open');
  return folders![0].uri.fsPath;
}

/**
 * Polls until `condition` holds. `executeCommand` resolves as soon as the handler returns,
 * but the tab model is updated by the workbench a tick later — asserting immediately is a
 * race that fails on a fast machine and passes on a slow one.
 */
async function waitFor(condition: () => boolean, timeoutMs = 5000): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (condition()) {return true;}
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  return condition();
}

function openTabLabels(): string[] {
  return vscode.window.tabGroups.all.flatMap((g) => g.tabs.map((t) => t.label));
}

async function exists(relativePath: string): Promise<boolean> {
  try {
    await fs.access(path.join(workspaceRoot(), relativePath));
    return true;
  } catch {
    return false;
  }
}

suite('extension activation', () => {
  test('the extension is installed in the test host', () => {
    assert.ok(vscode.extensions.getExtension(EXTENSION_ID), `${EXTENSION_ID} not found`);
  });

  test('activates without throwing', async () => {
    const extension = vscode.extensions.getExtension(EXTENSION_ID)!;
    await extension.activate();
    assert.equal(extension.isActive, true);
  });

  test('registers every contributed command', async () => {
    await vscode.extensions.getExtension(EXTENSION_ID)!.activate();
    const commands = await vscode.commands.getCommands(true);
    for (const id of ['joltapi.open', 'joltapi.newRequest', 'joltapi.openRequest']) {
      assert.ok(commands.includes(id), `${id} is contributed but not registered`);
    }
  });

  test('opening the panel does not throw and creates a webview tab', async () => {
    await vscode.extensions.getExtension(EXTENSION_ID)!.activate();
    await vscode.commands.executeCommand('joltapi.open');
    // The panel is a webview editor, so it shows up in the tab model — once the workbench
    // has caught up, hence the poll.
    const opened = await waitFor(() => openTabLabels().some((t) => t.includes('JoltAPI')));
    assert.ok(opened, `no JoltAPI tab found in [${openTabLabels().join(', ')}]`);
    await vscode.commands.executeCommand('workbench.action.closeAllEditors');
  });

  test('exposes its configuration defaults', () => {
    const config = vscode.workspace.getConfiguration('joltapi');
    assert.equal(config.get<number>('timeout'), 30000);
    assert.equal(config.get<boolean>('sslVerify'), true);
    assert.equal(config.get<boolean>('followRedirects'), true);
    assert.equal(config.get<number>('maxRedirects'), 5);
    assert.equal(config.get<number>('historyLimit'), 50);
  });
});

suite('storageService against a real workspace', () => {
  test('variables round-trip through .joltapi/variables.json', async () => {
    await saveVariables({
      variables: [{ id: 'v1', key: 'token', value: 'abc123', enabled: true }],
    });
    assert.equal(await exists('.joltapi/variables.json'), true);

    const loaded = await loadVariables();
    assert.equal(loaded.variables.length, 1);
    assert.equal(loaded.variables[0].key, 'token');
    assert.equal(loaded.variables[0].value, 'abc123');
  });

  test('loadCollections creates a Default collection when none exist', async () => {
    const collections = await loadCollections();
    assert.ok(collections.some((c) => c.name === 'Default'), 'no Default collection created');
    assert.equal(await exists('.joltapi/collections/Default.json'), true);
  });

  test('a saved collection survives a reload and can be deleted', async () => {
    const now = Date.now();
    const collection: ICollection = {
      id: 'itest-collection',
      name: 'Integration',
      requests: [],
      createdAt: now,
      updatedAt: now,
    };
    await saveCollection(collection);

    const afterSave = await loadCollections();
    assert.ok(afterSave.some((c) => c.id === 'itest-collection'), 'collection not persisted');

    await deleteCollection('itest-collection');
    const afterDelete = await loadCollections();
    assert.equal(afterDelete.some((c) => c.id === 'itest-collection'), false);
    assert.equal(await exists('.joltapi/collections/Integration.json'), false);
  });

  test('proxy profiles round-trip, and a missing file reads as an empty list', async () => {
    const empty = await loadProxyProfiles();
    assert.deepEqual(empty.profiles, [], 'expected no profiles before anything is saved');

    await saveProxyProfiles({
      profiles: [{
        id: 'p1', name: 'Corp', host: 'proxy.example.com', port: 8080,
        auth: { username: 'bob', password: 'pw' },
      }],
    });

    const loaded = await loadProxyProfiles();
    assert.equal(loaded.profiles.length, 1);
    assert.equal(loaded.profiles[0].host, 'proxy.example.com');
    assert.equal(loaded.profiles[0].auth?.username, 'bob');
    assert.equal(await exists('.joltapi/proxies.json'), true);
  });

  test('deleting a collection that does not exist is a no-op, not a throw', async () => {
    await deleteCollection('never-existed');
  });
});
