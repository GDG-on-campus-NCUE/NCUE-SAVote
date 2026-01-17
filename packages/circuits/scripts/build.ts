import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import https from 'https';

const BUILD_DIR = path.join(__dirname, '../build');
const SRC_DIR = path.join(__dirname, '../src');
const WEB_PUBLIC_ZK_DIR = path.join(__dirname, '../../../apps/web/public/zk');
const PTAU_URL = 'https://storage.googleapis.com/zkevm/ptau/powersOfTau28_hez_final_15.ptau'; // Upgraded to 15 just in case (32k constraints)
const PTAU_FILE = path.join(BUILD_DIR, 'powersOfTau28_hez_final_15.ptau');
const CIRCUIT_NAME = 'main';

// Ensure build directory exists
if (!fs.existsSync(BUILD_DIR)) {
    fs.mkdirSync(BUILD_DIR, { recursive: true });
}

// Ensure web public zk directory exists
if (!fs.existsSync(WEB_PUBLIC_ZK_DIR)) {
    fs.mkdirSync(WEB_PUBLIC_ZK_DIR, { recursive: true });
}

const run = (command: string) => {
    console.log(`Running: ${command}`);
    try {
        execSync(command, { stdio: 'inherit', cwd: path.join(__dirname, '..') });
    } catch (e) {
        console.error(`Error running command: ${command}`);
        process.exit(1);
    }
};

const downloadFile = (url: string, dest: string) => {
    return new Promise<void>((resolve, reject) => {
        if (fs.existsSync(dest)) {
            console.log(`${dest} already exists. Skipping download.`);
            resolve();
            return;
        }
        console.log(`Downloading ${url} to ${dest}...`);
        const file = fs.createWriteStream(dest);
        https.get(url, (response) => {
            if (response.statusCode !== 200) {
                fs.unlink(dest, () => {});
                reject(new Error(`Failed to download: ${response.statusCode}`));
                return;
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                console.log('Download completed.');
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(dest, () => {});
            reject(err);
        });
    });
};

const main = async () => {
    // 1. Compile Circuit
    console.log('--- Compiling Circuit ---');
    // Assuming 'circom' is in PATH
    run(`circom src/${CIRCUIT_NAME}.circom --r1cs --wasm --sym --output build`);

    // 2. Download PTAU
    console.log('--- Checking Powers of Tau ---');
    await downloadFile(PTAU_URL, PTAU_FILE);

    // 3. Setup (Groth16)
    console.log('--- Generating zKey (Phase 2) ---');
    const r1csFile = path.join(BUILD_DIR, `${CIRCUIT_NAME}.r1cs`);
    const zkeyFile = path.join(BUILD_DIR, `${CIRCUIT_NAME}_0000.zkey`);
    const finalZkeyFile = path.join(BUILD_DIR, `${CIRCUIT_NAME}_final.zkey`);
    
    // 3.1 Setup
    run(`npx snarkjs groth16 setup ${r1csFile} ${PTAU_FILE} ${zkeyFile}`);

    // 3.2 Contribute
    run(`npx snarkjs zkey contribute ${zkeyFile} ${finalZkeyFile} --name="Dev" -v -e="some random entropy"`);

    // 4. Export Verification Key
    console.log('--- Exporting Verification Key ---');
    const vKeyFile = path.join(BUILD_DIR, 'verification_key.json');
    run(`npx snarkjs zkey export verificationkey ${finalZkeyFile} ${vKeyFile}`);

    // 5. Copy to Web Public Directory
    console.log('--- Copying artifacts to Web ---');
    // Copy .wasm
    // The compiled wasm is inside build/main_js/main.wasm
    const wasmSource = path.join(BUILD_DIR, `${CIRCUIT_NAME}_js`, `${CIRCUIT_NAME}.wasm`);
    const wasmDest = path.join(WEB_PUBLIC_ZK_DIR, 'vote.wasm'); // Rename to vote.wasm for clarity
    fs.copyFileSync(wasmSource, wasmDest);
    console.log(`Copied ${wasmSource} -> ${wasmDest}`);

    // Copy .zkey
    const zkeyDest = path.join(WEB_PUBLIC_ZK_DIR, 'vote_final.zkey');
    fs.copyFileSync(finalZkeyFile, zkeyDest);
    console.log(`Copied ${finalZkeyFile} -> ${zkeyDest}`);
    
    // Copy verification_key.json to crypto-lib/src/ (optional, for type checking or direct import)
    // Actually crypto-lib reads it from build or local.
    // Let's copy it to crypto-lib/src/verification_key.json so it's bundled.
    const cryptoLibDest = path.join(__dirname, '../../crypto-lib/src/verification_key.json');
    fs.copyFileSync(vKeyFile, cryptoLibDest);
    console.log(`Copied ${vKeyFile} -> ${cryptoLibDest}`);

    console.log('--- Build Complete ---');
};

main().catch(console.error);