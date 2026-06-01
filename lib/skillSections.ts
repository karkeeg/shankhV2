export type SkillSectionSlug = 'quant_lab' | 'mcqs' | 'framework_drills' | 'case_simulations';

export interface SkillSection {
  id: string;
  name: string;
  slug: SkillSectionSlug;
  activity_type: 'quantus' | 'mcq' | 'canvas' | null; // null for mixed (case simulations)
  tab_label: string;
  icon_key?: string;
  order_index: number;
  is_active: boolean;
}

export const skillSectionsSeed: readonly SkillSection[] = [
  {
    id: '',
    name: 'Quant Lab',
    slug: 'quant_lab',
    activity_type: 'quantus',
    tab_label: 'Quantus Sheets',
    order_index: 1,
    is_active: true,
  },
  {
    id: '',
    name: 'MCQs',
    slug: 'mcqs',
    activity_type: 'mcq',
    tab_label: 'Multiple Choice Questions',
    order_index: 2,
    is_active: true,
  },
  {
    id: '',
    name: 'Framework Drills',
    slug: 'framework_drills',
    activity_type: 'canvas',
    tab_label: 'Canvas',
    order_index: 3,
    is_active: true,
  },
  {
    id: '',
    name: 'Case Simulations',
    slug: 'case_simulations',
    activity_type: null,
    tab_label: 'Case Simulations',
    order_index: 4,
    is_active: true,
  },
] as const;
