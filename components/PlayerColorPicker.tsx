"use client";

import { PLAYER_COLORS } from "@/lib/playerColors";
import { useState } from "react";

export default function PlayerColorPicker({
  color,
  availableColors,
  onSelect,
  disabled = false,
}: {
  color: string;
  availableColors: readonly { name: string; value: string }[];
  onSelect: (color: string) => void;
  disabled?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [page, setPage] = useState(0);
  const pageSize = 30;
  const pageCount = Math.ceil(availableColors.length / pageSize);
  const palette = [...availableColors.slice(page * pageSize, (page + 1) * pageSize)];
  if (!palette.some(option => option.value === color)) {
    const selectedColor = PLAYER_COLORS.find(option => option.value === color);
    if (selectedColor) {
      if (palette.length < pageSize) palette.push(selectedColor);
      else palette[palette.length - 1] = selectedColor;
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        title="Choose preferred color"
        aria-label="Choose preferred color"
        aria-expanded={isOpen}
        disabled={disabled}
        onClick={() => {
          if (!isOpen) {
            const colorIndex = availableColors.findIndex(option => option.value === color);
            setPage(colorIndex >= 0 ? Math.floor(colorIndex / pageSize) : 0);
          }
          setIsOpen(open => !open);
        }}
        className="flex size-9 items-center justify-center rounded-full border border-gray-500 bg-gray-800 shadow-sm disabled:opacity-50"
      >
        <span
          aria-hidden="true"
          className="size-5 rounded-full border border-white/70"
          style={{ backgroundColor: color }}
        />
      </button>
      {isOpen && (
        <div
          role="group"
          aria-label="Available preferred colors"
          className="absolute left-0 top-full z-50 mt-2 w-52 rounded-lg border border-gray-500 bg-gray-900 p-3 shadow-xl"
        >
          <div className="grid grid-cols-6 gap-2">
            {palette.map(option => (
              <button
                key={option.value}
                type="button"
                title={option.name}
                aria-label={`Choose ${option.name}`}
                aria-pressed={option.value === color}
                onClick={() => {
                  onSelect(option.value);
                  setIsOpen(false);
                }}
                className={`size-6 rounded-full border-2 ${option.value === color ? "border-white ring-2 ring-blue-400" : "border-gray-500 hover:border-white"}`}
                style={{ backgroundColor: option.value }}
              />
            ))}
          </div>
          {pageCount > 1 && (
            <div className="mt-3 flex items-center justify-between text-xs text-gray-200">
              <button
                type="button"
                onClick={() => setPage(currentPage => currentPage - 1)}
                disabled={page === 0}
                aria-label="Previous colors"
                className="rounded px-2 py-1 hover:bg-gray-700 disabled:opacity-40"
              >
                Previous
              </button>
              <span>{page + 1} / {pageCount}</span>
              <button
                type="button"
                onClick={() => setPage(currentPage => currentPage + 1)}
                disabled={page === pageCount - 1}
                aria-label="More colors"
                className="rounded px-2 py-1 hover:bg-gray-700 disabled:opacity-40"
              >
                More
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
