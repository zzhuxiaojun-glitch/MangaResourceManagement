export const MANGA_TAGS = [
  '漫画家作品合集',
  '少年',
  '青年',
  '少女',
  'BL',
  'GL',
  'SF',
  '本子',
  '生肉',
] as const;

export const ANIME_TYPES = [
  { value: 'tv', label: 'TV版' },
  { value: 'movie', label: '动画电影 · 剧场版' },
] as const;

export const STATUS_OPTIONS = [
  { value: 'all', label: '全部状态' },
  { value: '有效', label: '有效' },
  { value: '失效', label: '失效' },
  { value: '待补', label: '待补' },
  { value: '连载中', label: '连载中' },
  { value: '已完结', label: '已完结' },
] as const;
