import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { pb } from '@/lib/pocketbase';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  FolderIcon,
  StarIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';

interface Project {
  id: string;
  name: string;
  description: string;
  language: string;
  stars: number;
  tags: string[];
  notes: string;
  source: string;
  created: string;
}

export function CollectedProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const records = await pb.collection('gh_trending_projects').getFullList<Project>({
          sort: '-created',
          requestKey: null,
        });
        setProjects(records);
      } catch (error: any) {
        if (!error.isAbort) console.error('Failed to fetch projects:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  const allTags = [...new Set(projects.flatMap((p) => p.tags || []))].sort();

  const filtered = projects.filter((p) => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) &&
        !(p.description || '').toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    if (selectedTag && !(p.tags || []).includes(selectedTag)) {
      return false;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="text-neutral-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
          <FolderIcon className="h-8 w-8 text-primary" />
          采集管理
        </h1>
        <p className="mt-2 text-neutral-600 dark:text-neutral-400">
          浏览所有已采集的 GitHub 项目，按标签筛选和搜索
        </p>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <Input
            type="text"
            placeholder="搜索项目名称或描述..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-xl pl-10"
          />
        </div>
      </div>

      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Badge
            variant={selectedTag === null ? 'default' : 'secondary'}
            className="cursor-pointer"
            onClick={() => setSelectedTag(null)}
          >
            全部
          </Badge>
          {allTags.map((tag) => (
            <Badge
              key={tag}
              variant={selectedTag === tag ? 'default' : 'secondary'}
              className="cursor-pointer"
              onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
            >
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <Card className="rounded-2xl border-none shadow-sm">
          <CardContent className="py-12 text-center text-neutral-500">
            暂无匹配的项目
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((project) => (
            <Link key={project.id} to={`/github-trending/${project.id}`}>
              <Card className="rounded-2xl border-none shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">
                        {project.name}
                      </h3>
                      {project.description && (
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 line-clamp-1 mt-0.5">
                          {project.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-2">
                        {project.language && (
                          <Badge variant="secondary" className="text-xs">{project.language}</Badge>
                        )}
                        <span className="flex items-center gap-1 text-xs text-neutral-400">
                          <StarIcon className="h-3 w-3" />
                          {project.stars}
                        </span>
                        {(project.tags || []).slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                        ))}
                        <span className="text-xs text-neutral-400">
                          {new Date(project.created).toLocaleDateString('zh-CN')}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
