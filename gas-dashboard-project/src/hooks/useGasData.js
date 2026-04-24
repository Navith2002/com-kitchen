import { useEffect, useMemo, useState } from 'react';
import { onValue, ref } from 'firebase/database';
import { db } from '../config/firebase';
import { objectToSortedArray } from '../utils/firebaseHelpers';

export default function useGasData() {
  const [latest, setLatest] = useState(null);
  const [history, setHistory] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const latestRef = ref(db, 'gassensorData/latest');
    const historyRef = ref(db, 'gassensorData/history');
    const analysisRef = ref(db, 'gassensorData/analysis');

    const unsubLatest = onValue(latestRef, (snapshot) => {
      setLatest(snapshot.exists() ? snapshot.val() : null);
    });

    const unsubHistory = onValue(historyRef, (snapshot) => {
      setHistory(snapshot.exists() ? objectToSortedArray(snapshot.val()) : []);
    });

    const unsubAnalysis = onValue(analysisRef, (snapshot) => {
      setAnalysis(snapshot.exists() ? snapshot.val() : null);
      setLoading(false);
    });

    return () => {
      unsubLatest();
      unsubHistory();
      unsubAnalysis();
    };
  }, []);

  const alerts = useMemo(() => {
    return history
      .filter((item) => item.status && item.status.toLowerCase() !== 'normal')
      .slice(-5)
      .reverse()
      .map((item) => ({
        title: item.status?.toLowerCase() === 'danger' ? 'Gas Leak Detected' : 'Gas Level Warning',
        time: item.timestamp,
        level: item.status,
      }));
  }, [history]);

  return { latest, history, analysis, alerts, loading };
}
