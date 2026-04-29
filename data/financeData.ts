export type ExerciseType = "excel" | "select" | "dropdown" | "canvas";

export interface DragItem {
  id: string;
  label: string;
  type: "shape" | "rectangle" | "ellipse" | "diamond" | "equation";
  content: string;
}

export interface DragCategory {
  category: string;
  items: DragItem[];
}

export interface ExerciseConfig {
  type: ExerciseType;
  question: string;
  table?: (string | number | null)[][];
  // tables: For 'excel' with multiple tables (tabs)
  tables?: {
    name: string;
    table: (string | number | null)[][];
    inputs?: {
      row: number;
      col: number;
      correctValue: string | number;
      type?: "number" | "text";
      placeholder?: string;
    }[];
    dropdowns?: {
      row: number;
      col: number;
      options: string[];
      correctValue: string;
    }[];
  }[];
  // inputs: For 'excel', specifies which cells are editable and their correct values
  inputs?: {
    row: number;
    col: number;
    correctValue: string | number;
    type?: "number" | "text";
    placeholder?: string;
  }[];
  // options: For 'select', specifies the choices
  options?: {
    id: string;
    label: string;
    isCorrect: boolean;
  }[];
  // dropdowns: For 'dropdown', specifies options for specific cells
  dropdowns?: {
    row: number;
    col: number;
    options: string[];
    correctValue: string;
  }[];
  // canvas: For 'canvas' interactive maps
  canvasBackgroundText?: string;
  canvasDraggableElements?: {
    category: string;
    items: {
      id: string;
      label: string;
      type: "shape" | "rectangle" | "ellipse" | "diamond" | "equation";
      content: string; // The text to display in the shape
    }[];
  }[];
}

export interface Lesson {
  id: string;
  slug: string;
  category: "balance-sheet" | "income-statement" | "cash-flow";
  categoryDisplay: string;
  title: string;
  explanation: string;
  definitions: { term: string; definition: string }[];
  instructions: string;
  exercise: ExerciseConfig;
}

export const financeData: Lesson[] = [
  {
    id: "bs-1",
    slug: "intro-to-assets",
    category: "balance-sheet",
    categoryDisplay: "Balance Sheet",
    title: "Introduction to Assets",
    explanation:
      "Assets are resources owned by a business that have future economic value. They are typically categorized into Current Assets (expected to be converted to cash within a year) and Non-Current Assets (long-term investments or physical property).",
    definitions: [
      {
        term: "Current Assets",
        definition:
          "Cash and other assets expected to be converted to cash or used up within one year.",
      },
      {
        term: "Non-Current Assets",
        definition: "Long-term investments, property, plant, and equipment.",
      },
    ],
    instructions:
      "Identify the total current assets by filling in the missing values in the balance sheet fragment below.",
    exercise: {
      type: "excel",
      question: "Complete the Current Assets section of the Balance Sheet.",
      table: [
        ["Account", "Amount ($)"],
        ["Cash", null],
        ["Accounts Receivable", 15000],
        ["Inventory", null],
        ["Total Current Assets", null],
      ],
      inputs: [
        {
          row: 1,
          col: 1,
          correctValue: 25000,
          type: "number",
          placeholder: "Enter Cash",
        },
        {
          row: 3,
          col: 1,
          correctValue: 10000,
          type: "number",
          placeholder: "Enter Inventory",
        },
        {
          row: 4,
          col: 1,
          correctValue: 50000,
          type: "number",
          placeholder: "Sum total",
        },
      ],
    },
  },
  {
    id: "bs-2",
    slug: "classify-assets-liabilities",
    category: "balance-sheet",
    categoryDisplay: "Balance Sheet",
    title: "Classifying Assets and Liabilities",
    explanation:
      "The fundamental accounting equation is Assets = Liabilities + Equity. Distinguishing between what a company owns (Assets) and what it owes (Liabilities) is crucial.",
    definitions: [
      {
        term: "Liabilities",
        definition: "Obligations the company owes to outside parties.",
      },
      {
        term: "Equity",
        definition:
          "The owners' residual interest in the assets after deducting liabilities.",
      },
    ],
    instructions:
      "Classify each item as either an Asset or a Liability using the dropdown menus.",
    exercise: {
      type: "dropdown",
      question: "Classify the following accounts.",
      table: [
        ["Account", "Classification"],
        ["Accounts Payable", null],
        ["Buildings", null],
        ["Bank Loan", null],
        ["Cash on Hand", null],
      ],
      dropdowns: [
        {
          row: 1,
          col: 1,
          options: ["Asset", "Liability"],
          correctValue: "Liability",
        },
        {
          row: 2,
          col: 1,
          options: ["Asset", "Liability"],
          correctValue: "Asset",
        },
        {
          row: 3,
          col: 1,
          options: ["Asset", "Liability"],
          correctValue: "Liability",
        },
        {
          row: 4,
          col: 1,
          options: ["Asset", "Liability"],
          correctValue: "Asset",
        },
      ],
    },
  },

  {
    id: "bs-assets-detail",
    slug: "non-current-assets",
    category: "balance-sheet",
    categoryDisplay: "Balance Sheet",
    title: "Non-Current Assets & Depreciation",
    explanation:
      'Non-current assets (also called fixed assets) are long-term resources like buildings and machinery. Over time, these assets lose value through "Depreciation". The Book Value is the original cost minus the Accumulated Depreciation.',
    definitions: [
      {
        term: "PPE",
        definition:
          "Property, Plant, and Equipment - the physical assets of a company.",
      },
      {
        term: "Accumulated Depreciation",
        definition:
          "The total amount of an asset's cost that has been allocated to expense since the asset was put into service.",
      },
      {
        term: "Net Book Value",
        definition:
          "The value at which an asset is carried on the balance sheet (Cost - Acc. Depreciation).",
      },
    ],
    instructions: "Calculate the Net Book Value for the following assets.",
    exercise: {
      type: "excel",
      question: "Complete the Fixed Assets section.",
      table: [
        [
          "Asset Type",
          "Historical Cost",
          "Acc. Depreciation",
          "Net Book Value",
        ],
        ["Delivery Van", 45000, 12000, null],
        ["Office Furniture", 15000, 3500, null],
        ["Total Fixed Assets", null, null, null],
      ],
      inputs: [
        { row: 1, col: 3, correctValue: 33000, type: "number" },
        { row: 2, col: 3, correctValue: 11500, type: "number" },
        { row: 3, col: 1, correctValue: 60000, type: "number" },
        { row: 3, col: 2, correctValue: 15500, type: "number" },
        { row: 3, col: 3, correctValue: 44500, type: "number" },
      ],
    },
  },
  {
    id: "bs-liab-detail",
    slug: "liabilities-classification",
    category: "balance-sheet",
    categoryDisplay: "Balance Sheet",
    title: "Current vs Long-Term Liabilities",
    explanation:
      "Liabilities are obligations a company owes. Current liabilities are due within one year (e.g., Accounts Payable), while Long-term liabilities are due after one year (e.g., Mortgage).",
    definitions: [
      {
        term: "Accounts Payable",
        definition:
          "Money owed by a company to its creditors for goods/services.",
      },
      {
        term: "Bonds Payable",
        definition: "Long-term debt securities issued by a company.",
      },
      {
        term: "Current Maturity",
        definition:
          "The portion of long-term debt that is due within the next 12 months.",
      },
    ],
    instructions: "Classify each liability as either Current or Long-term.",
    exercise: {
      type: "dropdown",
      question: "Identify the liability type.",
      table: [
        ["Liability Account", "Classification"],
        ["Wages Payable", null],
        ["Bonds Payable (10-year)", null],
        ["Income Tax Payable", null],
        ["Mortgage Payable", null],
      ],
      dropdowns: [
        {
          row: 1,
          col: 1,
          options: ["Current", "Long-term"],
          correctValue: "Current",
        },
        {
          row: 2,
          col: 1,
          options: ["Current", "Long-term"],
          correctValue: "Long-term",
        },
        {
          row: 3,
          col: 1,
          options: ["Current", "Long-term"],
          correctValue: "Current",
        },
        {
          row: 4,
          col: 1,
          options: ["Current", "Long-term"],
          correctValue: "Long-term",
        },
      ],
    },
  },
  {
    id: "bs-equity-detail",
    slug: "shareholders-equity",
    category: "balance-sheet",
    categoryDisplay: "Balance Sheet",
    title: "Understanding Shareholders' Equity",
    explanation:
      "Equity represents the owners' claim on the assets. It mainly consists of Capital Contributed by owners and Retained Earnings (profits kept in the business).",
    definitions: [
      {
        term: "Common Stock",
        definition: "Value of shares issued to shareholders.",
      },
      {
        term: "Retained Earnings",
        definition:
          "Cumulative net income minus dividends paid since inception.",
      },
      {
        term: "Dividends",
        definition: "Distributions of earnings to shareholders.",
      },
    ],
    instructions: "Calculate the Ending Retained Earnings for the year.",
    exercise: {
      type: "excel",
      question: "Compute Retained Earnings.",
      table: [
        ["Item", "Amount ($)"],
        ["Beginning Retained Earnings", 120000],
        ["Net Income for Year", 35000],
        ["Dividends Paid", 10000],
        ["Ending Retained Earnings", null],
      ],
      inputs: [
        {
          row: 4,
          col: 1,
          correctValue: 145000,
          type: "number",
          placeholder: "Sum result",
        },
      ],
    },
  },
  {
    id: "bs-valuation",
    slug: "market-vs-book-value",
    category: "balance-sheet",
    categoryDisplay: "Balance Sheet",
    title: "Market Value vs. Book Value",
    explanation:
      "Book value corresponds to the equity value shown on the balance sheet. Market value (or Market Cap) is what the stock market thinks the company is worth, which often includes intangible assets like brand value or future growth potential.",
    definitions: [
      {
        term: "Market Capitalization",
        definition: "Share Price x Total Number of Shares.",
      },
      {
        term: "Intangible Assets",
        definition:
          "Non-physical assets like patents, trademarks, and brand recognition.",
      },
      {
        term: "Premium",
        definition:
          "The difference when market value is significantly higher than book value.",
      },
    ],
    instructions: "Calculate the Market Capitalization of the company.",
    exercise: {
      type: "excel",
      question: "Market Cap Calculation.",
      table: [
        ["Variable", "Value"],
        ["Total Shares Outstanding", 1000000],
        ["Current Share Price ($)", 45],
        ["Market Capitalization", null],
        ["Book Value of Equity", 30000000],
      ],
      inputs: [{ row: 3, col: 1, correctValue: 45000000, type: "number" }],
    },
  },
  {
    id: "is-operating",
    slug: "operating-profit-ebit",
    category: "income-statement",
    categoryDisplay: "Income Statement",
    title: "Operating Profit (EBIT)",
    explanation:
      "Operating profit, or EBIT (Earnings Before Interest and Taxes), measures the profit generated from core business operations, excluding the effects of financing and taxes.",
    definitions: [
      {
        term: "Gross Profit",
        definition: "Revenue minus Cost of Goods Sold (COGS).",
      },
      {
        term: "Operating Expenses",
        definition:
          "Costs required to run the day-to-day operations (SG&A, R&D).",
      },
      {
        term: "EBIT",
        definition:
          "Operating Income - the core profitability of the business model.",
      },
    ],
    instructions: "Calculate the EBIT using the information provided.",
    exercise: {
      type: "excel",
      question: "Income Statement Flow.",
      table: [
        ["Line Item", "Amount ($)"],
        ["Gross Profit", 500000],
        ["Selling & Admin Expenses", 120000],
        ["R&D Expenses", 80000],
        ["Operating Profit (EBIT)", null],
      ],
      inputs: [{ row: 4, col: 1, correctValue: 300000, type: "number" }],
    },
  },
  {
    id: "cf-classification",
    slug: "cash-flow-classification",
    category: "cash-flow",
    categoryDisplay: "Cash Flow Statement",
    title: "Cash Flow Activity Classification",
    explanation:
      "The Cash Flow Statement groups cash movements into three categories: Operating (core business), Investing (buying/selling assets), and Financing (debt/equity transactions).",
    definitions: [
      {
        term: "Operating Activities",
        definition: "Cash from day-to-day business (e.g., selling goods).",
      },
      {
        term: "Investing Activities",
        definition: "Cash for long-term assets (e.g., buying a factory).",
      },
      {
        term: "Financing Activities",
        definition:
          "Cash from/to owners and creditors (e.g., paying dividends).",
      },
    ],
    instructions:
      "Classify each transaction into its correct Cash Flow category.",
    exercise: {
      type: "dropdown",
      question: "Identify the Cash Flow type.",
      table: [
        ["Transaction", "Flow Category"],
        ["Cash received from customers", null],
        ["Purchase of new machinery", null],
        ["Issuance of common stock", null],
        ["Payment of bank loan interest", null],
      ],
      dropdowns: [
        {
          row: 1,
          col: 1,
          options: ["Operating", "Investing", "Financing"],
          correctValue: "Operating",
        },
        {
          row: 2,
          col: 1,
          options: ["Investing", "Financing", "Operating"],
          correctValue: "Investing",
        },
        {
          row: 3,
          col: 1,
          options: ["Financing", "Operating", "Investing"],
          correctValue: "Financing",
        },
        {
          row: 4,
          col: 1,
          options: ["Operating", "Investing", "Financing"],
          correctValue: "Operating",
        },
      ],
    },
  },
  {
    id: "cf-journal-entries",
    slug: "journal-entry-debit-credit",
    category: "cash-flow",
    categoryDisplay: "Cash Flow Statement",
    title: "Journal Entry Fundamentals",
    explanation:
      'Every transaction in accounting is recorded as a journal entry with debits and credits. The fundamental principle is that every debit must have an equal and opposite credit - this is called the "Double-Entry Bookkeeping" system.',
    definitions: [
      {
        term: "Debit",
        definition:
          "An entry made to the left side of an account; increases assets and expenses, decreases liabilities and equity.",
      },
      {
        term: "Credit",
        definition:
          "An entry made to the right side of an account; increases liabilities and equity, decreases assets and expenses.",
      },
      {
        term: "Journal Entry",
        definition:
          "A record of a business transaction showing debits and credits for each account affected.",
      },
    ],
    instructions:
      "Fill in the debit and credit amounts for the journal entry when the company receives $25,000 cash from a customer for services rendered.",
    exercise: {
      type: "excel",
      question: "Record the Journal Entry for cash receipt from customer.",
      table: [
        ["Account", "Debit ($)", "Credit ($)"],
        ["Cash", null, null],
        ["Service Revenue", null, null],
      ],
      inputs: [
        {
          row: 1,
          col: 1,
          correctValue: 25000,
          type: "number",
          placeholder: "Debit amount",
        },
        {
          row: 2,
          col: 2,
          correctValue: 25000,
          type: "number",
          placeholder: "Credit amount",
        },
      ],
    },
  },
  {
    id: "cf-canvas-1",
    slug: "map-income-statement",
    category: "income-statement",
    categoryDisplay: "Income Statement",
    title: "Income Statement Flowchart (Canvas)",
    explanation: "The Income Statement flows sequentially from Top Line (Revenue) down to Bottom Line (Net Income). Draw the flow logically on the canvas.",
    definitions: [
      { term: "Top Line", definition: "Gross Revenue before any deductions." },
      { term: "Bottom Line", definition: "Net Income after all expenses and taxes." }
    ],
    instructions: "Freely draw on the canvas using the pen tool, squares, and text to map out how Revenue drops down through Expenses to become Net Income. Click Check Answer when you have finished drawing.",
    exercise: {
      type: "canvas",
      question: "Sketch the flowchart for calculating Net Income.",
      canvasBackgroundText: "Use the pen and shape tools to draw your Income Statement flow.",
      canvasDraggableElements: [
        {
          category: "Shapes",
          items: [
            { id: "rev", label: "Revenue", type: "rectangle", content: "Revenue" },
            { id: "cogs", label: "COGS", type: "ellipse", content: "COGS" },
            { id: "gp", label: "Gross Profit", type: "diamond", content: "Gross Profit" },
            { id: "opex", label: "Op. Expenses", type: "rectangle", content: "Operating Expenses" },
            { id: "ebit", label: "EBIT", type: "ellipse", content: "EBIT" },
            { id: "int", label: "Interest", type: "diamond", content: "Interest" },
            { id: "tax", label: "Taxes", type: "diamond", content: "Taxes" },
            { id: "ni", label: "Net Income", type: "rectangle", content: "Net Income" },
          ]
        },
        {
          category: "Equations",
          items: [
            { id: "eq1", label: "GP Calc", type: "equation", content: "Revenue - COGS = Gross Profit" },
            { id: "eq2", label: "EBIT Calc", type: "equation", content: "Gross Profit - OpEx = EBIT" },
            { id: "eq3", label: "EBT Calc", type: "equation", content: "EBIT - Interest = EBT" },
            { id: "eq4", label: "NI Calc", type: "equation", content: "EBT - Taxes = Net Income" },
          ]
        }
      ]
    }
  }
];
