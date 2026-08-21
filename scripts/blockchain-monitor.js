const { ethers } = require('ethers');

// 1. Setup the connection to Arbitrum Sepolia
const RPC_URL = 'https://sepolia-rollup.arbitrum.io/rpc';
const provider = new ethers.providers.JsonRpcProvider(RPC_URL);

// 2. Your Smart Contract details
const CONTRACT_ADDRESS = '0x53f97C27131C2D0B801D718bD9C61CaC71E93EB8';
const ABI = [
  "event BatchSpoiled(string batchId, address indexed carrier, int256 temperatureCp)"
];
const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);

// 3. Your Live Vercel Webhook URL
const WEBHOOK_URL = 'https://pharma-trace-ten.vercel.app/api/webhooks/dedaub';

console.log('⏳ Starting Custom Blockchain Monitor...');
console.log(`Listening for BatchSpoiled events on contract: ${CONTRACT_ADDRESS}`);

// 4. Listen for the event
contract.on('BatchSpoiled', async (batchId, carrier, temperatureCp, event) => {
  console.log('\n🚨 BREACH DETECTED ON BLOCKCHAIN!');
  console.log(`Batch: ${batchId}`);
  console.log(`Temp: ${temperatureCp}`);
  console.log(`Tx Hash: ${event?.transactionHash || 'N/A'}`);

  // 5. Fire the webhook to your Vercel site (Acting as Dedaub)
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventName: 'BatchSpoiled',
        batchId: batchId,
        temperatureCp: temperatureCp.toNumber()
      })
    });
    
    if (response.ok) {
      console.log('? Webhook sent successfully to Vercel!');
    } else {
      console.error('? Webhook failed:', response.status);
    }
  } catch (err) {
    console.error('? Error sending webhook:', err.message);
  }
});
