import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

type DatasetContextValue = {
  file: File | null;
  setFile: (file: File | null) => void;
  loadSample: () => Promise<void>;
  clear: () => void;
};

const DatasetContext = createContext<DatasetContextValue | null>(null);

async function fetchSampleFile(): Promise<File> {
  const path = '/PROJET_POV-ML_-_Fichier_de_données_brutes.csv';
  const res = await fetch(path);
  if (!res.ok) {
    throw new Error(`Could not load sample CSV from ${path} (${res.status})`);
  }
  const blob = await res.blob();
  return new File([blob], 'PROJET_POV-ML_-_Fichier_de_données_brutes.csv', {
    type: blob.type || 'text/csv',
  });
}

export function DatasetProvider({ children }: { children: React.ReactNode }) {
  const [file, setFile] = useState<File | null>(null);

  const clear = useCallback(() => setFile(null), []);

  const loadSample = useCallback(async () => {
    const sample = await fetchSampleFile();
    setFile(sample);
  }, []);

  // Default to the bundled PROJET_POV sample so the app is immediately usable.
  useEffect(() => {
    let canceled = false;
    if (file) return;
    fetchSampleFile()
      .then((sample) => {
        if (!canceled) setFile(sample);
      })
      .catch(() => {
        // Non-blocking: user can still upload a file manually.
      });
    return () => {
      canceled = true;
    };
  }, [file]);

  const value = useMemo<DatasetContextValue>(() => ({ file, setFile, loadSample, clear }), [file, loadSample, clear]);

  return <DatasetContext.Provider value={value}>{children}</DatasetContext.Provider>;
}

export function useDataset() {
  const ctx = useContext(DatasetContext);
  if (!ctx) {
    throw new Error('useDataset must be used within DatasetProvider');
  }
  return ctx;
}
