import useFireData from './useFireData';
import useFridgeData from './useFridgeData';
import useGasData from './useGasData';
import useTempHumData from './useTempHumData';

export default function useOverviewData() {
  const gas = useGasData();
  const temp = useTempHumData();
  const fridge = useFridgeData();
  const fire = useFireData();

  return {
    gas,
    temp,
    fridge,
    fire,
    loading: gas.loading || temp.loading || fridge.loading || fire.loading,
  };
}
