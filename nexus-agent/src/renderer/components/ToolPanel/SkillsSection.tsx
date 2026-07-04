import { AlertTriangle, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SkillDto } from '../../../shared/types/ipc'

interface SkillsSectionProps {
  skills: SkillDto[]
  loadErrors: { path: string; reason: string }[]
}

export default function SkillsSection({ skills, loadErrors }: SkillsSectionProps) {
  const hasContent = skills.length > 0 || loadErrors.length > 0
  return (
    <div className="pt-3 mt-1 border-t border-[var(--color-border-subtle)] space-y-2">
      <div className="flex items-center gap-2 px-1">
        <Sparkles size={12} className="text-[var(--seed-primary)]" />
        <span className="text-[10px] uppercase tracking-[0.06em] text-[var(--seed-muted)]">Skills</span>
        <span className="text-[10px] text-[var(--seed-muted)] font-mono">
          {skills.length}{loadErrors.length > 0 ? ` · ${loadErrors.length} 错误` : ''}
        </span>
      </div>
      {!hasContent ? (
        <div className="text-[11px] text-[var(--seed-muted)] px-1">未加载</div>
      ) : (
        <>
          {skills.map((skill) => (
            <SkillItem key={`${skill.scope}:${skill.path}`} skill={skill} />
          ))}
          {loadErrors.map((err) => (
            <SkillLoadErrorItem key={err.path} error={err} />
          ))}
        </>
      )}
    </div>
  )
}

function SkillItem({ skill }: { skill: SkillDto }) {
  return (
    <div
      className="rounded-[var(--seed-radius)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-card)] p-3"
      title={skill.path}
    >
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-[var(--seed-fg)] truncate">{skill.name}</span>
        <span
          className={cn(
            'text-[9px] uppercase tracking-[0.06em] px-1.5 py-0.5 rounded',
            skill.scope === 'project'
              ? 'bg-[var(--seed-primary)]/10 text-[var(--seed-primary)]'
              : 'bg-[var(--color-border-subtle)] text-[var(--seed-muted)]',
          )}
        >
          {skill.scope}
        </span>
      </div>
      <div className="mt-1 text-[11px] text-[var(--color-text-secondary)] line-clamp-2">
        {skill.description}
      </div>
      <div className="mt-1 text-[10px] text-[var(--seed-muted)] font-mono truncate" title={skill.path}>
        {skill.path}
      </div>
    </div>
  )
}

function SkillLoadErrorItem({ error }: { error: { path: string; reason: string } }) {
  return (
    <div
      className="rounded-[var(--seed-radius)] border border-dashed border-[var(--color-border-subtle)] bg-[var(--color-surface-card)] p-3 opacity-60"
      title={`${error.path}\n${error.reason}`}
    >
      <div className="flex items-center gap-2">
        <AlertTriangle size={12} className="text-[var(--seed-muted)]" />
        <span className="text-xs font-medium text-[var(--seed-muted)] truncate">解析失败</span>
      </div>
      <div className="mt-1 text-[11px] text-[var(--seed-muted)] line-clamp-2">{error.reason}</div>
      <div className="mt-1 text-[10px] text-[var(--seed-muted)] font-mono truncate" title={error.path}>
        {error.path}
      </div>
    </div>
  )
}
