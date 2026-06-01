"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, ChevronUp, RefreshCw, Play } from 'lucide-react';
import useSkillData from '@/hooks/useSkillData';
import styles from './skillBundleCard.module.css';

type BundleItem = {
  id: string;
  label: string;
  description?: string;
  order_index: number;
  activity_type: 'quantus' | 'mcq' | 'canvas';
  item_progress: {
    is_completed: boolean;
    best_score_pct: number | null;
    attempts: number;
  } | null;
};

type Bundle = {
  id: string;
  name: string;
  description?: string;
  level: string;
  durationWeeks: number;
  bundleGroup: string;
  professions: { id: string; name: string; slug: string }[];
  items_count: number;
  user_progress: {
    completion_pct: number;
    items_completed: number;
    items_total: number;
    recall_strength: number | null;
    concept_accuracy: number | null;
    application_score: number | null;
    started_at: string;
    completed_at: string | null;
    last_accessed_at: string;
  } | null;
  items: BundleItem[];
};

type Props = {
  bundle: Bundle;
  onNavigate?: () => void;
};

export default function SkillBundleCard({ bundle, onNavigate }: Props) {
  const router = useRouter();
  const { startSkillBundle, startBundleItem } = useSkillData();
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);

  const userProgress = bundle.user_progress;
  const progressPct = userProgress ? userProgress.completion_pct : 0;
  const isCompleted = progressPct >= 100;
  const isInProgress = progressPct > 0 && progressPct < 100;

  // Find next incomplete item to put the "next" label on
  const nextItemIndex = bundle.items.findIndex(item => !item.item_progress?.is_completed);

  const handleActionClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (loading) return;
    setLoading(true);
    try {
      const result = await startSkillBundle(bundle.id);
      if (onNavigate) onNavigate();
      if (result.navigate_to) {
        router.push(result.navigate_to);
      }
    } catch (err) {
      console.error("Failed to start bundle:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleItemClick = async (e: React.MouseEvent, item: BundleItem) => {
    e.stopPropagation();
    if (loading) return;
    setLoading(true);
    try {
      const result = await startBundleItem(bundle.id, item.id);
      if (onNavigate) onNavigate();
      if (result.navigate_to) {
        router.push(result.navigate_to);
      }
    } catch (err) {
      console.error("Failed to start bundle item:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = () => {
    if (isCompleted) return { text: 'Completed', class: styles.completedBadge };
    if (isInProgress) return { text: 'In Progress', class: styles.progressBadge };
    return { text: 'Not Started', class: styles.notStartedBadge };
  };

  const badge = getStatusBadge();

  // Helper to render activity icons nicely
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'quantus':
        return <span className={styles.typeIcon} style={{ background: '#01696F' }}>Sheet</span>;
      case 'mcq':
        return <span className={styles.typeIcon} style={{ background: '#6B5CE7' }}>Quiz</span>;
      case 'canvas':
        return <span className={styles.typeIcon} style={{ background: '#D97706' }}>Drill</span>;
      default:
        return <span className={styles.typeIcon}>Lab</span>;
    }
  };

  return (
    <div className={`${styles.card} ${expanded ? styles.expanded : ''}`} onClick={() => setExpanded(!expanded)}>
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <h3 className={styles.title}>{bundle.name}</h3>
          <span className={`${styles.badge} ${badge.class}`}>{badge.text}</span>
        </div>
        <button className={styles.chevronBtn} aria-label="Toggle details">
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      <p className={styles.description}>{bundle.description ?? 'No description available.'}</p>

      <div className={styles.meta}>
        <span>Level: <strong className={styles.metaValue}>{bundle.level}</strong></span>
        <span>Duration: <strong className={styles.metaValue}>{bundle.durationWeeks} Weeks</strong></span>
        <span>Items: <strong className={styles.metaValue}>{bundle.items_count}</strong></span>
      </div>

      {/* Progress Bar */}
      <div className={styles.progressSection}>
        <div className={styles.progressWrapper}>
          <div className={styles.progressBar} style={{ width: `${progressPct}%` }} />
        </div>
        <div className={styles.progressLabels}>
          <span className={styles.progressPct}>{progressPct.toFixed(0)}% Complete</span>
          {userProgress && (
            <span className={styles.progressRatio}>
              {userProgress.items_completed} / {userProgress.items_total} Items
            </span>
          )}
        </div>
      </div>

      {/* Completed State Metrics */}
      {isCompleted && userProgress && (
        <div className={styles.metricsGrid}>
          <div className={styles.metricItem}>
            <span className={styles.metricLabel}>Recall Strength</span>
            <span className={styles.metricValue}>{userProgress.recall_strength ?? 0}%</span>
          </div>
          <div className={styles.metricItem}>
            <span className={styles.metricLabel}>Concept Accuracy</span>
            <span className={styles.metricValue}>{userProgress.concept_accuracy ?? 0}%</span>
          </div>
          <div className={styles.metricItem}>
            <span className={styles.metricLabel}>Application Score</span>
            <span className={styles.metricValue}>{userProgress.application_score ?? 0}%</span>
          </div>
        </div>
      )}

      {/* Action Button */}
      <div className={styles.actionArea}>
        <button
          onClick={handleActionClick}
          disabled={loading}
          className={`${styles.actionBtn} ${isCompleted ? styles.completedAction : isInProgress ? styles.resumeAction : styles.startAction}`}
        >
          {loading ? (
            'Loading...'
          ) : isCompleted ? (
            <>
              <RefreshCw size={14} className="mr-1.5 inline-block" />
              Retry Bundle
            </>
          ) : isInProgress ? (
            <>
              <Play size={14} className="mr-1.5 inline-block" />
              Resume Bundle
            </>
          ) : (
            <>
              <Play size={14} className="mr-1.5 inline-block" />
              Start Bundle
            </>
          )}
        </button>
      </div>

      {/* Expanded Bundle Items List */}
      {expanded && (
        <div className={styles.itemList} onClick={(e) => e.stopPropagation()}>
          <h4 className={styles.listTitle}>Bundle Items</h4>
          {bundle.items.length === 0 ? (
            <p className={styles.noItems}>No items in this bundle.</p>
          ) : (
            <div className={styles.itemsContainer}>
              {bundle.items.map((item, idx) => {
                const ip = item.item_progress;
                const itemIsCompleted = ip?.is_completed;
                const isNext = idx === nextItemIndex;

                let stateChar = '○';
                let stateClass = styles.stateNotStarted;
                if (itemIsCompleted) {
                  stateChar = '✓';
                  stateClass = styles.stateCompleted;
                } else if (ip && ip.attempts > 0) {
                  stateChar = '◐';
                  stateClass = styles.stateInProgress;
                }

                return (
                  <div
                    key={item.id}
                    className={`${styles.itemRow} ${isNext ? styles.nextItem : ''}`}
                    onClick={(e) => handleItemClick(e, item)}
                  >
                    <div className={styles.itemLeft}>
                      <span className={`${styles.itemState} ${stateClass}`}>{stateChar}</span>
                      <div className={styles.itemInfo}>
                        <div className={styles.itemMeta}>
                          {getActivityIcon(item.activity_type)}
                          <span className={styles.itemLabel}>{item.label}</span>
                          {isNext && <span className={styles.nextBadge}>Next</span>}
                        </div>
                        {item.description && <p className={styles.itemDesc}>{item.description}</p>}
                      </div>
                    </div>

                    <div className={styles.itemRight}>
                      {itemIsCompleted && ip?.best_score_pct !== null && (
                        <span className={styles.itemScore}>{ip.best_score_pct}%</span>
                      )}
                      <button className={styles.itemActionBtn} aria-label="Start item">
                        {itemIsCompleted ? 'Retry' : 'Start'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
