import { useEffect, useState } from "react";
import type { Coordinates } from './useUserLocation'

export type PollenTypeInfo = {
  code: string;
  displayName: string;
  value: number;
  advice?: string;
};

export type PollenData = {
  busyness: number;
  pollenTypes: PollenTypeInfo[];
};

export function usePollenData(location: Coordinates | null) {
  const [pollen, setPollen] = useState<PollenData>({
    busyness: 0.35,
    pollenTypes: [],
  });

  useEffect(() => {
    if (!location) return;

    const { latitude, longitude } = location;

    async function fetchPollen() {
      try {
        const response = await fetch(
            `${import.meta.env.VITE_API_URL}?key=${import.meta.env.VITE_API_KEY}&location.latitude=${latitude}&location.longitude=${longitude}&days=1`,
        );

        console.log("Pollen API response status:", response.status, response.statusText);

        const data = await response.json();

        console.log(JSON.stringify(data));

        const pollenTypesRaw =
          data.dailyInfo?.[0]?.pollenTypeInfo ?? [];

        const pollenTypes = pollenTypesRaw
          .map((type: any) => ({
            code: type.code,
            displayName: type.displayName ?? type.code,
            value: type.indexInfo?.value,
            advice: Array.isArray(type.healthRecommendations)
              ? type.healthRecommendations[0]
              : undefined,
          }))
          .filter(
            (type: any): type is PollenTypeInfo =>
              typeof type.value === "number"
          );

        const total = pollenTypes.reduce(
          (sum: number, type: PollenTypeInfo) => sum + type.value,
          0
        );

        const maxPossible = pollenTypes.length
          ? pollenTypes.length * 5
          : 5;

        const busyness = pollenTypes.length
          ? Math.max(0.15, Math.min(total / maxPossible, 1))
          : 0.15;

        setPollen({ busyness, pollenTypes });
      } catch (error) {
        console.error(error);
      }
    }

    fetchPollen();
  }, [location]);

  return pollen;
}