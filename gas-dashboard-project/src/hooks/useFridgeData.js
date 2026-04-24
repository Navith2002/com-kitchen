import { useEffect, useState } from 'react';
import { onValue, ref } from 'firebase/database';
import { db } from '../config/firebase';
import { objectToSortedArray } from '../utils/firebaseHelpers';

export default function useFridgeData() {
  const [latest, setLatest] = useState(null);
  const [history, setHistory] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const latestRef = ref(db, 'FridgeDoor/latest');
    const historyRef = ref(db, 'FridgeDoor/history');
    const analysisRef = ref(db, 'FridgeDoor/analysis');

    const unsubLatest = onValue(latestRef, (s) => setLatest(s.exists() ? s.val() : null));
    const unsubHistory = onValue(historyRef, (s) => setHistory(s.exists() ? objectToSortedArray(s.val(), 'timestamp') : []));
    const unsubAnalysis = onValue(analysisRef, (s) => {
      setAnalysis(s.exists() ? s.val() : null);
      setLoading(false);
    });

    return () => {
      unsubLatest();
      unsubHistory();
      unsubAnalysis();
    };
  }, []);

  return { latest, history, analysis, loading };
}
