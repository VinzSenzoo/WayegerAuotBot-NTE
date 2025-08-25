import figlet from 'figlet';
import fs from 'fs/promises';
import { createInterface } from 'readline/promises';
import axios from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';
import { decodeSuiPrivateKey } from '@mysten/sui/cryptography';
import ora from 'ora';
import chalk from 'chalk';
import moment from 'moment-timezone';
import crypto from 'crypto';

function getTimestamp() {
  return moment().tz('Asia/Jakarta').format('D/M/YYYY, HH:mm:ss');
}

function displayBanner() {
  const width = process.stdout.columns || 80;
  const banner = figlet.textSync('\n NT EXHAUST', { font: "ANSI Shadow", horizontalLayout: 'Speed' });
  banner.split('\n').forEach(line => {
    console.log(chalk.cyanBright(line.padStart(line.length + Math.floor((width - line.length) / 2))));
  });
  console.log(chalk.cyanBright(' '.repeat((width - 50) / 2) + '=== Telegram Channel 🚀 : NT Exhaust ( @NTExhaust ) ==='));
  console.log(chalk.yellowBright(' '.repeat((width - 30) / 2) + '✪ BOT WAYEGER AUTO DAILY CHAT  ✪\n'));
}

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function promptUser(question) {
  const answer = await rl.question(chalk.white(question));
  return answer.trim();
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function typeText(text, color, noType = false) {
  if (isSpinnerActive) await sleep(500);
  const maxLength = 80;
  const displayText = text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
  if (noType) {
    console.log(color(` ┊ │ ${displayText}`));
    return;
  }
  const totalTime = 200;
  const sleepTime = displayText.length > 0 ? totalTime / displayText.length : 1;
  console.log(color(' ┊ ┌── Response Chat API ──'));
  process.stdout.write(color(' ┊ │ '));
  for (const char of displayText) {
    process.stdout.write(char);
    await sleep(sleepTime);
  }
  process.stdout.write('\n');
  console.log(color(' ┊ └──'));
}

function createProgressBar(current, total) {
  const barLength = 30;
  const filled = Math.round((current / total) * barLength);
  return `[${'█'.repeat(filled)}${' '.repeat(barLength - filled)} ${current}/${total}]`;
}

function displayHeader(text, color, forceClear = false) {
  if (isSpinnerActive) return;
  if (forceClear) console.clear();
  console.log(color(text));
}

let isSpinnerActive = false;

async function clearConsoleLine() {
  process.stdout.clearLine(0);
  process.stdout.cursorTo(0);
}

const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 OPR/120.0.0.0 (Edition cdf)',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:102.0) Gecko/20100101 Firefox/102.0',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 15_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.4 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (Android 13; Mobile; rv:102.0) Gecko/102.0 Firefox/102.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36 Edg/114.0.1823.58',
];

function getRandomUserAgent() {
  return userAgents[crypto.randomInt(0, userAgents.length)];
}

function generateFingerprint() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 20; i++) {
    result += chars.charAt(crypto.randomInt(0, chars.length));
  }
  return result;
}

function getHeaders(isAuthenticated = false, token = null, isPost = false) {
  const headers = {
    'Accept': 'application/json, text/plain, */*',
    'Accept-Encoding': 'gzip, deflate, br',
    'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8,id;q=0.7,fr;q=0.6',
    'Cache-Control': 'no-cache',
    'Origin': 'https://app.waye.ai',
    'Pragma': 'no-cache',
    'Priority': 'u=1, i',
    'Referer': 'https://app.waye.ai/',
    'Sec-Ch-Ua': '"Opera";v="120", "Not-A.Brand";v="8", "Chromium";v="135"',
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Platform': '"Windows"',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-site',
    'User-Agent': getRandomUserAgent(),
  };

  if (isPost) {
    headers['Content-Type'] = 'application/json';
  }

  if (isAuthenticated) {
    headers['Authorization'] = `Bearer ${token}`;
    headers['X-Source'] = 'web';
    headers['x-fingerprint'] = generateFingerprint(); 
  }

  return headers;
}

async function getNonce(proxy = null, retryCount = 0) {
  const maxRetries = 5;
  await clearConsoleLine();
  const spinner = ora({ text: chalk.cyan(` ┊ → Getting Nonce${retryCount > 0 ? ` [Retry ${retryCount}/${maxRetries}]` : ''}`), prefixText: '', spinner: 'bouncingBar', interval: 120 }).start();
  isSpinnerActive = true;
  try {
    let config = {
      headers: getHeaders(),
    };
    if (proxy) {
      config.httpAgent = new HttpsProxyAgent(proxy);
      config.httpsAgent = new HttpsProxyAgent(proxy);
    }
    const response = await axios.get('https://api.waye.ai/auth/sui/nonce', config);
    const { nonce, expiresAt } = response.data;
    if (!nonce) throw new Error('Nonce missing in response');
    spinner.succeed(chalk.green(` ┊ ✓ Nonce Fetched Successfully`));
    await sleep(500);
    return nonce;
  } catch (err) {
    if (retryCount < maxRetries - 1) {
      spinner.text = chalk.cyan(` ┊ → Getting Nonce [Retry ${retryCount + 1}/${maxRetries}]`);
      await sleep(5000);
      return getNonce(proxy, retryCount + 1);
    }
    spinner.fail(chalk.red(` ┊ ✗ Failed Getting Nonce: ${err.message}`));
    await sleep(500);
    throw err;
  } finally {
    spinner.stop();
    isSpinnerActive = false;
    await clearConsoleLine();
  }
}

async function verifySignature(address, signature, nonce, proxy = null, retryCount = 0) {
  const maxRetries = 5;
  await clearConsoleLine();
  const spinner = ora({ text: chalk.cyan(` ┊ → Verifying Signature${retryCount > 0 ? ` [Retry ${retryCount}/${maxRetries}]` : ''}`), prefixText: '', spinner: 'bouncingBar', interval: 120 }).start();
  isSpinnerActive = true;
  try {
    let config = {
      headers: getHeaders(false, null, true),
    };
    if (proxy) {
      config.httpAgent = new HttpsProxyAgent(proxy);
      config.httpsAgent = new HttpsProxyAgent(proxy);
    }
    const payload = { address, signature, nonce };
    const response = await axios.post('https://api.waye.ai/auth/sui/verify', payload, config);
    const { success, userId, token } = response.data;
    if (!success || !token) throw new Error('Verification failed');
    spinner.succeed(chalk.green(` ┊ ✓ Login Successful`));
    await sleep(500);
    return { userId, token };
  } catch (err) {
    if (retryCount < maxRetries - 1) {
      spinner.text = chalk.cyan(` ┊ → Verifying Signature [Retry ${retryCount + 1}/${maxRetries}]`);
      await sleep(5000);
      return verifySignature(address, signature, nonce, proxy, retryCount + 1);
    }
    spinner.fail(chalk.red(` ┊ ✗ Failed Verifying Signature: ${err.message}`));
    await sleep(500);
    throw err;
  } finally {
    spinner.stop();
    isSpinnerActive = false;
    await clearConsoleLine();
  }
}

async function createRoom(address, shortAddress, token, proxy = null, retryCount = 0) {
  const maxRetries = 5;
  await clearConsoleLine();
  const spinner = ora({ text: chalk.cyan(` ┊ → Creating Chat Room${retryCount > 0 ? ` [Retry ${retryCount}/${maxRetries}]` : ''}`), prefixText: '', spinner: 'bouncingBar', interval: 120 }).start();
  isSpinnerActive = true;
  try {
    let config = {
      headers: getHeaders(true, token, true),
    };
    if (proxy) {
      config.httpAgent = new HttpsProxyAgent(proxy);
      config.httpsAgent = new HttpsProxyAgent(proxy);
    }
    const roomId = `${Date.now()}-1`;
    const payload = {
      userId: address,
      userName: 'Sui User',
      userScreenName: shortAddress,
      roomId,
    };
    const response = await axios.post('https://api.waye.ai/wager/rooms', payload, config);
    const { success, roomId: newRoomId } = response.data;
    if (!success || !newRoomId) throw new Error('Room creation failed');
    spinner.succeed(chalk.green(` ┊ ✓ Room Created: ${newRoomId.slice(0, 8)}...`));
    await sleep(500);
    return newRoomId;
  } catch (err) {
    if (retryCount < maxRetries - 1) {
      spinner.text = chalk.cyan(` ┊ → Creating Chat Room [Retry ${retryCount + 1}/${maxRetries}]`);
      await sleep(5000);
      return createRoom(address, shortAddress, token, proxy, retryCount + 1);
    }
    spinner.fail(chalk.red(` ┊ ✗ Failed Creating Room: ${err.message}`));
    await sleep(500);
    throw err;
  } finally {
    spinner.stop();
    isSpinnerActive = false;
    await clearConsoleLine();
  }
}

async function sendChatMessage(address, roomId, message, token, proxy = null, retryCount = 0) {
  const maxRetries = 5;
  await clearConsoleLine();
  const spinner = ora({ text: chalk.cyan(` ┊ → Sending Chat Message${retryCount > 0 ? ` [Retry ${retryCount}/${maxRetries}]` : ''}`), prefixText: '', spinner: 'bouncingBar', interval: 120 }).start();
  isSpinnerActive = true;
  try {
    let config = {
      headers: getHeaders(true, token, true),
    };
    if (proxy) {
      config.httpAgent = new HttpsProxyAgent(proxy);
      config.httpsAgent = new HttpsProxyAgent(proxy);
    }
    const payload = {
      text: message,
      userId: address,
      roomId,
    };
    const response = await axios.post('https://api.waye.ai/wager/message', payload, config);
    const aiResponse = response.data.messages?.map(msg => msg.text).join('\n') || 'No response';
    spinner.succeed(chalk.green(` ┊ ✓ Message Sent Successfully`));
    await sleep(500);
    return aiResponse;
  } catch (err) {
    if (retryCount < maxRetries - 1) {
      spinner.text = chalk.cyan(` ┊ → Sending Chat Message [Retry ${retryCount + 1}/${maxRetries}]`);
      await sleep(5000);
      return sendChatMessage(address, roomId, message, token, proxy, retryCount + 1);
    }
    spinner.fail(chalk.red(` ┊ ✗ Failed Sending Message: ${err.message}`));
    await sleep(500);
    throw err;
  } finally {
    spinner.stop();
    isSpinnerActive = false;
    await clearConsoleLine();
  }
}

async function getRateLimitStatus(address, token, proxy = null, retryCount = 0) {
  const maxRetries = 5;
  await clearConsoleLine();
  const spinner = ora({ text: chalk.cyan(` ┊ → Getting Rate Limit Status${retryCount > 0 ? ` [Retry ${retryCount}/${maxRetries}]` : ''}`), prefixText: '', spinner: 'bouncingBar', interval: 120 }).start();
  isSpinnerActive = true;
  try {
    let config = {
      headers: getHeaders(true, token),
    };
    if (proxy) {
      config.httpAgent = new HttpsProxyAgent(proxy);
      config.httpsAgent = new HttpsProxyAgent(proxy);
    }
    const response = await axios.get(`https://api.waye.ai/wager/rate-limit-status?userId=${address}`, config);
    const { success, rateLimitInfo } = response.data;
    if (!success) throw new Error('Failed to get rate limit status');
    spinner.succeed(chalk.green(` ┊ ✓ Rate Limit Status Fetched`));
    await sleep(500);
    return rateLimitInfo;
  } catch (err) {
    if (retryCount < maxRetries - 1) {
      spinner.text = chalk.cyan(` ┊ → Getting Rate Limit Status [Retry ${retryCount + 1}/${maxRetries}]`);
      await sleep(5000);
      return getRateLimitStatus(address, token, proxy, retryCount + 1);
    }
    spinner.fail(chalk.red(` ┊ ✗ Failed Getting Rate Limit Status: ${err.message}`));
    await sleep(500);
    throw err;
  } finally {
    spinner.stop();
    isSpinnerActive = false;
    await clearConsoleLine();
  }
}

async function processAccounts(accounts, messages, accountProxies, chatCount, noType) {
  let successCount = 0;
  let failCount = 0;
  let successfulChats = 0;
  let failedChats = 0;

  for (let i = 0; i < accounts.length; i++) {
    const account = accounts[i];
    const proxy = accountProxies[i];
    const shortAddress = `${account.address.slice(0, 8)}...${account.address.slice(-6)}`;
    displayHeader(`═════[ Akun ${i + 1}/${accounts.length} | ${shortAddress} @ ${getTimestamp()} ]═════`, chalk.blue);
    console.log(chalk.cyan(` ┊ ${proxy ? `Used Proxy: ${proxy}` : 'Not Using Proxy'}`));

    try {
      const nonce = await getNonce(proxy);
      let secretKeyBytes;
      if (/^[a-fA-F0-9]{64}$/.test(account.privateKey)) {
        secretKeyBytes = Buffer.from(account.privateKey, 'hex');
      } else if (account.privateKey.startsWith('suiprivkey')) {
        const decoded = decodeSuiPrivateKey(account.privateKey);
        if (decoded.scheme !== 'ED25519') throw new Error('Invalid private key scheme');
        secretKeyBytes = decoded.secretKey;
      } else {
        throw new Error('Invalid private key format');
      }
      const keypair = Ed25519Keypair.fromSecretKey(secretKeyBytes);
      const message = new TextEncoder().encode(nonce);
      const { signature } = await keypair.signPersonalMessage(message);
      const { userId: mongoUserId, token } = await verifySignature(account.address, signature, nonce, proxy);

      let rateLimitInfo = await getRateLimitStatus(account.address, token, proxy);
      let remaining = rateLimitInfo.remainingMessages;

      console.log(chalk.magentaBright(' ┊ ┌── Proses Chat ──'));
      let currentChat = 0;

      for (let j = 0; j < chatCount; j++) {
        if (remaining <= 0) {
          console.log(chalk.yellow(` ┊ │ Daily limit reached.`));
          break;
        }
        currentChat++;
        console.log(chalk.yellow(` ┊ ├─ Chat ${createProgressBar(currentChat, chatCount)} ──`));
        if (!messages.length) throw new Error('No messages available');
        const message = messages[crypto.randomInt(0, messages.length)].replace(/\r/g, '');
        console.log(chalk.white(` ┊ │ Message: ${chalk.yellow(message)}`));
        try {
          const roomId = await createRoom(account.address, shortAddress, token, proxy);
          const aiResponse = await sendChatMessage(account.address, roomId, message, token, proxy);
          await typeText(aiResponse, chalk.green, noType);
          successfulChats++;
          remaining--;
          console.log(chalk.yellow(' ┊ └──'));
        } catch (chatErr) {
          console.log(chalk.red(` ┊ ✗ Chat ${j + 1} failed: ${chatErr.message}`));
          failedChats++;
          console.log(chalk.yellow(' ┊ └──'));
        }
        await sleep(8000);
      }
      console.log(chalk.yellow(' ┊ └──'));

      rateLimitInfo = await getRateLimitStatus(account.address, token, proxy);
      console.log(chalk.yellow(' ┊ ┌── User Information ──'));
      console.log(chalk.white(` ┊ │ Address: ${rateLimitInfo.walletAddress}`));
      console.log(chalk.white(` ┊ │ Tier: ${rateLimitInfo.userTier}`));
      console.log(chalk.white(` ┊ │ Total Messages: ${rateLimitInfo.messageCount}`));
      console.log(chalk.white(` ┊ │ Remaining Daily Messages: ${rateLimitInfo.remainingMessages}`));
      console.log(chalk.white(` ┊ │ Daily Limit: ${rateLimitInfo.dailyLimit}`));
      console.log(chalk.yellow(' ┊ └──'));

      if (successfulChats > 0) {
        successCount++;
      } else {
        failCount++;
      }
    } catch (err) {
      console.log(chalk.red(` ┊ ✗ Error: ${err.message}`));
      failCount++;
    }

    console.log(chalk.gray(' ┊ ══════════════════════════════════════'));
  }

  displayHeader(`═════[ Selesai @ ${getTimestamp()} ]═════`, chalk.blue, false);
  console.log(chalk.gray(` ┊ ✅ ${successCount} akun sukses, ❌ ${failCount} akun gagal`));
  const nextRunTime = moment().add(24, 'hours');
  startCountdown(nextRunTime);
}

let lastCycleEndTime = null;

function startCountdown(nextRunTime) {
  const countdownInterval = setInterval(() => {
    if (isSpinnerActive) return;
    const now = moment();
    const timeLeft = moment.duration(nextRunTime.diff(now));
    if (timeLeft.asSeconds() <= 0) {
      clearInterval(countdownInterval);
      return;
    }
    clearConsoleLine();
    const hours = Math.floor(timeLeft.asHours()).toString().padStart(2, '0');
    const minutes = Math.floor(timeLeft.minutes()).toString().padStart(2, '0');
    const seconds = Math.floor(timeLeft.seconds()).toString().padStart(2, '0');
    process.stdout.write(chalk.cyan(` ┊ ⏳ Waiting Next Loop: ${hours}:${minutes}:${seconds}\r`));
  }, 1000);
}

let isProcessing = false;

function scheduleNextRun(accounts, messages, accountProxies, chatCount, noType) {
  const delay = 24 * 60 * 60 * 1000;
  console.log(chalk.cyan(` ┊ ⏰ Process Will be Loop Every  24 Hours...`));
  setInterval(async () => {
    if (isProcessing || isSpinnerActive) return;
    try {
      isProcessing = true;
      const nextRunTime = moment().add(24, 'hours');
      await processAccounts(accounts, messages, accountProxies, chatCount, noType);
      startCountdown(nextRunTime);
    } catch (err) {
      console.log(chalk.red(` ✗ Error selama siklus: ${err.message}`));
    } finally {
      isProcessing = false;
    }
  }, delay);
}

async function main() {
  console.log('\n');
  displayBanner();
  const noType = process.argv.includes('--no-type');
  let accounts = [];
  try {
    const accountsData = await fs.readFile('pk.txt', 'utf8');
    const lines = accountsData.split('\n').filter(line => line.trim() !== '');
    for (let i = 0; i < lines.length; i++) {
      const privateKey = lines[i].trim();
      let secretKeyBytes;
      try {
        if (/^[a-fA-F0-9]{64}$/.test(privateKey)) {
          secretKeyBytes = Buffer.from(privateKey, 'hex');
        } else if (privateKey.startsWith('suiprivkey')) {
          const decoded = decodeSuiPrivateKey(privateKey);
          if (decoded.scheme !== 'ED25519') throw new Error('Invalid private key scheme');
          secretKeyBytes = decoded.secretKey;
        } else {
          throw new Error('Invalid private key format');
        }
        const keypair = Ed25519Keypair.fromSecretKey(secretKeyBytes);
        const client = new SuiClient({ url: getFullnodeUrl('testnet') });
        const address = keypair.toSuiAddress();
        accounts.push({ address, privateKey });
      } catch (err) {
        console.log(chalk.red(`✗ Private key pada baris ${i + 1} tidak valid: ${err.message}`));
      }
    }
  } catch (err) {
    console.log(chalk.red('✗ File pk.txt tidak ditemukan atau kosong! Pastikan berisi private keys SUI per baris.'));
    rl.close();
    return;
  }

  if (accounts.length === 0) {
    console.log(chalk.red('✗ Tidak ada akun valid di pk.txt!'));
    rl.close();
    return;
  }

  let messages = [];
  try {
    const msgData = await fs.readFile('pesan.txt', 'utf8');
    messages = msgData.split('\n').filter(line => line.trim() !== '').map(line => line.replace(/\r/g, ''));
  } catch (err) {
    console.log(chalk.red('✗ File pesan.txt tidak ditemukan atau kosong!'));
    rl.close();
    return;
  }

  if (messages.length === 0) {
    console.log(chalk.red('✗ File pesan.txt kosong!'));
    rl.close();
    return;
  }

  let chatCount;
  while (true) {
    const input = await promptUser('Masukkan jumlah chat per akun: ');
    chatCount = parseInt(input, 10);
    if (!isNaN(chatCount) && chatCount > 0) break;
    console.log(chalk.red('✗ Masukkan angka yang valid!'));
  }

  let useProxy;
  while (true) {
    const input = await promptUser('Gunakan proxy? (y/n) ');
    if (input.toLowerCase() === 'y' || input.toLowerCase() === 'n') {
      useProxy = input.toLowerCase() === 'y';
      break;
    }
    console.log(chalk.red('✗ Masukkan "y" atau "n"!'));
  }

  let proxies = [];
  if (useProxy) {
    try {
      const proxyData = await fs.readFile('proxy.txt', 'utf8');
      proxies = proxyData.split('\n').filter(line => line.trim() !== '');
      if (proxies.length === 0) {
        console.log(chalk.yellow('✗ File proxy.txt kosong. Lanjut tanpa proxy.'));
      }
    } catch (err) {
      console.log(chalk.yellow('✗ File proxy.txt tidak ditemukan. Lanjut tanpa proxy.'));
    }
  }

  const accountProxies = accounts.map((_, index) => proxies.length > 0 ? proxies[index % proxies.length] : null);

  console.log(chalk.cyan(` ┊ ⏰ Memulai proses untuk ${accounts.length} akun...`));
  await processAccounts(accounts, messages, accountProxies, chatCount, noType);
  scheduleNextRun(accounts, messages, accountProxies, chatCount, noType);
  rl.close();
}

main();
