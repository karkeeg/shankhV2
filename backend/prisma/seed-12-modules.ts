import { PrismaClient, ModuleStage, LevelDifficulty, ActivityType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Create Study Plan
  const studyPlan = await prisma.studyPlan.upsert({
    where: { slug: 'shankh-finance-strategy' },
    update: {},
    create: {
      slug: 'shankh-finance-strategy',
      title: 'Shankh Finance & Strategy',
      description: 'Master finance and strategy through case-first learning.',
      position: 1,
    },
  });

  const modulesData = [
    {
      title: 'Introduction to Assets',
      stage: ModuleStage.foundation,
      skillTags: ['current-assets', 'non-current-assets', 'liquidity-basics'],
      importableCount: 13,
      position: 1,
      learningObjective: 'Distinguish current from non-current assets, build asset subtotals correctly, and connect classification to liquidity.',
      caseContext: 'A small distribution company is preparing an opening balance-sheet training file after its first full operating quarter.',
      mcqs: [
        { q: 'Which item is ordinarily a current asset?', a: 'B', options: ['Factory building', 'Cash', 'Patent', 'Long-term loan receivable due in 5 years'], rationale: 'Cash is available within the operating cycle and supports near-term liquidity.' },
        { q: 'Accounts receivable refers to', a: 'B', options: ['Money owed to suppliers', 'Money owed by customers', 'Future tax expense', 'Owner’s capital'], rationale: 'Receivables arise when the company records sales before collecting cash.' },
        { q: 'Inventory is usually classified as current because it is', a: 'B', options: ['Always cash', 'Sold or used within one operating cycle', 'A financing source', 'Exempt from valuation'], rationale: 'Inventory is expected to convert into sales or production use in the near term.' },
        { q: 'Which item belongs in non-current assets?', a: 'C', options: ['Cash', 'Inventory', 'Land', 'Trade receivables'], rationale: 'Land is a long-lived asset, not expected to convert to cash within a year.' },
        { q: 'If inventory rises while sales are flat, the most likely near-term effect is', a: 'A', options: ['More cash tied up', 'Lower assets', 'Higher equity automatically', 'Lower current assets'], rationale: 'Extra stock usually absorbs cash rather than releasing it.' },
      ],
      quantus: [
        { task: 'Calculate total current assets', inputs: 'Cash ₹12,000; Accounts receivable ₹15,000; Inventory ₹8,000', formula: 'cash + ar + inventory', answer: '₹35,000', difficulty: LevelDifficulty.easy },
        { task: 'Calculate total non-current assets', inputs: 'PPE ₹50,000; Patents ₹10,000; Long-term investments ₹12,000', formula: 'ppe + patents + lti', answer: '₹72,000', difficulty: LevelDifficulty.easy },
        { task: 'Calculate total assets', inputs: 'Current assets ₹35,000; Non-current assets ₹72,000', formula: 'current_assets + non_current_assets', answer: '₹107,000', difficulty: LevelDifficulty.easy },
      ],
      canvas: [
        { task: 'Drag asset cards into Current Assets and Non-current Assets buckets', expected: 'Current: Cash, Accounts receivable, Inventory. Non-current: Land, Machinery, Patent, Long-term investment.', rubric: '12 pts: 6 correct placement, 3 completeness, 2 logic, 1 clarity' },
        { task: 'Build the asset-side hierarchy', expected: 'Assets → Current Assets → Cash / AR / Inventory; Assets → Non-current Assets → PPE / Intangibles / Long-term investments; show both subtotals and total assets', rubric: '13 pts: 5 correct hierarchy, 4 correct subtotals, 3 completeness, 1 clarity' },
      ],
      decision: {
        prompt: 'A CFO needs to improve short-term liquidity this quarter with the least strategic disruption. Which action should come first?',
        options: ['Collect receivables faster and reduce slow-moving inventory', 'Buy additional machinery', 'Increase dividends', 'Prepay long-term lease liabilities'],
        scoring: '15 pts for A with liquidity rationale; 9 pts for A without rationale; 3 pts for D if the answer notes obligation reduction but ignores timing; 0 otherwise.'
      },
      coach: {
        hint: '“Only include items expected to turn into cash or be used within the operating cycle.”',
        warning: '“You have likely included a non-current item inside a current subtotal.”',
        correct: '“Correct: the subtotal includes only near-term operating assets.”',
        incorrect: '“Re-check classification before summing; the math may be right on the wrong items.”'
      }
    },
    {
      title: 'Balance Sheet Classification',
      stage: ModuleStage.foundation,
      skillTags: ['balance-sheet-identity', 'liabilities', 'equity'],
      importableCount: 13,
      position: 2,
      learningObjective: 'Understand how assets, liabilities and equity connect through the balance-sheet identity and financing maturity.',
      caseContext: 'A light manufacturing business is financing new machinery and must present a clean opening balance sheet.',
      mcqs: [
        { q: 'The balance-sheet identity is', a: 'B', options: ['Revenue = Cost + Profit', 'Assets = Liabilities + Equity', 'Cash = Profit + Debt', 'Assets = Equity – Liabilities'], rationale: 'This is the core accounting identity.' },
        { q: 'Trade payables are normally classified as', a: 'C', options: ['Asset', 'Revenue', 'Liability', 'Equity'], rationale: 'Payables are obligations owed to suppliers.' },
        { q: 'Retained earnings belong to', a: 'B', options: ['Current liabilities', 'Equity', 'Revenue', 'Inventory'], rationale: 'Retained earnings accumulate profits kept in the business.' },
        { q: 'If assets are ₹125,000 and liabilities are ₹80,000, equity is', a: 'A', options: ['₹45,000', '₹80,000', '₹125,000', '₹205,000'], rationale: 'Equity is the residual after liabilities are deducted from assets.' },
        { q: 'A 3-year term loan is usually a', a: 'C', options: ['Current asset', 'Current liability', 'Non-current liability', 'Equity reserve'], rationale: 'The maturity is beyond the short-term current period.' },
      ],
      quantus: [
        { task: 'Calculate total assets', inputs: 'Cash ₹10,000; Inventory ₹20,000; PPE ₹70,000', formula: 'cash + inventory + ppe', answer: '₹100,000', difficulty: LevelDifficulty.easy },
        { task: 'Calculate total liabilities', inputs: 'Accounts payable ₹15,000; Short-term debt ₹10,000; Long-term debt ₹35,000', formula: 'ap + std + ltd', answer: '₹60,000', difficulty: LevelDifficulty.easy },
        { task: 'Calculate equity', inputs: 'Assets ₹100,000; Liabilities ₹60,000', formula: 'assets - liabilities', answer: '₹40,000', difficulty: LevelDifficulty.easy },
      ],
      canvas: [
        { task: 'Sort accounts into Assets, Liabilities and Equity', expected: 'Assets: Cash, Inventory, PPE. Liabilities: AP, ST debt, LT debt. Equity: Share capital, Retained earnings.', rubric: '12 pts: 6 correct sorting, 3 completeness, 2 logic, 1 clarity' },
        { task: 'Build financing maturity map', expected: 'Assets matched against current liabilities, non-current liabilities and equity; long-lived machinery should not be funded mainly with short-term sources', rubric: '13 pts: 5 correct maturity logic, 4 correct categories, 3 recommendation logic, 1 clarity' },
      ],
      decision: {
        prompt: 'The company wants to buy machinery that will be used for five years while preserving its current ratio. Which financing choice is strongest?',
        options: ['Short-term debt', 'Long-term debt or equity', 'Record the machinery directly as an expense', 'Put the machinery under inventory'],
        scoring: '15 pts for B with maturity-matching rationale; 9 pts for B without rationale; 3 pts for A if liquidity trade-off is at least recognised; 0 otherwise.'
      },
      coach: {
        hint: '“Ask which side of the equation each line item belongs to.”',
        warning: '“A long-lived asset funded by short-term debt can create liquidity strain.”',
        correct: '“Correct: you preserved the balance-sheet identity and matched financing to asset life.”',
        incorrect: '“The category may be wrong even if the arithmetic balances.”'
      }
    },
    {
      title: 'Income Statement Flow',
      stage: ModuleStage.foundation,
      skillTags: ['revenue', 'gross-profit', 'EBITDA', 'net-income'],
      importableCount: 13,
      position: 3,
      learningObjective: 'Trace how revenue flows through COGS, operating expenses, interest and tax to net income.',
      caseContext: 'A regional packaged-food company is explaining why profit has changed despite higher sales.',
      mcqs: [
        { q: 'Gross profit equals', a: 'A', options: ['Revenue – COGS', 'Revenue – Tax', 'EBITDA – Interest', 'Cash – Debt'], rationale: 'Gross profit captures revenue after direct production costs.' },
        { q: 'EBITDA excludes', a: 'C', options: ['Revenue', 'COGS', 'Depreciation and amortisation', 'SG&A'], rationale: 'EBITDA is before D&A, interest and tax.' },
        { q: 'Interest expense appears below', a: 'B', options: ['Revenue only', 'EBIT', 'Inventory', 'Gross margin'], rationale: 'Interest is financing cost, not an operating cost.' },
        { q: 'If revenue rises but gross profit barely changes, the most likely issue is', a: 'A', options: ['Higher COGS pressure', 'Lower cash only', 'Higher equity', 'Lower asset turnover automatically'], rationale: 'Weak gross profit conversion typically signals direct-cost pressure.' },
        { q: 'The final profit line after tax is', a: 'C', options: ['EBITDA', 'EBIT', 'Net income', 'Gross profit'], rationale: 'Net income is the bottom line after interest and tax.' },
      ],
      quantus: [
        { task: 'Calculate gross profit and gross margin', inputs: 'Revenue ₹250; COGS ₹150', formula: 'revenue - cogs; (revenue - cogs) / revenue', answer: '₹100; 40%', difficulty: LevelDifficulty.easy },
        { task: 'Calculate EBITDA', inputs: 'Gross profit ₹100; Operating expenses ₹55', formula: 'gross_profit - opex', answer: '₹45', difficulty: LevelDifficulty.medium },
        { task: 'Calculate net income', inputs: 'EBITDA ₹45; D&A ₹10; Interest ₹5; Tax ₹8', formula: 'ebitda - da - interest - tax', answer: '₹22', difficulty: LevelDifficulty.medium },
      ],
      canvas: [
        { task: 'Arrange the income-statement flow', expected: 'Revenue → COGS → Gross Profit → Operating Expenses → EBITDA → D&A → EBIT → Interest → Profit Before Tax → Tax → Net Income', rubric: '12 pts: 6 correct order, 3 completeness, 2 logic, 1 clarity' },
        { task: 'Build a diagnostic bridge for falling net income', expected: 'Revenue, direct costs, opex, D&A, interest, tax; show where margin compression occurs and which line should be investigated first', rubric: '13 pts: 5 correct bridge structure, 4 identification of likely driver, 3 prioritisation, 1 clarity' },
      ],
      decision: {
        prompt: 'Revenue grew 10%, gross profit grew 8%, but EBITDA fell 5%. What should management review first?',
        options: ['Lower tax rate assumptions', 'SG&A and operating leverage', 'Share count', 'Historical depreciation policy only'],
        scoring: '15 pts for B with operating-cost rationale; 9 pts for B without rationale; 3 pts for D if the answer at least notes below-EBIT effects; 0 otherwise.'
      },
      coach: {
        hint: '“Move line by line from top to bottom before jumping to the answer.”',
        warning: '“You may be mixing operating cost with financing cost.”',
        correct: '“Correct: you tracked the statement in the right sequence.”',
        incorrect: '“Revisit which costs belong above and below EBITDA.”'
      }
    },
    {
      title: 'Margin Analysis',
      stage: ModuleStage.foundation,
      skillTags: ['gross-margin', 'EBITDA-margin', 'net-margin'],
      importableCount: 13,
      position: 4,
      learningObjective: 'Calculate gross, EBITDA and net margins and interpret where margin pressure sits.',
      caseContext: 'A restaurant chain is defending a pricing campaign while profitability weakens.',
      mcqs: [
        { q: 'Gross margin is', a: 'A', options: ['Gross profit / Revenue', 'Net income / Revenue', 'EBITDA / Assets', 'Revenue / COGS'], rationale: 'Gross margin measures direct profitability against revenue.' },
        { q: 'EBITDA margin shows', a: 'A', options: ['Operating profitability before D&A, interest and tax', 'Total assets used', 'Only free cash flow', 'Market share'], rationale: 'It isolates operating performance before non-cash and financing effects.' },
        { q: 'Net margin should use which denominator?', a: 'A', options: ['Revenue', 'COGS', 'Equity', 'Debt'], rationale: 'Margin ratios are typically profit divided by revenue.' },
        { q: 'If gross margin is stable but EBITDA margin falls, the likely problem is', a: 'A', options: ['SG&A or overhead creep', 'Inventory revaluation only', 'Lower tax rate', 'Higher share capital'], rationale: 'Stable gross profit with weaker EBITDA points to operating expense pressure.' },
        { q: 'Higher fixed costs typically make margins', a: 'B', options: ['Less sensitive to volume', 'More sensitive to volume', 'Equal to gross profit', 'Immune to pricing'], rationale: 'Operating leverage increases sensitivity to changes in sales.' },
      ],
      quantus: [
        { task: 'Calculate gross margin', inputs: 'Revenue ₹240; COGS ₹144', formula: '(revenue - cogs) / revenue', answer: '40%', difficulty: LevelDifficulty.easy },
        { task: 'Calculate EBITDA margin', inputs: 'Revenue ₹240; COGS ₹144; Opex ₹48', formula: '(revenue - cogs - opex) / revenue', answer: '20%', difficulty: LevelDifficulty.medium },
        { task: 'Calculate net margin', inputs: 'Revenue ₹240; COGS ₹144; Opex ₹48; D&A ₹12; Interest ₹6; Tax ₹9', formula: '(revenue - cogs - opex - da - interest - tax) / revenue', answer: '8.75%', difficulty: LevelDifficulty.medium },
      ],
      canvas: [
        { task: 'Build a margin waterfall', expected: 'Revenue → Gross Profit → EBITDA → EBIT → Net Income, with margin % at each level', rubric: '12 pts: 5 correct levels, 3 correct percentages, 3 completeness, 1 clarity' },
        { task: 'Classify levers by margin type', expected: 'Gross margin levers: price, product mix, COGS. EBITDA margin levers: SG&A, fulfilment, staff cost. Net margin levers: interest, tax, exceptional items.', rubric: '13 pts: 5 correct classification, 4 logic, 3 prioritisation, 1 clarity' },
      ],
      decision: {
        prompt: 'A chain’s gross margin is flat but EBITDA margin has fallen from 20% to 14%. Which lever should be tested first?',
        options: ['Renegotiate direct food inputs only', 'Audit overhead and store-level operating cost growth', 'Change depreciation method', 'Increase debt to fund expansion'],
        scoring: '15 pts for B with margin-layer rationale; 9 pts for B without rationale; 4 pts for A if the answer notes it may help but misses the evidence; 0 otherwise.'
      },
      coach: {
        hint: '“Ask whether the pressure sits above or below gross profit.”',
        warning: '“You may be dividing by the wrong base; margins use revenue.”',
        correct: '“Correct: you isolated the margin layer where the problem actually sits.”',
        incorrect: '“Recompute the margin and then decide which cost bucket it implicates.”'
      }
    },
    {
      title: 'Cash Flow Basics',
      stage: ModuleStage.foundation,
      skillTags: ['CFO', 'CFI', 'CFF', 'reconciliation'],
      importableCount: 13,
      position: 5,
      learningObjective: 'Reconcile profit to cash and distinguish operating, investing and financing flows.',
      caseContext: 'A wholesaler is profitable on paper but short of cash at month end.',
      mcqs: [
        { q: 'Profit and cash differ mainly because', a: 'A', options: ['Accounting is accrual-based', 'Profit is always cash', 'Cash ignores sales', 'Assets are liabilities'], rationale: 'Revenue and expenses can be recognised before cash moves.' },
        { q: 'An increase in receivables usually', a: 'B', options: ['Improves CFO', 'Reduces CFO', 'Has no effect', 'Creates financing cash flow'], rationale: 'More receivables mean cash has not yet been collected.' },
        { q: 'Depreciation is added back in CFO because it is', a: 'B', options: ['Revenue', 'A non-cash expense', 'A liability', 'A dividend'], rationale: 'It reduces profit without consuming period cash.' },
        { q: 'Buying machinery is usually classified as', a: 'B', options: ['CFO', 'CFI', 'CFF', 'Equity only'], rationale: 'Capex is an investing cash outflow.' },
        { q: 'Paying dividends is usually classified as', a: 'C', options: ['CFO', 'CFI', 'CFF', 'Tax only'], rationale: 'Dividends are financing cash outflows.' },
      ],
      quantus: [
        { task: 'Calculate CFO', inputs: 'Net income ₹18; Depreciation ₹6; Increase in AR ₹5; Increase in inventory ₹4; Increase in payables ₹3', formula: 'ni + dep - delta_ar - delta_inv + delta_ap', answer: '₹18', difficulty: LevelDifficulty.medium },
        { task: 'Calculate net change in cash', inputs: 'CFO ₹18; Capex ₹12; Debt raised ₹5; Dividends paid ₹4', formula: 'cfo - capex + debt_raised - dividends', answer: '₹7', difficulty: LevelDifficulty.medium },
        { task: 'Calculate ending cash', inputs: 'Opening cash ₹11; Net change in cash ₹7', formula: 'opening_cash + net_change_cash', answer: '₹18', difficulty: LevelDifficulty.easy },
      ],
      canvas: [
        { task: 'Build a cash bridge from net income to CFO', expected: 'Net income → + non-cash items → – receivables growth → – inventory growth → + payables growth → CFO', rubric: '12 pts: 6 correct bridge, 3 sign accuracy, 2 completeness, 1 clarity' },
        { task: 'Sort cash items into CFO, CFI and CFF', expected: 'CFO: NI, depreciation, WC changes. CFI: capex. CFF: debt raised, dividends.', rubric: '13 pts: 6 correct sorting, 3 sign logic, 3 completeness, 1 clarity' },
      ],
      decision: {
        prompt: 'The business is profitable but CFO is negative because receivables and inventory have risen sharply. What is the best first response?',
        options: ['Improve collections and tighten inventory planning', 'Borrow more and ignore working capital', 'Increase dividends to reassure investors', 'Accelerate capex to absorb the excess cash'],
        scoring: '15 pts for A with working-capital rationale; 9 pts for A without rationale; 2 pts for B if liquidity need is recognised but root cause is missed; 0 otherwise.'
      },
      coach: {
        hint: '“Receivables up means cash down.”',
        warning: '“You may have treated an investing or financing item as operating cash flow.”',
        correct: '“Correct: the statement now explains why profit and cash diverge.”',
        incorrect: '“Re-check the sign on working-capital movements before changing the answer.”'
      }
    },
    {
      title: 'Working Capital',
      stage: ModuleStage.foundation,
      skillTags: ['NWC', 'current-ratio', 'CCC'],
      importableCount: 13,
      position: 6,
      learningObjective: 'Compute NWC, current ratio and cash-conversion-cycle thinking.',
      caseContext: 'An electronics wholesaler wants to release cash without hurting service levels.',
      mcqs: [
        { q: 'Net working capital equals', a: 'A', options: ['Current assets – current liabilities', 'Revenue – COGS', 'Debt + equity', 'Profit / revenue'], rationale: 'NWC captures short-term operating liquidity.' },
        { q: 'Current ratio equals', a: 'A', options: ['Current assets / current liabilities', 'Revenue / assets', 'Assets / equity', 'Cash / debt'], rationale: 'It is the classic short-term coverage ratio.' },
        { q: 'DSO mainly measures', a: 'A', options: ['Collection speed', 'Inventory quality', 'Interest burden', 'Tax efficiency'], rationale: 'It tracks how long customers take to pay.' },
        { q: 'Higher DPO generally means', a: 'A', options: ['More supplier financing', 'Faster collections', 'Lower debt', 'Higher capital expenditure'], rationale: 'Paying later temporarily preserves cash.' },
        { q: 'Cash conversion cycle equals', a: 'A', options: ['DIO + DSO – DPO', 'DIO – DSO + DPO', 'DSO / DPO', 'Revenue / NWC'], rationale: 'It measures days cash is tied up in operations.' },
      ],
      quantus: [
        { task: 'Calculate current assets, current liabilities and NWC', inputs: 'Cash ₹8; AR ₹22; Inventory ₹30; AP ₹18; ST debt ₹12', formula: '(cash+ar+inventory) - (ap+st_debt)', answer: 'CA ₹60; CL ₹30; NWC ₹30', difficulty: LevelDifficulty.easy },
        { task: 'Calculate current ratio', inputs: 'Current assets ₹60; Current liabilities ₹30', formula: 'current_assets / current_liabilities', answer: '2.0x', difficulty: LevelDifficulty.easy },
        { task: 'Calculate cash conversion cycle', inputs: 'DIO 50; DSO 35; DPO 30', formula: 'dio + dso - dpo', answer: '55 days', difficulty: LevelDifficulty.medium },
      ],
      canvas: [
        { task: 'Map the working-capital cycle', expected: 'Buy inventory → sell stock → create receivable → collect cash → pay suppliers', rubric: '12 pts: 6 correct flow, 3 completeness, 2 timing logic, 1 clarity' },
        { task: 'Prioritise levers by bucket', expected: 'AR: tighter collections / terms; Inventory: slower movers, forecasting; AP: supplier terms without harming supply', rubric: '13 pts: 5 correct buckets, 4 prioritisation, 3 realism, 1 clarity' },
      ],
      decision: {
        prompt: 'Inventory days are the largest driver of a 55-day cash-conversion cycle. What should management do first?',
        options: ['Rationalise slow-moving stock and improve demand planning', 'Pay suppliers faster', 'Increase list price immediately', 'Stop collecting receivables aggressively'],
        scoring: '15 pts for A with inventory-cash rationale; 9 pts for A without rationale; 2 pts for C if margin is mentioned but cash blockage is missed; 0 otherwise.'
      },
      coach: {
        hint: '“Begin with the bucket where cash sits longest.”',
        warning: '“You may have improved one metric while worsening another.”',
        correct: '“Correct: you linked operating days to cash release.”',
        incorrect: '“The answer should release trapped cash, not simply move liabilities around.”'
      }
    },
    {
      title: 'Break-even Analysis',
      stage: ModuleStage.applied,
      skillTags: ['contribution', 'break-even', 'target-profit'],
      importableCount: 13,
      position: 7,
      learningObjective: 'Use contribution margin to calculate break-even and target-profit volume.',
      caseContext: 'A packaged-snacks brand is deciding whether a new SKU is commercially viable.',
      mcqs: [
        { q: 'Contribution per unit equals', a: 'A', options: ['Price – Variable cost', 'Revenue – Fixed cost', 'Profit / Units', 'Price – Tax'], rationale: 'Contribution is what remains to cover fixed costs and profit.' },
        { q: 'Break-even units equal', a: 'A', options: ['Fixed cost / Contribution per unit', 'Revenue / Fixed cost', 'Price / Variable cost', 'Contribution / Fixed cost'], rationale: 'This is the core break-even formula.' },
        { q: 'If fixed cost rises and all else stays constant, break-even volume will', a: 'C', options: ['Fall', 'Stay the same', 'Rise', 'Become negative'], rationale: 'More fixed cost requires more unit contribution to cover it.' },
        { q: 'If selling price rises and variable cost is unchanged, contribution per unit will', a: 'B', options: ['Fall', 'Rise', 'Stay flat', 'Equal fixed cost'], rationale: 'The gap between price and variable cost widens.' },
        { q: 'Units needed for a target profit equal', a: 'B', options: ['Fixed cost / price', '(Fixed cost + target profit) / contribution', 'Revenue / contribution', 'Profit / revenue'], rationale: 'Target profit is added to fixed cost before dividing by contribution.' },
      ],
      quantus: [
        { task: 'Calculate contribution per unit', inputs: 'Selling price ₹120; Variable cost ₹70', formula: 'price - variable_cost', answer: '₹50', difficulty: LevelDifficulty.easy },
        { task: 'Calculate break-even units', inputs: 'Fixed cost ₹1,000,000; Contribution ₹50', formula: 'fixed_cost / contribution', answer: '20,000 units', difficulty: LevelDifficulty.medium },
        { task: 'Calculate units required for target profit', inputs: 'Fixed cost ₹1,000,000; Target profit ₹500,000; Contribution ₹50', formula: '(fixed_cost + target_profit) / contribution', answer: '30,000 units', difficulty: LevelDifficulty.medium },
      ],
      canvas: [
        { task: 'Build the break-even driver tree', expected: 'Price → variable cost → contribution → fixed cost → break-even volume', rubric: '12 pts: 6 correct driver order, 3 completeness, 2 logic, 1 clarity' },
        { task: 'Build a sensitivity canvas', expected: 'Show how price, variable cost and fixed cost changes move break-even volume; prioritise most controllable lever', rubric: '13 pts: 5 correct sensitivity logic, 4 prioritisation, 3 realism, 1 clarity' },
      ],
      decision: {
        prompt: 'Expected first-year demand is 18,000 units and break-even volume is 20,000 units. What is the best recommendation?',
        options: ['Launch unchanged', 'Delay launch unless price, variable cost or fixed cost improves', 'Double marketing fixed cost immediately', 'Reduce price further to stimulate demand without reworking costs'],
        scoring: '15 pts for B with economics rationale; 9 pts for B without rationale; 2 pts for A if strategic reasons are at least noted; 0 otherwise.'
      },
      coach: {
        hint: '“Contribution covers fixed cost before it creates profit.”',
        warning: '“You may have used price instead of contribution in the break-even formula.”',
        correct: '“Correct: the economics now show the launch hurdle clearly.”',
        incorrect: '“Recalculate contribution first; break-even volume depends on that step.”'
      }
    },
    {
      title: 'Market Sizing',
      stage: ModuleStage.applied,
      skillTags: ['TAM', 'epidemiology-funnel', 'sanity-check'],
      importableCount: 13,
      position: 8,
      learningObjective: 'Build a top-down market-sizing funnel and sanity-check the assumptions.',
      caseContext: 'A pharma team is estimating the annual addressable market for a new diabetes therapy in India.',
      mcqs: [
        { q: 'Which sequence is strongest for drug market sizing?', a: 'A', options: ['Population → Prevalence → Diagnosis → Treatment → Price', 'Price → Population → Margin', 'Revenue → EBITDA → Market share', 'Population → Tax → Profit'], rationale: 'The market is narrowed step by step before pricing.' },
        { q: 'Prevalence means', a: 'A', options: ['Share of the population with the disease', 'Price per prescription', 'Company market share', 'Tax rate'], rationale: 'It describes disease burden in the population.' },
        { q: 'If diagnosis rate improves, the addressable market will usually', a: 'B', options: ['Fall', 'Rise', 'Stay unchanged', 'Become irrelevant'], rationale: 'More patients are identified and move into the treatable funnel.' },
        { q: 'A good top-down estimate should be checked against', a: 'A', options: ['At least one external sanity check', 'Nothing if the formula worked', 'Only last year’s profit', 'Only fixed costs'], rationale: 'Market-sizing is assumption-heavy and needs triangulation.' },
        { q: 'Which term is often confused with prevalence but measures new cases over a period?', a: 'A', options: ['Incidence', 'Margin', 'Dilution', 'Leverage'], rationale: 'Incidence is new-case flow, not total enrolled burden.' },
      ],
      quantus: [
        { task: 'Calculate diagnosed patients', inputs: 'Population 60,000,000; Prevalence 3%; Diagnosis rate 65%', formula: 'population * prevalence * diagnosis_rate', answer: '1,170,000 patients', difficulty: LevelDifficulty.medium },
        { task: 'Calculate treated patients', inputs: 'Diagnosed patients 1,170,000; Treatment rate 55%', formula: 'diagnosed_patients * treatment_rate', answer: '643,500 patients', difficulty: LevelDifficulty.medium },
        { task: 'Calculate annual market size', inputs: 'Treated patients 643,500; Annual price ₹30,000', formula: 'treated_patients * annual_price', answer: '₹19,305,000,000 or ₹1,930.5 crore', difficulty: LevelDifficulty.hard },
      ],
      canvas: [
        { task: 'Build the market-sizing tree', expected: 'Population → Prevalence → Diagnosed patients → Treated patients → Price per patient → Total market', rubric: '12 pts: 6 correct funnel, 3 completeness, 2 logic, 1 clarity' },
        { task: 'Build an assumption-evidence canvas', expected: 'Epidemiology, diagnosis, treatment, pricing and adoption assumptions; attach each to an evidence type and flag the weakest assumption', rubric: '13 pts: 5 correct assumption buckets, 4 evidence logic, 3 prioritisation, 1 clarity' },
      ],
      decision: {
        prompt: 'The estimated market is large, but diagnosis rates are low and physician awareness is uneven. What launch approach is strongest?',
        options: ['National rollout immediately', 'Pilot in target metros and invest in physician education', 'Halt the project because diagnosis is not 100%', 'Slash price before validating demand drivers'],
        scoring: '15 pts for B with funnel rationale; 9 pts for B without rationale; 3 pts for D if access is mentioned but evidence order is wrong; 0 otherwise.'
      },
      coach: {
        hint: '“Narrow the patient funnel before multiplying by price.”',
        warning: '“You may have priced the total population instead of the treated population.”',
        correct: '“Correct: you sized the market in the right order.”',
        incorrect: '“Check whether diagnosis and treatment were applied before pricing.”'
      }
    },
    {
      title: 'Pricing Strategy',
      stage: ModuleStage.applied,
      skillTags: ['cost-plus', 'value-based', 'pricing-floor'],
      importableCount: 13,
      position: 9,
      learningObjective: 'Choose an appropriate pricing method and quantify floor, ceiling and launch economics.',
      caseContext: 'A diagnostics company is launching a new point-of-care kit into a market with existing alternatives.',
      mcqs: [
        { q: 'If the objective is to recover cost and earn a target margin, the default method is', a: 'A', options: ['Cost-plus', 'Randomised testing', 'Equity dilution', 'Tax-based pricing'], rationale: 'Cost-plus starts from the cost base and adds target return.' },
        { q: 'If a product delivers measurable economic value to the buyer, the most relevant anchor is', a: 'A', options: ['Willingness to pay', 'Historical debt', 'Share capital', 'Depreciation only'], rationale: 'Value-based pricing links price to customer benefit.' },
        { q: 'In a crowded market with similar alternatives, the most informative external reference is', a: 'A', options: ['Competitor price band', 'Tax rate', 'Dividend yield', 'Book value'], rationale: 'Reference pricing matters when differentiation is limited.' },
        { q: 'Pricing below variable cost is generally', a: 'B', options: ['Sustainable in the long run', 'Unsustainable unless used very deliberately', 'Best practice', 'A pure balance-sheet choice'], rationale: 'It destroys contribution unless part of a clearly bounded strategy.' },
        { q: 'Net realised price can be lower than list price because of', a: 'A', options: ['Discounts and rebates', 'Depreciation only', 'Share repurchases', 'Goodwill'], rationale: 'The realised price is affected by commercial deductions.' },
      ],
      quantus: [
        { task: 'Calculate cost-plus floor price', inputs: 'Variable cost ₹180; Fixed cost allocation ₹60; Target markup 25%', formula: '(variable_cost + fixed_cost_alloc) * 1.25', answer: '₹300', difficulty: LevelDifficulty.medium },
        { task: 'Calculate value-based ceiling', inputs: 'Customer savings per test ₹900; Share of value captured 40%', formula: 'savings_per_test * capture_rate', answer: '₹360', difficulty: LevelDifficulty.medium },
        { task: 'Calculate break-even units at proposed launch price', inputs: 'Launch price ₹320; Variable cost ₹180; Fixed cost ₹1,120,000', formula: 'fixed_cost / (launch_price - variable_cost)', answer: '8,000 units', difficulty: LevelDifficulty.medium },
      ],
      canvas: [
        { task: 'Build the pricing-method decision map', expected: 'Objective → product type → market context → best method: cost-plus / competitor-based / value-based / hybrid', rubric: '12 pts: 5 correct method logic, 3 contextual fit, 3 completeness, 1 clarity' },
        { task: 'Build a realised-price waterfall', expected: 'List price → channel discount → rebate/promotions → net realised price; note margin implications', rubric: '13 pts: 5 correct waterfall, 4 economic logic, 3 completeness, 1 clarity' },
      ],
      decision: {
        prompt: 'The price floor is ₹300, the value-based ceiling is ₹360, and competitors cluster around ₹300–₹330. What is the strongest launch price?',
        options: ['₹280', '₹320', '₹380', '₹450'],
        scoring: '15 pts for B with range logic; 9 pts for B without rationale; 4 pts for C if premium differentiation is argued but competitive fit is missed; 0 otherwise.'
      },
      coach: {
        hint: '“Find the floor, then the ceiling, then check market fit.”',
        warning: '“You may have chosen a price that is below contribution viability or above the evidence-based ceiling.”',
        correct: '“Correct: the chosen price clears the floor and stays defensible in-market.”',
        incorrect: '“Revisit whether your answer sits between viable cost recovery and customer value.”'
      }
    },
    {
      title: 'Profitability Diagnosis',
      stage: ModuleStage.integrated,
      skillTags: ['issue-tree', 'revenue-vs-cost', 'prioritisation'],
      importableCount: 13,
      position: 10,
      learningObjective: 'Diagnose the root cause of declining profitability using structured issue trees.',
      caseContext: 'A retail chain is seeing lower profits despite stable footfall and same-store sales.',
      mcqs: [
        { q: 'Which is the best first split for a profit issue tree?', a: 'A', options: ['Revenue vs Cost', 'Assets vs Liabilities', 'Domestic vs International', 'Fixed vs Variable'], rationale: 'Profit is mathematically Revenue minus Cost; this is the most exhaustive first split.' },
        { q: 'If volume is flat but revenue is down, the driver must be', a: 'B', options: ['Cost creep', 'Average realised price', 'Inventory turnover', 'Fixed costs'], rationale: 'Revenue = Price x Volume. If volume is flat and revenue is down, price must have fallen.' },
        { q: 'An "MECE" tree means', a: 'B', options: ['Mostly Easy and Categorically Exhaustive', 'Mutually Exclusive and Collectively Exhaustive', 'Market Entry and Cost Efficiency', 'Margin Enhanced and Cost Effective'], rationale: 'MECE ensures no overlaps and no gaps in the analysis.' },
        { q: 'Which cost bucket is usually harder to adjust in the short term?', a: 'A', options: ['Fixed costs (Rent/Admin)', 'Variable costs (COGS)', 'Marketing spend', 'Dividends'], rationale: 'Fixed costs are often contractual and take time to resize.' },
        { q: 'Prioritisation in a diagnosis should focus on', a: 'A', options: ['High-impact, high-controllability levers', 'Smallest cost items', 'Only external market trends', 'Only fixed assets'], rationale: 'Management should focus where they can move the needle effectively.' },
      ],
      quantus: [
        { task: 'Isolate the profit impact of a 5% cost increase', inputs: 'Revenue ₹1,000; Current Cost ₹800; New Cost ₹840', formula: 'current_profit - new_profit', answer: '₹40 reduction', difficulty: LevelDifficulty.medium },
        { task: 'Calculate the price increase needed to offset a ₹50 cost rise', inputs: 'Volume 1,000 units; Cost rise ₹50,000', formula: 'total_cost_rise / volume', answer: '₹50 per unit', difficulty: LevelDifficulty.medium },
        { task: 'Determine profit if price falls 10% and volume rises 15%', inputs: 'Old: P=₹100, V=1,000, C=₹60; New: P=₹90, V=1,150, C=₹60', formula: '(90-60)*1150', answer: '₹34,500 (vs ₹40,000)', difficulty: LevelDifficulty.hard },
      ],
      canvas: [
        { task: 'Build a full profit issue tree', expected: 'Profit → Revenue (Price, Volume) and Cost (Fixed, Variable)', rubric: '12 pts: 6 correct tree structure, 3 MECE logic, 2 completeness, 1 clarity' },
        { task: 'Prioritisation Matrix', expected: 'Map identified issues onto an Impact vs Feasibility grid; identify top 3 initiatives', rubric: '13 pts: 5 correct mapping, 4 logic, 3 prioritisation, 1 clarity' },
      ],
      decision: {
        prompt: 'Revenue is up but profit is down due to a surge in variable shipping costs. What is the best immediate response?',
        options: ['Optimise logistics and renegotiate carrier rates', 'Cut all marketing spend', 'Sell the headquarters', 'Ignore the cost surge as long as revenue grows'],
        scoring: '15 pts for A with root-cause rationale; 9 pts for A without rationale; 3 pts for B if cost-cutting is noted but target is wrong; 0 otherwise.'
      },
      coach: {
        hint: '“Check if the problem is a "numerator" (revenue) or "denominator" (cost) issue.”',
        warning: '“Your tree might have overlaps; ensure each branch is distinct.”',
        correct: '“Correct: you isolated the driver that is actually destroying value.”',
        incorrect: '“Re-check your math; the profit change doesn’t match the revenue/cost delta.”'
      }
    },
    {
      title: 'Market Entry',
      stage: ModuleStage.integrated,
      skillTags: ['attractiveness', 'capability', 'entry-mode'],
      importableCount: 13,
      position: 11,
      learningObjective: 'Evaluate whether and how to enter a new market using a structured framework.',
      caseContext: 'A successful beverage company in Vietnam is considering entering the Thai market.',
      mcqs: [
        { q: 'The "Attractiveness" of a market includes', a: 'A', options: ['Market size, growth, and competitive intensity', 'Company’s current debt', 'Historical share price', 'Internal R&D budget'], rationale: 'Attractiveness is an external measure of the market opportunity.' },
        { q: 'A "Greenfield" entry mode means', a: 'C', options: ['Buying a competitor', 'Franchising only', 'Building operations from scratch', 'Exporting through a middleman'], rationale: 'Greenfield involves building everything from the ground up.' },
        { q: 'Which factor most likely reduces market attractiveness?', a: 'A', options: ['High barriers to entry and low margins', 'High growth rates', 'Weak competitors', 'Low tax rates'], rationale: 'Difficult entry and low returns make a market less appealing.' },
        { q: 'Capability fit asks', a: 'B', options: ['Is the market large?', 'Do we have the skills/assets to win?', 'Is the currency stable?', 'What is the tax rate?'], rationale: 'Capability fit is an internal assessment of the company’s strengths vs market needs.' },
        { q: 'An acquisition entry mode is often faster than greenfield but carries', a: 'A', options: ['Integration and overpayment risk', 'No risk', 'Zero cost', 'Lower debt automatically'], rationale: 'Merging cultures and systems is difficult and expensive.' },
      ],
      quantus: [
        { task: 'Calculate required market share for break-even', inputs: 'Fixed entry cost ₹500M; Contribution per unit ₹50; Total Market 50M units', formula: '(fixed_cost / contribution) / total_market', answer: '20% market share', difficulty: LevelDifficulty.hard },
        { task: 'Compare payback period: Greenfield vs Acquisition', inputs: 'Greenfield: Cost ₹200M, Year 1 Profit ₹40M; Acq: Cost ₹400M, Year 1 Profit ₹100M', formula: 'cost / annual_profit', answer: 'Greenfield 5 yrs; Acq 4 yrs', difficulty: LevelDifficulty.medium },
        { task: 'Estimate year 3 revenue with 5% share and 10% market growth', inputs: 'Current Market ₹1B; Share 5%; Growth 10% pa', formula: '1B * (1.1^3) * 0.05', answer: '₹66.55M', difficulty: LevelDifficulty.hard },
      ],
      canvas: [
        { task: 'Build a Market Entry Framework', expected: 'Market Attractiveness, Capability Fit, Entry Mode, Financials', rubric: '12 pts: 6 correct framework pillars, 3 logic, 2 completeness, 1 clarity' },
        { task: 'Mode Selection Canvas', expected: 'Compare Export, Licensing, JV, Acquisition, and Greenfield across Speed, Control, and Investment', rubric: '13 pts: 5 correct trade-off logic, 4 recommendation, 3 logic, 1 clarity' },
      ],
      decision: {
        prompt: 'The market is highly attractive but the company has no local distribution or brand presence. Which entry mode is safest?',
        options: ['Joint Venture or Acquisition of a local player', 'Aggressive Greenfield', 'Wait 10 years', 'Price at zero to win share'],
        scoring: '15 pts for A with capability-gap rationale; 9 pts for A without rationale; 3 pts for B if speed is noted but risk ignored; 0 otherwise.'
      },
      coach: {
        hint: '“Evaluate the market before you evaluate your own fit.”',
        warning: '“You might be ignoring the competitive response to your entry.”',
        correct: '“Correct: you matched the entry mode to the level of risk and capability.”',
        incorrect: '“Re-check the financial hurdle; the market share needed might be unrealistic.”'
      }
    },
    {
      title: 'Biotech Investment Case',
      stage: ModuleStage.integrated,
      skillTags: ['peak-sales', 'valuation', 'risk-adjustment'],
      importableCount: 13,
      position: 12,
      learningObjective: 'Model the value of a drug candidate using peak sales estimates and risk-adjusted NPV.',
      caseContext: 'A VC firm is evaluating a Phase II oncology drug with a 30% chance of reaching the market.',
      mcqs: [
        { q: 'Peak Sales usually occurs', a: 'B', options: ['In the first year of launch', 'Several years after launch once adoption plateaus', 'Before FDA approval', 'When the patent expires'], rationale: 'It takes time for doctors to adopt and for peak market penetration to be reached.' },
        { q: 'Risk-adjusted NPV (rNPV) accounts for', a: 'C', options: ['Only inflation', 'Only tax', 'Probability of clinical success at each stage', 'Share price only'], rationale: 'Biotech value depends heavily on the probability of passing clinical trials.' },
        { q: 'A "Phase II" drug typically has', a: 'A', options: ['Higher risk than Phase III', 'Lower risk than a marketed drug', 'Zero value', '100% success rate'], rationale: 'Success probabilities increase as a drug moves through later stages of testing.' },
        { q: 'The "Terminal Value" in biotech often assumes', a: 'B', options: ['Infinite growth', 'A sharp drop after patent expiry (the "patent cliff")', 'Zero tax', 'Fixed share count'], rationale: 'Generic competition usually erodes branded drug sales rapidly after patents expire.' },
        { q: 'The discount rate used for biotech is often higher because', a: 'A', options: ['The sector has higher technical and regulatory risk', 'The drugs are cheap', 'Tax rates are zero', 'Interest rates are low'], rationale: 'Higher risk requires a higher return (discount rate) to justify investment.' },
      ],
      quantus: [
        { task: 'Calculate Risk-Adjusted Value', inputs: 'Unadjusted NPV ₹1,000M; Probability of Success 30%', formula: 'npv * probability', answer: '₹300M', difficulty: LevelDifficulty.medium },
        { task: 'Estimate Peak Sales', inputs: 'Addressable Patients 100,000; Penetration 20%; Price ₹50,000', formula: 'patients * penetration * price', answer: '₹1,000M', difficulty: LevelDifficulty.medium },
        { task: 'Calculate Year 5 NPV at 15% discount rate', inputs: 'Year 5 Cash Flow ₹500M; Discount Factor 1.15^5', formula: '500 / (1.15^5)', answer: '₹248.6M', difficulty: LevelDifficulty.hard },
      ],
      canvas: [
        { task: 'Build the Biotech Valuation Bridge', expected: 'Patient Population → Treated Population → Peak Sales → rNPV → Final Valuation', rubric: '12 pts: 6 correct bridge flow, 3 risk logic, 2 completeness, 1 clarity' },
        { task: 'Clinical Milestone Map', expected: 'Phase I → Phase II → Phase III → NDA → Launch; assign typical success probabilities and value inflection points', rubric: '13 pts: 5 correct milestone logic, 4 probability estimates, 3 value logic, 1 clarity' },
      ],
      decision: {
        prompt: 'The rNPV is slightly positive but a competitor just released superior Phase III data for a similar drug. What is the best move?',
        options: ['Re-evaluate the peak sales penetration and terminal value assumptions', 'Invest more immediately', 'Ignore the competitor', 'Fire the R&D team'],
        scoring: '15 pts for A with competitive-reality rationale; 9 pts for A without rationale; 2 pts for B if "first-mover" is argued but risk missed; 0 otherwise.'
      },
      coach: {
        hint: '“The value is zero if the drug fails clinical trials; don’t forget the probability.”',
        warning: '“You might be overestimating peak penetration given the competitor data.”',
        correct: '“Correct: you adjusted the value for both time and technical risk.”',
        incorrect: '“Re-calculate the discount factor; the NPV should be lower for later cash flows.”'
      }
    }
  ];

  for (const m of modulesData) {
    const slug = m.title.toLowerCase().replace(/ /g, '-');
    const module = await prisma.module.upsert({
      where: { studyPlanId_slug: { studyPlanId: studyPlan.id, slug } },
      update: {
        stage: m.stage,
        skillTags: m.skillTags,
        importableCount: m.importableCount,
        position: m.position,
        description: m.learningObjective,
        learningObjective: m.learningObjective,
        caseContext: m.caseContext,
      },
      create: {
        studyPlanId: studyPlan.id,
        slug,
        title: m.title,
        description: m.learningObjective,
        learningObjective: m.learningObjective,
        caseContext: m.caseContext,
        stage: m.stage,
        skillTags: m.skillTags,
        importableCount: m.importableCount,
        position: m.position,
      },
    });

    // Create a default Topic for each module
    const topic = await prisma.topic.upsert({
      where: { moduleId_slug: { moduleId: module.id, slug: 'practice' } },
      update: {},
      create: {
        moduleId: module.id,
        slug: 'practice',
        title: 'Core Practice',
        position: 1,
      },
    });

    // Create Levels and Activities
    // We'll create one level per difficulty or just a general one
    const level = await prisma.level.upsert({
      where: { topicId_difficulty: { topicId: topic.id, difficulty: LevelDifficulty.easy } },
      update: {},
      create: {
        topicId: topic.id,
        difficulty: LevelDifficulty.easy,
        title: 'Fundamental Practice',
        position: 1,
      },
    });

    // 1. Lesson Activity
    const lessonActivity = await prisma.activity.upsert({
      where: { levelId_slug: { levelId: level.id, slug: 'lesson' } },
      update: {},
      create: {
        levelId: level.id,
        slug: 'lesson',
        title: 'Module Overview',
        type: ActivityType.lesson,
        position: 0,
      },
    });

    await prisma.activityVersion.create({
      data: {
        activityId: lessonActivity.id,
        version: 1,
        isPublished: true,
        contentJson: {
          itemType: 'lesson',
          moduleSlug: slug,
          title: m.title,
          learningObjective: m.learningObjective,
          caseContext: m.caseContext,
        },
        validationRulesJson: {},
      }
    });

    // 2. MCQ Activities (5 items)
    for (let i = 0; i < m.mcqs.length; i++) {
      const mcq = m.mcqs[i];
      const mcqSlug = `mcq-${i + 1}`;
      const activity = await prisma.activity.upsert({
        where: { levelId_slug: { levelId: level.id, slug: mcqSlug } },
        update: {},
        create: {
          levelId: level.id,
          slug: mcqSlug,
          title: `Knowledge Check ${i + 1}`,
          type: ActivityType.mcq,
          position: 10 + i,
        },
      });

      await prisma.activityVersion.create({
        data: {
          activityId: activity.id,
          version: 1,
          isPublished: true,
          contentJson: {
            itemType: 'mcq',
            moduleSlug: slug,
            prompt: mcq.q,
            options: mcq.options,
            correctAnswer: mcq.a,
            rationale: mcq.rationale,
            coach: m.coach,
            skillTags: m.skillTags,
          },
          validationRulesJson: { correctAnswer: mcq.a },
        }
      });
    }

    // 3. Quantus Activities (3 items)
    for (let i = 0; i < m.quantus.length; i++) {
      const q = m.quantus[i];
      const qSlug = `quantus-${i + 1}`;
      const activity = await prisma.activity.upsert({
        where: { levelId_slug: { levelId: level.id, slug: qSlug } },
        update: {},
        create: {
          levelId: level.id,
          slug: qSlug,
          title: q.task,
          type: ActivityType.spreadsheet,
          position: 20 + i,
        },
      });

      await prisma.activityVersion.create({
        data: {
          activityId: activity.id,
          version: 1,
          isPublished: true,
          contentJson: {
            itemType: 'spreadsheet',
            moduleSlug: slug,
            prompt: q.task,
            inputs: q.inputs,
            expectedFormula: q.formula,
            expectedAnswer: q.answer,
            difficulty: q.difficulty,
            coach: m.coach,
            skillTags: m.skillTags,
          },
          validationRulesJson: { expectedFormula: q.formula, expectedAnswer: q.answer },
        }
      });
    }

    // 4. Canvas Activities (2 items)
    for (let i = 0; i < m.canvas.length; i++) {
      const c = m.canvas[i];
      const cSlug = `canvas-${i + 1}`;
      const activity = await prisma.activity.upsert({
        where: { levelId_slug: { levelId: level.id, slug: cSlug } },
        update: {},
        create: {
          levelId: level.id,
          slug: cSlug,
          title: c.task,
          type: ActivityType.canvas,
          position: 30 + i,
        },
      });

      await prisma.activityVersion.create({
        data: {
          activityId: activity.id,
          version: 1,
          isPublished: true,
          contentJson: {
            itemType: 'canvas',
            moduleSlug: slug,
            prompt: c.task,
            expectedStructure: c.expected,
            scoringRubric: c.rubric,
            coach: m.coach,
            skillTags: m.skillTags,
          },
          validationRulesJson: { rubric: c.rubric },
        }
      });
    }

    // 5. Final Decision Activity (1 item)
    const decisionActivity = await prisma.activity.upsert({
      where: { levelId_slug: { levelId: level.id, slug: 'final-decision' } },
      update: {},
      create: {
        levelId: level.id,
        slug: 'final-decision',
        title: 'Final Decision',
        type: ActivityType.decision,
        position: 40,
      },
    });

    await prisma.activityVersion.create({
      data: {
        activityId: decisionActivity.id,
        version: 1,
        isPublished: true,
        contentJson: {
          itemType: 'decision',
          moduleSlug: slug,
          prompt: m.decision.prompt,
          options: m.decision.options,
          scoring: m.decision.scoring,
          coach: m.coach,
          skillTags: m.skillTags,
        },
        validationRulesJson: { scoring: m.decision.scoring },
      }
    });
  }

  console.log('Seed completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
