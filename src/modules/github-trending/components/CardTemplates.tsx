import { useState } from 'react';
import { CardPreview, templateCount } from './CardPreview';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface CardTemplatesProps {
  project: {
    name: string;
    description?: string;
    language?: string;
    stars?: number;
    forks?: number;
    stars_today?: number;
  };
}

export function CardTemplates({ project }: CardTemplatesProps) {
  const [currentTemplate, setCurrentTemplate] = useState(0);

  const prevTemplate = () => {
    setCurrentTemplate((prev) => (prev - 1 + templateCount) % templateCount);
  };

  const nextTemplate = () => {
    setCurrentTemplate((prev) => (prev + 1) % templateCount);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <Card className="rounded-2xl border-none shadow-sm w-full max-w-[420px]">
        <CardContent className="p-4">
          <CardPreview project={project} templateIndex={currentTemplate} />

          <div className="flex items-center justify-center gap-3 mt-4">
            <Button variant="outline" size="sm" className="rounded-xl h-8 w-8 p-0" onClick={prevTemplate}>
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>
            <span className="text-sm text-neutral-500 min-w-[80px] text-center">
              {currentTemplate + 1} / {templateCount}
            </span>
            <Button variant="outline" size="sm" className="rounded-xl h-8 w-8 p-0" onClick={nextTemplate}>
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </div>

          {/* Template thumbnails */}
          <div className="flex gap-1.5 justify-center mt-3 flex-wrap">
            {Array.from({ length: templateCount }, (_, i) => (
              <button
                key={i}
                onClick={() => setCurrentTemplate(i)}
                className={`h-2 w-4 rounded-full transition-colors ${
                  i === currentTemplate
                    ? 'bg-primary'
                    : 'bg-neutral-300 dark:bg-neutral-600 hover:bg-neutral-400'
                }`}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="text-center text-xs text-neutral-400">
        卡片尺寸 380×507px · 共 {templateCount} 套模板
      </div>
    </div>
  );
}
