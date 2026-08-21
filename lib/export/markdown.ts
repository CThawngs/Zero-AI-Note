import { NoteOutput, Block } from '@/lib/ai/validators/block-schema';

export function renderToMarkdown(note: NoteOutput): string {
  const lines: string[] = [];
  const { meta, blocks } = note;

  lines.push(`# ${meta.title}\n`);
  lines.push(`> **Method:** ${meta.method.toUpperCase()}  |  **Tier:** ${meta.tier.toUpperCase()}  |  **Language:** ${meta.language}\n`);
  lines.push(`## 📌 Tóm tắt\n${meta.summary}\n`);

  if (meta.keywords.length > 0) {
    lines.push(`**Keywords:** ${meta.keywords.map((k) => `\`${k}\``).join(' • ')}\n`);
  }
  if (meta.coreQuestions.length > 0) {
    lines.push(`**Câu hỏi cốt lõi:**\n${meta.coreQuestions.map((q) => `- ${q}`).join('\n')}\n`);
  }

  blocks.forEach((block) => {
    lines.push(...renderBlockMarkdown(block));
  });

  return lines.join('\n');
}

function renderBlockMarkdown(block: Block): string[] {
  switch (block.type) {
    case 'heading': {
      const hashes = '#'.repeat(block.level);
      return [`\n##${hashes.length > 3 ? '###' : hashes} ${block.text}\n`];
    }
    case 'paragraph':
      return [`${block.text}\n`];
    case 'cue_box':
      return [
        `> **Cue:** ${block.cue}`,
        ...block.notes.map((n) => `- ${n}`),
        '',
      ];
    case 'table': {
      const header = `| ${block.headers.join(' | ')} |`;
      const sep = `| ${block.headers.map(() => '---').join(' | ')} |`;
      const rows = block.rows.map((row) => `| ${row.join(' | ')} |`);
      return [header, sep, ...rows, ''];
    }
    case 'card_grid':
      return block.cards.flatMap((c) => [`❓ **${c.front}**`, `💡 ${c.back}${c.tag ? ` \`#${c.tag}\`` : ''}`, '']);
    case 'callout':
      return [`> **${block.style.toUpperCase()} — ${block.title}:** ${block.text}\n`];
    case 'mindmap_tree': {
      const tree: string[] = ['```mermaid', 'graph TD', `  root["${block.root.label}"]`];
      const walk = (node: any, prefix: string) => {
        node.children?.forEach((child: any, idx: number) => {
          const id = `${prefix}_${idx}`;
          tree.push(`  ${id}["${child.label}"]`);
          tree.push(`  ${prefix} --> ${id}`);
          walk(child, id);
        });
      };
      walk(block.root, 'root');
      tree.push('```\n');
      return tree;
    }
  }
}
