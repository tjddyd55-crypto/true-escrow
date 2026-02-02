# Creative Asset Registry Test Scenario

**Purpose**: Verify Creative Asset Registry functionality end-to-end

---

## Test Scenario: Register → Add Version → Reference → Export Evidence

### Step 1: Register Asset

**Request**:
```bash
POST /v1/assets
Content-Type: multipart/form-data

escrow_account_id: <UUID>
asset_type: LYRIC
visibility: PUBLIC
declared_creation_type: HUMAN
text: "This is a creative work sample"
payload_meta: {"size": 100, "mime": "text/plain"}
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "asset_id": "<UUID>",
    "version_id": "<UUID>",
    "content_hash": "<64-char SHA-256 hex>",
    "created_at": "2026-02-02T10:00:00Z"
  }
}
```

**Verification**:
- ✅ Asset created in `assets` table
- ✅ First version created in `asset_versions` table
- ✅ Content hash is 64-character hex string (SHA-256)
- ✅ `ASSET_REGISTERED` event in `registry_log`
- ✅ `VERSION_ADDED` event in `registry_log`

---

### Step 2: Add Version

**Request**:
```bash
POST /v1/assets/{asset_id}/versions
Content-Type: multipart/form-data

text: "This is an updated version of the creative work"
payload_meta: {"size": 120, "mime": "text/plain"}
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "id": "<UUID>",
    "asset_id": "<UUID>",
    "content_hash": "<64-char SHA-256 hex>",
    "payload_meta": "{\"size\": 120, \"mime\": \"text/plain\"}",
    "created_at": "2026-02-02T10:05:00Z"
  }
}
```

**Verification**:
- ✅ New version created in `asset_versions` table
- ✅ Original asset NOT modified (append-only)
- ✅ New content hash different from first version
- ✅ `VERSION_ADDED` event in `registry_log`
- ✅ Asset now has 2 versions

---

### Step 3: Record Reference

**Request**:
```bash
POST /v1/references
Content-Type: application/json

{
  "asset_id": "<UUID>",
  "context_type": "AUDITION",
  "context_id": "<audition-uuid>",
  "context_meta": "{\"audition_name\": \"Global Audition 2026\"}"
}
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "asset_id": "<UUID>",
    "context_type": "AUDITION",
    "context_id": "<audition-uuid>"
  }
}
```

**Verification**:
- ✅ Reference created in `asset_references` table
- ✅ `REFERENCED` event in `registry_log`
- ✅ Event payload contains context_type and context_id

---

### Step 4: Export Evidence (JSON)

**Request**:
```bash
GET /v1/assets/{asset_id}/evidence?format=json
```

**Expected Response**:
```json
{
  "asset_id": "<UUID>",
  "escrow_account_id": "<UUID>",
  "asset_type": "LYRIC",
  "visibility": "PUBLIC",
  "declared_creation_type": "HUMAN",
  "registered_at": "2026-02-02T10:00:00Z",
  "generated_at": "2026-02-02T10:10:00Z",
  "versions": [
    {
      "version_id": "<UUID>",
      "content_hash": "<64-char SHA-256>",
      "payload_meta": "{\"size\": 100, \"mime\": \"text/plain\"}",
      "created_at": "2026-02-02T10:00:00Z"
    },
    {
      "version_id": "<UUID>",
      "content_hash": "<64-char SHA-256>",
      "payload_meta": "{\"size\": 120, \"mime\": \"text/plain\"}",
      "created_at": "2026-02-02T10:05:00Z"
    }
  ],
  "registry_log_summary": [
    {
      "event_type": "ASSET_REGISTERED",
      "event_hash": "<64-char SHA-256>",
      "created_at": "2026-02-02T10:00:00Z"
    },
    {
      "event_type": "VERSION_ADDED",
      "event_hash": "<64-char SHA-256>",
      "created_at": "2026-02-02T10:00:00Z"
    },
    {
      "event_type": "VERSION_ADDED",
      "event_hash": "<64-char SHA-256>",
      "created_at": "2026-02-02T10:05:00Z"
    },
    {
      "event_type": "REFERENCED",
      "event_hash": "<64-char SHA-256>",
      "created_at": "2026-02-02T10:07:00Z"
    },
    {
      "event_type": "EVIDENCE_EXPORTED",
      "event_hash": "<64-char SHA-256>",
      "created_at": "2026-02-02T10:10:00Z"
    }
  ]
}
```

**Verification**:
- ✅ Evidence package includes all asset information
- ✅ All versions included with content hashes
- ✅ Registry log summary includes all events
- ✅ `EVIDENCE_EXPORTED` event recorded in `registry_log`

---

### Step 5: Export Evidence (PDF)

**Request**:
```bash
GET /v1/assets/{asset_id}/evidence?format=pdf
```

**Expected Response**:
- Content-Type: `application/pdf`
- Content-Disposition: `attachment; filename="evidence_{asset_id}.pdf"`
- Body: PDF content (text representation for MVP)

**Verification**:
- ✅ PDF format returned
- ✅ Contains same information as JSON format
- ✅ Downloadable file

---

## Append-Only Verification

### Test: Attempt to Update Asset (Should Fail)

**Attempt**:
- Try to update asset visibility directly (if API exists)
- Try to delete asset version

**Expected**:
- ✅ No UPDATE methods available in API
- ✅ No DELETE methods available in API
- ✅ All changes must go through version addition or event recording

---

## Blockchain Anchoring Test (Optional)

### Step: Generate Merkle Root

**Request** (Internal/Admin):
```java
blockchainAnchoringService.performAnchoring(
    fromDate, 
    toDate, 
    systemAccountId
);
```

**Verification**:
- ✅ Merkle root generated from registry log entries
- ✅ `ANCHORED` event recorded in `registry_log`
- ✅ Event payload contains merkle_root, tx_hash, date range, entry_count

---

## Error Cases

### Test: Register Asset with Invalid Data

**Request**:
```bash
POST /v1/assets
# Missing required fields
```

**Expected**:
- ✅ 400 Bad Request
- ✅ Clear error message

---

### Test: Add Version to Non-Existent Asset

**Request**:
```bash
POST /v1/assets/{non-existent-id}/versions
```

**Expected**:
- ✅ 404 Not Found or 400 Bad Request
- ✅ Error message: "Asset not found"

---

### Test: Export Evidence for Non-Existent Asset

**Request**:
```bash
GET /v1/assets/{non-existent-id}/evidence
```

**Expected**:
- ✅ 404 Not Found or 400 Bad Request
- ✅ Error message: "Asset not found"

---

## Summary

**Test Checklist**:
- [ ] Register asset creates asset + first version
- [ ] Add version creates new version (append-only)
- [ ] Record reference creates reference + event
- [ ] Export evidence (JSON) includes all data
- [ ] Export evidence (PDF) returns PDF format
- [ ] No UPDATE/DELETE operations possible
- [ ] All events recorded in registry_log
- [ ] Content hashes are valid SHA-256 (64 hex chars)

**Status**: Ready for testing
