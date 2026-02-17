/**
 * Run before engine tests so the store uses a dedicated test data file (empty).
 */
import path from "path";
import fs from "fs";
import os from "os";

const testDataFile = path.join(os.tmpdir(), "escrow-engine-test.json");
process.env.TRANSACTION_ENGINE_DATA_FILE = testDataFile;
if (fs.existsSync(testDataFile)) {
  try {
    fs.unlinkSync(testDataFile);
  } catch (e: unknown) {
    const code = (e as { code?: string }).code;
    if (code !== "ENOENT") throw e;
  }
}
