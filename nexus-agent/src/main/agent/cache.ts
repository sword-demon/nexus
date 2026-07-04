import type { Messages } from '@anthropic-ai/sdk/resources/beta/prompt-caching/messages'
import type { PromptContextDto, SkillDto } from '../../shared/types/ipc'

export type SystemBlock = Messages.PromptCachingBetaTextBlockParam

export function buildSystemPrompt(context: PromptContextDto): SystemBlock[] {
  const blocks: SystemBlock[] = []
  pushBlock(blocks, 'CLAUDE.md', context.claudeMd)
  pushBlock(blocks, 'AGENTS.md', context.agentsMd)
  for (const skill of context.skills) {
    pushBlock(blocks, `SKILL ${skill.name}`, formatSkill(skill))
  }
  if (blocks.length === 0) {
    blocks.push({ type: 'text', text: 'You are Nexus Agent. Help the user with coding tasks.' })
  }
  blocks[blocks.length - 1] = {
    ...blocks[blocks.length - 1],
    cache_control: { type: 'ephemeral' },
  }
  return blocks
}

function pushBlock(blocks: SystemBlock[], label: string, content: string): void {
  const text = content.trim()
  if (!text) return
  blocks.push({ type: 'text', text: `# ${label}\n\n${text}` })
}

function formatSkill(skill: SkillDto): string {
  return [
    `name: ${skill.name}`,
    `description: ${skill.description}`,
    skill.whenToUse ? `when_to_use: ${skill.whenToUse}` : null,
    skill.allowedTools.length > 0 ? `allowed-tools: ${skill.allowedTools.join(', ')}` : null,
    '',
    skill.content,
  ].filter((part): part is string => part !== null).join('\n')
}
