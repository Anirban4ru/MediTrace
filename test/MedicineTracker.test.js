const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MedicineTracker", function () {
  async function deployMedicineTrackerFixture() {
    const [admin, manufacturer, carrier, inspector, unauthorized] = await ethers.getSigners();
    const MedicineTracker = await ethers.getContractFactory("MedicineTracker");
    const tracker = await MedicineTracker.deploy();
    await tracker.waitForDeployment();

    // Register roles
    await tracker.registerManufacturer(manufacturer.address);
    await tracker.registerCarrier(carrier.address);
    await tracker.registerInspector(inspector.address);

    return { tracker, admin, manufacturer, carrier, inspector, unauthorized };
  }

  describe("Access Control", function () {
    it("Should allow authorized addresses to perform actions", async function () {
      const { tracker, manufacturer, carrier, inspector } = await deployMedicineTrackerFixture();
      
      await expect(
        tracker.connect(manufacturer).provisionBatch("BATCH1", "Vaccine", "Mfg A", 100, "SN123", "Origin", "Dest")
      ).to.emit(tracker, "BatchProvisioned");

      await expect(
        tracker.connect(carrier).logTelemetry("BATCH1", 0, 0, 500)
      ).to.emit(tracker, "TelemetryLogged");

      const hash = ethers.keccak256(ethers.toUtf8Bytes("test"));
      await expect(
        tracker.connect(inspector).recordVerificationHash("BATCH1", hash)
      ).to.emit(tracker, "VerificationRecorded");
    });

    it("Should revert when unauthorized addresses attempt actions", async function () {
      const { tracker, unauthorized } = await deployMedicineTrackerFixture();
      
      const mfRole = await tracker.MANUFACTURER_ROLE();
      await expect(
        tracker.connect(unauthorized).provisionBatch("BATCH1", "Vaccine", "Mfg A", 100, "SN123", "Origin", "Dest")
      ).to.be.revertedWithCustomError(tracker, "AccessControlUnauthorizedAccount").withArgs(unauthorized.address, mfRole);

      const carRole = await tracker.CARRIER_ROLE();
      await expect(
        tracker.connect(unauthorized).logTelemetry("BATCH1", 0, 0, 500)
      ).to.be.revertedWithCustomError(tracker, "AccessControlUnauthorizedAccount").withArgs(unauthorized.address, carRole);

      const adminRole = await tracker.DEFAULT_ADMIN_ROLE();
      await expect(
        tracker.connect(unauthorized).revokeBatch("BATCH1", "Reason")
      ).to.be.revertedWithCustomError(tracker, "AccessControlUnauthorizedAccount").withArgs(unauthorized.address, adminRole);
    });
  });

  describe("Telemetry and Status Logic", function () {
    it("Should transition Manufactured -> InTransit on first safe telemetry", async function () {
      const { tracker, manufacturer, carrier } = await deployMedicineTrackerFixture();
      await tracker.connect(manufacturer).provisionBatch("BATCH2", "Vaccine", "Mfg A", 100, "SN123", "Origin", "Dest");
      
      let batch = await tracker.getBatch("BATCH2");
      expect(batch.currentStatus).to.equal(0); // Manufactured

      await expect(tracker.connect(carrier).logTelemetry("BATCH2", 0, 0, 500))
        .to.emit(tracker, "BatchStatusChanged")
        .withArgs("BATCH2", 1); // InTransit

      batch = await tracker.getBatch("BATCH2");
      expect(batch.currentStatus).to.equal(1);
    });

    it("Should transition to Spoiled on out-of-band telemetry", async function () {
      const { tracker, manufacturer, carrier } = await deployMedicineTrackerFixture();
      await tracker.connect(manufacturer).provisionBatch("BATCH3", "Vaccine", "Mfg A", 100, "SN123", "Origin", "Dest");
      
      await expect(tracker.connect(carrier).logTelemetry("BATCH3", 0, 0, 900))
        .to.emit(tracker, "BatchSpoiled")
        .withArgs("BATCH3", carrier.address, 900)
        .and.to.emit(tracker, "BatchStatusChanged")
        .withArgs("BATCH3", 4); // Spoiled
    });

    it("Should reject telemetry after batch is Spoiled", async function () {
      const { tracker, manufacturer, carrier, admin } = await deployMedicineTrackerFixture();
      await tracker.connect(manufacturer).provisionBatch("BATCH4", "Vaccine", "Mfg A", 100, "SN123", "Origin", "Dest");
      await tracker.connect(admin).revokeBatch("BATCH4", "Manual Revocation");

      await expect(tracker.connect(carrier).logTelemetry("BATCH4", 0, 0, 500))
        .to.be.revertedWith("Batch is already spoiled");
    });

    it("Should revert if reading non-existent batch", async function () {
      const { tracker } = await deployMedicineTrackerFixture();
      await expect(tracker.getBatch("NON_EXISTENT")).to.be.revertedWith("Batch does not exist");
    });
  });
});
