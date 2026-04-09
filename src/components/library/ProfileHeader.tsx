interface ProfileHeaderProps {
  displayName: string;
  cardCount: number;
  collectionLikes: number;
}

export default function ProfileHeader({ displayName, cardCount, collectionLikes }: ProfileHeaderProps) {
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="flex flex-col items-center pt-6 pb-4 px-6">
      {/* Avatar */}
      <div className="w-16 h-16 rounded-full border border-brand-brown/20 flex items-center justify-center mb-3">
        <span className="font-serif text-brand-brown/60 text-2xl">{initial}</span>
      </div>

      {/* Name */}
      <h2 className="font-serif text-brand-brown text-base tracking-[0.15em] mb-1">{displayName}</h2>
      <span className="font-sans text-brand-brown/30 text-[8px] tracking-[0.3em] uppercase mb-5">Collector</span>

      {/* Stats row */}
      <div className="flex items-center gap-8">
        <StatItem value={cardCount} label="Cards" />
        <div className="w-[1px] h-6 bg-brand-brown/10" />
        <StatItem value={collectionLikes} label="Likes" />
        <div className="w-[1px] h-6 bg-brand-brown/10" />
        <StatItem value="S1" label="Season" />
      </div>
    </div>
  );
}

function StatItem({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="font-serif text-brand-brown text-sm tracking-wide">{value}</span>
      <span className="font-sans text-brand-brown/40 text-[8px] tracking-[0.2em] uppercase mt-0.5">{label}</span>
    </div>
  );
}
