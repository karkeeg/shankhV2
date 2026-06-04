/**
 * ============================================================
 * SHANKH — Case Simulation Seed
 * ============================================================
 * Creates 3 fully-authored case simulations:
 *
 *  1. Tata Steel Acquires Corus          (hard)   — Finance
 *     4 studies · MCQ + Quantus + Canvas (3 activities)
 *
 *  2. Zomato's UAE Market Entry          (medium) — Strategy
 *     3 studies · Canvas + MCQ + MCQ     (3 activities)
 *
 *  3. HUL Rural Distribution Challenge  (easy)   — Operations
 *     2 studies · MCQ + Quantus          (2 activities)
 *
 * Safe to re-run: uses upsert / skipDuplicates.
 *
 * Run standalone:
 *   npx ts-node --transpile-only prisma/seed_cases.ts
 * ============================================================
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ─── Static IDs (so re-runs are idempotent) ───────────────────────────────────

const CASE_1 = "case-tata-steel-corus-001";
const CASE_2 = "case-zomato-uae-entry-001";
const CASE_3 = "case-hul-rural-dist-001";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uid(prefix: string, n: number | string) {
  return `${prefix}-${n}`;
}

// ─── CASE 1: Tata Steel Acquires Corus ───────────────────────────────────────

const CASE1_STUDIES = [
  {
    id: "cs1-study-1",
    title: "The Deal: Background & Strategic Rationale",
    orderIndex: 0,
    content: `In January 2007, Tata Steel completed the acquisition of Corus Group plc — a UK-Dutch steelmaker — for approximately $12.1 billion (£6.7 billion), making it one of the largest overseas acquisitions by an Indian company at the time.

BACKGROUND
Corus Group was formed in 1999 through the merger of British Steel and Hoogovens (Netherlands). By 2006, Corus was the second-largest steelmaker in Europe with annual crude steel capacity of ~18 million tonnes and revenues of approximately £9.2 billion (~$18.6 billion). Its primary segments were Strip Products (flat steel for automotive, construction, packaging) and Long Products (sections, rails, wire rod).

Tata Steel, part of the Tata Group, was India's largest steel producer with ~5 million tonnes of capacity and revenues of ~$4.4 billion. While highly profitable on a per-tonne basis due to low-cost Indian operations, it was a fraction of the size of the global players it sought to compete with.

STRATEGIC RATIONALE
Tata Steel's CEO, B. Muthuraman, articulated three strategic drivers:

1. SCALE & GLOBAL REACH: The combined entity would rank as the world's fifth-largest steelmaker (~24 million tonnes), enabling participation in large-scale global tenders and long-term supply contracts with multinationals like Jaguar Land Rover, Airbus, and Ford.

2. PRODUCT MIX UPGRADE: Tata's Indian plants primarily produced commodity-grade flat steel. Corus's Strip Products division had deep R&D capabilities in high-value, high-strength automotive steels, aerospace alloys, and specialty packaging materials — product categories with 2–3× the margin of commodity steel.

3. RAW MATERIAL ARBITRAGE: Tata Steel's Indian operations had access to captive iron ore and coal mines with some of the lowest raw material costs globally (~$100–120/tonne vs. Corus's ~$240–260/tonne). Management believed routing semi-finished slabs from India to Corus's European finishing mills could reduce Corus's cost base by $400–600 million per year.

THE BIDDING PROCESS
The acquisition was not uncontested. Brazilian steelmaker CSN (Companhia Siderúrgica Nacional) launched a competing bid in November 2006, triggering a nine-round auction. Tata Steel's final winning bid of 608 pence per share represented a ~34% premium to Corus's undisturbed share price and an EV/EBITDA multiple of approximately 9.2× on trailing EBITDA — a significant premium to the sector average of 6–8×.`,
  },
  {
    id: "cs1-study-2",
    title: "Corus Financial Position & Valuation",
    orderIndex: 1,
    content: `To evaluate whether Tata Steel overpaid, analysts examined Corus's financial position across multiple dimensions.

INCOME STATEMENT SNAPSHOT (FY2006, £ millions)
Revenue:          9,200
Raw Materials:   (5,060)   — 55% of revenue
Labour & Overheads: (1,472) — 16% of revenue
EBITDA:           1,380   — 15% EBITDA margin
D&A:               (480)
EBIT:               900
Net Interest:      (220)
PBT:                680
Tax (30%):         (204)
Net Profit:         476

BALANCE SHEET HIGHLIGHTS (FY2006, £ millions)
Total Assets:    8,400
Net Debt:        1,320   (Debt: 2,100 | Cash: 780)
Pension Deficit: 1,300   (the "hidden liability" — critical to the deal)
Equity:          3,200

VALUATION AT BID PRICE
Equity Value:    £4.3bn  (708m shares × 608p)
Add: Net Debt:   £1.3bn
Add: Pension:    £1.3bn
Enterprise Value:£6.9bn (~$13.5bn)
EV/EBITDA:       6.9 / 1.38 = ~5.0× adjusted (or 9.2× unadjusted, ignoring pension)

ANALYST DEBATE
Bulls argued Tata was paying for future synergies, not historic earnings. Synergy targets ($400M cost + $200M revenue) implied an EV/EBITDA closer to 6× on "synergised" EBITDA — within historical norms.

Bears pointed to Corus's pension liability (£1.3bn deficit, largely unfunded), the structural overcapacity in European steel, and the acquisition debt load Tata was taking on (~$7.5bn in acquisition financing).

KEY METRICS FOR ANALYSIS
The case raises three key valuation questions:
(a) What is the fair EV at different EBITDA multiples?
(b) How does bridge financing (debt) at ~6% affect Tata Steel's consolidated leverage?
(c) At what synergy level does the acquisition price become fair value?`,
  },
  {
    id: "cs1-study-3",
    title: "Steel Industry Dynamics & Commodity Cycle",
    orderIndex: 2,
    content: `Understanding whether Tata Steel's acquisition thesis was sound requires grounding in the structural dynamics of the global steel industry in 2006–2007.

SUPPLY SIDE: FRAGMENTED AND CYCLICAL
Despite Mittal Steel's consolidation moves (acquiring Arcelor in 2006 to create ArcelorMittal), the global steel industry remained highly fragmented. The top 10 producers controlled less than 30% of global supply. China alone had 200+ steel companies and was both the world's largest producer (~423m tonnes in 2006) and consumer — with steel capacity growing at 12% per annum through state-backed investment.

This fragmentation had two consequences:
• Commodity pricing: No single player had meaningful pricing power. HRC (Hot Rolled Coil) prices tracked iron ore, coking coal, and energy costs with minimal premium.
• Overcapacity risk: Whenever China's domestic demand softened, surplus volumes were dumped on global markets at below-cost prices.

DEMAND SIDE: EUROPE'S STRUCTURAL DECLINE
European steel demand was mature and slow-growing (~1–2% per annum), driven primarily by construction and automotive — both cyclical industries. Unlike India (~8% GDP growth, 15% steel demand growth), European markets offered volume predictability but no growth premium.

Corus's portfolio was heavily exposed to UK construction and European automotive — both of which would become severe headwinds in the 2008–2009 financial crisis.

RAW MATERIAL COST SQUEEZE
Between 2004–2008, iron ore prices increased 75% (driven by Chinese demand), and coking coal prices nearly doubled. Integrated steelmakers with captive raw materials (BHP, Vale, and — partially — Tata Steel's Indian operations) were insulated; European steelmakers relying on spot markets were severely squeezed.

THE 2008–2009 CRISIS: STRESS TEST FOR THE ACQUISITION
Within 18 months of closing, global steel demand collapsed:
• HRC spot prices fell from $1,100/tonne (mid-2008) to $380/tonne (early 2009)
• Corus's UK operations were running at ~60% utilisation
• Tata Steel Group's net debt peaked at $10+ billion
• The company temporarily shut blast furnaces in Llanwern and Teesside

This stress test revealed that the acquisition debt load was sustainable only in a benign commodity environment — a critical lesson in cyclical industry M&A.`,
  },
  {
    id: "cs1-study-4",
    title: "Post-Acquisition Integration & Lessons Learned",
    orderIndex: 3,
    content: `M&A value creation is measured not by deal price but by post-acquisition execution. Tata Steel's integration of Corus provides a rich case study in cross-border, cross-cultural industrial M&A.

SYNERGY REALISATION (2007–2012)
Tata Steel management targeted $400–600M in annual synergies by Year 5. Actual realization was mixed:

COST SYNERGIES (partially achieved):
• Raw material procurement: Combined buying scale generated ~$80M/year in savings
• Slab routing (India → Europe): Technical and logistical barriers delayed this — blast furnace grade compatibility, maritime freight costs, and Corus's furnace configurations limited actual slab transfers. By 2010, only ~0.5M tonnes/year routed vs. 3M tonne target
• Shared services (IT, finance, HR): ~$50M/year achieved on schedule

REVENUE SYNERGIES (largely unrealised by 2012):
• Cross-selling high-grade Corus products in Indian automotive market: Limited by Indian OEMs' preference for domestic supply chains
• Joint R&D on advanced high-strength steels: Strong progress — "Tata Steel Europe" became a leader in Docol® and Ympress® grades

CULTURAL INTEGRATION CHALLENGES:
• British management resisted reporting structures to Indian HQ — a nationality-driven friction that required deliberate management
• Pension governance: The £1.3bn UK pension deficit became a recurring point of contention with unions and the UK government, eventually leading to a pension restructuring in 2017 (Tata Steel UK / ThyssenKrupp joint venture negotiations)

FINANCIAL OUTCOME BY 2015:
• Net synergies realised: ~$250–300M/year (vs. $500M target)
• Tata Steel Europe consistently loss-making post-2009
• Indian operations profitable, cross-subsidising European losses
• Total impairment charges on Corus assets: ~$3–4 billion (2012–2016)

KEY LESSONS:
1. Cyclical industry acquisitions require conservative leverage — at-the-cycle-peak premiums are dangerous
2. "Slab arbitrage" synergies depend on operational compatibility that is difficult to assess pre-close
3. Pension liabilities in mature industrial companies are often larger and stickier than headline numbers suggest
4. Cultural integration in cross-border deals requires dedicated management bandwidth — not just a "100 Day Plan"`,
  },
];

const CASE1_ACTIVITIES = [
  {
    id: "ca1-mcq-001",
    activityType: "mcq" as const,
    orderIndex: 0,
    activityData: {
      instructions: "Answer all questions based on the case studies you have read. Each question has exactly one correct answer.",
      context: "Tata Steel's acquisition of Corus Group (2007) — EV $12.1 billion. Corus FY2006: Revenue £9.2bn, EBITDA £1.38bn, Net Debt £1.32bn, Pension Deficit £1.3bn.",
      questions: [
        {
          id: "ca1-q1",
          questionText: "At the winning bid price of 608 pence per share, what EV/EBITDA multiple was Tata Steel paying on Corus's FY2006 EBITDA, EXCLUDING the pension deficit from enterprise value?",
          explanation: "Enterprise Value = Equity + Net Debt (excluding pension). Equity = 708M shares × 608p = £4.3bn. EV = £4.3bn + £1.32bn = £5.62bn. EV/EBITDA = 5.62/1.38 ≈ 4.1×. But most market practice at the time added pension to EV, giving ~9×. The headline figure cited in the case (9.2×) includes pension. Without pension: ~5.0×.",
          options: [
            { id: "ca1-q1-a", optionText: "Approximately 4.1× (equity + net debt only, no pension)", isCorrect: false },
            { id: "ca1-q1-b", optionText: "Approximately 9.2× (equity + net debt + pension deficit)", isCorrect: true },
            { id: "ca1-q1-c", optionText: "Approximately 6.5× (equity only, no debt or pension)", isCorrect: false },
            { id: "ca1-q1-d", optionText: "Approximately 12.0× (including goodwill and intangibles)", isCorrect: false },
          ],
        },
        {
          id: "ca1-q2",
          questionText: "What was the PRIMARY source of the raw material cost advantage Tata Steel expected to gain from the Corus acquisition?",
          explanation: "Tata Steel's Indian operations had captive (owned) iron ore and coal mines, giving them raw material costs of ~$100–120/tonne versus Corus's ~$240–260/tonne for spot-market procurement. The plan was to route semi-finished steel slabs from low-cost Indian plants to Corus's high-quality European finishing mills.",
          options: [
            { id: "ca1-q2-a", optionText: "Access to Corus's long-term iron ore contracts with Brazilian miners", isCorrect: false },
            { id: "ca1-q2-b", optionText: "Routing low-cost Indian semi-finished slabs to Corus's European finishing mills", isCorrect: true },
            { id: "ca1-q2-c", optionText: "Hedging steel price exposure through combined commodity derivatives", isCorrect: false },
            { id: "ca1-q2-d", optionText: "Consolidating European procurement to get better vendor pricing", isCorrect: false },
          ],
        },
        {
          id: "ca1-q3",
          questionText: "Which factor most directly explains why the Corus pension liability was described as a 'hidden' risk in the acquisition?",
          explanation: "The £1.3bn pension deficit was an off-balance-sheet liability — not included in Corus's reported net debt figure. Analysts who evaluated the deal purely on EV/EBITDA using reported net debt significantly underestimated the true enterprise value and effective leverage. Post-acquisition, this liability constrained Tata Steel Europe's restructuring options and required government negotiation.",
          options: [
            { id: "ca1-q3-a", optionText: "It was denominated in GBP which appreciated against INR after the deal closed", isCorrect: false },
            { id: "ca1-q3-b", optionText: "The deficit was only revealed in the due diligence process, not in public filings", isCorrect: false },
            { id: "ca1-q3-c", optionText: "It was an off-balance-sheet obligation not captured in reported net debt, understating true EV", isCorrect: true },
            { id: "ca1-q3-d", optionText: "UK accounting rules prohibited pension deficits from appearing in deal valuations", isCorrect: false },
          ],
        },
        {
          id: "ca1-q4",
          questionText: "The acquisition debt load proved most dangerous when which market condition materialised in 2008–2009?",
          explanation: "HRC (Hot Rolled Coil) spot prices collapsed from ~$1,100/tonne to ~$380/tonne — a 65% decline. This destroyed Corus's EBITDA generation precisely when debt service obligations were highest. This illustrates the fundamental danger of peak-cycle leverage in commodity industries: debt covenants are tested against through-the-cycle cash flows, not peak-year EBITDA.",
          options: [
            { id: "ca1-q4-a", optionText: "Indian rupee appreciated sharply, eliminating raw material cost advantages", isCorrect: false },
            { id: "ca1-q4-b", optionText: "UK government imposed windfall taxes on steel profits", isCorrect: false },
            { id: "ca1-q4-c", optionText: "Global steel prices collapsed ~65%, destroying EBITDA while acquisition debt remained fixed", isCorrect: true },
            { id: "ca1-q4-d", optionText: "CSN (Brazil) launched competing products that eroded Corus's market share in Europe", isCorrect: false },
          ],
        },
        {
          id: "ca1-q5",
          questionText: "In M&A valuation, why is it typically more appropriate to use EV/EBITDA rather than P/E (price-to-earnings) when comparing companies with different capital structures?",
          explanation: "EBITDA is a pre-interest, pre-tax metric — it measures operating cash generation before the effects of financing decisions. EV/EBITDA therefore allows comparison of companies regardless of whether they are debt-heavy or equity-funded. P/E is post-interest, so a highly-leveraged company like Corus (with significant debt interest) would show artificially low earnings relative to its operating performance, making P/E comparison misleading.",
          options: [
            { id: "ca1-q5-a", optionText: "EBITDA is always higher than earnings, so EV/EBITDA gives a more conservative (lower) multiple", isCorrect: false },
            { id: "ca1-q5-b", optionText: "EV/EBITDA strips out the effect of financing (interest) and tax, enabling operating comparison across capital structures", isCorrect: true },
            { id: "ca1-q5-c", optionText: "P/E ratios are unavailable for private companies, so EV/EBITDA is used by default", isCorrect: false },
            { id: "ca1-q5-d", optionText: "EV/EBITDA includes depreciation charges which provide a more accurate picture of asset quality", isCorrect: false },
          ],
        },
      ],
    },
  },
  {
    id: "ca1-quantus-001",
    activityType: "quantus" as const,
    orderIndex: 1,
    activityData: {
      title: "Corus Valuation: EV/EBITDA Bridge Model",
      instructions: "Using the financial data from the case studies, complete the valuation model below. Calculate Enterprise Value at 6× and 8× EBITDA multiples, then derive Equity Value by subtracting Net Debt. Enter numbers in £ millions (no commas, decimal allowed).",
      context: "Corus FY2006 actuals and FY2007–2008 estimates. EBITDA margins are 15%, 13%, and 13% respectively. Net Debt as reported (excluding pension): £1,320m (2006A), £1,150m (2007E), £980m (2008E).",
      gridRows: ["Revenue", "EBITDA", "EBITDA Margin %", "EV at 6× EBITDA", "EV at 8× EBITDA", "Net Debt", "Equity Value at 6×", "Equity Value at 8×"],
      gridCols: ["Metric", "FY2006A (£m)", "FY2007E (£m)", "FY2008E (£m)"],
      gridValues: {
        "Revenue-FY2006A (£m)": "9200",
        "Revenue-FY2007E (£m)": "9960",
        "Revenue-FY2008E (£m)": "10650",
        "EBITDA-FY2006A (£m)": "1380",
        "EBITDA-FY2007E (£m)": "1295",
        "EBITDA-FY2008E (£m)": "1385",
        "EBITDA Margin %-FY2006A (£m)": "15%",
        "EBITDA Margin %-FY2007E (£m)": "13%",
        "EBITDA Margin %-FY2008E (£m)": "13%",
        "Net Debt-FY2006A (£m)": "1320",
        "Net Debt-FY2007E (£m)": "1150",
        "Net Debt-FY2008E (£m)": "980",
      },
      correctAnswers: {
        "EV at 6× EBITDA-FY2006A (£m)": "8280",
        "EV at 6× EBITDA-FY2007E (£m)": "7770",
        "EV at 6× EBITDA-FY2008E (£m)": "8310",
        "EV at 8× EBITDA-FY2006A (£m)": "11040",
        "EV at 8× EBITDA-FY2007E (£m)": "10360",
        "EV at 8× EBITDA-FY2008E (£m)": "11080",
        "Equity Value at 6×-FY2006A (£m)": "6960",
        "Equity Value at 6×-FY2007E (£m)": "6620",
        "Equity Value at 6×-FY2008E (£m)": "7330",
        "Equity Value at 8×-FY2006A (£m)": "9720",
        "Equity Value at 8×-FY2007E (£m)": "9210",
        "Equity Value at 8×-FY2008E (£m)": "10100",
      },
    },
  },
  {
    id: "ca1-canvas-001",
    activityType: "canvas" as const,
    orderIndex: 2,
    activityData: {
      title: "M&A Synergy Framework",
      instructions: "Map the synergy analysis framework. Connect each synergy source and cost driver to the 'Net Synergy Value' node. Then connect 'Net Synergy Value' to the final 'Payback Period' outcome. Draw arrows showing how each component flows into the overall value calculation.",
      context: "Tata Steel identified four value-creation levers and one cost drag in the Corus deal. Your task is to show how these elements combine to determine the net synergy value, which in turn drives acquisition payback.",
      scoringMode: "partial",
      paletteItems: [
        { id: "syn-rev", label: "Revenue Synergies", shape: "rectangle", color: "#d1fae5" },
        { id: "syn-cost", label: "Cost Synergies", shape: "rectangle", color: "#d1fae5" },
        { id: "syn-wc", label: "Working Capital Savings", shape: "rectangle", color: "#d1fae5" },
        { id: "syn-int", label: "Integration Costs", shape: "rectangle", color: "#ffe4e6" },
        { id: "syn-net", label: "Net Synergy Value", shape: "ellipse", color: "#fef3c7" },
        { id: "syn-pay", label: "Payback Period", shape: "diamond", color: "#e0f2fe" },
      ],
      solutionSnapshot: {
        edges: [
          { sourceId: "syn-rev", targetId: "syn-net" },
          { sourceId: "syn-cost", targetId: "syn-net" },
          { sourceId: "syn-wc", targetId: "syn-net" },
          { sourceId: "syn-int", targetId: "syn-net" },
          { sourceId: "syn-net", targetId: "syn-pay" },
        ],
        nodePositions: [
          { id: "syn-rev", x: 60, y: 60 },
          { id: "syn-cost", x: 240, y: 60 },
          { id: "syn-wc", x: 420, y: 60 },
          { id: "syn-int", x: 600, y: 60 },
          { id: "syn-net", x: 300, y: 220 },
          { id: "syn-pay", x: 370, y: 380 },
        ],
      },
    },
  },
];

// ─── CASE 2: Zomato UAE Market Entry ─────────────────────────────────────────

const CASE2_STUDIES = [
  {
    id: "cs2-study-1",
    title: "Zomato's Business Model & India Playbook",
    orderIndex: 0,
    content: `Zomato Limited is an Indian multinational food-service marketplace founded in 2008. By 2022, it was operating in 850 cities in India, with a Gross Order Value (GOV) run-rate of ~$3.0 billion annualised and ~80 million monthly active users.

BUSINESS MODEL (India)
Zomato's core India model operates on a three-sided marketplace:

1. RESTAURANTS: ~350,000 restaurant partners listed. Zomato charges a commission of 18–25% on delivery orders (negotiated by restaurant tier). Restaurants also pay for "Gold" visibility and sponsored listing packages. Many restaurants rely on Zomato for 30–60% of their delivery revenue.

2. DELIVERY FLEET: ~200,000 active delivery partners (gig economy workers) in India. Average 4–6 deliveries per hour during peak, ~₹15–25 per delivery payment. Zomato does not classify these as employees (platform economy structure), reducing fixed labour costs.

3. CONSUMERS: Core cohort is 25–40 year urban professionals. Average Order Value (AOV) in India: ~₹320 ($4). Delivery fee to consumers: ₹30–70. Consumer subsidies (discounts, free delivery coupons) remain a significant operating cost.

UNIT ECONOMICS (FY2023 — India food delivery)
GOV:                      ₹28,600 Crore (~$3.5bn)
Revenue (take rate ~20%): ₹5,720 Crore
Contribution Margin:       ~4.5% of GOV (₹1,287 Crore)
Adjusted EBITDA:           ~₹250 Crore (positive for first time)

GROWTH DRIVERS IN INDIA
• Tier 2/3 city expansion: Penetrating 300+ cities beyond the top 8 metro markets
• Hyperpure (B2B ingredient supply to restaurants): ₹2,600 Crore GOV, growing 80% YoY
• Blinkit (10-minute grocery delivery): Strategic acquisition for ₹4,447 Crore (2022)

LEARNINGS APPLICABLE TO INTERNATIONAL EXPANSION
Zomato's India success rested on three elements that may or may not transfer:
(a) High smartphone penetration + UPI payment rails (frictionless ordering)
(b) Low delivery cost due to cheap gig labour (₹600–800/day effective daily take-home)
(c) Fragmented restaurant supply — no single chain dominates, ensuring supply-side dependency on the platform`,
  },
  {
    id: "cs2-study-2",
    title: "UAE Food Delivery Market: Landscape & Competition",
    orderIndex: 1,
    content: `The UAE presents both compelling attractiveness and significant challenges for a food delivery platform seeking to enter.

MARKET SIZE & ATTRACTIVENESS
The UAE food delivery market was estimated at $1.8–2.2 billion in GMV (2022), growing at ~18% CAGR. Penetration of online food delivery as a % of restaurant sales is already high — ~22% in Dubai versus ~15% in Mumbai. This paradox (high current penetration = limited runway vs. high base = proven market) shapes the entry calculus.

Dubai and Abu Dhabi collectively account for ~85% of market GMV. Population: 3.6 million in Dubai, 1.5 million in Abu Dhabi. Notably, ~89% of UAE residents are expatriates — a demographic mix spanning South Asian (38%), Arab non-UAE (27%), European (10%), and Filipino (10%) communities, each with distinct cuisine preferences.

COMPETITIVE LANDSCAPE (2022)

TALABAT (Delivery Hero): Dominant market leader. ~60–65% market share in UAE. Pan-GCC presence across 9 markets. Backed by Delivery Hero SE (Berlin, €3bn revenue). Deep restaurant exclusivity arrangements, established logistics, strong brand recognition particularly with Arab community. Talabat charges restaurants 20–27% commission.

DELIVEROO: UK-based (IPO 2021). ~20–25% UAE market share. Premium positioning — focused on upscale restaurants, hotel delivery, and European cuisine. Higher average order values (~AED 95 vs. Talabat's ~AED 78). Strong with European expat and tourist segments.

CAREEM (Uber subsidiary): Multi-service super-app (rides, food, grocery, payments). Food delivery (~8–10% share) integrated within Careem app. Unique: existing customer relationship through ride-hailing with high session frequency.

NOON FOOD: UAE-based Noon.com's food vertical. Limited traction (~3–5% share). Leverages Noon's e-commerce base but lacks dedicated food delivery infrastructure.

IMPLICATIONS FOR A NEW ENTRANT
• Top-2 players control ~85% share — entrenched positions, restaurant exclusivity as a moat
• Delivery labour costs are higher: UAE minimum wage regulations + visa/accommodation for delivery riders (AED 3,000–4,000/month effective cost vs. India's AED 800 equivalent)
• Consumer expectations are high — average delivery time expectation is 25–30 minutes (vs. 40–45 in India tier 1)
• Payments: Credit cards and Apple Pay dominant (not UPI-equivalent); payment gateway fees higher (~2.5% vs. ~0.9% UPI)`,
  },
  {
    id: "cs2-study-3",
    title: "Regulatory, Cultural & Operational Context",
    orderIndex: 2,
    content: `Any technology company entering the UAE must navigate a distinct regulatory and cultural environment that differs meaningfully from India.

REGULATORY ENVIRONMENT
BUSINESS STRUCTURE: Foreign companies can operate in UAE through three structures:
(a) Mainland LLC — requires UAE national partner holding 51% (or full ownership in designated sectors post-2021 Foreign Ownership Law)
(b) Free Zone Entity — 100% foreign ownership, tax-free, but restricted to free zone geography
(c) Branch Office — extends the Indian entity, subject to 9% corporate tax (effective 2023)

DATA LOCALISATION: UAE's Federal Decree Law No. 45 of 2021 (Data Protection) requires customer data of UAE residents to be stored on servers within the UAE or in approved jurisdictions. This has implications for Zomato's AWS-based infrastructure in India.

PAYMENT REGULATION: The UAE Central Bank regulates payment service providers. Zomato's wallet/UPI infrastructure used in India would require a fresh license in UAE under the Payment Services Regulation (2021). This process takes 9–18 months.

LABOUR REGULATION: Delivery riders in UAE must be under sponsored employment visas (not gig contracts). The sponsorship (kafala) system requires the platform to act as the legal employer — this fundamentally changes the cost structure versus India's gig model. Average monthly cost per rider: AED 3,500–4,500 (salary + accommodation + visa).

CULTURAL FOOD PREFERENCES
UAE's expat majority creates a diverse but segmented food market:
• South Asian expats (largest segment) are under-served by premium platforms like Deliveroo — this is a potential entry wedge
• Halal certification is mandatory for all food businesses — Zomato's certification systems in India would need to be adapted
• Ramadan season drives extreme demand spikes (late-night ordering up 300%) — logistics must be planned for surge capacity
• Arabic-language interface and customer service are necessary for the UAE national and Arab expat segments

OPERATIONAL COMPLEXITY: DARK KITCHENS & LOGISTICS
Zomato could replicate India's "Hyperpure" (B2B ingredient supply) model only if it establishes local warehouse and cold-chain infrastructure — an ₹800–1,200 Crore upfront investment for UAE scale. Alternatively, it could partner with existing UAE cold-chain operators (Al Amin, Agthia).

STRATEGIC OPTIONS FOR ENTRY
Option A — ORGANIC BUILD: Invest AED 500M+ over 3 years to build market presence from scratch. Risk: high, timeline: slow, but full control.
Option B — ACQUISITION: Acquire a mid-size UAE player (Noon Food, a regional QSR's delivery arm). Faster market access, existing regulatory licenses, but integration challenges and premium valuation.
Option C — PARTNERSHIP / JV: White-label arrangement with a UAE conglomerate (e.g., Al-Futtaim Group, Majid Al Futtaim). Lower risk, limited upside.`,
  },
];

const CASE2_ACTIVITIES = [
  {
    id: "ca2-canvas-001",
    activityType: "canvas" as const,
    orderIndex: 0,
    activityData: {
      title: "Porter's Five Forces — UAE Food Delivery",
      instructions: "Map the competitive intensity of the UAE food delivery market using Porter's Five Forces. Connect each of the five forces to the central 'Industry Attractiveness' node. The strength of each connection represents the force's influence on overall market attractiveness.",
      context: "Porter's Five Forces framework analyses an industry's competitive intensity and profit potential. Apply it to Zomato's UAE market entry decision. Consider: buyer power (consumers + restaurants), supplier power (riders + kitchen brands), competitive rivalry (Talabat, Deliveroo), new entrant threats, and substitute threats.",
      scoringMode: "partial",
      paletteItems: [
        { id: "pf-buyer", label: "Buyer Power (Consumers)", shape: "rectangle", color: "#dbeafe" },
        { id: "pf-supplier", label: "Supplier Power (Restaurants & Riders)", shape: "rectangle", color: "#dbeafe" },
        { id: "pf-rivalry", label: "Competitive Rivalry (Talabat, Deliveroo)", shape: "rectangle", color: "#ffe4e6" },
        { id: "pf-entry", label: "Threat of New Entrants", shape: "rectangle", color: "#fae8ff" },
        { id: "pf-sub", label: "Threat of Substitutes (Dine-in, Dark Kitchens)", shape: "rectangle", color: "#fae8ff" },
        { id: "pf-attract", label: "Industry Attractiveness", shape: "ellipse", color: "#fef3c7" },
      ],
      solutionSnapshot: {
        edges: [
          { sourceId: "pf-buyer", targetId: "pf-attract" },
          { sourceId: "pf-supplier", targetId: "pf-attract" },
          { sourceId: "pf-rivalry", targetId: "pf-attract" },
          { sourceId: "pf-entry", targetId: "pf-attract" },
          { sourceId: "pf-sub", targetId: "pf-attract" },
        ],
        nodePositions: [
          { id: "pf-buyer", x: 50, y: 50 },
          { id: "pf-supplier", x: 50, y: 180 },
          { id: "pf-rivalry", x: 50, y: 310 },
          { id: "pf-entry", x: 550, y: 50 },
          { id: "pf-sub", x: 550, y: 310 },
          { id: "pf-attract", x: 280, y: 200 },
        ],
      },
    },
  },
  {
    id: "ca2-mcq-001",
    activityType: "mcq" as const,
    orderIndex: 1,
    activityData: {
      instructions: "Answer the following questions about market entry strategy and competitive dynamics in the UAE food delivery market.",
      context: "UAE food delivery GMV: ~$2bn, growing 18% CAGR. Talabat: 60–65% share. Deliveroo: 20–25% share. Zomato is considering entry with three options: organic build, acquisition, or JV/partnership.",
      questions: [
        {
          id: "ca2-q1",
          questionText: "What is Zomato's most defensible competitive advantage from India that would be HARDEST for UAE incumbents to replicate?",
          explanation: "Zomato's Hyperpure B2B ingredient supply platform and its tech infrastructure (demand prediction, logistics algorithms built on 500M+ Indian orders) represent genuine operational depth accumulated over years. Restaurant commission rates and consumer discounts can be matched by well-capitalised incumbents; the technology stack and B2B supply chain integration are harder to replicate quickly.",
          options: [
            { id: "ca2-q1-a", optionText: "Ability to offer lower restaurant commissions (18% vs Talabat's 27%)", isCorrect: false },
            { id: "ca2-q1-b", optionText: "Deep logistics technology and demand prediction algorithms built on massive India dataset", isCorrect: true },
            { id: "ca2-q1-c", optionText: "Brand recognition among UAE's South Asian expat population", isCorrect: false },
            { id: "ca2-q1-d", optionText: "Access to Blinkit's quick-commerce capabilities for 10-minute grocery delivery", isCorrect: false },
          ],
        },
        {
          id: "ca2-q2",
          questionText: "The UAE's kafala (sponsorship) system most directly impacts Zomato's business model by:",
          explanation: "In India, Zomato's delivery riders are gig workers — independent contractors. The kafala system requires UAE delivery riders to be under sponsored employment visas, making Zomato their legal employer with full obligations (salary, accommodation, visa costs). This converts a variable cost (per-delivery payment) into a largely fixed cost (monthly employment), fundamentally altering the unit economics and break-even analysis.",
          options: [
            { id: "ca2-q2-a", optionText: "Limiting the number of restaurants Zomato can onboard to licensed food businesses only", isCorrect: false },
            { id: "ca2-q2-b", optionText: "Converting delivery labour from variable gig costs to fixed employment obligations, increasing cost structure", isCorrect: true },
            { id: "ca2-q2-c", optionText: "Requiring Zomato to partner with a UAE national as a majority shareholder in the mainland entity", isCorrect: false },
            { id: "ca2-q2-d", optionText: "Mandating Arabic-language customer interfaces and Halal-certified restaurant listings only", isCorrect: false },
          ],
        },
        {
          id: "ca2-q3",
          questionText: "Among the three entry options (organic build, acquisition, JV/partnership), which best balances speed-to-market with strategic control for a player like Zomato targeting the UAE?",
          explanation: "Acquisition of a mid-size UAE player (e.g., Noon Food) would transfer existing regulatory licenses (critical given 9–18 month payment license timelines), an existing restaurant network, and brand recognition — dramatically compressing the time to achieve operating scale. Organic build gives full control but 3+ year timeline with high cash burn against entrenched competitors. JV limits upside and creates governance complexity. Acquisition is strategically optimal if priced right.",
          options: [
            { id: "ca2-q3-a", optionText: "Organic build — maintains brand purity and avoids integration risk", isCorrect: false },
            { id: "ca2-q3-b", optionText: "Acquisition — transfers regulatory licenses, restaurant relationships, and brand at manageable integration risk", isCorrect: true },
            { id: "ca2-q3-c", optionText: "JV/partnership — zero capital risk with a UAE conglomerate partner absorbing all regulatory complexity", isCorrect: false },
            { id: "ca2-q3-d", optionText: "Franchise model — license the Zomato brand to a UAE operator with no equity commitment", isCorrect: false },
          ],
        },
        {
          id: "ca2-q4",
          questionText: "Zomato's India AOV (Average Order Value) is ~₹320 (~$4). UAE AOV is estimated at ~AED 78 (~$21). Which statement best explains why higher UAE AOV does NOT necessarily imply higher profitability per order?",
          explanation: "Higher AOV means higher absolute commission revenue per order (say 20% × AED 78 = AED 15.6 vs. 20% × ₹320 = ₹64). But UAE's higher delivery costs (AED 3,500–4,500/rider/month ÷ ~100–120 orders/day = AED 30–40/order vs. India's ₹20–25/order equivalent) and higher payment gateway fees can more than offset the AOV advantage on a per-order contribution margin basis.",
          options: [
            { id: "ca2-q4-a", optionText: "UAE tax rates are 9% corporate tax vs. India's 25%, reducing the take-home on every order", isCorrect: false },
            { id: "ca2-q4-b", optionText: "UAE delivery costs per order (AED 30–40) are disproportionately higher than India's, compressing contribution margins despite higher AOV", isCorrect: true },
            { id: "ca2-q4-c", optionText: "UAE consumers tip less, reducing delivery partner satisfaction and increasing rider churn costs", isCorrect: false },
            { id: "ca2-q4-d", optionText: "Higher-priced UAE restaurants demand lower commission rates, reducing Zomato's take-rate", isCorrect: false },
          ],
        },
      ],
    },
  },
  {
    id: "ca2-mcq-002",
    activityType: "mcq" as const,
    orderIndex: 2,
    activityData: {
      instructions: "These questions focus on execution risks and strategic priorities for Zomato's UAE operations post-entry.",
      context: "Assume Zomato has successfully entered the UAE through an acquisition and is now in Year 1 of operations. The focus shifts to execution.",
      questions: [
        {
          id: "ca2-q5",
          questionText: "During Ramadan, UAE food delivery orders spike 200–300% during late-night hours (10pm–3am). Which operational challenge is MOST critical to address in advance?",
          explanation: "A 3× demand spike in a 5-hour window requires pre-positioned delivery capacity (riders on shift) and pre-cooled kitchen inventory. Technology infrastructure (server capacity) can be auto-scaled on cloud providers. Restaurant supply during Ramadan is actually more predictable (fixed iftar/suhoor menus). The hardest constraint is physical rider availability — riders on sponsorship visas cannot simply be hired overnight; staffing up for peak seasons requires 3–4 month advance planning given visa processing timelines.",
          options: [
            { id: "ca2-q5-a", optionText: "Scaling technology servers to handle 3× concurrent app sessions during peak hours", isCorrect: false },
            { id: "ca2-q5-b", optionText: "Pre-positioning adequate delivery rider capacity ahead of Ramadan given visa processing lead times", isCorrect: true },
            { id: "ca2-q5-c", optionText: "Ensuring Halal certification is visibly displayed in the app during Ramadan month", isCorrect: false },
            { id: "ca2-q5-d", optionText: "Negotiating Ramadan-specific commission discounts with restaurant partners to drive volume", isCorrect: false },
          ],
        },
        {
          id: "ca2-q6",
          questionText: "Talabat responds to Zomato's entry by offering 6-month commission-free periods to its top-200 UAE restaurant partners. What is the most effective counter-strategy?",
          explanation: "Targeting restaurants where Talabat has no exclusivity (new openings, South Asian cuisine segment underserved by Talabat's core Arab-focused positioning) avoids a cash-burning commission war on established restaurants. Matching Talabat's commission-free terms would destroy Zomato's unit economics before it achieves scale. The asymmetric competitive response — focusing on underserved segments rather than fighting for contested accounts — is a classical market entry tactic.",
          options: [
            { id: "ca2-q6-a", optionText: "Match Talabat's commission-free offer across all UAE restaurants to maintain competitive parity", isCorrect: false },
            { id: "ca2-q6-b", optionText: "Focus onboarding efforts on restaurant segments underserved by Talabat (South Asian, new openings) to avoid a commission war on contested accounts", isCorrect: true },
            { id: "ca2-q6-c", optionText: "Launch a consumer-facing price war with zero delivery fees for 90 days to shift consumer preference", isCorrect: false },
            { id: "ca2-q6-d", optionText: "File a regulatory complaint with UAE competition authorities about Talabat's exclusivity arrangements", isCorrect: false },
          ],
        },
      ],
    },
  },
];

// ─── CASE 3: HUL Rural Distribution ──────────────────────────────────────────

const CASE3_STUDIES = [
  {
    id: "cs3-study-1",
    title: "HUL's Distribution Architecture & Project Shakti",
    orderIndex: 0,
    content: `Hindustan Unilever Limited (HUL) is India's largest FMCG company, with revenues of ~₹58,000 Crore (FY2023) and a portfolio spanning soaps, shampoos, tea, ice cream, and home care products. Its distribution network is one of the most studied in emerging market business literature.

HUL'S DISTRIBUTION STRUCTURE (2022)
HUL reaches consumers through a layered intermediary model:

LAYER 1 — C&F AGENTS (Carrying & Forwarding):
~40 warehouses across India. HUL sells at factory price to C&F agents who hold inventory and deliver to distributors within a defined territory. C&F margin: ~1.5–2% of MRP. HUL retains ownership of goods until C&F.

LAYER 2 — SUPER STOCKISTS / DISTRIBUTORS:
~6,000 distributors nationwide. Distributors buy from C&F, break bulk, and supply to retailers. Distributor margin: ~3–4% of MRP. Average distributor covers ~1,000–1,500 retail outlets. Distributor ROI is a key KPI for HUL's sales team.

LAYER 3 — RETAILERS:
~8 million retail touchpoints in India. HUL's "direct reach" (outlets serviced by HUL's own salesforce/vans) is ~3.5 million. The remaining ~4.5 million are "indirect reach" — supplied by sub-stockists and wholesale channels. Rural outlets (villages below 10,000 population) represent ~55% of total retail touchpoints but only ~35% of HUL's revenue.

PROJECT SHAKTI (LAUNCHED 2001)
Facing the challenge of economically reaching villages under 2,000 population (no distributor willing to service due to uneconomic trip economics), HUL launched Project Shakti — a micro-enterprise model:

• SHAKTI AMMAS: Rural women (typically SHG members) trained as direct-to-home saleswomen in their own village. HUL supplies products on 30-day credit. Each Shakti Amma services ~50–100 households.
• SHAKTIMAAN: Male counterpart model using bicycles/motorcycles to cover 4–6 neighbouring villages.
• SCALE BY 2023: ~175,000 Shakti Ammas covering ~200,000 villages, contributing ~₹2,500–3,000 Crore in annual revenues (~5% of HUL total).

WHY PROJECT SHAKTI WORKED
The model aligned commercial and social incentives:
(a) Last-mile economics: A Shakti Amma earns ₹8,000–12,000/month — replacing unreliable agricultural income. Her social capital (neighbour trust) substitutes for HUL's advertising cost.
(b) Demand creation: Door-to-door interaction educated consumers on product categories (shampoo in sachets, water purifiers) that had zero prior brand awareness in villages.
(c) Data capture: Project Shakti provided HUL with granular rural demand data unavailable through traditional distributor reports.`,
  },
  {
    id: "cs3-study-2",
    title: "Rural India Economics & The Sachet Revolution",
    orderIndex: 1,
    content: `Rural India's ~900 million population represents both the largest consumer market opportunity and the most complex distribution challenge for FMCG companies.

INCOME REALITIES
Rural India's per capita income is approximately ₹1,20,000/year (~$1,450) — roughly 40% of urban India. But averages conceal range: agricultural households with 5+ acres may earn ₹3–5 lakh/year, while landless labourers earn ₹60,000–80,000.

Key implication for FMCG: Price sensitivity is extreme. Rural consumers make purchase decisions on a per-use basis, not monthly-stock basis. This gave rise to the sachet economy.

THE SACHET REVOLUTION
HUL pioneered the sachet model in India for shampoo (Sunsilk, Clinic Plus) in the 1980s. A ₹1 shampoo sachet (one wash) allows a consumer who cannot afford a ₹125 bottle to access the same product. Key metrics:
• ~80% of HUL's rural shampoo volume by units is sachets
• Sachets: 4–5× higher revenue per ml than bottles (premium for unit economics)
• Manufacturing challenge: ~2 billion sachets produced annually — requires specialised packaging lines

INFRASTRUCTURE GAPS AFFECTING DISTRIBUTION
ROADS: ~40% of villages in India lack all-weather road connectivity (PMGSY data, 2021). During monsoon (June–September), supply to affected villages drops 25–40%.
ELECTRICITY: ~70% of rural homes have electricity (up from 25% in 2000), but only ~45% have reliable supply (4+ hours/day). This impacts cold-chain categories (ice cream, dairy) and device-dependent categories (electric appliances).
DIGITAL: Rural smartphone penetration reached ~55% in 2022 (vs. 85% urban), but mobile data usage is still primarily entertainment-focused. B2B ordering via apps (like HUL's Shikhar app) has 60% adoption among urban distributors but only 18% among rural sub-stockists.

THE COMPETITIVE LANDSCAPE IN RURAL
HUL's rural dominance is challenged on two fronts:
(a) Regional brands: Local manufacturers with hyper-efficient cost structures (no advertising, direct-to-retailer supply, lower margin requirements) undercut HUL on price by 20–30% in categories like soaps and hair oils.
(b) Jio-enabled D2C: Emerging model of WhatsApp-based ordering with 48-hour direct delivery — bypassing the distributor layer entirely. Penetration is still <5% of rural FMCG, but growing.

CHANNEL ECONOMICS: RURAL VS. URBAN
                        Urban       Rural
Distributor margin:     3.5%       4.5% (premium for effort)
Retailer margin:        10–12%     14–18% (stocking premium)
HUL logistics cost:     1.8%       3.5–5% of revenue
Average invoice size:   ₹4,500     ₹900 (smaller, more frequent orders)
Collection period:      18 days    28 days
Return rate:            2%         4–6% (expiry, damage)

The economics illustrate why rural profitability is structurally lower — but market share in rural is a long-term competitive moat that urbanising consumers carry with them as they move to cities.`,
  },
];

const CASE3_ACTIVITIES = [
  {
    id: "ca3-mcq-001",
    activityType: "mcq" as const,
    orderIndex: 0,
    activityData: {
      instructions: "Answer these questions about HUL's distribution strategy and rural market dynamics.",
      context: "HUL reaches 8 million retail touchpoints in India. Direct reach: 3.5 million outlets. Project Shakti: 175,000 Shakti Ammas covering 200,000 villages. Rural represents 55% of touchpoints but 35% of revenue.",
      questions: [
        {
          id: "ca3-q1",
          questionText: "Why does HUL offer a HIGHER distributor margin in rural India (4.5%) compared to urban (3.5%), even though rural volumes per distributor are lower?",
          explanation: "Rural distributors face fundamentally worse economics: smaller invoice sizes (₹900 vs ₹4,500 urban), higher logistics costs per rupee of revenue, longer collection periods (28 vs 18 days), and higher return rates (4–6% vs 2%). To maintain sufficient distributor ROI to keep the channel economically viable — ensuring distributors don't drop the HUL line for easier urban routes — HUL must compensate with a higher margin. Without this, the rural distribution network would collapse from a lack of financial incentive.",
          options: [
            { id: "ca3-q1-a", optionText: "Rural distributors need higher margin to compensate for lower turnover velocity and higher operating costs per rupee", isCorrect: true },
            { id: "ca3-q1-b", optionText: "Rural areas have less competition among distributors, allowing HUL to offer higher margins as a cost-plus pricing model", isCorrect: false },
            { id: "ca3-q1-c", optionText: "Government regulations require FMCG companies to pay rural distributors a premium margin under FDI norms", isCorrect: false },
            { id: "ca3-q1-d", optionText: "Rural distributors handle premium product categories (sachets, health products) with higher absolute margins", isCorrect: false },
          ],
        },
        {
          id: "ca3-q2",
          questionText: "Project Shakti's fundamental innovation was resolving which specific distribution economics problem?",
          explanation: "The core problem was 'last-mile uneconomics': standard distributors calculated trip economics on distance-per-order-value. Servicing 1,000 households scattered across 5 km² with average invoice of ₹300 is unprofitable at standard van/driver costs. Project Shakti solved this by converting the 'last mile' into an in-community social network — the Shakti Amma's home is the distribution hub. Her marginal cost of reaching 80 neighbours is effectively zero since they already interact daily. The social model replaces physical logistics infrastructure.",
          options: [
            { id: "ca3-q2-a", optionText: "Eliminating adulteration of HUL products by removing multiple intermediary handling layers", isCorrect: false },
            { id: "ca3-q2-b", optionText: "Making last-mile village distribution economically viable using SHG women's social networks as zero-marginal-cost logistics", isCorrect: true },
            { id: "ca3-q2-c", optionText: "Bypassing distributor margins entirely to give HUL direct pricing control in rural markets", isCorrect: false },
            { id: "ca3-q2-d", optionText: "Creating consumer financing for rural buyers unable to afford full-size FMCG products", isCorrect: false },
          ],
        },
        {
          id: "ca3-q3",
          questionText: "HUL's Shikhar app (B2B ordering for retailers) has 18% adoption among rural sub-stockists vs 60% among urban distributors. What is the most EFFECTIVE short-term intervention to accelerate rural adoption?",
          explanation: "Rural adoption barriers are not primarily awareness or willingness — they are operational friction (smartphone not available during working hours, patchy data connectivity) and habit inertia (calling/WhatsApp order to sub-stockist is already functional). The most effective intervention is tying Shikhar usage to a financial incentive directly visible in the retailer's own economics: e.g., 0.25% additional scheme/discount for Shikhar-placed orders. This creates ROI-positive behaviour change. Training programmes alone fail because they don't change the economic equation.",
          options: [
            { id: "ca3-q3-a", optionText: "Conduct 3-day Shikhar app training camps in district headquarters for rural retailers", isCorrect: false },
            { id: "ca3-q3-b", optionText: "Link Shikhar usage to a financial incentive (e.g., 0.25% additional discount) creating direct ROI for the retailer", isCorrect: true },
            { id: "ca3-q3-c", optionText: "Develop an offline-mode Shikhar app that works without internet connectivity", isCorrect: false },
            { id: "ca3-q3-d", optionText: "Make Shikhar mandatory — stop accepting telephonic orders from sub-stockists", isCorrect: false },
          ],
        },
      ],
    },
  },
  {
    id: "ca3-quantus-001",
    activityType: "quantus" as const,
    orderIndex: 1,
    activityData: {
      title: "Rural Distribution Economics: Break-Even Analysis",
      instructions: "Complete the route-to-market cost model for a rural distribution route. Calculate missing values — Total Route Cost, Revenue Coverage %, and Distributor Net Margin. Enter numbers where indicated; percentages should be entered as plain numbers (e.g. enter 4.5 for 4.5%).",
      context: "A rural distributor services 800 retail outlets across 120 villages, operating 6 days/week with 2 delivery vans. Monthly operating data provided. Distributor buys from HUL at 4.5% below MRP and sells to retailers at MRP.",
      gridRows: [
        "Monthly Revenue (MRP basis)",
        "HUL Purchase Cost (at 4.5% margin)",
        "Van Operating Cost (fuel + driver)",
        "Rider/Helper Wages",
        "Credit & Collection Cost",
        "Bad Debt Provision",
        "Total Route Cost",
        "Gross Profit (Revenue - Purchase Cost)",
        "Net Margin (Gross Profit - Route Cost)",
        "Net Margin %",
      ],
      gridCols: ["Cost Item", "Urban Route (₹)", "Rural Route (₹)", "Rural as % of Urban"],
      gridValues: {
        "Monthly Revenue (MRP basis)-Urban Route (₹)": "5,40,000",
        "Monthly Revenue (MRP basis)-Rural Route (₹)": "2,16,000",
        "HUL Purchase Cost (at 4.5% margin)-Urban Route (₹)": "5,15,700",
        "HUL Purchase Cost (at 4.5% margin)-Rural Route (₹)": "2,06,280",
        "Van Operating Cost (fuel + driver)-Urban Route (₹)": "22,000",
        "Van Operating Cost (fuel + driver)-Rural Route (₹)": "34,000",
        "Rider/Helper Wages-Urban Route (₹)": "12,000",
        "Rider/Helper Wages-Rural Route (₹)": "18,000",
        "Credit & Collection Cost-Urban Route (₹)": "4,500",
        "Credit & Collection Cost-Rural Route (₹)": "9,000",
        "Bad Debt Provision-Urban Route (₹)": "3,240",
        "Bad Debt Provision-Rural Route (₹)": "8,640",
        "Gross Profit (Revenue - Purchase Cost)-Urban Route (₹)": "24,300",
        "Gross Profit (Revenue - Purchase Cost)-Rural Route (₹)": "9,720",
      },
      correctAnswers: {
        "Total Route Cost-Urban Route (₹)": "41740",
        "Total Route Cost-Rural Route (₹)": "69640",
        "Net Margin (Gross Profit - Route Cost)-Urban Route (₹)": "-17440",
        "Net Margin (Gross Profit - Route Cost)-Rural Route (₹)": "-59920",
        "Net Margin %-Urban Route (₹)": "-3.23",
        "Net Margin %-Rural Route (₹)": "-27.74",
        "Rural as % of Urban-Monthly Revenue (MRP basis)": "40",
        "Rural as % of Urban-Total Route Cost": "167",
      },
    },
  },
];

// ─── MAIN ─────────────────────────────────────────────────────────────────────

async function seedCases() {
  console.log("Seeding case simulations…");

  const cases = [
    {
      id: CASE_1,
      title: "Tata Steel Acquires Corus: Valuation & M&A Analysis",
      description: "Analyse one of India's largest overseas acquisitions — Tata Steel's $12.1bn purchase of Corus Group. Evaluate valuation multiples, synergy economics, and the impact of commodity cycle risk on cross-border M&A.",
      difficulty: "hard" as const,
      isPublished: true,
      orderIndex: 0,
      studies: CASE1_STUDIES,
      activities: CASE1_ACTIVITIES,
    },
    {
      id: CASE_2,
      title: "Zomato's UAE Market Entry: Strategy & Execution",
      description: "Assess Zomato's potential expansion into the UAE food delivery market. Evaluate competitive dynamics, regulatory complexity, and the strategic trade-offs between organic build, acquisition, and partnership entry modes.",
      difficulty: "medium" as const,
      isPublished: true,
      orderIndex: 1,
      studies: CASE2_STUDIES,
      activities: CASE2_ACTIVITIES,
    },
    {
      id: CASE_3,
      title: "HUL's Rural India Challenge: Distribution Economics",
      description: "Explore how Hindustan Unilever has built one of the world's most complex consumer goods distribution networks in rural India — and the financial realities that make last-mile distribution simultaneously critical and economically challenging.",
      difficulty: "easy" as const,
      isPublished: true,
      orderIndex: 2,
      studies: CASE3_STUDIES,
      activities: CASE3_ACTIVITIES,
    },
  ];

  for (const c of cases) {
    console.log(`  ↳ Upserting case: ${c.title}`);

    await prisma.caseSimulation.upsert({
      where: { id: c.id },
      update: {
        title: c.title,
        description: c.description,
        difficulty: c.difficulty,
        isPublished: c.isPublished,
        orderIndex: c.orderIndex,
      },
      create: {
        id: c.id,
        title: c.title,
        description: c.description,
        difficulty: c.difficulty,
        isPublished: c.isPublished,
        orderIndex: c.orderIndex,
      },
    });

    // Upsert studies
    for (const s of c.studies) {
      await prisma.caseStudy.upsert({
        where: { id: s.id },
        update: { title: s.title, content: s.content, orderIndex: s.orderIndex },
        create: {
          id: s.id,
          caseSimulationId: c.id,
          title: s.title,
          content: s.content,
          orderIndex: s.orderIndex,
        },
      });
    }

    // Upsert activities
    for (const a of c.activities) {
      await prisma.caseActivity.upsert({
        where: { id: a.id },
        update: { activityData: a.activityData as any, orderIndex: a.orderIndex },
        create: {
          id: a.id,
          caseSimulationId: c.id,
          activityType: a.activityType,
          activityData: a.activityData as any,
          orderIndex: a.orderIndex,
        },
      });
    }

    console.log(`     ✓ ${c.studies.length} studies · ${c.activities.length} activities`);
  }

  console.log("Case simulation seed complete.");
}

seedCases()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
