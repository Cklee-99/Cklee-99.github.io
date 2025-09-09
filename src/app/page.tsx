import Timeline from './components/Timeline';
import Stellaris from './components/Stellaris';

export default function Home() {
  return (
    <div className="min-h-screen relative">
      <Stellaris />
      <div className="relative z-10">
        <Timeline />
      </div>
    </div>
  );
}
