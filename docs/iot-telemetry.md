# IoT Telemetry & Security Alerts

PharmaTrace relies on a hybrid Web2/Web3 architecture to handle high-frequency IoT data (like GPS and Temperature sensors) efficiently.

Writing temperature data to the blockchain every 10 seconds is too expensive and slow. Instead, PharmaTrace indexes high-frequency telemetry in **Supabase (PostgreSQL)** and only executes on-chain transactions when a critical state change occurs (e.g., a temperature breach).

---

## Telemetry Ingestion

When a carrier transports a batch, their IoT device (or mobile terminal) continuously pings the Supabase database with the current temperature and coordinates.

### Code Snippet: Inserting Telemetry
```typescript
const { error } = await supabase
  .from('telemetry_checkpoints')
  .insert({
    batch_id: batchId,
    temperature: currentTemp,
    lat: currentLat,
    lng: currentLng,
    breached: isBreached, // true if < 2°C or > 8°C
    signer: userAddress
  });
```

If the `isBreached` flag is true, the application simultaneously prompts the Carrier's MetaMask wallet to execute the `markSpoiled()` smart contract function, finalizing the failure on-chain.

---

## Real-time Dashboards

Because Supabase supports **Realtime WebSockets**, the Admin and Carrier dashboards do not need to constantly refresh the page.

When a new telemetry checkpoint is inserted into the database, the React frontend instantly re-renders the map and temperature charts with zero latency.

---

## Dedaub Security Webhooks (Zero-Day Protection)

To protect the smart contract from zero-day exploits and off-chain discrepancies, PharmaTrace integrates with the **Dedaub Security Suite**.

Dedaub continuously monitors the deployed Arbitrum contract. If a catastrophic event occurs (e.g., an unauthorized wallet attempts to drain or hijack the contract, or a batch is spoiled), Dedaub fires a secure Webhook back to the Next.js backend.

### Next.js Route Handler for Webhooks
The `/api/webhooks/dedaub` endpoint receives the payload, verifies the secret token, and pushes a high-priority alert to the Supabase `alerts` table.

```typescript
export async function POST(req: Request) {
  // 1. Verify Authentication
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.DEDAUB_WEBHOOK_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload = await req.json();

  // 2. Parse Dedaub Alert
  const alertData = {
    title: payload.title || 'Dedaub Security Alert',
    description: payload.description || 'Anomalous smart contract activity detected.',
    severity: payload.severity === 'HIGH' ? 'CRITICAL' : 'WARNING',
    type: 'ON_CHAIN_SPOILAGE'
  };

  // 3. Insert into Database to instantly notify Admins
  await supabase.from('alerts').insert(alertData);

  return NextResponse.json({ success: true });
}
```
