import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { User, Settings, Award, Book, LogOut } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import FolioCard from '../components/FolioCard';

export default function Profile({ user }: { user: any }) {
  const [userData, setUserData] = useState<any>(null);
  const [cardCount, setCardCount] = useState(0);
  const [favoriteCard, setFavoriteCard] = useState<any>(null);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user) return;
      
      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setUserData(userSnap.data());
        }

        const cardsRef = collection(db, 'cards');
        const q = query(cardsRef, where("current_owner", "==", user.uid));
        const snapshot = await getDocs(q);
        setCardCount(snapshot.docs.length);
        
        if (snapshot.docs.length > 0) {
          setFavoriteCard({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };

    fetchProfileData();
  }, [user]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  return (
    <div className="p-6 flex flex-col gap-8 min-h-screen">
      <div className="flex justify-between items-start border-b border-gray-800 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#d4af37] to-[#1a140a] border-2 border-[#d4af37]/50 flex items-center justify-center text-[#d4af37] shadow-[0_0_20px_rgba(212,175,55,0.3)]">
            <User size={32} />
          </div>
          <div>
            <h2 className="font-serif text-2xl text-[#d4af37]">{user?.displayName || 'User'}</h2>
            <p className="text-xs text-gray-400 mt-1 tracking-wider uppercase">Folio Collector</p>
          </div>
        </div>
        <button className="p-2 rounded-full bg-[#1e1e1e] hover:bg-[#d4af37]/20 transition-colors">
          <Settings size={20} className="text-gray-400 hover:text-[#d4af37]" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1e1e1e] rounded-xl p-4 border border-gray-800 flex flex-col items-center justify-center gap-2"
        >
          <Award size={24} className="text-[#d4af37]" />
          <span className="text-2xl font-serif text-white">{userData?.points || 0}</span>
          <span className="text-[10px] text-gray-400 uppercase tracking-widest">Points</span>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#1e1e1e] rounded-xl p-4 border border-gray-800 flex flex-col items-center justify-center gap-2"
        >
          <Book size={24} className="text-[#d4af37]" />
          <span className="text-2xl font-serif text-white">{cardCount}</span>
          <span className="text-[10px] text-gray-400 uppercase tracking-widest">Cards</span>
        </motion.div>
      </div>

      <div className="flex flex-col gap-4">
        <h3 className="font-serif text-xl text-[#d4af37] border-b border-gray-800 pb-2">Favorite Quote</h3>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="flex justify-center"
        >
          {favoriteCard ? (
            <FolioCard card={favoriteCard} />
          ) : (
            <div className="text-gray-500 font-serif italic py-8">아직 수집한 카드가 없습니다.</div>
          )}
        </motion.div>
      </div>

      <div className="mt-auto pt-6 border-t border-gray-800">
        <button 
          onClick={handleSignOut}
          className="w-full py-3 rounded-xl bg-red-500/10 text-red-400 font-medium tracking-wider text-sm flex items-center justify-center gap-2 hover:bg-red-500/20 transition-colors"
        >
          <LogOut size={18} />
          SIGN OUT
        </button>
      </div>
    </div>
  );
}
