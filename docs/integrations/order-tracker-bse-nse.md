# Order Tracker — BSE / NSE Corporate Filings Integration

> **Status**: `LIVE_FETCH` (no mock order rows)  
> **UI**: `/techno-funda?tab=orders` → `OrderTrackerTab`  
> **API**: `GET /api/v1/techno-funda/orders?refresh=true`  
> **Service**: `TechnoFundaService.getOrderTracker()`  
> **Master reference**: [PLATFORM_COMPREHENSIVE_REFERENCE.md](../../PLATFORM_COMPREHENSIVE_REFERENCE.md) §5.4, §6.5–6.6, §6.11  
> **Last verified**: 2026-09-16 (Suratwwala ₹69 Cr from PDF; Patels ₹226 Cr from headline)

---

## 1. Purpose

Surface **SEBI LODR Regulation 30** order/contract bagging disclosures for listed Indian companies, with:

- Contract value in **₹ Crores** (or `Undisclosed` when truly absent)
- Counterparty / awarding entity when present in annexure
- Materiality vs company TTM revenue
- Direct link to the exchange PDF

**Why PDF extraction is required:** BSE `HEADLINE` often omits commercial size. Amounts appear in annexure row *“Broad commercial consideration or size of the order(s)/contract(s)”* inside the attached PDF.

---

## 2. Third-party sources

### 2.1 BSE announcements API

| | |
|---|---|
| **URL** | `https://api.bseindia.com/BseIndiaAPI/api/AnnSubCategoryGetData/w` |
| **Method** | `GET` |
| **Code** | `fetchLiveBseAnnouncements()` |

#### Query parameters

| Param | Value we send | Notes |
|---|---|---|
| `pageno` | `1`, `2` | Two pages per day |
| `strCat` | `-1` | All categories |
| `strPrevDate` | `YYYYMMDD` | **Must equal** `strToDate` or `Table` is empty |
| `strToDate` | `YYYYMMDD` | Same day as prev |
| `strScrip` | `` | All scrips |
| `strSearch` | `P` | Matches BSE site search mode |
| `strType` | `C` | Corporate |

#### Day-walk strategy

BSE returns data for **one calendar day only**. Platform loops **14 days × 2 pages**, merges, dedupes on `SCRIP_CD|NEWSID|HEADLINE`, prioritizes `SUBCATNAME` matching `Award of Order / Receipt of Order`, caps ~250 rows.

#### Required HTTP headers

```
User-Agent: Mozilla/5.0 … FinanciallyFree/1.0
Referer: https://www.bseindia.com/
Origin: https://www.bseindia.com
Accept: application/json, text/plain, */*
```

#### Response fields we map

| BSE `Table[]` field | Platform field |
|---|---|
| `SLONGNAME` | `company` |
| `HEADLINE` / `NEWSSUB` | title / description |
| `SUBCATNAME` | order-win boost + category |
| `ATTACHMENTNAME` | PDF path segment |
| `DT_TM` | `pubDate` |
| `SCRIP_CD` | cleared if pure digits (not NSE symbol) |
| `NEWSID` | dedupe |
| `NSURL` | fallback link |

### 2.2 BSE attachment PDFs

| | |
|---|---|
| **Live** | `https://www.bseindia.com/xml-data/corpfiling/AttachLive/{ATTACHMENTNAME}` |
| **History** | `https://www.bseindia.com/xml-data/corpfiling/AttachHis/{ATTACHMENTNAME}` |
| **Code** | `fetchAnnouncementPdfText()`, `resolveAnnouncementPdfUrls()`, `enrichOrderAnnouncementsFromPdfs()` |
| **Extract** | `pdftotext` if installed → else `pdfjs-dist@4.10.38` |
| **Parse** | `extractOrderValue()`, `extractCounterpartyFromFiling()`, `parseOrderValueCr()` |

Annexure amount patterns (examples):

- `Rs. 69 Crores Only/- (Rupees Sixty-Nine Crores Only) (Excluding GST)`
- `~ INR 29.34 Crore`
- `Approximate Rs. 226 Crores` (sometimes already in headline)

### 2.3 NSE corporate announcements

| | |
|---|---|
| **URL** | `https://www.nseindia.com/api/corporate-announcements?index=equities` |
| **Params** | `index=equities` |
| **Code** | `fetchLiveNseAnnouncements()` via `fetchNseApi()` (session cookies) |
| **Fields** | `sm_name`, `symbol`, `desc`, `attchmntText`, `attchmntFile`, `sort_date`, `an_dt` |

### 2.4 Economic Times RSS (secondary)

| | |
|---|---|
| **URL** | `https://economictimes.indiatimes.com/markets/stocks/rssfeeds/2146842.cms` |
| **Role** | Extra headlines; same `detectOrderWin` / `extractOrderValue` NLP |

### 2.5 Company financials (materiality)

| | |
|---|---|
| **Code** | `getCompanyFinancialSummary(symbol, companyName)` |
| **Provides** | `revenueCr`, `fiscalYear`, display name |
| **UI** | Company Revenue, Order Size % |

---

## 3. Backend pipeline

```
getOrderTracker(refresh?)
  → getNewsFeed()          # NSE + BSE + ET → data_source_health sourceKey=news
  → filter isOrderWin
  → enrichOrderAnnouncementsFromPdfs()   # only if orderValue missing & .pdf link
  → resolve NSE symbol
  → getCompanyFinancialSummary
  → map orders[] + consolidated[]
  → orderTrackerCache (15 min)
```

### Public API response (shape)

```json
{
  "source": "LIVE_EXCHANGE_FEED",
  "dataSource": "BSE/NSE corporate filings (SEBI LODR Reg 30) + PDF annexure amount extraction",
  "totalOrdersCount": 12,
  "totalOrderValueCr": 295,
  "consolidated": [
    {
      "companyName": "…",
      "symbol": "…",
      "totalOrderValueCr": 69,
      "totalOrderValueFormatted": "₹69 Cr",
      "orderCount": 1,
      "ordersAsRevenuePct": 12.5,
      "companyRevenueCr": 552,
      "companyRevenueFormatted": "₹552 Cr (TTM)",
      "orders": []
    }
  ],
  "orders": [
    {
      "id": "ord-live-1",
      "companyName": "…",
      "symbol": "…",
      "customer": "…",
      "orderType": "Letter of Intent",
      "date": "16 Sep 2026",
      "contractValueCr": 69,
      "contractValueFormatted": "₹69 Cr",
      "orderSizePct": 12.5,
      "companyRevenueCr": 552,
      "companyRevenueFormatted": "₹552 Cr (TTM)",
      "pdfUrl": "https://www.bseindia.com/xml-data/corpfiling/AttachLive/….pdf"
    }
  ],
  "lastUpdated": "2026-09-16T…"
}
```

When value cannot be parsed even from PDF: `contractValueCr: 0`, `contractValueFormatted: "Undisclosed"`.

---

## 4. UI mapping

| UI (`OrderTrackerTab`) | API field |
|---|---|
| Consolidated → Total Order Value | `totalOrderValueFormatted` / sum of `contractValueCr` (client timeframe filter) |
| Consolidated → Order Count | `orderCount` |
| Consolidated → Orders as % Rev | `ordersAsRevenuePct` |
| All Orders → Contract Value | `contractValueFormatted` |
| All Orders → Customer | `customer` |
| All Orders → PDF | `pdfUrl` |
| Loading / refresh | `page.tsx` feed key `orders` → `setOrderTrackerData` |

Client helpers: `extractOrderValueClient` / `detectOrderWinClient` in `apps/web/app/techno-funda/page.tsx` (News Desk parity).

---

## 5. Database & ops

| Store | Detail |
|---|---|
| **Table** | `data_source_health` (migration `010-data-source-health.ts`) |
| **Row used** | `sourceKey = 'news'` — cached merged headlines JSON in `rawResponseSnippet` |
| **No dedicated orders table** | Values recomputed live (incl. PDF) on each tracker refresh |
| **Admin** | `/admin/data-integrity` → refresh **News** to refresh announcement cache |
| **Dependency** | `pdfjs-dist` in `apps/api/package.json`; optional OS package `poppler-utils` (`pdftotext`) on Render/host |

### Health entity columns

`id`, `sourceKey`, `sourceName`, `mode`, `status`, `upstreamRef`, `lastFetchedAt`, `durationMs`, `rawResponseSnippet`, `errorMessage`, timestamps.

---

## 6. Verification checklist

1. `GET /api/v1/techno-funda/orders?refresh=true` returns `source: LIVE_EXCHANGE_FEED` and `orders.length > 0` on active market days.
2. Open a row whose headline lacks ₹ Cr but PDF has annexure amount → UI shows non-zero / not Undisclosed.
3. Patels-style headline with `Approximate Rs. 226 Crores` → `contractValueCr === 226` without needing PDF.
4. Suratwwala-style PDF-only amount → enrichment yields `₹69 Cr`.
5. UI consolidated total does not show `₹0 Cr` when values are unknown — shows **Undisclosed**.
6. Admin News refresh updates `data_source_health` for `news`.

---

## 7. Known limitations

- BSE subcategory filter alone is unreliable; we pull broad corporate (`strCat=-1`) and classify client-side.
- Some filings disclose only bands (“Ultra Mega Order”) without a number → remain `Undisclosed` (correct).
- Numeric BSE `SCRIP_CD` is not an NSE ticker; symbol resolution can fall back to name matching.
- PDF extract needs either `pdftotext` on PATH or working `pdfjs-dist` in the API runtime.
- Exchange redistribution / scraping policies: delayed/research use; commercial redistribution may need licenses.
