interface DishArtworkProps {
  productName: string;
  categoryName?: string;
  darkSurface?: boolean;
  compact?: boolean;
  className?: string;
}

type DishKind = 'wrap' | 'burger' | 'sandwich' | 'salad' | 'pizza' | 'combo';
type FlavorKind = 'veg' | 'paneer' | 'fish' | 'prawns' | 'spicy' | 'chicken';

function detectDishKind(name: string, category: string): DishKind {
  const n = name.toLowerCase();
  const c = category.toLowerCase();
  if (c.includes('combo') || c.includes('beverage') || c.includes('bevrage') || n.includes('saver')) {
    return 'combo';
  }
  if (n.includes('pizza') || c.includes('pizza')) return 'pizza';
  if (n.includes('burger') || c.includes('burger')) return 'burger';
  if (n.includes('sandwich') || n.includes('sandwitch') || c.includes('sandwich')) return 'sandwich';
  if (n.includes('salad') || c.includes('salad')) return 'salad';
  return 'wrap';
}

function detectFlavorKind(name: string, category: string): FlavorKind {
  const n = name.toLowerCase();
  const c = category.toLowerCase();
  if (n.includes('prawn')) return 'prawns';
  if (n.includes('fish')) return 'fish';
  if (n.includes('paneer')) return 'paneer';
  if (n.includes('veg') || n === 'cheese pizza') return 'veg';
  if (n.includes('spicy') || n.includes('65') || c.includes('spicy')) return 'spicy';
  return 'chicken';
}

const FLAVOR_ACCENTS: Record<
  FlavorKind,
  {primary: string; secondary: string; glowLight: string; glowDark: string}
> = {
  chicken: {
    primary: '#C97B2B',
    secondary: '#E7B05C',
    glowLight: 'rgba(201, 123, 43, 0.14)',
    glowDark: 'rgba(231, 176, 92, 0.18)',
  },
  spicy: {
    primary: '#B93829',
    secondary: '#E56D4C',
    glowLight: 'rgba(185, 56, 41, 0.14)',
    glowDark: 'rgba(229, 109, 76, 0.2)',
  },
  paneer: {
    primary: '#D48D2A',
    secondary: '#F2CA6B',
    glowLight: 'rgba(212, 141, 42, 0.15)',
    glowDark: 'rgba(242, 202, 107, 0.18)',
  },
  veg: {
    primary: '#3F7D47',
    secondary: '#76B36D',
    glowLight: 'rgba(63, 125, 71, 0.14)',
    glowDark: 'rgba(118, 179, 109, 0.18)',
  },
  fish: {
    primary: '#2F6F8F',
    secondary: '#D9A74A',
    glowLight: 'rgba(47, 111, 143, 0.13)',
    glowDark: 'rgba(114, 178, 209, 0.16)',
  },
  prawns: {
    primary: '#C4533B',
    secondary: '#F09472',
    glowLight: 'rgba(196, 83, 59, 0.14)',
    glowDark: 'rgba(240, 148, 114, 0.18)',
  },
};

export function DishArtwork({
  productName,
  categoryName = '',
  darkSurface = false,
  compact = false,
  className = '',
}: DishArtworkProps) {
  const dishKind = detectDishKind(productName, categoryName);
  const flavorKind = detectFlavorKind(productName, categoryName);
  const accent = FLAVOR_ACCENTS[flavorKind];

  const bgColor = darkSurface ? '#1A1816' : '#F3F1EC';
  const plateFill = darkSurface ? '#25221E' : '#FFFFFF';
  const plateStroke = darkSurface ? '#38342E' : '#E2DDD3';
  const crustFill = '#D7944A';
  const crustDark = '#A96628';
  const cheeseFill = '#F6C84C';
  const lettuceFill = '#5E9E52';
  const tomatoFill = '#D44B3A';

  return (
    <div
      className={`relative w-full h-full flex items-center justify-center overflow-hidden select-none ${className}`}
      style={{
        backgroundColor: bgColor,
        backgroundImage: `radial-gradient(circle at 50% 45%, ${
          darkSurface ? accent.glowDark : accent.glowLight
        }, transparent 72%)`,
      }}
      role="img"
      aria-label={productName}
    >
      <svg
        viewBox="0 0 240 180"
        className={compact ? 'w-11 h-9' : 'w-full h-full max-w-[230px] max-h-[175px]'}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Subtle serving plate */}
        <ellipse
          cx="120"
          cy="128"
          rx="76"
          ry="24"
          fill={plateFill}
          stroke={plateStroke}
          strokeWidth="2.5"
        />
        <ellipse
          cx="120"
          cy="128"
          rx="58"
          ry="16"
          stroke={plateStroke}
          strokeWidth="1.2"
          strokeDasharray="4 4"
        />

        {dishKind === 'wrap' && (
          <g>
            {/* Back wrap half */}
            <g transform="translate(88 64) rotate(-18)">
              <rect x="0" y="0" width="92" height="36" rx="18" fill="#E8C284" stroke={crustDark} strokeWidth="2" />
              <line x1="20" y1="6" x2="32" y2="30" stroke={crustDark} strokeWidth="2" opacity="0.45" />
              <line x1="40" y1="6" x2="52" y2="30" stroke={crustDark} strokeWidth="2" opacity="0.45" />
              <line x1="60" y1="6" x2="72" y2="30" stroke={crustDark} strokeWidth="2" opacity="0.45" />
            </g>
            {/* Front sliced wrap showing filling */}
            <g transform="translate(56 80) rotate(-10)">
              <rect x="0" y="0" width="102" height="40" rx="20" fill="#F0CF95" stroke={crustDark} strokeWidth="2.2" />
              <line x1="22" y1="7" x2="34" y2="33" stroke={crustDark} strokeWidth="2.2" opacity="0.5" />
              <line x1="42" y1="7" x2="54" y2="33" stroke={crustDark} strokeWidth="2.2" opacity="0.5" />
              <line x1="62" y1="7" x2="74" y2="33" stroke={crustDark} strokeWidth="2.2" opacity="0.5" />
              {/* Open stuffed cut end */}
              <ellipse cx="96" cy="20" rx="13" ry="18" fill={accent.primary} stroke={crustDark} strokeWidth="2" />
              <circle cx="93" cy="14" r="4.5" fill={lettuceFill} />
              <circle cx="99" cy="23" r="4" fill={cheeseFill} />
              <circle cx="92" cy="26" r="3.5" fill={tomatoFill} />
            </g>
            {/* Dipping sauce cup */}
            <path d="M168 112 L192 112 L188 128 L172 128 Z" fill={plateFill} stroke={plateStroke} strokeWidth="2" />
            <ellipse cx="180" cy="112" rx="12" ry="4" fill={accent.secondary} />
          </g>
        )}

        {dishKind === 'burger' && (
          <g transform="translate(0 4)">
            {/* Bottom bun */}
            <rect x="72" y="112" width="96" height="16" rx="8" fill={crustFill} stroke={crustDark} strokeWidth="2" />
            {/* Patty */}
            <rect x="68" y="96" width="104" height="16" rx="8" fill={accent.primary} stroke={crustDark} strokeWidth="2" />
            {/* Melted cheese triangle */}
            <path d="M74 96 L166 96 L146 108 L120 97 L96 107 Z" fill={cheeseFill} />
            {/* Lettuce & Tomato */}
            <path
              d="M68 92 Q78 84 88 92 Q98 84 108 92 Q118 84 128 92 Q138 84 148 92 Q158 84 172 92"
              stroke={lettuceFill}
              strokeWidth="6"
              strokeLinecap="round"
            />
            <rect x="82" y="80" width="76" height="7" rx="3.5" fill={tomatoFill} />
            {/* Top sesame bun */}
            <path d="M72 82 C72 48, 168 48, 168 82 Z" fill={crustFill} stroke={crustDark} strokeWidth="2.2" />
            <ellipse cx="102" cy="63" rx="3.5" ry="1.8" transform="rotate(-15 102 63)" fill="#FFF4D6" />
            <ellipse cx="122" cy="57" rx="3.5" ry="1.8" fill="#FFF4D6" />
            <ellipse cx="140" cy="64" rx="3.5" ry="1.8" transform="rotate(15 140 64)" fill="#FFF4D6" />
          </g>
        )}

        {dishKind === 'sandwich' && (
          <g>
            {/* Back grilled triangle */}
            <g transform="translate(12 -8)">
              <polygon points="74,118 164,118 119,62" fill="#EBBF7A" stroke={crustDark} strokeWidth="2" strokeLinejoin="round" />
              <line x1="94" y1="112" x2="115" y2="86" stroke={crustDark} strokeWidth="2" opacity="0.4" />
              <line x1="114" y1="112" x2="130" y2="90" stroke={crustDark} strokeWidth="2" opacity="0.4" />
            </g>
            {/* Front club sandwich triangle with filling layers */}
            <g transform="translate(-8 6)">
              <polygon points="70,122 162,122 116,66" fill="#F4D396" stroke={crustDark} strokeWidth="2.2" strokeLinejoin="round" />
              <rect x="74" y="114" width="84" height="6" rx="3" fill={accent.primary} />
              <rect x="78" y="109" width="76" height="5" rx="2.5" fill={lettuceFill} />
              <rect x="82" y="104" width="68" height="4.5" rx="2" fill={cheeseFill} />
              <line x1="94" y1="100" x2="112" y2="80" stroke={crustDark} strokeWidth="2.2" opacity="0.45" />
              <line x1="112" y1="100" x2="126" y2="83" stroke={crustDark} strokeWidth="2.2" opacity="0.45" />
            </g>
          </g>
        )}

        {dishKind === 'salad' && (
          <g>
            {/* Greens & toppings */}
            <circle cx="94" cy="86" r="18" fill={lettuceFill} />
            <circle cx="122" cy="78" r="20" fill="#72B565" />
            <circle cx="146" cy="88" r="17" fill={lettuceFill} />
            {/* Protein / Paneer / Prawns cubes */}
            <rect x="98" y="82" width="14" height="12" rx="4" transform="rotate(-12 98 82)" fill={accent.primary} />
            <rect x="124" y="78" width="14" height="12" rx="4" transform="rotate(14 124 78)" fill={accent.secondary} />
            <circle cx="109" cy="74" r="5.5" fill={tomatoFill} />
            <circle cx="139" cy="84" r="5" fill={tomatoFill} />
            {/* Salad bowl */}
            <path d="M70 92 C72 132, 168 132, 170 92 Z" fill={plateFill} stroke={plateStroke} strokeWidth="2.4" />
            <ellipse cx="120" cy="92" rx="50" ry="8" fill="none" stroke={accent.primary} strokeWidth="2" opacity="0.6" />
          </g>
        )}

        {dishKind === 'pizza' && (
          <g>
            {/* Full wood-fired pizza angled on plate */}
            <ellipse cx="120" cy="100" rx="64" ry="38" fill={crustFill} stroke={crustDark} strokeWidth="2.4" />
            <ellipse cx="120" cy="100" rx="54" ry="30" fill={tomatoFill} />
            <ellipse cx="120" cy="100" rx="50" ry="27" fill={cheeseFill} />
            {/* Slice cut lines */}
            <line x1="70" y1="100" x2="170" y2="100" stroke={crustDark} strokeWidth="1.3" opacity="0.35" />
            <line x1="120" y1="73" x2="120" y2="127" stroke={crustDark} strokeWidth="1.3" opacity="0.35" />
            <line x1="85" y1="81" x2="155" y2="119" stroke={crustDark} strokeWidth="1.3" opacity="0.35" />
            <line x1="155" y1="81" x2="85" y2="119" stroke={crustDark} strokeWidth="1.3" opacity="0.35" />
            {/* Toppings */}
            <circle cx="100" cy="92" r="5.5" fill={accent.primary} />
            <circle cx="136" cy="90" r="5.5" fill={accent.primary} />
            <circle cx="116" cy="110" r="5.5" fill={accent.primary} />
            <circle cx="142" cy="108" r="5" fill={accent.secondary} />
            <ellipse cx="104" cy="108" rx="4.5" ry="2.6" transform="rotate(-25 104 108)" fill={lettuceFill} />
            <ellipse cx="124" cy="85" rx="4.5" ry="2.6" transform="rotate(20 124 85)" fill={lettuceFill} />
          </g>
        )}

        {dishKind === 'combo' && (
          <g>
            {/* Cold Beverage Cup + Straw */}
            <line x1="154" y1="36" x2="146" y2="66" stroke={accent.primary} strokeWidth="4" strokeLinecap="round" />
            <path d="M128 66 L166 66 L160 122 L134 122 Z" fill={accent.primary} opacity="0.9" stroke={plateStroke} strokeWidth="2" />
            <rect x="125" y="61" width="44" height="8" rx="4" fill={plateFill} stroke={plateStroke} strokeWidth="2" />
            <circle cx="147" cy="94" r="9" fill={plateFill} opacity="0.25" />
            {/* Paired Saver Wrap / Burger */}
            <g transform="translate(52 84) rotate(-8)">
              <rect x="0" y="0" width="84" height="34" rx="17" fill="#F0CF95" stroke={crustDark} strokeWidth="2.2" />
              <line x1="18" y1="6" x2="28" y2="28" stroke={crustDark} strokeWidth="2" opacity="0.45" />
              <line x1="36" y1="6" x2="46" y2="28" stroke={crustDark} strokeWidth="2" opacity="0.45" />
              <ellipse cx="78" cy="17" rx="11" ry="15" fill={accent.secondary} stroke={crustDark} strokeWidth="2" />
              <circle cx="77" cy="14" r="4" fill={lettuceFill} />
              <circle cx="78" cy="22" r="3.5" fill={tomatoFill} />
            </g>
          </g>
        )}

        {/* Small flavor dot indicator for spicy dishes */}
        {flavorKind === 'spicy' && (
          <g transform="translate(186 42)">
            <path
              d="M8 2 C13 8, 13 15, 7 18 C2 15, 2 9, 8 2 Z"
              fill={accent.primary}
            />
          </g>
        )}
      </svg>
    </div>
  );
}
