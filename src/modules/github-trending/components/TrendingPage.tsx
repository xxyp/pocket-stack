import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { pb } from '@/lib/pocketbase';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  FireIcon,
  ArrowPathIcon,
  StarIcon,
  CodeBracketIcon,
} from '@heroicons/react/24/outline';

interface Project {
  id: string;
  name: string;
  description: string;
  url: string;
  homepage: string;
  language: string;
  stars: number;
  forks: number;
  stars_today: number;
  owner_avatar: string;
  source: string;
  collected_at: string;
  created: string;
}

export function TrendingPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [language, setLanguage] = useState('');
  const [since, setSince] = useState('daily');
  const [status, setStatus] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      const records = await pb.collection('gh_trending_projects').getFullList<Project>({
        sort: '-stars',
        requestKey: null,
      });
      setProjects(records);
    } catch (error: any) {
      if (!error.isAbort) {
        console.error('Failed to fetch projects:', error);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setStatus(null);
    try {
      const params = new URLSearchParams();
      if (language) params.set('language', language);
      if (since) params.set('since', since);

      const resp = await fetch(`/api/github-trending/refresh?${params.toString()}`, {
        method: 'POST',
      });
      const data = await resp.json();

      if (data.success) {
        toast.success(`抓取完成：新增 ${data.stats.created}，更新 ${data.stats.updated}`);
        setStatus(`新增 ${data.stats.created} 个项目，更新 ${data.stats.updated} 个`);
        fetchProjects();
      } else {
        toast.error(`抓取失败: ${data.error}`);
      }
    } catch (error: any) {
      toast.error(`请求失败: ${error.message}`);
    } finally {
      setRefreshing(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return String(num);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
            <FireIcon className="h-8 w-8 text-primary" />
            GitHub 热门项目
          </h1>
          <p className="mt-2 text-neutral-600 dark:text-neutral-400">
            抓取 GitHub Trending 热门项目，自动搜索相关文章和图片素材
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          >
            <option value="">所有语言</option>
            <option value="typescript">TypeScript</option>
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="go">Go</option>
            <option value="rust">Rust</option>
            <option value="java">Java</option>
            <option value="c">C</option>
            <option value="c++">C++</option>
          </select>

          <select
            value={since}
            onChange={(e) => setSince(e.target.value)}
            className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          >
            <option value="daily">今日</option>
            <option value="weekly">本周</option>
            <option value="monthly">本月</option>
          </select>

          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            className="rounded-xl"
          >
            {refreshing ? (
              <>
                <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                抓取中...
              </>
            ) : (
              <>
                <ArrowPathIcon className="h-4 w-4 mr-2" />
                刷新
              </>
            )}
          </Button>
        </div>
      </div>

      {status && (
        <div className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700 dark:bg-green-900/30 dark:text-green-400">
          {status}
        </div>
      )}

      {loading ? (
        <div className="flex h-[400px] items-center justify-center">
          <div className="text-neutral-500">加载中...</div>
        </div>
      ) : projects.length === 0 ? (
        <Card className="rounded-2xl border-none shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FireIcon className="h-16 w-16 text-neutral-300 mb-4" />
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
              暂无数据
            </h2>
            <p className="text-neutral-500 text-center max-w-md mb-6">
              点击"刷新"按钮，从 GitHub Trending 抓取热门项目
            </p>
            <Button onClick={handleRefresh} disabled={refreshing} className="rounded-xl">
              <ArrowPathIcon className="h-4 w-4 mr-2" />
              开始抓取
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link key={project.id} to={`/github-trending/${project.id}`}>
              <Card className="rounded-2xl border-none shadow-sm hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3 mb-3">
                    {project.owner_avatar ? (
                      <img
                        src={project.owner_avatar}
                        alt=""
                        className="h-10 w-10 rounded-full"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-neutral-200 dark:bg-neutral-700" />
                    )}
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                        {project.name}
                      </h3>
                      {project.description && (
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 line-clamp-2 mt-1">
                          {project.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-neutral-500 dark:text-neutral-400">
                    {project.language && (
                      <span className="flex items-center gap-1">
                        <CodeBracketIcon className="h-4 w-4" />
                        {project.language}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <StarIcon className="h-4 w-4" />
                      {formatNumber(project.stars)}
                    </span>
                    {project.stars_today > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        +{project.stars_today} 今日
                      </Badge>
                    )}
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
