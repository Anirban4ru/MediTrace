# ⛓️ Web3 Smart Contracts

At the absolute core of MediTrace is a bespoke Solidity smart contract deployed on the **Arbitrum Sepolia L2** network. This contract acts as the ultimate, immutable source of truth for the entire supply chain.

> 🚀 **Why Arbitrum L2?** 
> By leveraging an Ethereum Layer-2, MediTrace achieves enterprise-grade scalability and near-zero gas fees while fully inheriting the massive cryptographic security of the Ethereum mainnet.

---

## 🧊 The Ledger State Machine

The smart contract maintains a strict state machine for every pharmaceutical batch.

### Batch Status Flow
A drug batch can only exist in one of four states:
1. `PROVISIONED` - Minted by the manufacturer.
2. `IN_TRANSIT` - Currently being transported by a carrier.
3. `DELIVERED` - Successfully verified and received by the pharmacy.
4. `SPOILED` - Irreversibly invalidated due to cold-chain failure or recall.

### Code Snippet: The Batch Struct
```solidity
enum BatchStatus { PROVISIONED, IN_TRANSIT, DELIVERED, SPOILED }

struct Batch {
    string batchId;
    string productName;
    address manufacturer;
    BatchStatus status;
    uint256 createdAt;
    bool isSpoiled;
}

mapping(string => Batch) public batches;
```

---

## 🛡️ Cryptographic Role Enforcement

To prevent malicious actors from altering the ledger, the contract utilizes **OpenZeppelin's AccessControl**.

Only wallets that have been explicitly granted the `MANUFACTURER_ROLE` can mint new batches. Only the `CARRIER_ROLE` can log telemetry.

### Code Snippet: Provisioning a Batch
Notice the `onlyRole(MANUFACTURER_ROLE)` modifier. If an unauthorized wallet attempts to call this function, the blockchain node will instantly reject the transaction at the protocol level.

```solidity
function provisionBatch(string memory _batchId, string memory _productName) 
    public 
    onlyRole(MANUFACTURER_ROLE) 
{
    require(bytes(batches[_batchId].batchId).length == 0, "Batch already exists");

    batches[_batchId] = Batch({
        batchId: _batchId,
        productName: _productName,
        manufacturer: msg.sender,
        status: BatchStatus.PROVISIONED,
        createdAt: block.timestamp,
        isSpoiled: false
    });

    emit BatchProvisioned(_batchId, msg.sender, _productName);
}
```

---

## ⚠️ The Irreversible "Spoiled" State

In the pharmaceutical industry, if a batch of biologics drops below 2°C or exceeds 8°C, it becomes chemically inert or toxic. 

If the IoT telemetry system detects a breach, it calls the `markSpoiled` function. 

> 🛑 **CRITICAL SECURITY FEATURE:** 
> Once a batch is marked as `SPOILED`, **it can never be transitioned back to a safe state**. This guarantees that no human administrator or executive can override a safety failure to save costs.

```solidity
function markSpoiled(string memory _batchId) public {
    require(hasRole(ADMIN_ROLE, msg.sender) || hasRole(CARRIER_ROLE, msg.sender), "Unauthorized");
    require(bytes(batches[_batchId].batchId).length != 0, "Batch does not exist");
    
    batches[_batchId].status = BatchStatus.SPOILED;
    batches[_batchId].isSpoiled = true;
    
    emit BatchSpoiled(_batchId, msg.sender);
}
```
