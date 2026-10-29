"use client";

/**
 * CHOISI (app/choisi/page.tsx)
 * Finger-picker for splitting players into two teams and ordering them.
 *
 * Flow:
 * - Every finger held on the screen gets a pastel halo.
 * - With 2+ fingers registered, one finger lifts and double taps → random teams + order.
 *   Team 1 halos are filled, team 2 halos are striped. Numbers stay after fingers lift.
 * - Double tap again to start over.
 */

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

type Player = {
  id: number;
  pointerId: number | null;
  x: number;
  y: number;
  hue: number;
  downAt: number;
  team?: 0 | 1;
  rank?: number;
};

type PendingTouch = { x: number; y: number; downAt: number; timer: number };

const PASTEL_HUES = [350, 200, 130, 45, 275, 175, 20, 235, 95, 310];
const TAP_MAX_MS = 220;
const TAP_MAX_MOVE = 24;
const DOUBLE_TAP_MS = 450;

const pastel = (hue: number, alpha = 1) => `hsl(${hue} 85% 78% / ${alpha})`;

function shuffle<T>(items: T[]) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default function ChoisiPage() {
  const areaRef = useRef<HTMLDivElement>(null);
  const playersRef = useRef<Player[]>([]);
  const pendingRef = useRef(new Map<number, PendingTouch>());
  const lastTapRef = useRef(0);
  const nextIdRef = useRef(1);
  const [players, setPlayers] = useState<Player[]>([]);
  const [haloSize, setHaloSize] = useState(130);

  const isDone = players.some(player => player.rank !== undefined);
  const isArmed = !isDone && players.length >= 2;

  // An average fingertip is ~15 mm wide; aim for a ~22 mm halo, scaled from the screen size.
  useEffect(() => {
    const updateSize = () => {
      const shortSide = Math.min(window.innerWidth, window.innerHeight);
      setHaloSize(Math.round(Math.min(160, Math.max(110, shortSide * 0.34))));
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  useEffect(() => {
    const pending = pendingRef.current;
    return () => pending.forEach(touch => window.clearTimeout(touch.timer));
  }, []);

  const commit = (next: Player[]) => {
    playersRef.current = next;
    setPlayers(next);
  };

  const localPoint = (event: ReactPointerEvent) => {
    const rect = areaRef.current!.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const nextHue = () => {
    const used = new Set(playersRef.current.map(player => player.hue));
    return PASTEL_HUES.find(hue => !used.has(hue))
      ?? (PASTEL_HUES[playersRef.current.length % PASTEL_HUES.length] + 17 * playersRef.current.length) % 360;
  };

  const registerFinger = (pointerId: number, x: number, y: number, downAt: number) => {
    const current = playersRef.current;
    if (current.some(player => player.rank !== undefined)) return;
    // A finger placed back on a lifted halo takes that halo back instead of adding a player.
    const lifted = current.find(player =>
      player.pointerId === null && Math.hypot(player.x - x, player.y - y) < haloSize * 0.6
    );
    if (lifted) {
      commit(current.map(player => player === lifted ? { ...player, pointerId, x, y } : player));
      return;
    }
    commit([...current, { id: nextIdRef.current++, pointerId, x, y, hue: nextHue(), downAt }]);
  };

  const choose = () => {
    const current = playersRef.current;
    const order = shuffle(current.map(player => player.id));
    const teamOne = new Set(shuffle(current.map(player => player.id)).slice(0, Math.ceil(current.length / 2)));
    commit(current.map(player => ({
      ...player,
      rank: order.indexOf(player.id) + 1,
      team: teamOne.has(player.id) ? 0 : 1,
    })));
    navigator.vibrate?.(60);
  };

  const handleTap = () => {
    const now = performance.now();
    if (now - lastTapRef.current > DOUBLE_TAP_MS) {
      lastTapRef.current = now;
      return;
    }
    lastTapRef.current = 0;
    const current = playersRef.current;
    if (current.some(player => player.rank !== undefined)) {
      commit([]);
    } else if (current.length >= 2) {
      choose();
    }
  };

  const handlePointerDown = (event: ReactPointerEvent) => {
    event.preventDefault();
    const { x, y } = localPoint(event);
    const downAt = performance.now();
    const pointerId = event.pointerId;
    // The first two fingers show up instantly; later touches wait a moment so double taps don't add players.
    if (playersRef.current.length < 2) {
      registerFinger(pointerId, x, y, downAt);
      return;
    }
    const timer = window.setTimeout(() => {
      const touch = pendingRef.current.get(pointerId);
      if (!touch) return;
      pendingRef.current.delete(pointerId);
      registerFinger(pointerId, touch.x, touch.y, touch.downAt);
    }, TAP_MAX_MS);
    pendingRef.current.set(pointerId, { x, y, downAt, timer });
  };

  const handlePointerMove = (event: ReactPointerEvent) => {
    const { x, y } = localPoint(event);
    const touch = pendingRef.current.get(event.pointerId);
    if (touch) {
      touch.x = x;
      touch.y = y;
      return;
    }
    if (playersRef.current.some(player => player.pointerId === event.pointerId)) {
      commit(playersRef.current.map(player =>
        player.pointerId === event.pointerId ? { ...player, x, y } : player
      ));
    }
  };

  const handlePointerUp = (event: ReactPointerEvent, cancelled = false) => {
    const now = performance.now();
    const { x, y } = localPoint(event);
    const touch = pendingRef.current.get(event.pointerId);
    if (touch) {
      window.clearTimeout(touch.timer);
      pendingRef.current.delete(event.pointerId);
      if (!cancelled && Math.hypot(touch.x - x, touch.y - y) < TAP_MAX_MOVE) handleTap();
      return;
    }

    const player = playersRef.current.find(p => p.pointerId === event.pointerId);
    if (!player) return;
    const wasTap = !cancelled && now - player.downAt < TAP_MAX_MS;
    const current = playersRef.current;
    if (current.some(p => p.rank !== undefined)) {
      commit(current.map(p => p === player ? { ...p, pointerId: null } : p));
    } else if (wasTap || current.length < 2) {
      // Quick taps and a lone finger don't count as players.
      commit(current.filter(p => p !== player));
    } else {
      commit(current.map(p => p === player ? { ...p, pointerId: null } : p));
    }
    if (wasTap) handleTap();
  };

  const edgeMessage = isDone
    ? "Double tap to start over"
    : isArmed
      ? "Lift one finger and double tap to choose"
      : "Hold 2 or more fingers, then lift one and double tap";

  return (
    <div
      ref={areaRef}
      className="relative w-full flex-1 select-none overflow-hidden bg-neutral-950 text-gray-100"
      style={{
        height: "calc(100dvh - 4rem)",
        touchAction: "none",
        overscrollBehavior: "none",
        WebkitTouchCallout: "none",
        WebkitUserSelect: "none",
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={event => handlePointerUp(event)}
      onPointerCancel={event => handlePointerUp(event, true)}
      onContextMenu={event => event.preventDefault()}
    >
      <style>{`
        @keyframes choisi-breathe { 0%, 100% { transform: translate(-50%, -50%) scale(1); } 50% { transform: translate(-50%, -50%) scale(1.08); } }
        @keyframes choisi-pop { 0% { transform: translate(-50%, -50%) scale(0.6); } 100% { transform: translate(-50%, -50%) scale(1); } }
      `}</style>

      <p className="pointer-events-none absolute inset-x-0 top-3 rotate-180 px-4 text-center text-xs tracking-wide text-gray-400">
        {edgeMessage}
      </p>
      <p
        className="pointer-events-none absolute inset-x-0 px-4 text-center text-xs tracking-wide text-gray-400"
        style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 0.75rem)" }}
      >
        {edgeMessage}
      </p>

      {players.length === 0 && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center">
          <p className="text-3xl font-light tracking-[0.2em]">TOUCH THE SCREEN</p>
          <p className="text-sm text-gray-400">Every player puts one finger down</p>
        </div>
      )}

      {players.map(player => {
        const isHeld = player.pointerId !== null;
        const isStriped = player.team === 1;
        return (
          <div
            key={player.id}
            className="pointer-events-none absolute flex items-center justify-center rounded-full"
            style={{
              left: player.x,
              top: player.y,
              width: haloSize,
              height: haloSize,
              transform: "translate(-50%, -50%)",
              opacity: isHeld || isDone ? 1 : 0.55,
              animation: isDone
                ? "choisi-pop 220ms ease-out"
                : isHeld ? "choisi-breathe 1.6s ease-in-out infinite" : undefined,
              background: !isDone
                ? `radial-gradient(circle, ${pastel(player.hue, 0.25)} 0 42%, ${pastel(player.hue, 0.9)} 56%, ${pastel(player.hue, 0)} 72%)`
                : isStriped
                  ? `repeating-linear-gradient(45deg, ${pastel(player.hue, 0.85)} 0 6px, ${pastel(player.hue, 0.15)} 6px 12px)`
                  : pastel(player.hue),
              border: isDone ? `4px solid ${pastel(player.hue)}` : undefined,
              boxShadow: `0 0 ${haloSize / 4}px ${pastel(player.hue, 0.45)}`,
            }}
          >
            {player.rank !== undefined && (
              <span
                className="flex size-12 items-center justify-center rounded-full bg-neutral-950/80 text-2xl font-bold"
                style={{ color: pastel(player.hue) }}
              >
                {player.rank}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
