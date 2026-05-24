import { FireIcon } from '@heroicons/react/24/outline';

export const menu = {
  title: 'GitHub 热点',
  icon: FireIcon,
  children: [
    { title: '热门项目', path: '/github-trending' },
    { title: '采集管理', path: '/github-trending/collected' },
    { title: '抓取设置', path: '/github-trending/settings' },
  ],
};
