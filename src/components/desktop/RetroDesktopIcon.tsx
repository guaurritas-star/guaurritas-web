type RetroDesktopIconProps = {
  kind: "world" | "pet" | "paint" | "notes" | "cart" | "mark";
  className?: string;
};

const colors = {
  navy: "#425B8C",
  blue: "#637AA6",
  blush: "#D9A689",
  pink: "#A66D88",
  paper: "#F2F2F2",
  ink: "#263650",
  mint: "#A9C9BE",
  yellow: "#E4C56D",
};

function WorldIcon() {
  return (
    <>
      <path className="desktop-icon-shadow" d="M18 77h57l8 8H25z" />
      <path className="desktop-icon-shell" d="M14 14h66v56H14z" />
      <path fill={colors.paper} stroke={colors.navy} strokeWidth="3" d="M20 20h54v39H20z" />
      <g className="desktop-icon-world-orbit">
        <circle cx="47" cy="39.5" r="14.5" fill={colors.blue} stroke={colors.ink} strokeWidth="2.5" />
        <path fill={colors.mint} d="m39 28 6 1 3 5-4 4-7-2-2-4zm10 12 8-4 4 4-3 8-8 5-4-5z" />
        <path fill="none" stroke={colors.paper} strokeWidth="1.6" d="M33 40h28M47 25c-6 7-6 22 0 29m0-29c6 7 6 22 0 29" />
        <ellipse cx="47" cy="39.5" rx="24" ry="9" fill="none" stroke={colors.pink} strokeWidth="2" strokeDasharray="4 3" />
      </g>
      <path fill={colors.navy} d="M38 70h18l3 8H35z" />
      <path fill={colors.paper} stroke={colors.navy} strokeWidth="3" d="M29 78h36v6H29z" />
      <path className="desktop-icon-spark desktop-icon-spark-one" fill={colors.yellow} stroke={colors.navy} strokeWidth="1.5" d="m75 8 2 5 5 2-5 2-2 5-2-5-5-2 5-2z" />
      <path className="desktop-icon-spark desktop-icon-spark-two" fill={colors.pink} d="m12 48 1.5 3.5L17 53l-3.5 1.5L12 58l-1.5-3.5L7 53l3.5-1.5z" />
    </>
  );
}

function PetIcon() {
  return (
    <>
      <path className="desktop-icon-shadow" d="M24 80h56l6 6H30z" />
      <g className="desktop-icon-pet-card">
        <path fill={colors.paper} stroke={colors.navy} strokeWidth="3" d="M24 14h53v67H24z" />
        <path fill={colors.blush} stroke={colors.navy} strokeWidth="3" d="M31 22h39v31H31z" />
        <path fill={colors.ink} d="M42 34c-5-8-11-4-9 4 1 5 5 8 8 10h18c4-3 7-6 8-10 2-8-4-12-9-4-4-5-12-5-16 0Z" />
        <circle cx="44" cy="39" r="1.8" fill={colors.paper} />
        <circle cx="56" cy="39" r="1.8" fill={colors.paper} />
        <path fill={colors.pink} d="M47 44h6l-3 4z" />
        <path fill={colors.blue} d="M31 61h28v4H31zm0 8h20v4H31z" />
        <path fill={colors.pink} d="M63 61h7v12h-7z" />
      </g>
      <g className="desktop-icon-pet-tag">
        <path fill={colors.yellow} stroke={colors.navy} strokeWidth="2.5" d="M17 51h16l5 7-13 18-13-18z" />
        <circle cx="25" cy="57" r="2.5" fill={colors.paper} stroke={colors.navy} strokeWidth="1.5" />
        <path fill={colors.pink} d="M25 70c-7-4-7-10-2-10 2 0 2 2 2 2s1-2 3-2c5 0 5 6-3 10Z" />
      </g>
      <path className="desktop-icon-spark desktop-icon-spark-one" fill={colors.mint} stroke={colors.navy} strokeWidth="1.5" d="m77 13 2 5 5 2-5 2-2 5-2-5-5-2 5-2z" />
    </>
  );
}

function PaintIcon() {
  return (
    <>
      <path className="desktop-icon-shadow" d="M13 75h67l7 8H20z" />
      <path className="desktop-icon-shell" fill={colors.paper} stroke={colors.navy} strokeWidth="3" d="M11 18h69v58H11z" />
      <path fill={colors.blue} stroke={colors.navy} strokeWidth="3" d="M11 18h69v11H11z" />
      <circle cx="18" cy="23.5" r="2" fill={colors.paper} />
      <circle cx="25" cy="23.5" r="2" fill={colors.blush} />
      <path fill={colors.paper} stroke={colors.navy} strokeWidth="2" d="M19 37h44v29H19z" />
      <g className="desktop-icon-paint-stroke">
        <path fill="none" stroke={colors.pink} strokeLinecap="round" strokeWidth="7" d="M28 57c8-17 16 11 27-8" />
        <path fill="none" stroke={colors.yellow} strokeLinecap="round" strokeWidth="4" d="M28 47c8-10 13 7 23-5" />
      </g>
      <g className="desktop-icon-brush">
        <path fill={colors.blush} stroke={colors.navy} strokeWidth="2.5" d="m59 15 8 4-17 35-7-4z" />
        <path fill={colors.ink} stroke={colors.navy} strokeWidth="2" d="m42 49 9 5-7 10-8 2 1-9z" />
        <path fill={colors.mint} d="m38 57 7 4-2 3-6 1z" />
      </g>
      <circle className="desktop-icon-paint-dot desktop-icon-paint-dot-one" cx="70" cy="42" r="5" fill={colors.mint} stroke={colors.navy} strokeWidth="2" />
      <circle className="desktop-icon-paint-dot desktop-icon-paint-dot-two" cx="70" cy="56" r="5" fill={colors.yellow} stroke={colors.navy} strokeWidth="2" />
    </>
  );
}

function NotesIcon() {
  return (
    <>
      <path className="desktop-icon-shadow" d="M20 78h61l6 7H26z" />
      <g className="desktop-icon-note-page">
        <path fill={colors.paper} stroke={colors.navy} strokeWidth="3" d="M22 13h55v68H22z" />
        <path fill={colors.blush} stroke={colors.navy} strokeWidth="3" d="M22 13h55v13H22z" />
        <path fill={colors.blue} d="M31 34h36v4H31zm0 9h29v4H31zm0 9h34v4H31zm0 9h22v4H31z" />
        <path fill={colors.mint} stroke={colors.navy} strokeWidth="2" d="M60 59h15v18H60z" />
        <path fill={colors.ink} d="M66 67c-3-4-7-1-4 3l5 4 5-4c3-4-1-7-4-3-1-2-1-2-2 0Z" />
      </g>
      <g className="desktop-icon-note-clip">
        <path fill={colors.yellow} stroke={colors.navy} strokeWidth="2.5" d="M35 8h29v11H35z" />
        <path fill="none" stroke={colors.navy} strokeLinecap="round" strokeWidth="3" d="M44 12V8c0-5 10-5 10 0v4" />
      </g>
      <g className="desktop-icon-note-stamp">
        <circle cx="18" cy="61" r="11" fill={colors.pink} stroke={colors.navy} strokeWidth="2.5" />
        <circle cx="14" cy="57" r="2.2" fill={colors.paper} />
        <circle cx="19" cy="54" r="2.2" fill={colors.paper} />
        <circle cx="24" cy="57" r="2.2" fill={colors.paper} />
        <path fill={colors.paper} d="M18.8 60c-6 0-7 8-.8 8 7 0 7-8 .8-8Z" />
      </g>
      <path className="desktop-icon-spark desktop-icon-spark-one" fill={colors.yellow} d="m81 32 2 5 5 2-5 2-2 5-2-5-5-2 5-2z" />
    </>
  );
}

function CartIcon() {
  return (
    <>
      <path className="desktop-icon-shadow" d="M14 73h69l7 7H21z" />
      <g className="desktop-icon-cart-body">
        <path fill={colors.paper} stroke={colors.navy} strokeWidth="3" d="M17 28h65l-7 38H25z" />
        <path fill={colors.blue} d="M24 36h52l-2 10H26z" />
        <path fill={colors.blush} d="m28 51 43 0-2 9H30z" />
        <path fill="none" stroke={colors.navy} strokeLinecap="round" strokeWidth="4" d="M17 28h-7" />
        <path fill="none" stroke={colors.navy} strokeWidth="2" d="m36 29 2 36m18-36-2 36" />
      </g>
      <g className="desktop-icon-cart-bag">
        <path fill={colors.yellow} stroke={colors.navy} strokeWidth="2.5" d="M37 14h29l4 35H33z" />
        <path fill="none" stroke={colors.navy} strokeWidth="2.5" d="M42 22c0-9 18-9 18 0" />
        <path fill={colors.pink} d="M43 30h17v10H43z" />
        <path fill={colors.paper} d="M49 33h5v4h-5z" />
      </g>
      <g className="desktop-icon-cart-wheels">
        <circle cx="32" cy="75" r="6" fill={colors.pink} stroke={colors.navy} strokeWidth="3" />
        <circle cx="68" cy="75" r="6" fill={colors.pink} stroke={colors.navy} strokeWidth="3" />
        <path stroke={colors.paper} strokeWidth="1.5" d="m28 75 8 0m-4-4v8m32-4h8m-4-4v8" />
      </g>
      <path className="desktop-icon-spark desktop-icon-spark-one" fill={colors.mint} stroke={colors.navy} strokeWidth="1.5" d="m78 13 2 5 5 2-5 2-2 5-2-5-5-2 5-2z" />
    </>
  );
}

function MarkIcon() {
  return (
    <>
      <path fill={colors.paper} stroke={colors.navy} strokeWidth="5" d="M18 28h60v43H18z" />
      <path fill={colors.blush} stroke={colors.navy} strokeWidth="5" d="M26 20h44v15H26z" />
      <path fill={colors.ink} d="M37 47c-6-9-13-4-10 5 2 6 8 11 21 16 13-5 19-10 21-16 3-9-4-14-10-5-6-8-16-8-22 0Z" />
      <circle cx="42" cy="52" r="2" fill={colors.paper} />
      <circle cx="55" cy="52" r="2" fill={colors.paper} />
      <path fill={colors.pink} d="m45 57 7 0-3.5 4z" />
    </>
  );
}

export default function RetroDesktopIcon({ kind, className = "" }: RetroDesktopIconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 96 96"
      className={`retro-desktop-icon ${className}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {kind === "world" && <WorldIcon />}
      {kind === "pet" && <PetIcon />}
      {kind === "paint" && <PaintIcon />}
      {kind === "notes" && <NotesIcon />}
      {kind === "cart" && <CartIcon />}
      {kind === "mark" && <MarkIcon />}
    </svg>
  );
}
