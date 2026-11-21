import {lazy, Suspense, useEffect, useRef, useState} from 'react';
import {motion, AnimatePresence} from 'motion/react';
import {INTRO_SCENES, type IntroSceneId} from './introScenes';

const ChefCookingCanvas = lazy(() =>
  import('./ChefCookingCanvas').then((mod) => ({default: mod.ChefCookingCanvas}))
);

const FUNNY_TAGLINES = [
  'Aur yaar, aaj kya khayega?',
  'Tom bhi Jerry ko pakad lega, tu pehle order toh decide kar!',
  'Aaj diet kal se shuru karenge, pehle wrap mangwa le!',
  'Bhookh ke maare pet mein Tom & Jerry lad rahe hain!',
  'Bill dost dega kya? Toh double cheese wala order kar!',
  'Gym trainer ko mat batana ki aaj yahan aaye ho...',
  'Pyaar dhokha hai, broasted wrap hi sachcha mauka hai!',
  'Menu dekh ke confuse mat ho, sab kuch tasty hai yaar!',
  'Pet pooja shuru ki jaaye, ya sirf dekhne aaye ho?',
  'Jerry cheese leke bhaag gaya, tu apni plate bacha le!',
  'Aaj cheat day hai — calorie ginna mana hai!',
  'Khali pet dimaag kaam nahi karta, pehle burger mangwa!',
  'Dost bole "bas ek bite lunga" — aur poora wrap gayab!',
  'Aaj mood spicy hai ya extra cheesy? Jaldi bata!',
  'Dil bole pizza, pet bole burger — dono manga le na yaar!',
  'Ghar ka khana roz milta hai, aaj Al Arabian treat le le!',
  'Khaana aisa ki Jerry bhi bhaagna chhod ke baith jaaye!',
  'Budget tight hai? AA Saver Combo dekh, maza full milega!',
  'Tom pan leke peeche pada hai, tu jaldi apni dish pick kar!',
  'Bhookh lagi hai zor se, order maaro shor se!',
  'Zindagi chhoti hai, extra cheese mein kanjoosi mat kar!',
  'Aaj treat teri taraf se hai na? Sab muskura rahe hain!',
  'Ek wrap se kya hoga bhai? Saath mein combo bhi le!',
  'Swad aisa ki ungliyan chaat-te reh jaaoge!',
  'Waiter bhi soch raha hai — bhai ab toh order bol de!',
  'Aaj kuch chatpata ho jaaye, warna pet bura maan jayega!',
  'Diet plan Monday se... aaj toh bas dil khol ke khao!',
  'Plate ready hai, bas aapki pasand ka intezaar hai!',
];

const LAST_TAGLINE_STORAGE_KEY = 'qr_menu_recent_taglines';
const LAST_SCENE_STORAGE_KEY = 'qr_menu_recent_scenes';

function pickFreshTagline(): string {
  if (typeof window === 'undefined') {
    return FUNNY_TAGLINES[0];
  }

  let recentIndices: number[] = [];
  try {
    const stored = window.localStorage.getItem(LAST_TAGLINE_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        recentIndices = parsed.filter((n): n is number => typeof n === 'number' && Number.isFinite(n));
      }
    }
  } catch {
    // Ignore storage access errors in private browsing
  }

  const recentSet = new Set(recentIndices.slice(-6));
  const availableIndices = FUNNY_TAGLINES.map((_, idx) => idx).filter((idx) => !recentSet.has(idx));
  const pool = availableIndices.length > 0 ? availableIndices : FUNNY_TAGLINES.map((_, idx) => idx);
  const nextIndex = pool[Math.floor(Math.random() * pool.length)];

  try {
    const updatedHistory = [...recentIndices.slice(-5), nextIndex];
    window.localStorage.setItem(LAST_TAGLINE_STORAGE_KEY, JSON.stringify(updatedHistory));
  } catch {
    // Ignore storage access errors
  }

  return FUNNY_TAGLINES[nextIndex];
}

function pickFreshScene(): IntroSceneId {
  if (typeof window === 'undefined') {
    return INTRO_SCENES[0].id;
  }

  let recentIndices: number[] = [];
  try {
    const stored = window.localStorage.getItem(LAST_SCENE_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        recentIndices = parsed.filter(
          (n): n is number => typeof n === 'number' && Number.isFinite(n) && n >= 0 && n < INTRO_SCENES.length
        );
      }
    }
  } catch {
    // Ignore storage access errors in private browsing
  }

  // Avoid repeating the last 2 shown animations (just like funny taglines)
  const recentSet = new Set(recentIndices.slice(-2));
  const availableIndices = INTRO_SCENES.map((_, idx) => idx).filter((idx) => !recentSet.has(idx));
  const pool =
    availableIndices.length > 0
      ? availableIndices
      : INTRO_SCENES.map((_, idx) => idx).filter((idx) => idx !== recentIndices[recentIndices.length - 1]);
  const finalPool = pool.length > 0 ? pool : INTRO_SCENES.map((_, idx) => idx);
  const nextIndex = finalPool[Math.floor(Math.random() * finalPool.length)];

  try {
    const updatedHistory = [...recentIndices.slice(-2), nextIndex];
    window.localStorage.setItem(LAST_SCENE_STORAGE_KEY, JSON.stringify(updatedHistory));
  } catch {
    // Ignore storage access errors
  }

  return INTRO_SCENES[nextIndex].id;
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
  const [sceneId] = useState<IntroSceneId>(() => pickFreshScene());
  const [tagline] = useState<string>(() => pickFreshTagline());

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      setVisible(false);
      onCompleteRef.current();
      return;
    }

    const timer = window.setTimeout(() => {
      setVisible(false);
    }, INTRO_DURATION_MS);

    return () => window.clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setVisible(false);
  };

  return (
    <AnimatePresence onExitComplete={() => onCompleteRef.current()}>
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

          {/* Single 3D Animation Stage (fresh non-repeating scene picked automatically per scan) */}
          <div className="w-full max-w-xl flex-1 max-h-[420px] min-h-[260px] flex items-center justify-center relative">
            <Suspense fallback={null}>
              <ChefCookingCanvas
                sceneId={sceneId}
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
              <h2 className="font-serif text-2xl sm:text-3xl font-medium tracking-tight leading-snug text-balance">
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
