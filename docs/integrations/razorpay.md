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

## Reference
- Razorpay Docs: https://razorpay.com/docs
- Current domestic card rate: ~2% (verify current rate with Razorpay before finalizing unit economics)
