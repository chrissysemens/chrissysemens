import GenerativeScene from '../components/GenerativeScene';
import { usePollenData } from '../hooks/usePollenData';
import { useUserLocation } from '../hooks/useUserLocation';

export default function Home() {
  const { location, requestLocation } = useUserLocation();
  const pollen = usePollenData(location);

  return (
    <GenerativeScene
      location={location}
      pollen={pollen}
      onRequestLocation={requestLocation}
    />
  );
}
