import {lazy, Suspense, useEffect, useState} from 'react';
import {motion, AnimatePresence} from 'motion/react';
import {ChefHat} from 'lucide-react';

const ChefCookingCanvas = lazy(() =>
  import('./ChefCookingCanvas').then((mod) => ({default: mod.ChefCookingCanvas}))
);

const FUNNY_TAGLINES = [
  'Aur yaar, aaj kya khayega?',
  'Bhookh lagi hai kya? Chalo kuch tasty dekhte hain!',
  'Aaj diet kal se shuru karenge, pehle menu dekho!',
  'Pet pooja shuru ki jaaye?',
  'Chef full form mein hai, bas aap dish decide karo!',
  'Garma-garam khana bas ek tap door hai...',
  'Aaj kuch chatpata ho jaaye?',
  'Dil bole sab try kar, pet bole jaldi order kar!',
  'Plate ready hai, bas aapki pasand ka intezaar hai!',
  'Khaana aisa jo mood set kar de!',
  'Aaj cheat day hai — khul ke choose karo!',
  'Swad aisa ki ungliyan chaat-te reh jaaoge!',
];

const LAST_TAGLINE_STORAGE_KEY = 'qr_menu_last_tagline_idx';

function pickFreshTagline(): string {
  if (typeof window === 'undefined') {
    return FUNNY_TAGLINES[0];
  }

  let lastIndex = -1;
  try {
    const stored = window.localStorage.getItem(LAST_TAGLINE_STORAGE_KEY);
    if (stored !== null) {
      const parsed = Number.parseInt(stored, 10);
      if (Number.isFinite(parsed)) lastIndex = parsed;
    }
  } catch {
    // Ignore storage access errors in private browsing
  }

  let nextIndex = Math.floor(Math.random() * FUNNY_TAGLINES.length);
  if (FUNNY_TAGLINES.length > 1 && nextIndex === lastIndex) {
    nextIndex = (nextIndex + 1 + Math.floor(Math.random() * (FUNNY_TAGLINES.length - 1))) % FUNNY_TAGLINES.length;
  }

  try {
    window.localStorage.setItem(LAST_TAGLINE_STORAGE_KEY, String(nextIndex));
  } catch {
    // Ignore storage access errors
  }

  return FUNNY_TAGLINES[nextIndex];
}

const INTRO_DURATION_MS = 5000;

interface ChefCookingIntroProps {
  businessName?: string;
  themeBgClass: string;
  themeTextClass: string;
  themeSubTextClass: string;
  themeBorderClass: string;
  backgroundColorHex: string;
  isDarkTheme: boolean;
  onComplete: () => void;
}

export function ChefCookingIntro({
  businessName,
  themeBgClass,
  themeTextClass,
  themeSubTextClass,
  themeBorderClass,
  backgroundColorHex,
  isDarkTheme,
  onComplete,
}: ChefCookingIntroProps) {
  const [visible, setVisible] = useState(true);
  const [tagline] = useState<string>(() => pickFreshTagline());

  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      setVisible(false);
      onComplete();
      return;
    }

    const timer = window.setTimeout(() => {
      setVisible(false);
    }, INTRO_DURATION_MS);

    return () => window.clearTimeout(timer);
  }, [onComplete]);

  const handleDismiss = () => {
    setVisible(false);
  };

  return (
    <AnimatePresence onExitComplete={onComplete}>
      {visible ? (
        <motion.div
          key="chef-cooking-intro"
          initial={{opacity: 1}}
          exit={{opacity: 0}}
          transition={{duration: 0.55, ease: [0.16, 1, 0.3, 1]}}
          className={`fixed inset-0 z-50 flex flex-col items-center justify-between ${themeBgClass} ${themeTextClass} px-6 py-8 sm:py-10 select-none`}
          role="dialog"
          aria-label="Welcome animation"
        >
          {/* Top Branding */}
          <div className="text-center pt-2">
            {businessName ? (
              <p
                className={`text-xs sm:text-sm font-medium tracking-[0.18em] uppercase ${themeSubTextClass}`}
              >
                {businessName}
              </p>
            ) : null}
          </div>

          {/* 3D Tom & Jerry Chase Stage */}
          <div className="w-full max-w-xl flex-1 max-h-[420px] min-h-[260px] flex items-center justify-center relative">
            <Suspense
              fallback={
                <div className="flex flex-col items-center justify-center gap-3">
                  <div className="w-16 h-16 rounded-full border border-current/15 flex items-center justify-center animate-bounce">
                    <ChefHat className="w-7 h-7" strokeWidth={1.5} />
                  </div>
                </div>
              }
            >
              <ChefCookingCanvas
                backgroundColorHex={backgroundColorHex}
                isDarkTheme={isDarkTheme}
              />
            </Suspense>
          </div>

          {/* Bottom Funny Tagline + Progress Bar + Skip */}
          <div className="text-center space-y-4 pb-2 max-w-md w-full">
            <motion.div
              initial={{opacity: 0, y: 8}}
              animate={{opacity: 1, y: 0}}
              transition={{duration: 0.45, delay: 0.15}}
            >
              <h2 className="font-serif text-2xl sm:text-3xl font-medium tracking-tight leading-snug">
                {tagline}
              </h2>
              <p className={`mt-1.5 text-xs sm:text-sm ${themeSubTextClass}`}>
                Opening menu...
              </p>
            </motion.div>

            {/* Smooth 5s progress bar */}
            <div className="w-40 h-1 mx-auto rounded-full overflow-hidden bg-current/10">
              <motion.div
                initial={{scaleX: 0}}
                animate={{scaleX: 1}}
                transition={{duration: INTRO_DURATION_MS / 1000, ease: 'linear'}}
                style={{transformOrigin: 'left'}}
                className="h-full w-full bg-current opacity-50"
              />
            </div>

            <button
              type="button"
              onClick={handleDismiss}
              className={`min-h-[44px] px-5 py-2.5 text-xs font-medium rounded-lg border ${themeBorderClass} ${themeTextClass} hover:opacity-80 transition-opacity`}
            >
              View Menu
            </button>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
