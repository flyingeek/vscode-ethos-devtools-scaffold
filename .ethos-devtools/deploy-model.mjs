/**
 * Post-deploy step: copy model00.bin to the simulator's folder
 * (two level above DEST_PATH), but only if model00.bin does not already exist there.
 * This allows users to edit model00.bin from the simulator without worrying
 * about their changes being overwritten by subsequent deploys.
 *
 * Usage in ethos-devtools.deploy.steps:
 *   ".ethos-devtools/deploy-model.mjs"
 *
 * Environment variables provided by the deploy command:
 *   DEST_PATH   — absolute path to the deployed app folder
 *   SOURCE_PATH — absolute path to the source app folder
 *   WORKSPACE_ROOT — absolute path to the workspace root (optional; defaults to process.cwd())
 *   DEPLOY_TARGET — the deploy target (e.g. "simulator", "radio", etc.) (optional; The script will only run if DEPLOY_TARGET="simulator")
*/

import { copyFile, access, mkdir } from 'fs/promises';
import { join, dirname, resolve, basename } from 'path';
import { constants } from 'fs';

const deployTarget = process.env.DEPLOY_TARGET;
if (deployTarget !== 'simulator') {
    console.log(`[MODEL] Skipping — target='${deployTarget}' is not 'simulator'`);
    process.exit(0);
}

const destPath = process.env.DEST_PATH;
if (!destPath) {
    console.error('[MODEL] — DEST_PATH is not set.');
    process.exit(1);
}

const workspaceRoot = process.env.WORKSPACE_ROOT || process.cwd();
// .vscode/model00.bin lives at the workspace root by default
let srcModel = join(workspaceRoot, '.vscode', 'model00.bin');
if (process.argv[2]) {
    srcModel = resolve(process.argv[2]);
}

// Target: two levels above the app folder — <simulatorsFolder>/<board>_<protocol>@<release>/models/model00.bin
const destModel = join(dirname(dirname(destPath)), 'models','model00.bin');

try {
    await access(destModel, constants.F_OK);
    console.log(`[MODEL] Skipping — ${destModel} already exists`);
    process.exit(0);
} catch {
    // File does not exist — proceed with copy
}

try {
    await mkdir(dirname(destModel), { recursive: true });
    await copyFile(srcModel, destModel);
    console.log(`[MODEL] Copied — ${srcModel} -> ${destModel}`);
} catch (e) {
    console.error(`[MODEL] Failed to copy ${srcModel}: ${e.message}`);
    process.exit(1);
}
