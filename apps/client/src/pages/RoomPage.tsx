import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { roomApi, petsApi, inventoryApi } from '../api/endpoints';
import { useUIStore } from '../stores/uiStore';

export default function RoomPage() {
  const [status, setStatus] = useState(null);
  const [pets, setPets] = useState([]);
  const [inventory, setInventory] = useState({});
  const showToast = useUIStore((s) => s.showToast);
  const [msg, setMsg] = useState('');

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    try {
      const [sRes, pRes, iRes] = await Promise.all([
        roomApi.getStatus(),
        petsApi.getPets(),
        inventoryApi.getInventory(),
      ]);
      setStatus(sRes.data);
      setPets(pRes.data);
      setInventory(iRes.data);
    } catch {}
  };

  const updateRoute = async (route) => {
    try { await roomApi.updateProgress(route); setMsg('探索进度 +1'); loadAll(); } catch {}
  };

  const feed = async (petId, foodId) => {
    try { await petsApi.feedPet(petId, foodId); setMsg('喂食成功！'); loadAll(); }
    catch (err) { setMsg(err.response?.data?.message || '喂食失败'); }
  };

  const foods = inventory['pet_food'] || [];

  return (
    <div>
      <h1 className="font-display text-2xl text-gold mb-4">🚪 有求必应屋</h1>
      {msg && <motion.div className="card mb-3 py-2 text-sm text-center text-gold" initial={{opacity:0}} animate={{opacity:1}}>{msg}</motion.div>}

      {(!status || !status.unlocked) ? (
        <div>
          <div className="card text-center mb-4">
            <p className="text-parchment/50">墙还没完全为你打开</p>
            <p className="text-parchment/30 text-xs mt-2">有求必应屋像一间只认主人的秘密温室，先拿到它的钥匙...</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button className="card text-center hover:border-gold/60" onClick={() => updateRoute('da')}>
              <p className="text-gold font-display">路线：D.A.</p>
              <p className="text-xs text-parchment/40 mt-1">进度: {(status?.da?.progress||0)}/5</p>
              <div className="h-1.5 bg-black/40 rounded-full mt-1 overflow-hidden">
                <div className="h-full bg-gold/60 rounded-full" style={{width: ((status?.da?.progress||0)/5)*100 + '%'}} />
              </div>
            </button>
            <button className="card text-center hover:border-gold/60" onClick={() => updateRoute('spew')}>
              <p className="text-gold font-display">路线：S.P.E.W.</p>
              <p className="text-xs text-parchment/40 mt-1">进度: {(status?.spew?.progress||0)}/5</p>
              <div className="h-1.5 bg-black/40 rounded-full mt-1 overflow-hidden">
                <div className="h-full bg-gold/60 rounded-full" style={{width: ((status?.spew?.progress||0)/5)*100 + '%'}} />
              </div>
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div className="card mb-4">
            <h2 className="text-gold font-display">🏠 已解锁</h2>
            <p className="text-parchment/30 text-xs mt-1">你的私人空间已准备好</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {pets.map(pet => (
              <div key={pet.id} className="card text-center">
                <p className="text-3xl mb-1">{pet.stage === 'egg' ? '🥚' : pet.stage === 'baby' ? '🐉' : '🐲'}</p>
                <p className="text-gold text-sm">{pet.name}</p>
                <p className="text-xs text-parchment/40">{pet.stage === 'egg' ? '孵化中' : pet.stage === 'baby' ? '幼龙' : '成年龙'} Lv.{pet.level}</p>
                <p className="text-xs text-gold/60 mt-1">饱腹度: {pet.hunger}/100</p>
                {pet.stage !== 'egg' && foods.length > 0 && (
                  <button className="btn-ghost text-xs py-0.5 mt-2" onClick={() => feed(pet.id, foods[0].id)}>
                    🍎 喂食
                  </button>
                )}
              </div>
            ))}
          </div>
          {pets.length === 0 && <p className="text-parchment/30 text-sm text-center py-4">还没有宠物，去对角巷神奇动物园购买龙蛋吧！</p>}
        </div>
      )}
    </div>
  );
}
