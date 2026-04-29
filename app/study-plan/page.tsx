"use client";

import React, { useState } from "react";

import { SplitLayout } from "@/components/layout/SplitLayout";
import { StudyIntroPage } from "@/components/study-plan/StudyIntroPage";
import { ExercisePanel } from "@/components/exercise/ExercisePanel";
import { CanvasExerciseView } from "@/components/exercise/CanvasExerciseView";
import { MainLayout } from "@/components/layout/MainLayout";
import { ExerciseConfig, financeData } from "@/data/financeData";
import { ChevronDown, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/layout/Logo";


const modelingToolkit = [
  {
    category: "Financial Blocks",
    items: [
      { id: "rev", label: "Revenue", type: "rectangle" as const, content: "Revenue" },
      { id: "cogs", label: "COGS", type: "ellipse" as const, content: "COGS" },
      { id: "gp", label: "Gross Profit", type: "diamond" as const, content: "Gross Profit" },
      { id: "opex", label: "Op. Expenses", type: "rectangle" as const, content: "Operating Expenses" },
      { id: "ebit", label: "EBIT", type: "ellipse" as const, content: "EBIT" },
      { id: "ni", label: "Net Income", type: "rectangle" as const, content: "Net Income" },
    ]
  },
  {
    category: "Calculations",
    items: [
      { id: "eq1", label: "GP Calc", type: "equation" as const, content: "Revenue - COGS" },
      { id: "eq2", label: "EBIT Calc", type: "equation" as const, content: "GP - OpEx" },
      { id: "eq3", label: "NI Calc", type: "equation" as const, content: "EBIT - Interest - Tax" },
    ]
  }
];

// Full 3-Statement Financial Model
const fullFinancialModelExercise: ExerciseConfig = {
  type: "excel",
  question: "Analyze the 3-statement model and calculate the missing 'Actual 2020' totals for Gross Profit, EBIT, Net Income, Total Current Assets, and Total Assets.",
  table: [
    ["Assumptions & Drivers", "Actual", "", "", "Forecast", "", ""],
    ["Metrics", "2020", "2021", "2022", "2023", "2024", "2025"],
    ["Income Statement Drivers", "", "", "", "", "", ""],
    ["Sales YoY Growth", "", "", "", "", "", ""],
    ["Gross Margin", "", "", "", "", "", ""],
    ["Depreciation Expense (% of Revenue)", "", "", "", "", "", ""],
    ["Marketing Expense (Fixed)", "15750", "17801", "20656", "18069", "19876", "21863"],
    ["Int. Rate (% of Debt)", "", "", "", "6.20%", "6.20%", "6.20%"],
    ["Tax Rate (%)", "", "", "", "", "", ""],
    ["", "", "", "", "", "", ""],
    ["Balance Sheet Drivers", "", "", "", "", "", ""],
    ["Days in Period", "365", "365", "365", "365", "365", "365"],
    ["Long-term Debt", "13400", "13400", "13400", "20000", "25000", "28000"],
    ["", "", "", "", "", "", ""],
    ["Income Statement", "Actual", "", "", "Forecast", "", ""],
    ["$ in thousands", "2020", "2021", "2022", "2023", "2024", "2025"],
    ["Revenue", "54553", "58088", "62368", "", "", ""],
    ["Cost of Goods Sold", "25541", "25297", "26558", "", "", ""],
    ["Gross Profit", null, "32791", "35810", "", "", ""],
    ["", "", "", "", "", "", ""],
    ["Operating Expenses", "", "", "", "", "", ""],
    ["Depreciation and Amortization", "1983", "1878", "1948", "", "", ""],
    ["General and Administration", "3942", "4302", "4131", "", "", ""],
    ["Marketing and Promotion", "15750", "17801", "20656", "", "", ""],
    ["Other Operating Expenses", "1182", "1294", "1357", "", "", ""],
    ["Total Operating Expenses", "22857", "25275", "28092", "", "", ""],
    ["", "", "", "", "", "", ""],
    ["EBIT (Operating Income)", null, "7516", "7718", "", "", ""],
    ["Interest", "831", "831", "831", "", "", ""],
    ["Income Before Taxes", "5324", "6685", "6887", "", "", ""],
    ["Taxes", "1850", "1627", "1052", "", "", ""],
    ["", "", "", "", "", "", ""],
    ["Net Income", null, "5058", "5835", "", "", ""],
    ["Common Dividends", "2889", "2820", "1964", "", "", ""],
    ["", "", "", "", "", "", ""],
    ["Balance Sheet", "Actual", "", "", "Forecast", "", ""],
    ["ASSETS", "2020", "2021", "2022", "2023", "2024", "2025"],
    ["Current Assets", "", "", "", "", "", ""],
    ["Cash", "3544", "3964", "6807", "", "", ""],
    ["Accounts Receivable", "8499", "9430", "9863", "", "", ""],
    ["Inventories", "4803", "5153", "5384", "", "", ""],
    ["Total Current Assets", null, "18547", "22054", "", "", ""],
    ["", "", "", "", "", "", ""],
    ["Non-Current Assets", "", "", "", "", "", ""],
    ["Property Plant and Equipment", "12906", "13649", "14187", "", "", ""],
    ["Total Assets", null, "32196", "36241", "", "", ""],
    ["", "", "", "", "", "", ""],
    ["LIABILITIES AND EQUITY", "", "", "", "", "", ""],
    ["Current Liabilities", "", "", "", "", "", ""],
    ["Accounts Payable", "6701", "7038", "7422", "", "", ""],
    ["Other Current Liabilities", "729", "599", "389", "", "", ""],
    ["Total Current Liabilities", "7430", "7637", "7811", "", "", ""],
    ["", "", "", "", "", "", ""],
    ["Non-Current Liabilities", "", "", "", "", "", ""],
    ["Long-term Debt", "13400", "13400", "13400", "", "", ""],
    ["Total Liabilities", "20830", "21037", "21211", "", "", ""],
    ["", "", "", "", "", "", ""],
    ["Shareholders' Equity", "", "", "", "", "", ""],
    ["Common Stock", "5110", "5110", "5110", "", "", ""],
    ["Retained Earnings", "3812", "6049", "9920", "", "", ""],
    ["Total Shareholders' Equity", "8922", "11159", "15030", "", "", ""],
    ["", "", "", "", "", "", ""],
    ["TOTAL LIABILITIES & EQUITY", "29752", "32196", "36241", "", "", ""],
    ["Check", "0", "0", "0", "", "", ""],
    ["", "", "", "", "", "", ""],
    ["Cash Flow Statement", "Actual", "", "", "Forecast", "", ""],
    ["", "2020", "2021", "2022", "2023", "2024", "2025"],
    ["Cash Flows from Operating Activities", "", "", "", "", "", ""],
    ["Net Income", "3474", "5058", "5835", "", "", ""],
    ["Depreciation", "1983", "1878", "1948", "", "", ""],
    ["Changes in Working Capital", "", "", "", "", "", ""],
    ["Accounts Receivables", "-858", "-931", "-434", "", "", ""],
    ["Inventories", "-315", "-350", "-231", "", "", ""],
    ["Account Payables", "328", "337", "384", "", "", ""],
    ["Other Current Liabilities", "34", "-130", "-210", "", "", ""],
    ["Net Cash from Operating Activities", "4646", "5862", "7292", "", "", ""],
    ["", "", "", "", "", "", ""],
    ["Investing Activities", "", "", "", "", "", ""],
    ["Net Addition to PP&E", "-2013", "-2620", "-2486", "", "", ""],
    ["Cash Flows from Investing Activities", "-2013", "-2620", "-2486", "", "", ""],
    ["", "", "", "", "", "", ""],
    ["Financing Activities", "", "", "", "", "", ""],
    ["Issuance of Common Stock", "0", "0", "0", "", "", ""],
    ["Payment to Dividends", "-2889", "-2820", "-1964", "", "", ""],
    ["Net Addition to Long-term Debt", "0", "0", "0", "", "", ""],
    ["Cash Flows from Financing Activities", "-2889", "-2820", "-1964", "", "", ""],
    ["", "", "", "", "", "", ""],
    ["Increase/(Decrease) in Cash", "-256", "422", "2842", "", "", ""],
    ["Cash, Beginning of Year", "3800", "3544", "3965", "", "", ""],
    ["Cash, End of Year", "3544", "3966", "6807", "", "", ""],
    ["", "", "", "", "", "", ""],
    ["Supporting Schedules", "Actual", "", "", "Forecast", "", ""],
    ["", "2020", "2021", "2022", "2023", "2024", "2025"],
    ["Property Plant and Equipment (PP&E)", "", "", "", "", "", ""],
    ["Beginning PP&E", "12876", "12907", "13649", "", "", ""],
    ["Capital Expenditures", "2013", "2620", "2486", "", "", ""],
    ["Depreciation Expense", "1983", "1878", "1948", "", "", ""],
    ["Ending PP&E", "12906", "13649", "14187", "", "", ""],
    ["", "", "", "", "", "", ""],
    ["Retained Earnings", "", "", "", "", "", ""],
    ["Beginning Balance", "3227", "3812", "6049", "", "", ""],
    ["Net Income", "3474", "5058", "5835", "", "", ""],
    ["Dividends", "2889", "2820", "1964", "", "", ""],
    ["Ending Balance", "3812", "6049", "9920", "", "", ""],
  ],
  inputs: [
    { row: 18, col: 1, correctValue: 29012, type: "number", placeholder: "Revenue - COGS" },
    { row: 27, col: 1, correctValue: 6155, type: "number", placeholder: "Gross Profit - OpEx" },
    { row: 32, col: 1, correctValue: 3474, type: "number", placeholder: "Inc Before Tax - Tax" },
    { row: 41, col: 1, correctValue: 16846, type: "number", placeholder: "Sum of Cur. Assets" },
    { row: 45, col: 1, correctValue: 29752, type: "number", placeholder: "Current + Non-Current" },
  ],
};

// Apple Financial Modeling Exercise - Multiple Tables
const appleFinancialExercise: ExerciseConfig = {
  type: "excel",
  question:
    "Complete Apple's 3-Statement Financial Model for 2019–2021 using historical data (2016–2018) and provided growth assumptions. Forecast the Income Statement, Balance Sheet, and Cash Flow Statement, completing all highlighted cells.",
  tables: [
    {
      name: "Income Statement",
      table: [
        ["Income Statement", "2016", "2017", "2018", "2019", "2020", "2021"],
        ["Revenue", "215,639", "229,234", "265,595", "", "", ""],
        ["Cost of Revenue", "131,376", "141,048", "163,756", "", "", ""],
        ["Gross Profit", "84,263", "88,186", "101,839", "", "", ""],
        ["Gross Margin %", "39.1%", "38.4%", "38.3%", "", "", ""],
        ["R&D", "10,045", "11,581", "14,236", "", "", ""],
        ["SG&A", "15,685", "16,705", "16,705", "", "", ""],
        ["Operating Expenses", "25,730", "28,286", "30,941", "", "", ""],
        ["EBITDA", "58,533", "59,900", "70,898", "", "", ""],
        ["D&A", "10,505", "10,717", "10,903", "", "", ""],
        ["EBIT", "48,028", "49,183", "59,995", "", "", ""],
        ["Interest Income", "1,076", "1,115", "1,970", "", "", ""],
        ["Interest Expense", "1,283", "1,456", "1,615", "", "", ""],
        ["EBT", "47,821", "48,842", "60,350", "", "", ""],
        ["Tax Rate", "13.4%", "13.4%", "13.4%", "15.0%", "15.0%", "15.0%"],
        ["Taxes", "6,409", "6,545", "8,087", "", "", ""],
        ["Net Income", "41,412", "42,297", "52,263", "", "", ""],
      ],
      inputs: [
        {
          row: 1,
          col: 4,
          correctValue: "281,461",
          placeholder: "Revenue 2019",
        },
        {
          row: 1,
          col: 5,
          correctValue: "294,535",
          placeholder: "Revenue 2020",
        },
        {
          row: 1,
          col: 6,
          correctValue: "309,150",
          placeholder: "Revenue 2021",
        },
        { row: 2, col: 4, correctValue: "163,756", placeholder: "CoR 2019" },
        { row: 2, col: 5, correctValue: "171,468", placeholder: "CoR 2020" },
        { row: 2, col: 6, correctValue: "179,987", placeholder: "CoR 2021" },
      ],
    },
    {
      name: "Balance Sheet",
      table: [
        ["Balance Sheet", "2016", "2017", "2018", "2019", "2020", "2021"],
        ["ASSETS", "", "", "", "", "", ""],
        ["Cash & Equivalents", "20,484", "49,771", "25,913", "", "", ""],
        ["Accounts Receivable", "15,754", "17,874", "23,186", "", "", ""],
        ["Inventory", "2,132", "4,061", "3,956", "", "", ""],
        ["Other Current Assets", "13,936", "12,870", "12,087", "", "", ""],
        ["Total Current Assets", "52,306", "84,576", "65,142", "", "", ""],
        ["PP&E, net", "84,809", "107,813", "98,316", "", "", ""],
        ["Goodwill", "15,934", "15,934", "15,934", "", "", ""],
        ["Other Intangibles", "3,922", "3,806", "3,693", "", "", ""],
        ["Other Assets", "10,559", "11,835", "13,882", "", "", ""],
        ["Total Assets", "167,530", "223,964", "196,967", "", "", ""],
        ["LIABILITIES", "", "", "", "", "", ""],
        ["Accounts Payable", "22,058", "28,102", "55,888", "", "", ""],
        ["Accrued Expenses", "8,577", "7,932", "12,352", "", "", ""],
        ["Current Portion LT Debt", "3,500", "3,500", "8,784", "", "", ""],
        ["Other Current Liabilities", "10,111", "7,946", "9,252", "", "", ""],
        ["Total Current Liabilities", "44,246", "47,480", "86,276", "", "", ""],
        ["Long-term Debt", "28,658", "79,031", "93,736", "", "", ""],
        ["Other Long-term Liabilities", "9,637", "9,100", "8,905", "", "", ""],
        ["Total Liabilities", "82,541", "135,611", "188,917", "", "", ""],
        ["EQUITY", "", "", "", "", "", ""],
        ["Common Stock", "25,814", "31,251", "35,867", "", "", ""],
        ["Retained Earnings", "85,794", "84,605", "72,183", "", "", ""],
        ["Total Equity", "111,608", "115,856", "108,050", "", "", ""],
        [
          "Total Liabilities & Equity",
          "194,149",
          "251,467",
          "296,967",
          "",
          "",
          "",
        ],
      ],
      inputs: [
        { row: 2, col: 4, correctValue: "28,950", placeholder: "Cash 2019" },
        { row: 3, col: 4, correctValue: "24,599", placeholder: "AR 2019" },
        { row: 4, col: 4, correctValue: "4,106", placeholder: "Inv 2019" },
      ],
    },
    {
      name: "D&A Schedule",
      table: [
        ["D&A Schedule", "2016", "2017", "2018", "2019", "2020", "2021"],
        ["Equipment D&A", "4,200", "4,350", "4,500", "", "", ""],
        ["Building D&A", "2,100", "2,100", "2,100", "", "", ""],
        ["Software D&A", "1,500", "1,550", "1,603", "", "", ""],
        ["Leasehold D&A", "2,705", "2,717", "2,700", "", "", ""],
        ["Total D&A", "10,505", "10,717", "10,903", "", "", ""],
      ],
      inputs: [
        {
          row: 1,
          col: 4,
          correctValue: "4,650",
          placeholder: "Equipment D&A 2019",
        },
        {
          row: 2,
          col: 4,
          correctValue: "2,100",
          placeholder: "Building D&A 2019",
        },
      ],
    },
    {
      name: "Interest Schedule",
      table: [
        ["Interest Schedule", "2016", "2017", "2018", "2019", "2020", "2021"],
        ["Beginning Debt", "28,658", "28,658", "79,031", "", "", ""],
        ["Interest Rate", "2.5%", "2.5%", "2.0%", "1.8%", "1.8%", "1.8%"],
        ["Interest Expense", "", "", "", "", "", ""],
        ["Cash Interest Paid", "1,283", "1,456", "1,615", "", "", ""],
        [
          "Interest Income Rate",
          "1.2%",
          "1.3%",
          "1.8%",
          "2.0%",
          "2.0%",
          "2.0%",
        ],
        ["Interest Income", "1,076", "1,115", "1,970", "", "", ""],
      ],
      inputs: [
        {
          row: 3,
          col: 4,
          correctValue: "1,422",
          placeholder: "Interest Exp 2019",
        },
        {
          row: 5,
          col: 4,
          correctValue: "2,182",
          placeholder: "Interest Inc 2019",
        },
      ],
    },
    {
      name: "PP&E Schedule",
      table: [
        ["PP&E Schedule", "2016", "2017", "2018", "2019", "2020", "2021"],
        ["Beginning PP&E, gross", "119,113", "135,419", "160,641", "", "", ""],
        ["Capital Expenditures", "8,346", "12,795", "13,313", "", "", ""],
        ["Accumulated D&A", "(34,304)", "(27,606)", "(62,325)", "", "", ""],
        ["Ending PP&E, net", "84,809", "107,813", "98,316", "", "", ""],
      ],
      inputs: [
        { row: 2, col: 4, correctValue: "14,200", placeholder: "CapEx 2019" },
      ],
    },
    {
      name: "Cash Flow",
      table: [
        ["Cash Flow Statement", "2016", "2017", "2018", "2019", "2020", "2021"],
        ["Net Income", "41,412", "42,297", "52,263", "", "", ""],
        ["Add: D&A", "10,505", "10,717", "10,903", "", "", ""],
        ["Changes in WC", "", "", "", "", "", ""],
        ["Δ Accounts Receivable", "(2,120)", "(2,120)", "(5,312)", "", "", ""],
        ["Δ Inventory", "(929)", "(1,929)", "105", "", "", ""],
        ["Δ Accounts Payable", "5,566", "6,044", "27,786", "", "", ""],
        [
          "Δ Other Current Assets/Liab",
          "1,165",
          "2,164",
          "(1,306)",
          "",
          "",
          "",
        ],
        ["Operating Cash Flow", "55,599", "57,173", "84,439", "", "", ""],
        ["Capital Expenditures", "(8,346)", "(12,795)", "(13,313)", "", "", ""],
        ["Free Cash Flow", "47,253", "44,378", "71,126", "", "", ""],
      ],
      inputs: [
        { row: 1, col: 4, correctValue: "59,531", placeholder: "NI 2019" },
        { row: 9, col: 4, correctValue: "14,200", placeholder: "CapEx 2019" },
      ],
    },
  ],
  inputs: [],
};

const studyPlanExercise: ExerciseConfig = {
  type: "excel",
  question:
    "Complete the study plan modeling sheet using 2016–2018 historical data and project 2019–2023.",
  table: [
    ["Driver", "2016", "2017", "2018", "2019", "2020", "2021", "2022", "2023"],
    ["Annual Gross Margin Improvement", "0.45%", "", "", "", "", "", "", ""],
    ["Effective Tax Rate", "30.00%", "", "", "", "", "", "", ""],
    ["Interest Rate on Debt", "4.00%", "", "", "", "", "", "", ""],
    ["Interest Rate on Cash", "0.50%", "", "", "", "", "", "", ""],
    ["Days in Year", "365", "", "", "", "", "", "", ""],
    ["Circ.", "1", "", "", "", "", "", "", ""],
    [
      "Income Statement Drivers",
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
    ],
    [
      "Revenue Growth %",
      null,
      null,
      null,
      "3.0%",
      "5.0%",
      "6.0%",
      "6.0%",
      "6.0%",
    ],
    ["Gross Margin %", null, null, null, null, null, null, null, null],
    [
      "SG&A Revenue %",
      null,
      null,
      null,
      "18.0%",
      "17.5%",
      "17.5%",
      "17.0%",
      "17.0%",
    ],
    [
      "Amortization of Intangible Assets",
      "250",
      "242",
      "231",
      "217",
      "196",
      "175",
      "153",
      "134",
    ],
    ["Impairment of Goodwill", "2", "3", "2", "0", "0", "0", "0", "0"],
    [
      "Amortization of Original Debt %",
      null,
      null,
      null,
      "10.0%",
      "10.0%",
      "10.0%",
      "10.0%",
      "10.0%",
    ],
    [
      "Beginning Debt Balance",
      "6,344",
      "7,419",
      "7,422",
      null,
      null,
      null,
      null,
      null,
    ],
    ["Amortization", null, null, null, null, null, null, null, null],
    [
      "Ending Debt Balance",
      "6,344",
      "7,419",
      "7,422",
      null,
      null,
      null,
      null,
      null,
    ],
    ["Interest Expense", "-239", "-250", "-226", null, null, null, null, null],
    ["Interest Income", "72", "61", "78", null, null, null, null, null],
    ["Balance Sheet Drivers", null, null, null, null, null, null, null, null],
    ["Days Sales Outstanding", null, null, null, "50", "49", "49", "48", "48"],
    ["Days Sales Inventory", null, null, null, "50", "49", "49", "48", "48"],
    [
      "Days Payable Outstanding",
      null,
      null,
      null,
      "20",
      "19",
      "19",
      "18",
      "18",
    ],
    [
      "Prepaid Expenses & Other % SG&A",
      null,
      null,
      null,
      "13.0%",
      "13.0%",
      "12.0%",
      "12.0%",
      "11.0%",
    ],
    [
      "Other Current Liabilities % SG&A",
      null,
      null,
      null,
      "10.0%",
      "10.0%",
      "10.0%",
      "10.0%",
      "10.0%",
    ],
    [
      "Cash Flow Statement Drivers",
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
    ],
    [
      "Capital Expenditures",
      "-368",
      "-361",
      "-284",
      "-285",
      "-325",
      "-375",
      "-425",
      "-475",
    ],
    [
      "Depreciation % Revenue",
      null,
      null,
      null,
      "1.7%",
      "1.8%",
      "1.9%",
      "2.0%",
      "2.1%",
    ],
    [
      "Stock Repurchases",
      "1,900",
      "4,198",
      "1,943",
      "1,000",
      "1,000",
      "1,000",
      "1,000",
      "1,000",
    ],
    ["Other Non-Cash Items", null, null, null, "0", "0", "0", "0", "0"],
  ],
  inputs: [
    { row: 9, col: 4, correctValue: "39.8%", placeholder: "Gross Margin 2019" },
    { row: 9, col: 5, correctValue: "40.6%", placeholder: "Gross Margin 2020" },
    { row: 9, col: 6, correctValue: "41.4%", placeholder: "Gross Margin 2021" },
    { row: 9, col: 7, correctValue: "42.2%", placeholder: "Gross Margin 2022" },
    { row: 9, col: 8, correctValue: "43.0%", placeholder: "Gross Margin 2023" },
    {
      row: 14,
      col: 4,
      correctValue: "7,422",
      placeholder: "Beginning Debt 2019",
    },
    {
      row: 14,
      col: 5,
      correctValue: "7,422",
      placeholder: "Beginning Debt 2020",
    },
    {
      row: 14,
      col: 6,
      correctValue: "7,422",
      placeholder: "Beginning Debt 2021",
    },
    {
      row: 14,
      col: 7,
      correctValue: "7,422",
      placeholder: "Beginning Debt 2022",
    },
    {
      row: 14,
      col: 8,
      correctValue: "7,422",
      placeholder: "Beginning Debt 2023",
    },
    { row: 16, col: 4, correctValue: "7,422", placeholder: "Ending Debt 2019" },
    { row: 16, col: 5, correctValue: "7,422", placeholder: "Ending Debt 2020" },
    { row: 16, col: 6, correctValue: "7,422", placeholder: "Ending Debt 2021" },
    { row: 16, col: 7, correctValue: "7,422", placeholder: "Ending Debt 2022" },
    { row: 16, col: 8, correctValue: "7,422", placeholder: "Ending Debt 2023" },
  ],
};

// ─── Types ───────────────────────────────────────────────────────────────────

type TabId = "sheets" | "mcq" | "canvas";
type PhaseId = "easy" | "medium" | "hard";

type LessonDifficulty = "Easy" | "Medium" | "Hard";

interface SubItemLesson {
  id: string;
  title: string;
  difficulty: LessonDifficulty;
}

interface SubItem {
  id: string;
  title: string;
  lessons?: SubItemLesson[];
}

interface FountainModule {
  title: string;
  description: string;
  subItems: SubItem[];
}

interface FountainCard {
  id: string;
  title: string;
  subtitle: string;
  module: FountainModule;
  difficulty: string;
  duration: string;
  exercise: ExerciseConfig;
  tab: TabId;
  prerequisites?: string[];
  numPractices?: number;
  /** Sheet tab label for canvas exercises (shown in bottom bar) */
  canvasSheetTab?: string;
}

interface FountainGroup {
  id: string;
  label: string;
  cards: FountainCard[];
}

const canvasExercise: ExerciseConfig = {
  ...fullFinancialModelExercise,
  canvasDraggableElements: modelingToolkit,
};

const incomeStmtFlowchartExercise = financeData.find(l => l.id === "cf-canvas-1")?.exercise || canvasExercise;

// ─── Fountain Data ────────────────────────────────────────────────────────────

const fountainGroups: FountainGroup[] = [
  {
    id: "modeling-fountains",
    label: "Modeling Fountains",
    cards: [
      {
        id: "fs-fundamentals-sheets",
        title: "Financial Statement Fundamentals",
        subtitle: "Master individual financial statements",
        module: {
          title: "Individual Financial Statement Modeling",
          description:
            "Learn the core principles of financial analysis and how to evaluate business performance.",
          subItems: [
            {
              id: "pl",
              title: "P&L Forecast",
              lessons: [
                { id: "pl-easy", title: "Simple P&L Forecast", difficulty: "Easy" },
                { id: "pl-medium", title: "P&L Forecast with Historical Growth Rates", difficulty: "Medium" },
                { id: "pl-hard", title: "P&L Forecast – Apple", difficulty: "Hard" },
              ],
            },
            {
              id: "bs",
              title: "Balance Sheet Forecast",
              lessons: [
                { id: "bs-easy", title: "Simple Balance Sheet Forecast", difficulty: "Easy" },
                { id: "bs-medium", title: "Balance Sheet Forecast with Historical Growth Rates", difficulty: "Medium" },
                { id: "bs-hard", title: "Balance Sheet Forecast – Apple", difficulty: "Hard" },
              ],
            },
            {
              id: "cf",
              title: "Cash Flow Forecast",
              lessons: [
                { id: "cf-easy", title: "Simple Cash Flow Forecast", difficulty: "Easy" },
                { id: "cf-medium", title: "Cash Flow Forecast with Historical Growth Rates", difficulty: "Medium" },
                { id: "cf-hard", title: "Cash Flow Forecast – Apple", difficulty: "Hard" },
              ],
            },
          ],
        },
        difficulty: "Beginners / Intermediate",
        duration: "8 Hours",
        numPractices: 9,
        prerequisites: ["Financial Statements", "Financial Analysis"],
        exercise: fullFinancialModelExercise,
        tab: "sheets",
      },
      {
        id: "integrated-model-sheets",
        title: "Integrated Financial Model",
        subtitle: "Connect all three financial statements",
        module: {
          title: "Individual Financial Statement Modeling",
          description:
            "Build a strong foundation in financial modeling by practicing individual financial statements.",
          subItems: [
            {
              id: "pl",
              title: "P&L Forecast",
              lessons: [
                { id: "ipl-easy", title: "Simple P&L Forecast", difficulty: "Easy" },
                { id: "ipl-medium", title: "P&L Forecast with Historical Growth Rates", difficulty: "Medium" },
                { id: "ipl-hard", title: "P&L Forecast – Apple", difficulty: "Hard" },
              ],
            },
            {
              id: "bs",
              title: "Balance Sheet Forecast",
              lessons: [
                { id: "ibs-easy", title: "Simple Balance Sheet Forecast", difficulty: "Easy" },
                { id: "ibs-medium", title: "Balance Sheet Forecast with Historical Growth Rates", difficulty: "Medium" },
                { id: "ibs-hard", title: "Balance Sheet Forecast – Apple", difficulty: "Hard" },
              ],
            },
            {
              id: "cf",
              title: "Cash Flow Forecast",
              lessons: [
                { id: "icf-easy", title: "Simple Cash Flow Forecast", difficulty: "Easy" },
                { id: "icf-medium", title: "Cash Flow Forecast with Historical Growth Rates", difficulty: "Medium" },
                { id: "icf-hard", title: "Cash Flow Forecast – Apple", difficulty: "Hard" },
              ],
            },
          ],
        },
        difficulty: "Beginners / Intermediate",
        duration: "10 Hours",
        numPractices: 9,
        prerequisites: ["P&L Modeling", "Balance Sheet Basics"],
        exercise: studyPlanExercise,
        tab: "sheets",
      },
      {
        id: "apple-sheets",
        title: "Apple 3-Statement Model",
        subtitle: "Real-world modeling with Apple financials",
        module: {
          title: "Apple Financial Model",
          description:
            "Forecast Apple's Income Statement, Balance Sheet, and Cash Flow using historical data.",
          subItems: [
            {
              id: "is",
              title: "Income Statement",
              lessons: [
                { id: "ais-easy", title: "Simple Income Statement", difficulty: "Easy" },
                { id: "ais-medium", title: "Income Statement with Growth Drivers", difficulty: "Medium" },
                { id: "ais-hard", title: "Full Income Statement – Apple", difficulty: "Hard" },
              ],
            },
            {
              id: "bs",
              title: "Balance Sheet",
              lessons: [
                { id: "abs-easy", title: "Simple Balance Sheet", difficulty: "Easy" },
                { id: "abs-medium", title: "Balance Sheet with Working Capital", difficulty: "Medium" },
                { id: "abs-hard", title: "Full Balance Sheet – Apple", difficulty: "Hard" },
              ],
            },
            {
              id: "cfs",
              title: "Cash Flow Statement",
              lessons: [
                { id: "acfs-easy", title: "Simple Cash Flow Statement", difficulty: "Easy" },
                { id: "acfs-medium", title: "Cash Flow with Adjustments", difficulty: "Medium" },
                { id: "acfs-hard", title: "Full Cash Flow – Apple", difficulty: "Hard" },
              ],
            },
          ],
        },
        difficulty: "Intermediate / Advanced",
        duration: "12 Hours",
        numPractices: 9,
        prerequisites: ["Financial Statement Fundamentals"],
        exercise: appleFinancialExercise,
        tab: "sheets",
      },
      {
        id: "complete-3stmt-sheets",
        title: "Complete 3-Statement Model",
        subtitle: "Integrate all three financial statements",
        module: {
          title: "3-Statement Integration",
          description:
            "Link the Income Statement, Balance Sheet, and Cash Flow Statement into one cohesive model.",
          subItems: [
            {
              id: "drivers",
              title: "Assumptions & Drivers",
              lessons: [
                { id: "drv-easy", title: "Basic Assumptions Setup", difficulty: "Easy" },
                { id: "drv-hard", title: "Advanced Driver Modelling", difficulty: "Hard" },
              ],
            },
            {
              id: "is",
              title: "Income Statement",
              lessons: [
                { id: "cis-medium", title: "Linked Income Statement", difficulty: "Medium" },
                { id: "cis-hard", title: "Full IS Integration", difficulty: "Hard" },
              ],
            },
            {
              id: "bs-cf",
              title: "Balance Sheet & Cash Flow",
              lessons: [
                { id: "cbscf-easy", title: "Simple BS & CFS Link", difficulty: "Easy" },
                { id: "cbscf-medium", title: "Working Capital Integration", difficulty: "Medium" },
                { id: "cbscf-hard", title: "Full 3-Statement Reconciliation", difficulty: "Hard" },
              ],
            },
          ],
        },
        difficulty: "Advanced",
        duration: "15 Hours",
        numPractices: 7,
        prerequisites: ["Individual FS Modeling", "Apple 3-Statement"],
        exercise: fullFinancialModelExercise,
        tab: "sheets",
      },
      // MCQ cards
      {
        id: "fs-classification-mcq",
        title: "Financial Statement Classification",
        subtitle: "Test your classification knowledge",
        module: {
          title: "Account Classification Quiz",
          description:
            "Classify accounts as assets, liabilities, or equity across multiple financial statement scenarios.",
          subItems: [
            {
              id: "assets",
              title: "Asset Classification",
              lessons: [
                { id: "mac-easy", title: "Current vs Non-Current Assets", difficulty: "Easy" },
                { id: "mac-medium", title: "Intangible Asset Classification", difficulty: "Medium" },
                { id: "mac-hard", title: "Complex Asset Scenarios", difficulty: "Hard" },
              ],
            },
            {
              id: "liab",
              title: "Liability Classification",
              lessons: [
                { id: "mlc-easy", title: "Current vs Long-term Liabilities", difficulty: "Easy" },
                { id: "mlc-medium", title: "Contingent Liabilities", difficulty: "Medium" },
              ],
            },
            {
              id: "equity",
              title: "Equity Classification",
              lessons: [
                { id: "mec-easy", title: "Common vs Preferred Equity", difficulty: "Easy" },
                { id: "mec-hard", title: "Retained Earnings Analysis", difficulty: "Hard" },
              ],
            },
          ],
        },
        difficulty: "Beginners",
        duration: "4 Hours",
        numPractices: 7,
        prerequisites: ["Accounting Basics"],
        exercise: fullFinancialModelExercise,
        tab: "mcq",
      },
      {
        id: "cash-flow-mcq",
        title: "Cash Flow Activity Quiz",
        subtitle: "Identify operating, investing & financing flows",
        module: {
          title: "Cash Flow Classification",
          description:
            "Practice identifying cash flow activities and their impact on the statement.",
          subItems: [
            {
              id: "operating",
              title: "Operating Activities",
              lessons: [
                { id: "oa-easy", title: "Basic Operating Cash Flows", difficulty: "Easy" },
                { id: "oa-medium", title: "Working Capital Adjustments", difficulty: "Medium" },
              ],
            },
            {
              id: "investing",
              title: "Investing Activities",
              lessons: [
                { id: "ia-easy", title: "Capital Expenditure Flows", difficulty: "Easy" },
                { id: "ia-hard", title: "M&A and Investment Flows", difficulty: "Hard" },
              ],
            },
            {
              id: "financing",
              title: "Financing Activities",
              lessons: [
                { id: "fa-easy", title: "Debt & Equity Issuances", difficulty: "Easy" },
                { id: "fa-medium", title: "Dividends & Buybacks", difficulty: "Medium" },
              ],
            },
          ],
        },
        difficulty: "Beginners / Intermediate",
        duration: "5 Hours",
        numPractices: 6,
        prerequisites: ["Financial Statements"],
        exercise: fullFinancialModelExercise,
        tab: "mcq",
      },
      // Canvas cards
      {
        id: "income-stmt-canvas",
        title: "Income Statement Flowchart",
        subtitle: "Map the revenue-to-net-income flow visually",
        module: {
          title: "Income Statement Canvas",
          description:
            "Draw the flow from Revenue down through expenses to Net Income using shapes and connectors.",
          subItems: [
            {
              id: "rev",
              title: "Revenue Block",
              lessons: [
                { id: "rvb-easy", title: "Simple Revenue Mapping", difficulty: "Easy" },
                { id: "rvb-medium", title: "Revenue with Segments", difficulty: "Medium" },
              ],
            },
            {
              id: "opex",
              title: "Operating Expenses Block",
              lessons: [
                { id: "opx-easy", title: "Fixed vs Variable OPEX", difficulty: "Easy" },
                { id: "opx-hard", title: "OPEX Waterfall Diagram", difficulty: "Hard" },
              ],
            },
            {
              id: "ni",
              title: "Net Income Block",
              lessons: [
                { id: "nib-easy", title: "Net Income Flow", difficulty: "Easy" },
              ],
            },
          ],
        },
        difficulty: "Beginners",
        duration: "3 Hours",
        numPractices: 5,
        prerequisites: ["Income Statement Basics"],
        exercise: incomeStmtFlowchartExercise,
        tab: "canvas",
        canvasSheetTab: "Income Statement",
      },
      {
        id: "3stmt-canvas",
        title: "3-Statement Linkage Map",
        subtitle: "Visualize how statements connect",
        module: {
          title: "Statement Linkage Canvas",
          description:
            "Build a visual map showing how the Income Statement, Balance Sheet, and Cash Flow link together.",
          subItems: [
            {
              id: "is-link",
              title: "IS → BS Link",
              lessons: [
                { id: "isbs-easy", title: "Net Income to Retained Earnings", difficulty: "Easy" },
                { id: "isbs-medium", title: "Revenue to Receivables", difficulty: "Medium" },
              ],
            },
            {
              id: "bs-link",
              title: "BS → CFS Link",
              lessons: [
                { id: "bscfs-easy", title: "Working Capital to Cash Flow", difficulty: "Easy" },
                { id: "bscfs-hard", title: "Full Balance Sheet Reconciliation", difficulty: "Hard" },
              ],
            },
            {
              id: "cfs-link",
              title: "CFS → IS Link",
              lessons: [
                { id: "cfsis-medium", title: "D&A and Non-Cash Items", difficulty: "Medium" },
              ],
            },
          ],
        },
        difficulty: "Intermediate",
        duration: "6 Hours",
        numPractices: 5,
        prerequisites: ["Income Statement Flowchart"],
        exercise: canvasExercise,
        tab: "canvas",
        canvasSheetTab: "3-Statement Model",
      },
    ],
  },
];

const phaseDetails = {
  easy: {
    title: "Simple Financial Statement Modeling",
    description:
      "Complete the historical drivers and guided assumptions for an easier, structured modeling workflow.",
    points: [
      "Review historical income, balance sheet, and cash flow drivers.",
      "Fill the highlighted projection cells with step-by-step assumptions.",
      "Use consistent growth and margin drivers through 2023.",
    ],
  },
  medium: {
    title: "Intermediate Statement Integration",
    description:
      "Work through connected assumptions across statements and validate the key projection relationships.",
    points: [
      "Link Income Statement assumptions to balance sheet and cash flow items.",
      "Project working capital and debt balances using the modeled drivers.",
      "Confirm the integrated 3-statement structure on each period.",
    ],
  },
  hard: {
    title: "Advanced Integrated Modeling",
    description:
      "Take on the full 3-statement forecast with advanced assumptions and cross-statement validation.",
    points: [
      "Complete the full forecast using advanced driver logic.",
      "Validate cash flow and balance sheet alignment across the model.",
      "Review the overall model for consistency and framing risk assumptions.",
    ],
  },
};

// ─── Sub-item Row ─────────────────────────────────────────────────────────────

function SubItemRow({
  item,
  onSelectLevel
}: {
  item: SubItem;
  onSelectLevel: (phase: PhaseId) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-2">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 border border-zinc-200 rounded-2xl text-sm font-bold text-zinc-800 bg-white hover:bg-zinc-50 hover:border-zinc-300 transition-all shadow-sm"
      >
        <span>{item.title}</span>
        <ChevronDown
          size={16}
          className={cn(
            "text-zinc-500 transition-transform duration-300 shrink-0",
            open ? "rotate-180" : "rotate-0",
          )}
        />
      </button>

      {open && item.lessons && (
        <div className="flex flex-col gap-1.5 px-1 pb-1 animate-in fade-in slide-in-from-top-2 duration-200">
          {item.lessons.map((lesson) => (
            <button
              key={lesson.id}
              onClick={() => onSelectLevel(lesson.difficulty.toLowerCase() as PhaseId)}
              className="group flex items-center justify-between px-4 py-2.5 rounded-xl bg-white border border-zinc-100 hover:border-zinc-300 hover:bg-zinc-50 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  lesson.difficulty === "Easy" ? "bg-emerald-400" :
                    lesson.difficulty === "Medium" ? "bg-amber-400" : "bg-rose-400"
                )} />
                <span className="text-xs font-bold text-zinc-700">{lesson.title}</span>
              </div>
              <span className={cn(
                "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md",
                lesson.difficulty === "Easy" ? "bg-emerald-50 text-emerald-600" :
                  lesson.difficulty === "Medium" ? "bg-amber-50 text-amber-600" : "bg-rose-50 text-rose-600"
              )}>
                {lesson.difficulty}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Fountain Card ────────────────────────────────────────────────────────────

function FountainCardComponent({
  card,
  onStart,
  onSelectLevel,
}: {
  card: FountainCard;
  onStart: (card: FountainCard) => void;
  onSelectLevel: (card: FountainCard, phase: PhaseId) => void;
}) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="bg-white rounded-3xl border border-zinc-200 shadow-lg flex flex-col overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-zinc-300">
      {/* Card Header */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h3 className="text-lg font-extrabold text-zinc-900 tracking-tight leading-tight">
              {card.title}
            </h3>
            <p className="text-sm text-zinc-500 font-medium">{card.subtitle}</p>
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="shrink-0 flex items-center gap-1.5 bg-zinc-900 text-white text-[11px] uppercase tracking-wider font-bold px-4 py-2 rounded-full hover:bg-zinc-800 transition-all shadow-md active:scale-95"
          >
            {expanded ? "Collapse" : "Expand"}
            <ChevronDown
              size={14}
              className={cn(
                "transition-transform duration-300",
                expanded ? "rotate-180" : "rotate-0",
              )}
            />
          </button>
        </div>

        {/* Badges/Info Row */}
        <div className="flex items-center gap-3 mt-4">
          {card.numPractices && (
            <div className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider border border-blue-100">
              {card.numPractices} Practices
            </div>
          )}
          <div className="flex items-center gap-1.5 text-zinc-400">
            <div className="w-1.5 h-1.5 rounded-full bg-zinc-300" />
            <span className="text-[11px] font-bold uppercase tracking-wide">{card.difficulty}</span>
          </div>
          <div className="flex items-center gap-1.5 text-zinc-400">
            <div className="w-1.5 h-1.5 rounded-full bg-zinc-300" />
            <span className="text-[11px] font-bold uppercase tracking-wide">{card.duration}</span>
          </div>
        </div>
      </div>

      {/* Expandable inner dashed box */}
      <div
        className={cn(
          "transition-all duration-300 overflow-hidden",
          expanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="mx-6 mb-4">
          <div className="bg-zinc-50/50 border-2 border-dashed border-zinc-200 rounded-2xl p-5 flex flex-col gap-4">
            <div>
              <h4 className="text-sm font-bold text-zinc-900 mb-1.5">
                {card.module.title}
              </h4>
              <p className="text-xs text-zinc-500 leading-relaxed font-medium">
                {card.module.description}
              </p>
            </div>
            <div className="flex flex-col gap-2.5">
              {card.module.subItems.map((item) => (
                <SubItemRow
                  key={item.id}
                  item={item}
                  onSelectLevel={(phase) => onSelectLevel(card, phase)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer / Start Button */}
      <div className="px-6 pb-6 mt-auto">
        <button
          onClick={() => onStart(card)}
          className="w-full bg-zinc-900 text-white font-bold text-sm py-4 rounded-2xl hover:bg-zinc-800 active:scale-[0.98] transition-all shadow-lg shadow-zinc-200 flex items-center justify-center gap-2"
        >
          <span>Start Module</span>
          <ChevronDown className="-rotate-90" size={16} />
        </button>
      </div>
    </div>
  );
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

const tabs: { id: TabId; label: string }[] = [
  { id: "sheets", label: "Quantus Sheets" },
  { id: "mcq", label: "Multiple Choice Questions" },
  { id: "canvas", label: "Canvas" },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

type ViewStep = "list" | "intro" | "exercise";

export default function StudyPlanPage() {
  const [activeTab, setActiveTab] = useState<TabId>("sheets");
  const [step, setStep] = useState<ViewStep>("list");
  const [selectedCard, setSelectedCard] = useState<FountainCard | null>(null);
  const [selectedPhase, setSelectedPhase] = useState<PhaseId>("easy");
  const [previousStep, setPreviousStep] = useState<ViewStep>("list");

  // ── handlers ──
  const handleCardStart = (card: FountainCard) => {
    setSelectedCard(card);
    setPreviousStep("list");
    setStep("intro");
  };

  const handleGoToExercise = (phase: PhaseId) => {
    setSelectedPhase(phase);
    setPreviousStep(step);
    setStep("exercise");
  };

  const handleDirectSelectLevel = (card: FountainCard, phase: PhaseId) => {
    setSelectedCard(card);
    setSelectedPhase(phase);
    setPreviousStep("list");
    setStep("exercise");
  };

  const handleBack = () => {
    if (step === "exercise") {
      setStep(previousStep);
      if (previousStep === "list") {
        setSelectedCard(null);
      }
    } else if (step === "intro") {
      setStep("list");
      setSelectedCard(null);
    } else {
      setStep("list");
      setSelectedCard(null);
    }
  };

  // ── Step 1: Intro ──
  if (step === "intro" && selectedCard) {
    return (
      <MainLayout>
        <StudyIntroPage
          card={{
            title: selectedCard.title,
            subtitle: selectedCard.subtitle,
            difficulty: selectedCard.difficulty,
            duration: selectedCard.duration,
            module: selectedCard.module,
            prerequisites: selectedCard.prerequisites,
            numPractices: selectedCard.numPractices,
          }}
          onBack={handleBack}
          onNext={() => handleGoToExercise("easy")}
          onSelectLevel={(diff) => handleGoToExercise(diff.toLowerCase() as PhaseId)}
        />
      </MainLayout>
    );
  }

  // ── Step 3: Exercise ──
  if (step === "exercise" && selectedCard) {
    // Canvas tab → use the new canvas-specific layout
    if (selectedCard.tab === "canvas") {
      const phaseDifficulty: "Easy" | "Medium" | "Hard" =
        selectedPhase === "easy" ? "Easy" : selectedPhase === "medium" ? "Medium" : "Hard";

      return (
        <MainLayout>
          <CanvasExerciseView
            lessonId={selectedCard.id}
            exercise={selectedCard.exercise}
            cardTitle={selectedCard.title}
            difficulty={phaseDifficulty}
            sheetTabName={selectedCard.canvasSheetTab || "Income Statement"}
            instructionContent={
              <>
                <p>
                  Using the historical Profit & Loss statements from{" "}
                  <strong>2014 to 2016</strong> and the{" "}
                  <strong>growth rate assumptions</strong> provided in the
                  Assumptions section, complete all{" "}
                  <strong>yellow-highlighted cells</strong> in the template.
                </p>
                <p>
                  1. Forecast <strong>Revenue, Cost of Goods Sold (COGS), Operating Expenses, and Taxes</strong>{" "}
                  for the years <strong>2017 to 2021</strong>.
                </p>
                <p>
                  2. Calculate the resulting <strong>Gross Profit, EBITDA, EBIT, EBT, and Net Income</strong>{" "}
                  for <strong>2017–2021</strong>.
                </p>
              </>
            }
            contextContent={
              <div className="space-y-3">
                <p>This exercise uses a simplified P&L template. The historical data (2014–2016) is provided for reference.</p>
                <p>Growth assumptions are pre-filled in the Assumptions section. Use these to project future values.</p>
              </div>
            }
            onClose={handleBack}
          />
        </MainLayout>
      );
    }

    // Default: Sheets/MCQ → use the existing SplitLayout
    return (
      <SplitLayout
        leftContent={
          <div className="h-full flex flex-col">
            {/* Top Logo & Branding */}
            <div className="px-6 flex flex-col">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden shrink-0">
                  <img src="/logo.svg" alt="Shankh Logo" className="w-full h-full object-contain" />
                </div>
                <span className="text-xl font-bold text-white tracking-tight">Shankh</span>
              </div>

              <div className="h-px bg-white/10 w-full" />
            </div>

            {/* Sidebar Tabs */}
            <div className="px-4 pt-4">
              <div className="bg-white/5 rounded-full p-1 flex gap-1">
                <button className="flex-1 py-1.5 rounded-full bg-white text-zinc-900 text-xs font-bold shadow-sm">
                  Instructions
                </button>
                <button className="flex-1 py-1.5 rounded-full text-white/60 hover:text-white text-xs font-bold transition-colors">
                  Context
                </button>
              </div>
            </div>

            {/* Instruction Card */}
            <div className="px-4 py-4 flex-1 overflow-y-auto">
              <div className="bg-white rounded-2xl p-6 shadow-xl relative overflow-hidden group">
                {/* Difficulty Badge */}
                <span className="inline-block px-2.5 py-1 rounded-md bg-emerald-500 text-[10px] font-black text-white uppercase tracking-wider mb-4">
                  {selectedCard.difficulty.split(' ')[0]}
                </span>

                <h2 className="text-xl font-bold text-zinc-900 mb-3 leading-tight">
                  {phaseDetails[selectedPhase].title}
                </h2>

                <p className="text-sm text-zinc-500 leading-relaxed mb-6">
                  {phaseDetails[selectedPhase].description}
                </p>

                <div className="space-y-4">
                  <h3 className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">Exercise Task</h3>
                  <ul className="space-y-3">
                    {phaseDetails[selectedPhase].points.map((pt, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-zinc-700 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-900 mt-1.5 shrink-0" />
                        {pt}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Subtle Hint Box */}
                <div className="mt-8 p-4 rounded-xl bg-amber-50 border border-amber-100">
                  <p className="text-[11px] text-amber-800 font-bold leading-relaxed">
                    Freely draw on the canvas using the pen tool, squares and text to map out how Revenue drops down through Expenses to become Net Income.
                  </p>
                </div>
              </div>
            </div>

            {/* Profile Card at Bottom */}
            <div className="p-4 mt-auto">
              <div className="bg-[#05121A] rounded-2xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-zinc-700 overflow-hidden border-2 border-white/10 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">BK</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">Bibek karki</p>
                  <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">Free Plan</p>
                </div>
                <div className="flex items-center gap-2 text-zinc-500">
                  <div className="flex items-center gap-0.5">
                    <span className="text-[10px]">👍</span>
                    <span className="text-[10px] font-bold">4</span>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <span className="text-[10px]">👎</span>
                    <span className="text-[10px] font-bold">2</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        }
        rightContent={<ExercisePanel lessonId={selectedCard.id} exercise={selectedCard.exercise} />}
      />
    );
  }

  // Study Plan list view
  return (
    <MainLayout>
      {/* Page title */}
      <div className="px-8 pt-8 pb-4">
        <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">
          Study Plan
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Choose a path to start building your modeling skills.
        </p>
      </div>

      {/* Tab Bar */}
      <div className="px-8 pb-6">
        <div className="inline-flex items-center bg-white rounded-full p-1.5 gap-0.5 shadow-sm border border-zinc-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200",
                activeTab === tab.id
                  ? "bg-zinc-900 text-white shadow-sm"
                  : "text-zinc-500 hover:text-zinc-800",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Fountain Groups */}
      <div className="px-8 pb-12 space-y-8">
        {fountainGroups.map((group) => {
          const visibleCards = group.cards.filter(
            (c) => c.tab === activeTab,
          );
          if (visibleCards.length === 0) return null;
          return (
            <div key={group.id}>
              <h2 className="text-xl font-bold text-zinc-900 mb-4">
                {group.label}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {visibleCards.map((card) => (
                  <FountainCardComponent
                    key={card.id}
                    card={card}
                    onStart={handleCardStart}
                    onSelectLevel={handleDirectSelectLevel}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </MainLayout>
  );
}

