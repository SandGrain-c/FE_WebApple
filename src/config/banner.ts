export const BANNER_POSITION_KEYS = {
  HOME_HERO: "home-hero",
  HOME_SMALL: "home-small",
} as const;

export const BANNER_POSITIONS = [
  {
    value: BANNER_POSITION_KEYS.HOME_HERO,
    label: "Trang chủ - Banner chính",
  },
  {
    value: BANNER_POSITION_KEYS.HOME_SMALL,
    label: "Trang chủ - Banner nhỏ",
  },
] as const;

export const DEFAULT_BANNER_POSITION = BANNER_POSITION_KEYS.HOME_HERO;

const canonicalPositionValues = new Set<string>(
  BANNER_POSITIONS.map((position) => position.value),
);

export function isCanonicalBannerPosition(value: string) {
  return canonicalPositionValues.has(value);
}

export function getBannerPositionLabel(value: string) {
  return (
    BANNER_POSITIONS.find((position) => position.value === value)?.label ?? value
  );
}

export function getBannerFormPositionOptions(currentPosition?: string | null) {
  const storedPosition = currentPosition?.trim();

  if (!storedPosition || isCanonicalBannerPosition(storedPosition)) {
    return [...BANNER_POSITIONS];
  }

  return [
    {
      value: storedPosition,
      label: `${storedPosition} (giá trị cũ)`,
    },
    ...BANNER_POSITIONS,
  ];
}
