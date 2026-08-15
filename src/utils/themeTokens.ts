export type ColorPalette = 
  | 'paper' 
  | 'dracula' 
  | 'forest' 
  | 'ocean' 
  | 'sunset'
  | 'ink'
  | 'lavender'
  | 'sakura'
  | 'mint'
  | 'wine'
  | 'mono'
  | 'gray';
export type ThemeMode = 'dark' | 'light';

export interface ThemeOption {
  id: ColorPalette;
  nameVi: string;
  nameEn: string;
  descVi: string;
  descEn: string;
  darkBg: string;
  lightBg: string;
  darkSurface: string;
  lightSurface: string;
  darkAccent: string;
  lightAccent: string;
  darkBorder: string;
  lightBorder: string;
}

export const THEME_OPTIONS: ThemeOption[] = [
  // 5 Classic Themes (Row 1)
  {
    id: 'paper',
    nameVi: 'Giấy',
    nameEn: 'Paper',
    descVi: 'Than ấm & kem giấy, điểm nhấn hổ phách đất nung',
    descEn: 'Warm charcoal & parchment cream with amber terracotta',
    darkBg: '#171513',
    lightBg: '#FBF9F5',
    darkSurface: '#201D1A',
    lightSurface: '#FFFFFF',
    darkAccent: '#F59E0B',
    lightAccent: '#D97706',
    darkBorder: '#38322B',
    lightBorder: '#E6E0D6'
  },
  {
    id: 'dracula',
    nameVi: 'Dracula / Alucard',
    nameEn: 'Dracula / Alucard',
    descVi: 'Tím huyền bí, hồng neon & xám Dracula kinh điển',
    descEn: 'Classic gothic dark purple, pink & crisp Alucard light',
    darkBg: '#282a36',
    lightBg: '#f8f8f2',
    darkSurface: '#21222c',
    lightSurface: '#ffffff',
    darkAccent: '#bd93f9',
    lightAccent: '#7952b3',
    darkBorder: '#44475a',
    lightBorder: '#d6d8e8'
  },
  {
    id: 'forest',
    nameVi: 'Rừng',
    nameEn: 'Forest',
    descVi: 'Xanh rừng rậm sâu thẳm, dịu mắt & tập trung',
    descEn: 'Deep evergreen pine & soothing botanical emerald',
    darkBg: '#0D1612',
    lightBg: '#F4F8F5',
    darkSurface: '#13221B',
    lightSurface: '#FFFFFF',
    darkAccent: '#10B981',
    lightAccent: '#047857',
    darkBorder: '#23382D',
    lightBorder: '#D4E3D8'
  },
  {
    id: 'ocean',
    nameVi: 'Biển',
    nameEn: 'Ocean',
    descVi: 'Xanh đại dương tĩnh lặng, thanh lịch & khoáng đạt',
    descEn: 'Deep nautical blue & crisp azure sky breeze',
    darkBg: '#0C1524',
    lightBg: '#F2F7FB',
    darkSurface: '#131F33',
    lightSurface: '#FFFFFF',
    darkAccent: '#0EA5E9',
    lightAccent: '#0284C7',
    darkBorder: '#223554',
    lightBorder: '#CFE0F0'
  },
  {
    id: 'sunset',
    nameVi: 'Hoàng hôn',
    nameEn: 'Sunset',
    descVi: 'Tím hoàng hôn & cam hồng ấm áp, lãng mạn',
    descEn: 'Twilight dusk violet & warm coral sunset amber',
    darkBg: '#19121E',
    lightBg: '#FDF5F6',
    darkSurface: '#23192B',
    lightSurface: '#FFFFFF',
    darkAccent: '#F43F5E',
    lightAccent: '#E11D48',
    darkBorder: '#3C2B49',
    lightBorder: '#ECD1D8'
  },
  // 5 New Themes (Row 2)
  {
    id: 'ink',
    nameVi: 'Mực',
    nameEn: 'Ink',
    descVi: 'Đơn sắc tối giản, chuyên nghiệp & điểm nhấn ngọc trầm',
    descEn: 'Minimalist monochrome with subtle dark jade accent',
    darkBg: '#1c1c1e',
    lightBg: '#f5f5f5',
    darkSurface: '#2c2c2e',
    lightSurface: '#ffffff',
    darkAccent: '#6b9b95',
    lightAccent: '#4a7d78',
    darkBorder: '#3a3a3c',
    lightBorder: '#d1d1d6'
  },
  {
    id: 'lavender',
    nameVi: 'Oải hương',
    nameEn: 'Lavender',
    descVi: 'Tím pastel dịu êm, thanh nhã & thư thái tinh thần',
    descEn: 'Soft calming pastel lavender violet for deep peace',
    darkBg: '#2a2438',
    lightBg: '#f6f3fb',
    darkSurface: '#372f47',
    lightSurface: '#ffffff',
    darkAccent: '#9c7fc7',
    lightAccent: '#8667b8',
    darkBorder: '#463b5b',
    lightBorder: '#e2dcf2'
  },
  {
    id: 'sakura',
    nameVi: 'Đào',
    nameEn: 'Sakura',
    descVi: 'Hồng phấn hoa đào nhẹ nhàng, tươi mới & thi vị',
    descEn: 'Gentle cherry blossom blush with soothing spring warmth',
    darkBg: '#2b2024',
    lightBg: '#fdf3f5',
    darkSurface: '#3a2b30',
    lightSurface: '#ffffff',
    darkAccent: '#d97a94',
    lightAccent: '#d97a94',
    darkBorder: '#4a363d',
    lightBorder: '#f2d7dc'
  },
  {
    id: 'mint',
    nameVi: 'Bạc hà',
    nameEn: 'Mint',
    descVi: 'Xanh mint tươi mát, tràn đầy năng lượng & sảng khoái',
    descEn: 'Crisp refreshing spearmint green for vitality',
    darkBg: '#16241f',
    lightBg: '#f0faf5',
    darkSurface: '#1f3129',
    lightSurface: '#ffffff',
    darkAccent: '#5ecfa0',
    lightAccent: '#2fa876',
    darkBorder: '#2d453b',
    lightBorder: '#cde8dc'
  },
  {
    id: 'wine',
    nameVi: 'Rượu vang',
    nameEn: 'Wine',
    descVi: 'Đỏ vang trầm quý phái, đằm thắm & sang trọng',
    descEn: 'Deep vintage wine crimson with royal elegance',
    darkBg: '#241417',
    lightBg: '#fbf1f2',
    darkSurface: '#351d21',
    lightSurface: '#ffffff',
    darkAccent: '#a8384f',
    lightAccent: '#a8384f',
    darkBorder: '#4b272e',
    lightBorder: '#ecd2d6'
  },
  {
    id: 'mono',
    nameVi: 'Trắng/Đen',
    nameEn: 'Monochrome',
    descVi: 'Tương phản cao tuyệt đối, tối giản & sắc sảo',
    descEn: 'Absolute high contrast, minimalist & sharp',
    darkBg: '#000000',
    lightBg: '#ffffff',
    darkSurface: '#0a0a0a',
    lightSurface: '#ffffff',
    darkAccent: '#ffffff',
    lightAccent: '#000000',
    darkBorder: '#333333',
    lightBorder: '#e5e5e5'
  },
  {
    id: 'gray',
    nameVi: 'Xám',
    nameEn: 'Slate Gray',
    descVi: 'Xám sang trọng, hiện đại & chuyên nghiệp',
    descEn: 'Modern sophisticated gray, professional & sleek',
    darkBg: '#18181b',
    lightBg: '#f4f4f5',
    darkSurface: '#27272a',
    lightSurface: '#ffffff',
    darkAccent: '#a1a1aa',
    lightAccent: '#52525b',
    darkBorder: '#3f3f46',
    lightBorder: '#e4e4e7'
  }
];
