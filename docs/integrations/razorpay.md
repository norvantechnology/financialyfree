# Razorpay Integration

## What it is
Razorpay is the primary payment gateway for course purchases and Techno-Funda Tools subscription renewals.

> NOTE: MF transaction money movement (SIP debits) is a **separate rail** through BSE StAR MF / NACH /
> UPI AutoPay. Do NOT route SIP debits through Razorpay.

## Required Credentials

```
RAZORPAY_KEY_ID=rzp_live_XXXX              # or rzp_test_XXXX for test mode
RAZORPAY_KEY_SECRET=XXXX
RAZORPAY_WEBHOOK_SECRET=XXXX               # set in Razorpay dashboard → Webhooks
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_XXXX  # exposed to browser for checkout
```

## Activation

```
USE_MOCK_PAYMENTS=false    # in .env
```

## Mock Behavior (default)

When `USE_MOCK_PAYMENTS=true`:
- Payment order creation returns a synthetic Razorpay order ID
- Webhook handler accepts a synthetic `payment.captured` event
- Entitlements are granted immediately without actual payment

## Integration Points

- `POST /api/v1/payments/orders` — creates a Razorpay order, returns `orderId` to frontend
- Frontend loads Razorpay checkout SDK with `NEXT_PUBLIC_RAZORPAY_KEY_ID`
- On payment success, Razorpay calls our webhook `POST /api/v1/payments/webhook`
- Webhook verifies HMAC signature, grants entitlements, sends receipt email

## Plans & SKUs

| SKU | Description | Access |
|---|---|---|
| `course_lifetime` | Course Library | Lifetime |
| `tools_1yr` | Techno-Funda Tools | 1 year (must expire) |
| `webinars_1yr` | Live Case Studies | 1 year |
| `bundle_diy` | Zero to Hero bundle (all 3) | Mixed |

## Steps to Go Live Checklist

Follow this checklist before flipping `USE_MOCK_PAYMENTS=false`:

- [ ] **Activated Razorpay Account**: Complete merchant KYC on dashboard.razorpay.com and activate Live mode.
- [ ] **Live API Keys**: Generate Live Key ID and Key Secret (`rzp_live_...`).
- [ ] **Webhook Configuration**: In Razorpay Dashboard &rarr; Settings &rarr; Webhooks:
  - Add webhook URL: `https://api.yourdomain.com/api/v1/subscriptions/webhook`
  - Select active events: `payment.captured`, `payment.failed`, `order.paid`.
  - Copy secret into `RAZORPAY_WEBHOOK_SECRET`.
- [ ] **Environment Injection**:
  - In API service: Set `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `RAZORPAY_WEBHOOK_SECRET`.
  - In Web service: Set `NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_...`.
- [ ] **Flip Flag**: Set `USE_MOCK_PAYMENTS=false` in production environment.
- [ ] **Live Test Transaction**: Execute 1 live transaction (e.g. ₹1 or ₹99 discount coupon) using UPI / NetBanking to verify signature calculation and entitlement grant in `user_subscriptions` table.
- [ ] **GST Invoice Ingestion**: Verify automatic GST invoice generation on payment capture with user GSTIN if provided.

## Reference
- Razorpay Docs: https://razorpay.com/docs
- Current domestic card rate: ~2% (verify current rate with Razorpay before finalizing unit economics)
