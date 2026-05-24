import { useState, useEffect } from 'react';
import { pb } from '@/lib/pocketbase';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Cog6ToothIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

interface Setting {
  id: string;
  key: string;
  value: any;
}

export function Settings() {
  const [settings, setSettings] = useState<Record<string, Setting>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const defaultSettings = {
    language: { key: 'language', value: '' },
    since: { key: 'since', value: 'daily' },
    auto_sync: { key: 'auto_sync', value: true },
    sync_interval: { key: 'sync_interval', value: 6 },
  };

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const records = await pb.collection('gh_trending_settings').getFullList<Setting>({
          requestKey: null,
        });
        const map: Record<string, Setting> = {};
        records.forEach((r) => {
          map[r.key] = r;
        });
        Object.entries(defaultSettings).forEach(([key, def]) => {
          if (!map[key]) {
            map[key] = { id: '', key: def.key, value: def.value };
          }
        });
        setSettings(map);
      } catch (error: any) {
        if (!error.isAbort) console.error('Failed to fetch settings:', error);
        toast.error('获取设置失败，请确保已初始化数据集合');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const updateSetting = (key: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [key]: { ...prev[key], value },
    }));
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      const promises = Object.values(settings).map(async (setting) => {
        const data = { key: setting.key, value: setting.value };
        if (setting.id) {
          return pb.collection('gh_trending_settings').update(setting.id, data, { requestKey: null });
        } else {
          return pb.collection('gh_trending_settings').create(data, { requestKey: null });
        }
      });
      await Promise.all(promises);
      toast.success('设置已保存');

      const records = await pb.collection('gh_trending_settings').getFullList<Setting>({ requestKey: null });
      const map: Record<string, Setting> = {};
      records.forEach((r) => { map[r.key] = r; });
      Object.entries(defaultSettings).forEach(([key, def]) => {
        if (!map[key]) map[key] = { id: '', key: def.key, value: def.value };
      });
      setSettings(map);
    } catch (error: any) {
      toast.error(`保存失败: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="text-neutral-500">加载设置中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
          <Cog6ToothIcon className="h-8 w-8 text-primary" />
          抓取设置
        </h1>
        <p className="mt-2 text-neutral-600 dark:text-neutral-400">
          配置 GitHub Trending 抓取参数和自动同步
        </p>
      </div>

      <Card className="rounded-2xl border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">抓取参数</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>筛选语言</Label>
            <select
              value={String(settings.language?.value || '')}
              onChange={(e) => updateSetting('language', e.target.value)}
              className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            >
              <option value="">所有语言</option>
              <option value="typescript">TypeScript</option>
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="go">Go</option>
              <option value="rust">Rust</option>
              <option value="java">Java</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label>时间范围</Label>
            <select
              value={String(settings.since?.value || 'daily')}
              onChange={(e) => updateSetting('since', e.target.value)}
              className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            >
              <option value="daily">每日</option>
              <option value="weekly">每周</option>
              <option value="monthly">每月</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="auto_sync"
              checked={Boolean(settings.auto_sync?.value)}
              onChange={(e) => updateSetting('auto_sync', e.target.checked)}
              className="h-4 w-4 rounded border-neutral-300"
            />
            <Label htmlFor="auto_sync">启用自动同步</Label>
          </div>

          {Boolean(settings.auto_sync?.value) && (
            <div className="space-y-2">
              <Label>同步间隔（小时）</Label>
              <Input
                type="number"
                min={1}
                max={24}
                value={Number(settings.sync_interval?.value) || 6}
                onChange={(e) => updateSetting('sync_interval', parseInt(e.target.value) || 6)}
                className="rounded-xl w-32"
              />
            </div>
          )}

          <div className="pt-4">
            <Button onClick={saveSettings} disabled={saving} className="rounded-xl">
              {saving ? (
                <>
                  <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                  保存中...
                </>
              ) : (
                '保存设置'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
