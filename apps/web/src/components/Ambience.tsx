/**
 * Full-viewport ambient backdrop shared by every screen: the blurred
 * speakeasy photo, a flickering lamp-glow vignette, and animated film grain.
 * Values mirror the imported "MAFIA Game" design 1:1.
 */

const GRAIN_SVG =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)'/%3E%3C/svg%3E\")";

export function Ambience() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element -- decorative, blurred backdrop; next/image adds nothing here */}
      <img
        src="/ambience.png"
        alt=""
        className="absolute h-[106%] w-[106%] object-cover blur-[14px] brightness-[0.42] saturate-[0.85]"
        style={{ inset: '-3%' }}
      />
      <div
        className="absolute inset-0 animate-lamp-flicker"
        style={{
          background:
            'radial-gradient(ellipse 70% 55% at 50% 30%, rgba(232,169,79,0.10), rgba(11,8,5,0) 55%), radial-gradient(ellipse 120% 90% at 50% 60%, rgba(11,8,5,0) 30%, rgba(6,4,2,0.88) 100%)',
        }}
      />
      <div
        className="absolute h-[110%] w-[110%] animate-grain opacity-5"
        style={{ inset: '-5%', backgroundImage: GRAIN_SVG }}
      />
    </div>
  );
}
