# KYC / KRA Integration

## What it is
KYC Registration Agencies (KRAs) verify investor identity (PAN + Aadhaar) before any MF folio can be opened.
The four SEBI-registered KRAs are: CVL KRA, CAMS KRA, KFin KRA, NDML.

## Required Credentials

```
KYC_KRA_PROVIDER=cvl                   # cvl | cams | kfin | ndml
KYC_KRA_API_KEY=XXXX
KYC_KRA_BASE_URL=https://www.cvlkra.com/
```

## Activation

```
USE_MOCK_KYC=false    # in .env
```

## Mock Behavior (default)

When `USE_MOCK_KYC=true`:
- Any PAN in format XXXXX9999X returns `status: verified`
- No actual KRA API call is made

## Flow

1. User submits PAN + date of birth (+ optional Aadhaar last 4 for e-KYC)
2. Backend calls KRA status lookup — user may already be KYC verified via another distributor
3. If not verified, initiate e-KYC flow (OTP + Aadhaar XML)
4. Store KRA provider name + verification timestamp in `kyc_records` table

## Important Notes

- A user KYC-verified through one KRA is valid across all AMCs — check all KRAs before asking to re-verify
- PAN is stored encrypted in the database (AES-256); only masked version shown in API responses
- Aadhaar number is NEVER stored — only the last 4 digits if required by KRA API

## Reference
- SEBI KRA list: https://www.sebi.gov.in
- CVL KRA: https://www.cvlkra.com
- CAMS KRA: https://camskra.com
- KFin KRA: https://kfintech.com
