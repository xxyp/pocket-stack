import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  ClockIcon,
  PlayCircleIcon,
  StopCircleIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

const SCRAPER_API = 'http://localhost:3001';

interface ScheduleInfo {
  enabled: boolean;
  cron: string | null;
}

export const metadata = {
  id: 'github-schedule',
  title: '定时任务',
  icon: ClockIcon,
  presetSettings: [],
};

export function GitHubScheduleForm() {
  const [schedule, setSchedule] = useState<ScheduleInfo | null>(null);
  const [nextRun, setNextRun] = useState<string | null>(null);
  const [cronInput, setCronInput] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSchedule = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch(`${SCRAPER_API}/api/schedule`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.success) {
        setSchedule(data.schedule);
        setNextRun(data.nextRun);
        setCronInput(data.schedule.cron || '');
      }
    } catch (err: any) {
      setError('无法连接到抓取服务，请确认服务已启动');
    }
  }, []);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  const updateSchedule = async (body: object) => {
    try {
      setSaving(true);
      const res = await fetch(`${SCRAPER_API}/api/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        setSchedule(data.schedule);
        setNextRun(data.nextRun || null);
        toast.success(data.message || '定时任务已更新');
      } else {
        toast.error(data.error || '操作失败');
      }
    } catch (err: any) {
      toast.error('连接抓取服务失败');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!cronInput.trim()) {
      toast.error('请输入 cron 表达式');
      return;
    }
    await updateSchedule({ cron: cronInput.trim() });
  };

  const handleToggle = async () => {
    if (schedule?.enabled) {
      try {
        setSaving(true);
        const res = await fetch(`${SCRAPER_API}/api/schedule`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
          setSchedule(data.schedule);
          setNextRun(null);
          toast.success('定时任务已关闭');
        }
      } catch {
        toast.error('连接抓取服务失败');
      } finally {
        setSaving(false);
      }
    } else {
      await updateSchedule({ cron: cronInput.trim() || '0 */6 * * *' });
    }
  };

  const handleSyncNow = async () => {
    try {
      setSyncing(true);
      const res = await fetch(`${SCRAPER_API}/api/sync?since=daily`, { signal: AbortSignal.timeout(120000) });
      const data = await res.json();
      if (data.success) {
        toast.success(`同步完成：新增 ${data.stats.created}，更新 ${data.stats.updated}`);
        // Refresh schedule to get updated next run time
        fetchSchedule();
      } else {
        toast.error(data.error || '同步失败');
      }
    } catch (err: any) {
      if (err.name === 'TimeoutError') {
        toast.error('同步超时，GitHub 可能暂时不可达');
      } else {
        toast.error('同步请求失败');
      }
    } finally {
      setSyncing(false);
    }
  };

  const formatNextRun = (iso: string | null) => {
    if (!iso) return '--';
    return new Date(iso).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
  };

  const cronExamples = [
    { expr: '0 */6 * * *', label: '每 6 小时' },
    { expr: '0 * * * *', label: '每小时' },
    { expr: '0 9 * * *', label: '每天 09:00' },
    { expr: '0 */12 * * *', label: '每 12 小时' },
  ];

  return (
    <Card className="rounded-2xl border-none shadow-sm bg-white/50 backdrop-blur-sm dark:bg-neutral-900/50">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <ClockIcon className="h-5 w-5 text-primary" />
          {schedule?.enabled ? '定时抓取' : '定时抓取（已暂停）'}
        </CardTitle>
        <CardDescription>
          管理 GitHub Trending 自动抓取的定时任务，抓取结果将自动写入数据库。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 text-sm text-amber-700 dark:text-amber-300 flex items-start gap-2">
            <ExclamationCircleIcon className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">服务连接失败</p>
              <p className="mt-1">请确认抓取服务已启动：<code className="text-xs bg-amber-100 dark:bg-amber-800/40 px-1 rounded">npm run scraper-api</code></p>
            </div>
          </div>
        )}

        {/* Status Bar */}
        <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <span className="text-sm text-neutral-500">状态：</span>
            {schedule?.enabled ? (
              <Badge variant="default" className="bg-green-500 hover:bg-green-600 gap-1">
                <CheckCircleIcon className="h-3 w-3" />
                运行中
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1">
                <StopCircleIcon className="h-3 w-3" />
                已暂停
              </Badge>
            )}
          </div>
          <div className="text-sm text-neutral-500">
            <span className="hidden sm:inline">下次执行：</span>
            <span className="font-mono text-neutral-700 dark:text-neutral-300">{formatNextRun(nextRun)}</span>
          </div>
          <div className="text-sm text-neutral-500">
            <span className="hidden sm:inline">当前表达式：</span>
            <code className="px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-700 text-xs font-mono">
              {schedule?.enabled ? schedule.cron : '--'}
            </code>
          </div>
        </div>

        {/* Cron Config */}
        <div className="space-y-3">
          <Label htmlFor="cron" className="text-base font-semibold">
            Cron 表达式
          </Label>
          <div className="flex gap-2">
            <Input
              id="cron"
              value={cronInput}
              onChange={(e) => setCronInput(e.target.value)}
              placeholder="0 */6 * * *"
              className="rounded-xl border-neutral-200 font-mono flex-1"
            />
            <Button
              onClick={handleSave}
              disabled={saving || !cronInput.trim()}
              variant="outline"
              className="rounded-xl"
            >
              <CheckCircleIcon className="h-4 w-4 mr-1" />
              应用
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {cronExamples.map((ex) => (
              <button
                key={ex.expr}
                type="button"
                onClick={() => setCronInput(ex.expr)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                  cronInput === ex.expr
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-neutral-200 dark:border-neutral-700 text-neutral-500 hover:border-neutral-300 dark:hover:border-neutral-600'
                }`}
              >
                {ex.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-neutral-400">
            使用标准 cron 表达式。例如 <code className="text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-1 rounded">0 */6 * * *</code> 表示每 6 小时执行一次
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Button
            onClick={handleSyncNow}
            disabled={syncing}
            className="rounded-xl bg-primary hover:bg-primary/90"
          >
            {syncing ? (
              <>
                <ArrowPathIcon className="h-4 w-4 mr-1.5 animate-spin" />
                同步中...
              </>
            ) : (
              <>
                <SparklesIcon className="h-4 w-4 mr-1.5" />
                立即同步
              </>
            )}
          </Button>
          <Button
            onClick={handleToggle}
            disabled={saving}
            variant={schedule?.enabled ? 'outline' : 'default'}
            className="rounded-xl"
          >
            {schedule?.enabled ? (
              <>
                <StopCircleIcon className="h-4 w-4 mr-1.5" />
                暂停定时
              </>
            ) : (
              <>
                <PlayCircleIcon className="h-4 w-4 mr-1.5" />
                启用定时
              </>
            )}
          </Button>
          <Button
            onClick={fetchSchedule}
            variant="ghost"
            size="sm"
            className="rounded-xl text-neutral-400"
          >
            <ArrowPathIcon className="h-4 w-4 mr-1" />
            刷新状态
          </Button>
        </div>

        {/* Info */}
        <div className="rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/30 p-3 text-xs text-blue-600 dark:text-blue-400">
          <p>定时任务通过本地的抓取服务（端口 3001）执行。该服务使用 Axios + Cheerio 直接从 GitHub Trending 抓取数据，比 PocketBase 内置的正则解析更稳定。</p>
        </div>
      </CardContent>
    </Card>
  );
}
