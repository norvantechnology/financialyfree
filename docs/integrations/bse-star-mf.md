# BSE StAR MF Integration

## What it is
BSE StAR MF (Stock Exchange - Transaction in Aggregated Rupees for Mutual Funds) is India's highest-volume
mutual-fund order-routing platform for AMFI-registered distributors. BSE reports **over 6 crore orders/month in FY26**.

## API Type
SOAP/XML web services (documented in BSE StAR MF member portal)

## Required Credentials

Set these in `.env` (never commit):

```
BSE_STAR_MF_BASE_URL=https://bsestarmf.in/
BSE_STAR_MF_USER=<your member user ID>
BSE_STAR_MF_PASSWORD=<your member password>
BSE_STAR_MF_MEMBER_CODE=<your BSE member code>
BSE_STAR_MF_PASSKEY=<your passkey for order signing>
```

## Activation

```
USE_MOCK_MF_EXECUTION=false    # in .env
```

## Mock Behavior (default)

When `USE_MOCK_MF_EXECUTION=true` (default):
- All order placements return a synthetic order acknowledgement with a fake BSE order number
- Settlement is simulated as instant
- No real money moves

## Real Integration Notes

1. Apply for BSE StAR MF membership at bsestarmf.in (requires AMFI ARN)
2. Complete API access registration in member portal
3. Get test (UAT) credentials first — use UAT_BASE_URL for testing
4. SOAP client library: the adapter in `apps/api/src/adapters/mf-execution/` wraps the SOAP calls
5. Transaction types supported: lumpsum, SIP register/pause/cancel, STP, SWP, switch, redemption
6. Always reconcile via RTA (CAMS/KFintech) — order acknowledgement ≠ confirmed settlement

## Steps to Go Live Checklist

Follow this checklist before flipping `USE_MOCK_MF_EXECUTION=false`:

- [ ] **AMFI Registration**: Active AMFI Registration Number (ARN) and valid EUIN registered with AMFI.
- [ ] **BSE StAR MF Membership**: Complete distributor onboarding on bsestarmf.in and obtain Member Code.
- [ ] **UAT Certification**: Complete mandatory order placement and SIP registration test cycles in the BSE StAR MF UAT portal.
- [ ] **IP Whitelisting**: Submit production server outbound IP address(es) to BSE StAR MF operations team for firewall whitelisting.
- [ ] **Production Credentials**: Securely retrieve production Member Code, User ID, Password, and RSA Passkey from BSE portal.
- [ ] **Environment Injection**: Set `BSE_STAR_MF_MEMBER_CODE`, `BSE_STAR_MF_USER`, `BSE_STAR_MF_PASSWORD`, and `BSE_STAR_MF_PASSKEY` in production secrets manager (never commit to git).
- [ ] **Flip Flag**: Set `USE_MOCK_MF_EXECUTION=false` in production environment.
- [ ] **Pilot Order Validation**: Place 1 test ₹100 lumpsum order and verify settlement acknowledgement and RTA folio generation.
- [ ] **Reconciliation Job**: Ensure nightly RTA feed ingestion and order reconciliation workers are scheduled via BullMQ.

## Reference
- BSE StAR MF: https://bsestarmf.in
- BSE StAR MF API documentation: available after member registration
