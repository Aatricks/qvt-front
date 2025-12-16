import { useEffect, useState, useMemo } from 'react';
import Papa from 'papaparse';
import { Plus, X, Filter } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface FilterBuilderProps {
  file: File | null;
  onFiltersChange: (filters: Record<string, any>) => void;
}

// Helper to check if a column looks like a Likert question (e.g. COM1, PGC2)
function isLikertColumn(col: string) {
  // Matches typical Likert codes: 2-5 uppercase letters followed by 1 digit
  // e.g. COM1, EPUI4, RECO2. 
  // Avoids matching things like "Sexe" or "Age".
  return /^[A-Z]{2,6}[0-9]$/.test(col);
}

// Value mapping for specific columns based on standard French HR coding
const VALUE_LABELS: Record<string, Record<string, string>> = {
  'Sexe': {
    '1': 'Homme',
    '2': 'Femme'
  },
  'Contrat': {
    '1': 'CDI',
    '2': 'CDD',
    '3': 'Autre/Intérim'
  },
  'Temps': {
    '1': 'Temps plein',
    '2': 'Temps partiel'
  },
  'Encadre': {
    '1': 'Non encadrant',
    '2': 'Manager de proximité',
    '3': 'Manager sup.'
  },
  'Secteur': {
    '1': 'Siège',
    '2': 'Opérations',
    '3': 'Support'
  },
  'TailleOr': {
    '1': '< 50',
    '2': '50-249',
    '3': '250-999',
    '4': '1000+'
  }
};

export function FilterBuilder({ file, onFiltersChange }: FilterBuilderProps) {
  const [data, setData] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  
  const [selectedColumn, setSelectedColumn] = useState<string>('');
  const [selectedValue, setSelectedValue] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Parse CSV to get full data and columns
  useEffect(() => {
    if (!file) {
      setData([]);
      setColumns([]);
      setActiveFilters({});
      return;
    }

    setLoading(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const meta = results.meta;
        if (meta.fields) {
          setColumns(meta.fields);
          setData(results.data);
          setActiveFilters({});
          onFiltersChange({});
        }
        setLoading(false);
      },
      error: (err) => {
        console.error('Error parsing CSV:', err);
        setLoading(false);
      }
    });
  }, [file]);

  // Dynamically calculate available options based on active filters
  const { availableColumns, availableValuesForColumn } = useMemo(() => {
    // 1. Filter the data based on active filters
    const filteredData = data.filter(row => {
      return Object.entries(activeFilters).every(([key, val]) => {
        // Robust comparison: handle potential spaces
        return String(row[key] || '').trim() === val;
      });
    });

    // 2. Calculate unique values for all columns based on the filtered subset
    const values: Record<string, Set<string>> = {};
    columns.forEach(field => {
      values[field] = new Set();
    });

    filteredData.forEach(row => {
      columns.forEach(field => {
        const val = row[field];
        if (val !== undefined && val !== null && String(val).trim() !== '') {
            values[field].add(String(val).trim());
        }
      });
    });

    // 3. Determine usable columns (low cardinality, > 1 option)
    const validCols: string[] = [];
    const validValues: Record<string, string[]> = {};

    Object.keys(values).forEach(key => {
      if (values[key].size > 0 && values[key].size < 50) {
         validCols.push(key);
         validValues[key] = Array.from(values[key]).sort();
      }
    });

    // Sort columns alphabetically
    validCols.sort();

    return { 
      availableColumns: validCols, 
      availableValuesForColumn: validValues 
    };
  }, [data, columns, activeFilters]);

  const addFilter = () => {
    if (selectedColumn && selectedValue) {
      const newFilters = { ...activeFilters, [selectedColumn]: selectedValue };
      setActiveFilters(newFilters);
      onFiltersChange(newFilters);
      setSelectedColumn('');
      setSelectedValue('');
    }
  };

  const removeFilter = (key: string) => {
    const newFilters = { ...activeFilters };
    delete newFilters[key];
    setActiveFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    setActiveFilters({});
    onFiltersChange({});
  };

  // Group columns
  const groups = useMemo(() => {
    const hr: string[] = [];
    const baro: string[] = [];
    
    availableColumns
        .filter(col => !activeFilters[col])
        .forEach(col => {
            if (isLikertColumn(col)) {
                baro.push(col);
            } else {
                hr.push(col);
            }
        });

    return { hr, baro };
  }, [availableColumns, activeFilters]);

  // Get display label for a value
  const getDisplayValue = (col: string, val: string) => {
    return VALUE_LABELS[col]?.[val] || val;
  };

  if (!file) return null;

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                <CardTitle className="text-lg">Filtres dynamiques</CardTitle>
            </div>
            {Object.keys(activeFilters).length > 0 && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 px-2 text-xs text-muted-foreground hover:text-destructive">
                    Tout effacer
                </Button>
            )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
           <div className="text-sm text-muted-foreground">Analyse du fichier...</div>
        ) : (
          <>
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="flex-1 min-w-[140px]">
                <Select value={selectedColumn} onValueChange={(val) => {
                    setSelectedColumn(val);
                    setSelectedValue('');
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir une colonne" />
                  </SelectTrigger>
                  <SelectContent>
                    {groups.hr.length > 0 && (
                        <SelectGroup>
                            <SelectLabel>Facteurs RH</SelectLabel>
                            {groups.hr.map(col => (
                                <SelectItem key={col} value={col}>{col}</SelectItem>
                            ))}
                        </SelectGroup>
                    )}
                    {groups.baro.length > 0 && (
                        <SelectGroup>
                            <SelectLabel>Baromètre</SelectLabel>
                            {groups.baro.map(col => (
                                <SelectItem key={col} value={col}>{col}</SelectItem>
                            ))}
                        </SelectGroup>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 min-w-[140px]">
                <Select 
                    value={selectedValue} 
                    onValueChange={setSelectedValue}
                    disabled={!selectedColumn}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir une valeur" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedColumn && availableValuesForColumn[selectedColumn]?.map(val => (
                      <SelectItem key={val} value={val}>
                          {getDisplayValue(selectedColumn, val)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={addFilter} 
                disabled={!selectedColumn || !selectedValue}
                variant="secondary"
                size="icon"
                className="shrink-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {Object.keys(activeFilters).length > 0 ? (
                <div className="flex flex-wrap gap-2 pt-2">
                {Object.entries(activeFilters).map(([key, val]) => (
                    <Badge key={key} variant="secondary" className="flex items-center gap-1 px-3 py-1 text-sm font-normal">
                    <span className="font-semibold">{key}:</span> {getDisplayValue(key, val)}
                    <button 
                        onClick={() => removeFilter(key)}
                        className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20 focus:outline-none"
                    >
                        <X className="h-3 w-3" />
                    </button>
                    </Badge>
                ))}
                </div>
            ) : (
                <div className="text-xs text-muted-foreground text-center py-2 border border-dashed rounded-md">
                    Aucun filtre actif
                </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
