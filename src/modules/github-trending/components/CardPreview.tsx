import { useMemo } from 'react';
import { getLanguageColor } from '../data/language-colors';

// Import all 18 templates as raw strings
const templateModules = import.meta.glob('../templates/*.html', { query: '?raw', eager: true });
const templates = Object.values(templateModules).map((mod: any) => mod.default || mod) as string[];
const templateCount = templates.length;

interface CardPreviewProps {
  project: {
    name: string;
    description?: string;
    language?: string;
    stars?: number;
    forks?: number;
    stars_today?: number;
  };
  templateIndex?: number;
}

function formatNumber(num: number): string {
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
  return String(num);
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return text.replace(/[&<>"']/g, (c) => map[c]);
}

function renderTemplate(template: string, project: CardPreviewProps['project']): string {
  const [owner, name] = project.name.split('/');
  const safeName = escapeHtml(name || project.name);
  const safeOwner = escapeHtml(owner || '');

  return template
    .replace(/\{\{rank\}\}/g, '1')
    .replace(/\{\{name\}\}/g, safeName)
    .replace(/\{\{owner\}\}/g, safeOwner)
    .replace(/\{\{description\}\}/g, escapeHtml(project.description || 'No description'))
    .replace(/\{\{language\}\}/g, escapeHtml(project.language || 'Unknown'))
    .replace(/\{\{languageColor\}\}/g, getLanguageColor(project.language || ''))
    .replace(/\{\{stars\}\}/g, formatNumber(project.stars || 0))
    .replace(/\{\{forks\}\}/g, formatNumber(project.forks || 0))
    .replace(/\{\{todayStars\}\}/g, formatNumber(project.stars_today || 0))
    .replace(/\{\{firstName\}\}/g, safeName.charAt(0).toUpperCase());
}

export function CardPreview({ project, templateIndex = 0 }: CardPreviewProps) {
  const srcdoc = useMemo(() => {
    if (templates.length === 0) return '<html><body>No templates found</body></html>';
    const idx = templateIndex % templates.length;
    return renderTemplate(templates[idx], project);
  }, [project, templateIndex]);

  return (
    <iframe
      srcDoc={srcdoc}
      title="Card Preview"
      className="w-full max-w-[380px] mx-auto rounded-xl border border-neutral-200 dark:border-neutral-700"
      style={{ aspectRatio: '3/4', height: '507px' }}
      sandbox="allow-scripts"
    />
  );
}

export { templates, templateCount };
