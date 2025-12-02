const http = require('http');
const fs = require('fs');
const path = require('path');

const API_ENV_PATH = path.join(__dirname, '../apps/api/.env');

function getNgrokUrl() {
    return new Promise((resolve, reject) => {
        const req = http.get('http://localhost:4040/api/tunnels', (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    const tunnel = response.tunnels.find(t => t.proto === 'https');
                    if (tunnel) {
                        resolve(tunnel.public_url);
                    } else {
                        reject('No HTTPS tunnel found');
                    }
                } catch (e) {
                    reject(e.message);
                }
            });
        });

        req.on('error', (e) => {
            reject(e.message);
        });
    });
}

function updateEnvFile(url) {
    if (!fs.existsSync(API_ENV_PATH)) {
        console.log('[Warn] apps/api/.env not found. Skipping update.');
        return;
    }

    let content = fs.readFileSync(API_ENV_PATH, 'utf8');
    const callbackUrl = `${url}/auth/saml/callback`;
    
    // Regex to replace SAML_CALLBACK_URL
    const regex = /^SAML_CALLBACK_URL=.*$/m;
    
    if (regex.test(content)) {
        content = content.replace(regex, `SAML_CALLBACK_URL="${callbackUrl}"`);
        fs.writeFileSync(API_ENV_PATH, content);
        console.log(`[Config] Updated SAML_CALLBACK_URL to: ${callbackUrl}`);
    } else {
        console.log('[Warn] SAML_CALLBACK_URL not found in .env. Appending...');
        content += `\nSAML_CALLBACK_URL="${callbackUrl}"`;
        fs.writeFileSync(API_ENV_PATH, content);
    }
    
    console.log('\nIMPORTANT: Please update your Synology IdP Redirect URI to:');
    console.log(`\x1b[36m${callbackUrl}\x1b[0m\n`);
}

async function main() {
    let retries = 10;
    while (retries > 0) {
        try {
            const url = await getNgrokUrl();
            console.log(`[Ngrok] Tunnel established at: ${url}`);
            updateEnvFile(url);
            return;
        } catch (e) {
            retries--;
            if (retries === 0) {
                console.error('[Error] Failed to get Ngrok URL:', e);
                console.log('Please ensure the ngrok container is running and accessible on port 4040.');
            } else {
                // Wait 1 second before retrying
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
    }
}

main();
