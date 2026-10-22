const RED_SUITS = new Set(["♥", "♦"]);

export default function SuitSymbol({
  suit,
  className = "",
}: {
  suit: string;
  className?: string;
}) {
  return (
    <span
      aria-label={`${suit} suit`}
      className={`inline-block text-[20px] leading-none ${RED_SUITS.has(suit) ? "text-red-500" : "text-black dark:text-white"} ${className}`}
    >
      {suit}
    </span>
  );
}
