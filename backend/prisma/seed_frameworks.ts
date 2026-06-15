/**
 * ============================================================
 * SHANKH — Framework Library Seed
 * ============================================================
 * Creates 8 consulting frameworks for case-simulation canvas activities.
 *
 * The first three reproduce the reference diagrams exactly:
 *   1. Market Entry Framework        (Consulting)
 *   2. New Product Framework         (Consulting)
 *   3. Due Diligence Framework       (Consulting)
 * Plus five standard frameworks in the same tree style:
 *   4. Profitability Framework
 *   5. M&A Framework
 *   6. Pricing Strategy Framework
 *   7. Growth Strategy Framework (Ansoff)
 *   8. Porter's Five Forces
 *
 * Layout: a tidy-tree engine positions each node (root on top, branches below,
 * leaves at the bottom) so the diagram looks like the org-chart references.
 *
 * Blank policy: the structural skeleton (root + named branches) is LOCKED and
 * shown to the learner; the terminal leaf nodes are BLANK — the learner analyses
 * the case and types the missing detail. Toggle any node in the admin builder.
 *
 * Safe to re-run: upserts on fixed IDs.
 *
 * Run standalone:
 *   npx ts-node --transpile-only prisma/seed_frameworks.ts
 * ============================================================
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ─── Tree layout engine ────────────────────────────────────────────────────────

type Tree = { label: string; children?: Tree[] };
type FwNode = { id: string; label: string; x: number; y: number; shape: "rectangle"; color: string; isBlank: boolean };
type FwEdge = { id: string; sourceId: string; targetId: string };

const LOCK_COLOR = "#dbeafe"; // shown nodes (blue)
const BLANK_COLOR = "#fef3c7"; // learner-filled nodes (amber)
const H_GAP = 200; // horizontal spacing between leaves
const V_GAP = 150; // vertical spacing between depths
const ORIGIN_X = 40;
const ORIGIN_Y = 40;

function layoutTree(fwId: string, tree: Tree): { nodes: FwNode[]; edges: FwEdge[] } {
  const nodes: FwNode[] = [];
  const edges: FwEdge[] = [];
  let leafSlot = 0;
  let idc = 0;
  const newId = () => `${fwId}-n${idc++}`;

  function place(node: Tree, depth: number, parentId: string | null): number {
    const id = newId();
    const isLeaf = !node.children || node.children.length === 0;
    let x: number;
    if (isLeaf) {
      x = ORIGIN_X + leafSlot * H_GAP;
      leafSlot++;
    } else {
      const childXs = node.children!.map((c) => place(c, depth + 1, id));
      x = (childXs[0] + childXs[childXs.length - 1]) / 2;
    }
    nodes.push({
      id, label: node.label, x, y: ORIGIN_Y + depth * V_GAP,
      shape: "rectangle", color: isLeaf ? BLANK_COLOR : LOCK_COLOR, isBlank: isLeaf,
    });
    if (parentId) edges.push({ id: `${id}-e`, sourceId: parentId, targetId: id });
    return x;
  }

  place(tree, 0, null);
  return { nodes, edges };
}

// ─── Framework definitions ─────────────────────────────────────────────────────

const DEFS: { id: string; name: string; category: string; description: string; tree: Tree }[] = [
  {
    id: "fw-market-entry-001",
    name: "Market Entry Framework",
    category: "Consulting",
    description: "Assess whether and how to enter a market across Customer, Company, Competition, Product, and the mode of entry.",
    tree: {
      label: "Market Entry",
      children: [
        { label: "Customer", children: [
          { label: "Segments" }, { label: "Needs" }, { label: "Size & Growth" }, { label: "Target Group" }, { label: "Market Share" },
        ] },
        { label: "Company", children: [
          { label: "Product Mix" }, { label: "Resources" }, { label: "Key Assets" }, { label: "Value Chain Analysis" }, { label: "Financial Analysis" },
        ] },
        { label: "Competition", children: [
          { label: "No. of Competitors & Market Share" }, { label: "SWOT Analysis" }, { label: "Barriers to Entry/Exit" },
        ] },
        { label: "Product", children: [
          { label: "Gap vs Customer Expectations" },
        ] },
        { label: "How to Enter", children: [
          { label: "Brownfield - Acquisitions" }, { label: "Greenfield Operations" }, { label: "Joint Venture" }, { label: "Outsourcing" },
        ] },
      ],
    },
  },
  {
    id: "fw-new-product-001",
    name: "New Product Framework",
    category: "Consulting",
    description: "Launch economics of a new product across Initial Financing, Value Chain and Profits & break-even.",
    tree: {
      label: "New Product",
      children: [
        { label: "Initial Financing", children: [
          { label: "Self Financed" }, { label: "Debt Financed" }, { label: "Equity Financed" },
        ] },
        { label: "Value Chain", children: [
          { label: "Procurement" }, { label: "Production" }, { label: "Distribution" }, { label: "Marketing" },
        ] },
        { label: "Profits & Break-even", children: [
          { label: "Price" }, { label: "# Units Sold" }, { label: "Variable Costs" }, { label: "Fixed Costs" },
        ] },
      ],
    },
  },
  {
    id: "fw-due-diligence-001",
    name: "Due Diligence Framework",
    category: "Consulting",
    description: "Commercial due diligence across Pre-diligence, Diligence (Market, Competition, Business, Customer) and Post-diligence.",
    tree: {
      label: "Due Diligence",
      children: [
        { label: "Pre-diligence", children: [
          { label: "Investor Profile" }, { label: "Existing Investments" }, { label: "Investment Objective" },
        ] },
        { label: "Diligence", children: [
          { label: "Market", children: [{ label: "Sizing" }, { label: "Future Outlook" }, { label: "Key Drivers" }] },
          { label: "Competition", children: [{ label: "Benchmarking" }, { label: "Differentiation" }, { label: "Moat" }] },
          { label: "Business", children: [{ label: "Financial" }, { label: "Non-financial" }] },
          { label: "Customer", children: [{ label: "Behavioural" }, { label: "Psychographic" }, { label: "Firmographic" }] },
        ] },
        { label: "Post-diligence", children: [
          { label: "Valuation & Transaction" }, { label: "Growth Strategy" }, { label: "Exit Options" },
        ] },
      ],
    },
  },
  {
    id: "fw-profitability-001",
    name: "Profitability Framework",
    category: "Consulting",
    description: "Decompose profit into Revenue (Price, Volume) and Cost (Fixed, Variable) drivers.",
    tree: {
      label: "Profitability",
      children: [
        { label: "Revenue", children: [{ label: "Price" }, { label: "Volume" }] },
        { label: "Cost", children: [{ label: "Fixed Costs" }, { label: "Variable Costs" }] },
      ],
    },
  },
  {
    id: "fw-mergers-acquisitions-001",
    name: "M&A Framework",
    category: "Consulting",
    description: "Evaluate an acquisition across Rationale, Target Screening, Valuation and Integration.",
    tree: {
      label: "M&A",
      children: [
        { label: "Rationale", children: [{ label: "Synergies" }, { label: "Strategic Fit" }] },
        { label: "Target Screening", children: [{ label: "Market" }, { label: "Financials" }] },
        { label: "Valuation", children: [{ label: "DCF" }, { label: "Comparables" }] },
        { label: "Integration", children: [{ label: "Operations" }, { label: "Culture" }] },
      ],
    },
  },
  {
    id: "fw-pricing-strategy-001",
    name: "Pricing Strategy Framework",
    category: "Consulting",
    description: "Set price using Cost-based, Competitor-based and Value-based approaches.",
    tree: {
      label: "Pricing",
      children: [
        { label: "Cost-based", children: [{ label: "Markup" }, { label: "Break-even" }] },
        { label: "Competitor-based", children: [{ label: "Benchmarking" }, { label: "Positioning" }] },
        { label: "Value-based", children: [{ label: "Willingness to Pay" }, { label: "Differentiation" }] },
      ],
    },
  },
  {
    id: "fw-growth-strategy-001",
    name: "Growth Strategy Framework",
    category: "Consulting",
    description: "Ansoff matrix — grow via existing vs new products and markets.",
    tree: {
      label: "Growth Strategy",
      children: [
        { label: "Existing Products", children: [{ label: "Market Penetration" }, { label: "Market Development" }] },
        { label: "New Products", children: [{ label: "Product Development" }, { label: "Diversification" }] },
      ],
    },
  },
  {
    id: "fw-five-forces-001",
    name: "Porter's Five Forces",
    category: "Consulting",
    description: "Assess industry attractiveness across the five competitive forces.",
    tree: {
      label: "Industry Analysis",
      children: [
        { label: "Competitive Rivalry" },
        { label: "Supplier Power" },
        { label: "Buyer Power" },
        { label: "Threat of New Entrants" },
        { label: "Threat of Substitutes" },
      ],
    },
  },
];

async function main() {
  for (const def of DEFS) {
    const structure = layoutTree(def.id, def.tree);
    const blanks = structure.nodes.filter((n) => n.isBlank).length;
    await prisma.framework.upsert({
      where: { id: def.id },
      create: { id: def.id, name: def.name, category: def.category, description: def.description, structure, isActive: true },
      update: { name: def.name, category: def.category, description: def.description, structure, isActive: true },
    });
    console.log(`✓ ${def.name.padEnd(34)} ${structure.nodes.length} nodes · ${blanks} blank · ${structure.edges.length} connections`);
  }
  console.log(`\nSeeded ${DEFS.length} frameworks.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
