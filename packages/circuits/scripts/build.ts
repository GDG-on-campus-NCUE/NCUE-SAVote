import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import https from 'https';

const BUILD_DIR = path.join(__dirname, '../build');
const SRC_DIR = path.join(__dirname, '../src');
const BIN_DIR = path.join(__dirname, '../bin');
const PTAU_URL = 'https://storage.googleapis.com/zkevm/ptau/powersOfTau28_hez_final_14.ptau';
const PTAU_FILE = path.join(BUILD_DIR, 'powersOfTau28_hez_final_14.ptau');
const CIRCUIT_NAME = 'main';

// Ensure build directory exists
if (!fs.existsSync(BUILD_DIR)) {
    fs.mkdirSync(BUILD_DIR);
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
    // Use local circom binary if available
    let circomCmd = 'circom';
    const localCircom = path.join(BIN_DIR, 'circom.exe');
    if (fs.existsSync(localCircom)) {
        circomCmd = localCircom;
    }
    
    run(`${circomCmd} src/${CIRCUIT_NAME}.circom --r1cs --wasm --sym --output build`);

    // 2. Download PTAU
    console.log('--- Checking Powers of Tau ---');
    await downloadFile(PTAU_URL, PTAU_FILE);

    // 3. Setup (Groth16)
    console.log('--- Generating zKey (Phase 2) ---');
    const r1csFile = path.join(BUILD_DIR, `${CIRCUIT_NAME}.r1cs`);
    const zkeyFile = path.join(BUILD_DIR, `${CIRCUIT_NAME}_0000.zkey`);
    const finalZkeyFile = path.join(BUILD_DIR, `${CIRCUIT_NAME}_final.zkey`);
    
    // snarkjs groth16 setup
    // Note: In production, we should perform a phase 2 contribution.
    // For development, we can just use the setup output or do a dummy contribution.
    // Let's do a proper setup sequence.
    
    // 3.1 Setup
    run(`npx snarkjs groth16 setup ${r1csFile} ${PTAU_FILE} ${zkeyFile}`);

    // 3.2 Contribute (Dummy contribution for dev)
    // We need to provide some random text.
    const contributionCmd = `npx snarkjs zkey contribute ${zkeyFile} ${finalZkeyFile} --name="First Contribution" -v -e="random text"`;
    // Note: -e is entropy. In a real ceremony, this is user input.
    // But snarkjs might require interactive input if -e is not enough or different version.
    // Let's try non-interactive.
    // Actually, for dev, we can skip contribute if we trust the setup? 
    // No, groth16 setup produces a zkey that needs at least one contribution?
    // Wait, 'groth16 setup' produces the initial zkey. It is usable but it's better to contribute.
    // Let's just use the initial zkey as final for simplicity if possible, 
    // BUT snarkjs usually recommends verifying the zkey.
    
    // Let's do one contribution.
    // On Windows, passing entropy via command line might be tricky with quotes.
    // Let's try:
    run(`npx snarkjs zkey contribute ${zkeyFile} ${finalZkeyFile} --name="Dev" -v -e="some random entropy"`);

    // 4. Export Verification Key
    console.log('--- Exporting Verification Key ---');
    const vKeyFile = path.join(BUILD_DIR, 'verification_key.json');
    run(`npx snarkjs zkey export verificationkey ${finalZkeyFile} ${vKeyFile}`);

    console.log('--- Build Complete ---');
    console.log(`Files generated in ${BUILD_DIR}:`);
    console.log(`- ${CIRCUIT_NAME}.wasm`);
    console.log(`- ${CIRCUIT_NAME}_final.zkey`);
    console.log(`- verification_key.json`);
};

main().catch(console.error);
