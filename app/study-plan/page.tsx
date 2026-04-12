"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Sidebar } from "@/components/layout/Sidebar";
import { SplitLayout } from "@/components/layout/SplitLayout";
import { LessonPanel } from "@/components/lesson/LessonPanel";
import { ExercisePanel } from "@/components/exercise/ExercisePanel";
import { ExerciseConfig } from "@/data/financeData";
import { Button } from "@/components/ui/Button";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

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

type PhaseId = "easy" | "medium" | "hard";

type Phase = {
  id: PhaseId;
  label: string;
  description: string;
};

interface StudyPlan {
  id: string;
  title: string;
  description: string;
  exercise: ExerciseConfig;
}

const studyPlans: StudyPlan[] = [
  {
    id: "complete-3-statement-model",
    title: "Complete 3-Statement Model",
    description: "A comprehensive 3-statement financial model linking the Income Statement, Balance Sheet, and Cash Flow Statement using historical data and assumptions.",
    exercise: fullFinancialModelExercise,
  },
  {
    id: "financial-statements-modeling-advanced",
    title: "Financial Statements Modeling Advanced",
    description:
      "Build an integrated 3-statement model using historical drivers from 2016–2018 and project 2019–2023.",
    exercise: studyPlanExercise,
  },
  {
    id: "apple-financial-modeling",
    title: "Financial Statements Modeling - Apple",
    description:
      "Real-world modeling using Apple's actual P&L, Balance Sheet, and Cash Flow to forecast 2019–2021.",
    exercise: appleFinancialExercise,
  },
];

const phases: Phase[] = [
  {
    id: "easy",
    label: "Easy",
    description: "Simple practice and guided assumptions.",
  },
  {
    id: "medium",
    label: "Medium",
    description: "Medium difficulty modeling workflow.",
  },
  {
    id: "hard",
    label: "Hard",
    description: "Advanced integrated modeling scenario.",
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

type Stage = "plans" | "levels" | "exercise";

export default function StudyPlanPage() {
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [selectedPhase, setSelectedPhase] = useState<PhaseId | null>(null);
  const [stage, setStage] = useState<Stage>("plans");

  const currentPlan = selectedPlanId
    ? studyPlans.find((p) => p.id === selectedPlanId)
    : null;

  const handleSelectPlan = (planId: string) => {
    setSelectedPlanId(planId);
    setStage("levels");
  };

  const handleSelectPhase = (phaseId: PhaseId) => {
    setSelectedPhase(phaseId);
    setStage("exercise");
  };

  if (stage === "exercise" && selectedPhase) {
    return (
      <SplitLayout
        header={
          <header className="h-10 flex items-center justify-between px-6 bg-zinc-900 border-b border-zinc-800 shrink-0">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="flex items-center gap-1 text-zinc-400 hover:text-white transition-colors text-sm font-medium pr-4 border-r border-zinc-800"
              >
                <ChevronLeft size={16} />
                Back to Dashboard
              </Link>
              <div className="flex items-center gap-2">
                <span className="text-zinc-500 text-xs font-bold uppercase tracking-widest">
                  {currentPlan?.title}
                </span>
                <span className="text-zinc-600 text-xs font-bold">/</span>
                <span className="text-zinc-100 text-sm font-bold tracking-tight">
                  {phaseDetails[selectedPhase].title}
                </span>
              </div>
            </div>
          </header>
        }
        leftContent={
          <LessonPanel
            title={phaseDetails[selectedPhase].title}
            explanation={phaseDetails[selectedPhase].description}
            definitions={[
              {
                term: "Income Statement Drivers",
                definition:
                  "Complete the highlighted drivers and forecast revenue, margins, and costs.",
              },
              {
                term: "Balance Sheet Drivers",
                definition:
                  "Fill the working capital and debt assumptions to connect the model.",
              },
              {
                term: "Cash Flow Drivers",
                definition:
                  "Complete the cash flow forecast and check the ending cash balance.",
              },
            ]}
            instructions="Complete the highlighted Excel model on the right by entering the required projection values and verifying the integrated statement logic."
          />
        }
        rightContent={<ExercisePanel exercise={currentPlan!.exercise} />}
        leftClassName="bg-white"
        rightClassName="bg-[#F8F8FB]"
      />
    );
  }

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-y-auto">
        <header
          className={
            stage === "exercise"
              ? "h-10 flex items-center justify-between px-6 bg-zinc-900 border-b border-zinc-800 shrink-0"
              : "bg-white border-b border-zinc-200 px-6 py-4 relative shrink-0"
          }
        >
          <div className="max-w-6xl mx-auto flex items-center justify-between w-full">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className={
                  stage === "exercise"
                    ? "inline-flex items-center gap-2 text-sm font-semibold text-zinc-300 hover:text-white transition-colors"
                    : "inline-flex items-center gap-2 text-sm font-semibold text-zinc-600 hover:text-zinc-900 transition-colors"
                }
              >
                <ChevronLeft size={16} />
                Back to Dashboard
              </Link>
              {stage === "exercise" && selectedPhase ? (
                <div className="hidden md:flex items-center gap-2 text-sm text-zinc-300">
                  <span className="uppercase tracking-[0.3em] text-[10px] text-zinc-500">
                    {currentPlan?.title}
                  </span>
                  <span className="text-zinc-600">/</span>
                  <span className="font-semibold text-white">
                    {phaseDetails[selectedPhase].title}
                  </span>
                </div>
              ) : null}
            </div>
            {stage !== "exercise" ? (
              <div className="inline-flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-1 text-xs uppercase tracking-[0.3em] text-zinc-500">
                <CalendarDays size={14} />
                Study Plan
              </div>
            ) : null}
          </div>
        </header>

        <div className="max-w-6xl w-full mx-auto px-6 py-8 pb-20 space-y-6">
          {stage === "plans" && (
            <div className="space-y-6">
              <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-1 text-xs uppercase tracking-[0.2em] text-zinc-700">
                    <CalendarDays size={16} />
                    Study Plans
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-zinc-900">
                      Choose a Study Plan
                    </h1>
                    <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-600">
                      Select from our curated financial modeling exercises to
                      build your skills.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {studyPlans.map((plan) => (
                  <button
                    key={plan.id}
                    onClick={() => handleSelectPlan(plan.id)}
                    className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm transition-all hover:shadow-md hover:border-zinc-300 text-left"
                  >
                    <div className="space-y-4">
                      <h2 className="text-xl font-bold text-zinc-900">
                        {plan.title}
                      </h2>
                      <p className="text-sm leading-6 text-zinc-600">
                        {plan.description}
                      </p>
                      <div className="flex items-center justify-end pt-4">
                        <ChevronRight
                          size={20}
                          className="text-zinc-400 group-hover:text-zinc-600"
                        />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {stage === "levels" && currentPlan && selectedPhase === null && (
            <div className="space-y-6">
              <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
                <div className="space-y-4">
                  <h1 className="text-3xl font-bold text-zinc-900">
                    Select your level
                  </h1>
                  <p className="text-sm leading-7 text-zinc-600">
                    Choose Easy, Medium, or Hard to continue into the study
                    plan.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {phases.map((phase) => (
                  <button
                    key={phase.id}
                    onClick={() => handleSelectPhase(phase.id)}
                    className="group rounded-3xl border border-zinc-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-700 font-bold">
                        {phase.id === "easy"
                          ? "1"
                          : phase.id === "medium"
                            ? "2"
                            : "3"}
                      </div>
                      <span
                        className={
                          "rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] " +
                          (phase.id === "easy"
                            ? "bg-emerald-100 text-emerald-700"
                            : phase.id === "medium"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-rose-100 text-rose-700")
                        }
                      >
                        {phase.label}
                      </span>
                    </div>
                    <h2 className="mt-5 text-xl font-semibold text-zinc-900">
                      {phase.label} practice
                    </h2>
                    <p className="mt-3 text-sm leading-7 text-zinc-600">
                      {phase.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {stage === "exercise" &&
            selectedPhase &&
            currentPlan &&
            selectedPhase !== null && (
              <div className="space-y-6">
                <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">
                      {currentPlan.title}
                    </p>
                    <h1 className="mt-2 text-3xl font-bold text-zinc-900">
                      {phaseDetails[selectedPhase].title}
                    </h1>
                    <p className="mt-2 max-w-2xl text-sm leading-7 text-zinc-600">
                      {phaseDetails[selectedPhase].description}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setStage("levels")}
                    >
                      Back to Levels
                    </Button>
                    <Button variant="primary" onClick={() => setStage("plans")}>
                      Exit
                    </Button>
                  </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
                  <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">
                          Phase Guidance
                        </p>
                        <h2 className="mt-2 text-xl font-semibold text-zinc-900">
                          {phaseDetails[selectedPhase].title}
                        </h2>
                      </div>
                      <span
                        className={
                          "rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] " +
                          (selectedPhase === "easy"
                            ? "bg-emerald-100 text-emerald-700"
                            : selectedPhase === "medium"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-rose-100 text-rose-700")
                        }
                      >
                        {selectedPhase}
                      </span>
                    </div>
                    <ul className="mt-5 space-y-3 text-sm leading-7 text-zinc-600">
                      {phaseDetails[selectedPhase].points.map(
                        (point: string) => (
                          <li key={point} className="flex gap-3">
                            <span className="mt-1 h-2.5 w-2.5 rounded-full bg-zinc-900" />
                            <span>{point}</span>
                          </li>
                        ),
                      )}
                    </ul>
                  </div>

                  <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
                    <ExercisePanel exercise={currentPlan.exercise} />
                  </div>
                </div>
              </div>
            )}
        </div>
      </main>
    </div>
  );
}
