
import { useState, useEffect, useCallback } from 'react';
import type { Sodium } from '../types';
import _sodium from 'libsodium-wrappers';

// Una sola promesa que se resuelve con la instancia de sodium.
// Esto asegura que solo intentemos cargarla e inicializarla una vez.
let sodiumPromise: Promise<Sodium> | null = null;

const getSodium = (): Promise<Sodium> => {
    if (sodiumPromise) {
        return sodiumPromise;
    }

    sodiumPromise = new Promise(async (resolve, reject) => {
        try {
            console.log('Inicializando libsodium...');
            await _sodium.ready;
            console.log('¡Sodium listo!');
            resolve(_sodium);
        } catch (err) {
            console.error('Error de inicialización de sodium:', err);
            reject(new Error("sodiumInitError"));
        }
    });

    return sodiumPromise;
};


export function useSodium() {
  const [sodium, setSodium] = useState<Sodium | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const retry = useCallback(() => {
    setError(null);
    setSodium(null);
    // Nota: Solo reiniciamos la promesa en un error de carga de script (en getSodium),
    // no en error de inicialización, ya que sería un problema persistente.
    // Incrementar el contador de reintentos volverá a activar el efecto.
    setRetryCount(c => c + 1);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
        try {
            const sodiumInstance = await getSodium();
            if (isMounted) {
                setSodium(sodiumInstance);
            }
        } catch (err) {
            if (isMounted && err instanceof Error) {
                console.error("Error cargando/inicializando libsodium:", err.message);
                setError(err.message);
            }
        }
    };

    init();

    return () => {
      isMounted = false;
    };
  }, [retryCount]);

  return { sodium, error, isReady: !!sodium, retry };
}