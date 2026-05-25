import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { pb } from '@/lib/pocketbase';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { CardTemplates } from './CardTemplates';
import {
  ArrowLeftIcon,
  StarIcon,
  CodeBracketIcon,
  GlobeAltIcon,
  CalendarIcon,
  BookOpenIcon,
  PhotoIcon,
  PencilSquareIcon,
  RectangleGroupIcon,
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
  readme: string;
  tags: string[];
  notes: string;
  source: string;
  collected_at: string;
  created: string;
}

interface Article {
  id: string;
  title: string;
  url: string;
  snippet: string;
  content: string;
  source: string;
}

interface Image {
  id: string;
  image_url: string;
  alt_text: string;
  source: string;
  is_cover: boolean;
}

export function ProjectDetail() {
  const { id } = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      try {
        setLoading(true);
        const [proj, arts, imgs] = await Promise.all([
          pb.collection('gh_trending_projects').getOne<Project>(id, { requestKey: null }),
          pb.collection('gh_trending_articles').getFullList<Article>({
            filter: `project = "${id}"`,
            sort: '-created',
            requestKey: null,
          }),
          pb.collection('gh_trending_images').getFullList<Image>({
            filter: `project = "${id}"`,
            sort: '-created',
            requestKey: null,
          }),
        ]);
        setProject(proj);
        setArticles(arts);
        setImages(imgs);
        setNote(proj.notes || '');
      } catch (error: any) {
        if (!error.isAbort) console.error('Failed to fetch project detail:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const saveNote = async () => {
    if (!project) return;
    try {
      setSaving(true);
      await pb.collection('gh_trending_projects').update(project.id, { notes: note });
      toast.success('笔记已保存');
    } catch (error: any) {
      console.error('Failed to save note:', error);
      toast.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const addTag = async () => {
    if (!project || !tagInput.trim()) return;
    const newTags = [...(project.tags || []), tagInput.trim()];
    try {
      await pb.collection('gh_trending_projects').update(project.id, { tags: newTags });
      setProject({ ...project, tags: newTags });
      setTagInput('');
    } catch (error: any) {
      console.error('Failed to add tag:', error);
    }
  };

  const removeTag = async (tagToRemove: string) => {
    if (!project) return;
    const newTags = (project.tags || []).filter((t) => t !== tagToRemove);
    try {
      await pb.collection('gh_trending_projects').update(project.id, { tags: newTags });
      setProject({ ...project, tags: newTags });
    } catch (error: any) {
      console.error('Failed to remove tag:', error);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return String(num);
  };

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="text-neutral-500">加载中...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-6">
        <Link to="/github-trending" className="text-primary hover:underline">← 返回列表</Link>
        <p className="mt-4 text-neutral-500">项目不存在</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <Link
        to="/github-trending"
        className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        返回列表
      </Link>

      <Card className="rounded-2xl border-none shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            {project.owner_avatar ? (
              <img src={project.owner_avatar} alt="" className="h-16 w-16 rounded-full" />
            ) : (
              <div className="h-16 w-16 rounded-full bg-neutral-200 dark:bg-neutral-700" />
            )}
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
                {project.name}
              </h1>
              {project.description && (
                <p className="mt-1 text-neutral-600 dark:text-neutral-400">{project.description}</p>
              )}
              <div className="flex flex-wrap items-center gap-4 mt-3">
                {project.language && (
                  <span className="flex items-center gap-1 text-sm text-neutral-500">
                    <CodeBracketIcon className="h-4 w-4" />
                    {project.language}
                  </span>
                )}
                <span className="flex items-center gap-1 text-sm text-neutral-500">
                  <StarIcon className="h-4 w-4" />
                  {formatNumber(project.stars)}
                </span>
                <span className="text-sm text-neutral-500">
                  Forks: {formatNumber(project.forks)}
                </span>
                {project.stars_today > 0 && (
                  <Badge variant="secondary">今日 +{project.stars_today}</Badge>
                )}
                <span className="flex items-center gap-1 text-sm text-neutral-500">
                  <CalendarIcon className="h-4 w-4" />
                  {project.collected_at ? new Date(project.collected_at).toLocaleDateString('zh-CN') : '-'}
                </span>
              </div>
              <div className="flex gap-2 mt-3">
                <Button variant="outline" size="sm" className="rounded-xl" onClick={() => window.open(project.url, '_blank')}>
                  <GlobeAltIcon className="h-4 w-4 mr-1" />
                  查看 GitHub
                </Button>
                {project.homepage && (
                  <Button variant="outline" size="sm" className="rounded-xl" onClick={() => window.open(project.homepage, '_blank')}>
                    <GlobeAltIcon className="h-4 w-4 mr-1" />
                    项目主页
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {(project.tags || []).map((tag) => (
              <Badge key={tag} variant="secondary" className="gap-1">
                {tag}
                <button onClick={() => removeTag(tag)} className="ml-1 hover:text-red-500">&times;</button>
              </Badge>
            ))}
            <div className="flex gap-1">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addTag()}
                placeholder="添加标签..."
                className="h-7 rounded-md border border-neutral-200 px-2 text-xs dark:border-neutral-700 dark:bg-neutral-900"
              />
              <Button size="sm" variant="ghost" onClick={addTag} className="h-7">+</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="readme" className="w-full">
        <TabsList>
          <TabsTrigger value="readme">
            <BookOpenIcon className="h-4 w-4 mr-2" />
            概览
          </TabsTrigger>
          <TabsTrigger value="articles">
            <PencilSquareIcon className="h-4 w-4 mr-2" />
            文章 ({articles.length})
          </TabsTrigger>
          <TabsTrigger value="images">
            <PhotoIcon className="h-4 w-4 mr-2" />
            图片素材 ({images.length})
          </TabsTrigger>
          <TabsTrigger value="cards">
            <RectangleGroupIcon className="h-4 w-4 mr-2" />
            卡片
          </TabsTrigger>
          <TabsTrigger value="notes">笔记</TabsTrigger>
        </TabsList>

        <TabsContent value="readme" className="mt-4">
          <Card className="rounded-2xl border-none shadow-sm">
            <CardContent className="p-6">
              {project.readme ? (
                <pre className="whitespace-pre-wrap text-sm text-neutral-700 dark:text-neutral-300 max-h-[600px] overflow-y-auto font-sans">
                  {project.readme}
                </pre>
              ) : (
                <p className="text-neutral-500">暂无 README 数据</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="articles" className="mt-4 space-y-3">
          {articles.length === 0 ? (
            <Card className="rounded-2xl border-none shadow-sm">
              <CardContent className="py-8 text-center text-neutral-500">暂无相关文章</CardContent>
            </Card>
          ) : (
            articles.map((article) => (
              <Card key={article.id} className="rounded-2xl border-none shadow-sm">
                <CardContent className="p-4">
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-primary hover:underline"
                  >
                    {article.title}
                  </a>
                  {article.snippet && (
                    <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400 line-clamp-3">
                      {article.snippet}
                    </p>
                  )}
                  <span className="text-xs text-neutral-400 mt-1 block">来源: {article.source}</span>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="images" className="mt-4">
          {images.length === 0 ? (
            <Card className="rounded-2xl border-none shadow-sm">
              <CardContent className="py-8 text-center text-neutral-500">暂无图片素材</CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {images.map((image) => (
                <Card key={image.id} className="rounded-2xl border-none shadow-sm overflow-hidden">
                  <div className="relative aspect-video bg-neutral-100 dark:bg-neutral-800">
                    <img
                      src={image.image_url}
                      alt={image.alt_text}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                    {image.is_cover && (
                      <Badge className="absolute top-2 right-2">封面</Badge>
                    )}
                  </div>
                  <div className="p-2">
                    <p className="text-xs text-neutral-500 truncate">{image.alt_text}</p>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="cards" className="mt-4">
          <CardTemplates project={project} />
        </TabsContent>

        <TabsContent value="notes" className="mt-4">
          <Card className="rounded-2xl border-none shadow-sm">
            <CardContent className="p-6">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="记录你对这个项目的看法、用途、待办事项..."
                className="w-full min-h-[200px] rounded-xl border border-neutral-200 bg-white p-4 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              />
              <div className="mt-3 flex justify-end">
                <Button onClick={saveNote} disabled={saving} className="rounded-xl">
                  {saving ? '保存中...' : '保存笔记'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
