
import { StyleCategory, StyleAdjustmentQuestion, User, Match, Product, ChatMessage } from './types';

export const APP_ROUTES = {
  LOGIN: '/login',
  PROFILE: '/profile',
  EDIT_PROFILE: '/edit-profile',
  STYLE_ADJUSTMENT: '/style-adjustment',
  MATCH_AREA: '/match-area',
  CHAT: '/chat/:chatId', // Example of dynamic route for specific chat
  VENDOR: '/vendor',
  SETTINGS: '/settings',
};

export const NEON_COLORS = {
  blue: 'text-neon-blue', // #00FFFF
  green: 'text-neon-green', // #00FF00
  orange: 'text-neon-orange', // #FF8C00
};

export const MOCK_USER_PROFILE: User = {
  id: 'currentUser',
  displayName: 'Alex Ryder',
  city: 'Neo Kyoto',
  gender: 'male',
  avatarUrl: 'https://picsum.photos/seed/alexryder/200/200',
  bio: 'Explorer of digital frontiers and analog dreams. Seeking connections beyond the surface.',
  isVip: true,
};

export const MOCK_STYLE_PROFILE_COMPLETION = 65;

export const MOCK_RADAR_CHART_DATA = [
  { subject: StyleCategory.Sneakers, A: 70, fullMark: 100 },
  { subject: StyleCategory.Clothing, A: 85, fullMark: 100 },
  { subject: StyleCategory.Colors, A: 60, fullMark: 100 },
  { subject: StyleCategory.Hobbies, A: 90, fullMark: 100 },
  { subject: StyleCategory.Feelings, A: 75, fullMark: 100 },
];

export const MOCK_POTENTIAL_MATCHES = 48;

export const MOCK_STYLE_ADJUSTMENT_QUESTIONS: StyleAdjustmentQuestion[] = [
  {
    id: 'sneakers1',
    category: StyleCategory.Sneakers,
    questionText: 'Which sneaker style calls to you?',
    option1: { id: 'nike', imageUrl: 'https://picsum.photos/seed/nike/300/200', label: 'Sporty Kicks' },
    option2: { id: 'adidas', imageUrl: 'https://picsum.photos/seed/adidas/300/200', label: 'Urban Classics' },
  },
  {
    id: 'clothing1',
    category: StyleCategory.Clothing,
    questionText: 'Your everyday vibe?',
    option1: { id: 'casual', imageUrl: 'https://picsum.photos/seed/casual/300/200', label: 'Relaxed & Casual' },
    option2: { id: 'formal', imageUrl: 'https://picsum.photos/seed/formal/300/200', label: 'Sharp & Formal' },
  },
  {
    id: 'colors1',
    category: StyleCategory.Colors,
    questionText: 'Color palette preference?',
    option1: { id: 'bright', imageUrl: 'https://picsum.photos/seed/brightcolors/300/200?random=1', label: 'Vibrant Hues' },
    option2: { id: 'dark', imageUrl: 'https://picsum.photos/seed/darkcolors/300/200?random=2', label: 'Muted Tones' },
  },
  {
    id: 'hobbies1',
    category: StyleCategory.Hobbies,
    questionText: 'How do you unwind?',
    option1: { id: 'gaming', imageUrl: 'https://picsum.photos/seed/gaming/300/200', label: 'Digital Worlds' },
    option2: { id: 'outdoors', imageUrl: 'https://picsum.photos/seed/outdoors/300/200', label: 'Nature Escapes' },
  },
  {
    id: 'feelings1',
    category: StyleCategory.Feelings,
    questionText: 'Your current emotional state?',
    option1: { id: 'energetic', imageUrl: 'https://picsum.photos/seed/energetic/300/200', label: 'High Energy' },
    option2: { id: 'calm', imageUrl: 'https://picsum.photos/seed/calm/300/200', label: 'Tranquil Vibes' },
  },
];

export const MOCK_MATCHES: Match[] = [
  { id: 'match1', user: { id: 'user1', displayName: 'Nova', city: 'Cyberia', gender: 'female', avatarUrl: 'https://picsum.photos/seed/nova/100/100', isVip: false }, compatibilityScore: 92 },
  { id: 'match2', user: { id: 'user2', displayName: 'Jax', city: 'Tech Haven', gender: 'male', avatarUrl: 'https://picsum.photos/seed/jax/100/100', isVip: true }, compatibilityScore: 88 },
  { id: 'match3', user: { id: 'user3', displayName: 'Lyra', city: 'Aethelburg', gender: 'female', avatarUrl: 'https://picsum.photos/seed/lyra/100/100', isVip: false }, compatibilityScore: 85 },
  { id: 'match4', user: { id: 'user4', displayName: 'Orion', city: 'Neo Kyoto', gender: 'other', avatarUrl: 'https://picsum.photos/seed/orion/100/100', isVip: false }, compatibilityScore: 78 },
];

export const MOCK_CHAT_MESSAGES: ChatMessage[] = [
  { id: 'msg1', senderId: 'user1', text: 'Hey Alex! Saw we matched, 92% is pretty high! 😄', timestamp: new Date(Date.now() - 1000 * 60 * 5), isCurrentUser: false },
  { id: 'msg2', senderId: 'currentUser', text: 'Nova! Hey! Yeah, awesome score. What caught your eye?', timestamp: new Date(Date.now() - 1000 * 60 * 4), isCurrentUser: true },
  { id: 'msg3', senderId: 'user1', text: 'Definitely our shared love for urban classics and digital worlds. You into retro-futurism?', timestamp: new Date(Date.now() - 1000 * 60 * 3), isCurrentUser: false },
  { id: 'msg4', senderId: 'currentUser', text: 'Absolutely! Currently replaying Chrono Trigger. You?', timestamp: new Date(Date.now() - 1000 * 60 * 2), isCurrentUser: true },
];


export const MOCK_PRODUCTS: Product[] = [
  { id: 'prod1', name: 'Cyber-Visor X1', brandLogoUrl: 'https://picsum.photos/seed/brandA/50/50', imageUrl: 'https://picsum.photos/seed/visor/200/200', price: 'Ξ0.25 ETH' },
  { id: 'prod2', name: 'Zero-G Sneakers', brandLogoUrl: 'https://picsum.photos/seed/brandB/50/50', imageUrl: 'https://picsum.photos/seed/sneakerX/200/200', price: '$199.99' },
  { id: 'prod3', name: 'Holo-Jacket', brandLogoUrl: 'https://picsum.photos/seed/brandC/50/50', imageUrl: 'https://picsum.photos/seed/jacketH/200/200', price: '¥25,000' },
  { id: 'prod4', name: 'Neuralink Band', brandLogoUrl: 'https://picsum.photos/seed/brandD/50/50', imageUrl: 'https://picsum.photos/seed/bandN/200/200', price: 'VIP Exclusive' },
];

export const MOCK_SPONSORED_BANNERS = [
    { id: 'banner1', imageUrl: 'https://picsum.photos/seed/nikebanner/400/100', alt: 'Nike Banner Ad' },
    { id: 'banner2', imageUrl: 'https://picsum.photos/seed/spotifybanner/400/100', alt: 'Spotify Banner Ad' },
];
