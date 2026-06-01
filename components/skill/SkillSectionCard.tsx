import React from 'react';
import Link from 'next/link';
import styles from './skillBundleCard.module.css';

type Section = {
  id: string;
  name: string;
  slug: string;
  activity_type: string | null;
  tab_label: string;
  icon_key?: string;
  order_index: number;
  is_active: boolean;
};

type Props = {
  section: Section;
  onClick: () => void;
};

export default function SkillSectionCard({ section, onClick }: Props) {
  const accentColor = {
    quant_lab: 'var(--skill-quantus)',
    mcqs: 'var(--skill-mcq)',
    framework_drills: 'var(--skill-canvas)',
    case_simulations: 'var(--skill-case)',
  }[section.slug] || 'var(--skill-default)';

  return (
    <button onClick={onClick} className={styles.card} style={{ '--accent': accentColor } as React.CSSProperties}>
      <h3 className={styles.title}>{section.name}</h3>
      <p className={styles.subtitle}>{section.tab_label}</p>
    </button>
  );
}
