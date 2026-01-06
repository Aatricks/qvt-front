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
    '2': 'Femme',
    '3': 'Autre'
  },
  'Contrat': {
    '1': 'CDI',
    '2': 'CDD',
    '3': 'Intérim'
  },
  'Temps': {
    '1': 'Temps plein',
    '2': 'Temps partiel'
  },
  'Encadre': {
    '1': 'Non',
    '2': 'Oui, en tant que cadre opérationnel',
    '3': 'Oui, en tant que cadre dirigeant'
  },
  'Secteur': {
    '1': 'Privé',
    '2': 'Public',
    '3': 'Associatif'
  },
  'TailleOr': {
    '1': 'Moins de 10',
    '2': 'De 11 à 49',
    '3': 'De 50 à 249',
    '4': 'De 250 à 499',
    '5': '500 et plus'
  }
};

const LIKERT_PREFIXES = ['POV', 'PGC', 'CSA', 'EVPVP', 'RECO', 'COM', 'DL', 'PPD', 'JUST', 'PI', 'PD', 'ENG', 'EPUI'];

function getAgeClasse(age: number | string): string {
    const val = Number(age);
    if (isNaN(val)) return 'N/A';
    if (val <= 29) return 'Moins de 30 ans';
    if (val <= 39) return '30-39 ans';
    if (val <= 49) return '40-49 ans';
    if (val <= 59) return '50-59 ans';
    return '60 ans et plus';
}

function getSeniorityClasse(years: number | string): string {
    const val = Number(years);
    if (isNaN(val)) return 'N/A';
    if (val <= 1) return "Moins d'un an";
    if (val <= 5) return '1-5 ans';
    if (val <= 10) return '6-10 ans';
    if (val <= 20) return '11-20 ans';
    return 'Plus de 20 ans';
}

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
        const rawData = results.data as any[];
        const fields = results.meta.fields || [];
        
        // Enrich data with banded columns and dimension averages
        const enriched = rawData.map(row => {
            const newRow = { ...row };
            
            // 1. Banding
            if (row['Age']) newRow['AgeClasse'] = getAgeClasse(row['Age']);
            const seniorityKey = row['Ancienneté'] ? 'Ancienneté' : (row['Ancienne'] ? 'Ancienne' : null);
            if (seniorityKey) {
                newRow['AnciennetéClasse'] = getSeniorityClasse(row[seniorityKey]);
            }

            // 2. Dimensions
            LIKERT_PREFIXES.forEach(prefix => {
                const items = fields.filter(f => f.toUpperCase().startsWith(prefix));
                if (items.length > 0) {
                    const values = items.map(i => Number(row[i])).filter(v => !isNaN(v) && v > 0);
                    if (values.length > 0) {
                        const avg = values.reduce((a, b) => a + b, 0) / values.length;
                        newRow[`DIM_${prefix}`] = Math.round(avg).toString(); // Use rounded score for filtering
                    }
                }
            });

            return newRow;
        });

        const allFields = Array.from(new Set([
            ...fields, 
            'AgeClasse', 
            'AnciennetéClasse', 
            ...LIKERT_PREFIXES.map(p => `DIM_${p}`)
        ])).filter(f => enriched.some(r => r[f] !== undefined));

        setColumns(allFields);
        setData(enriched);
        setActiveFilters({});
        onFiltersChange({});
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
        return String(row[key] || '').trim() === val;
      });
    });

    // 2. Calculate unique values
    const values: Record<string, Set<string>> = {};
    columns.forEach(field => { values[field] = new Set(); });

    filteredData.forEach(row => {
      columns.forEach(field => {
        const val = row[field];
        if (val !== undefined && val !== null && String(val).trim() !== '') {
            values[field].add(String(val).trim());
        }
      });
    });

    // 3. Filter valid columns: hide raw numeric ones if banded versions exist
    const excludeRaw = new Set(['Age', 'Ancienne', 'Ancienneté']);
    const isLikertRaw = (c: string) => /^[A-Z]{2,6}[0-9]$/.test(c);

    const validCols: string[] = [];
    const validValues: Record<string, string[]> = {};

    Object.keys(values).forEach(key => {
      if (excludeRaw.has(key) || isLikertRaw(key)) return;
      
      if (values[key].size > 0 && values[key].size < 50) {
         validCols.push(key);
         validValues[key] = Array.from(values[key]).sort((a, b) => {
             // Numeric sort for scores
             const na = Number(a), nb = Number(b);
             if (!isNaN(na) && !isNaN(nb)) return na - nb;
             return a.localeCompare(b);
         });
      }
    });

    validCols.sort();
    return { availableColumns: validCols, availableValuesForColumn: validValues };
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

  // Group columns for UI
  const groups = useMemo(() => {
    const hr: string[] = [];
    const baro: string[] = [];
    
    availableColumns
        .filter(col => !activeFilters[col])
        .forEach(col => {
            if (col.startsWith('DIM_')) {
                baro.push(col);
            } else {
                hr.push(col);
            }
        });

    return { hr, baro };
  }, [availableColumns, activeFilters]);

  // Get display label for a value or column
  const getDisplayColumn = (col: string) => {
      if (col === 'AgeClasse') return 'Âge (tranche)';
      if (col === 'AnciennetéClasse') return 'Ancienneté (tranche)';
      if (col.startsWith('DIM_')) return col.replace('DIM_', '');
      return col;
  };

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
                                <SelectItem key={col} value={col}>{getDisplayColumn(col)}</SelectItem>
                            ))}
                        </SelectGroup>
                    )}
                    {groups.baro.length > 0 && (
                        <SelectGroup>
                            <SelectLabel>Dimensions QVCT</SelectLabel>
                            {groups.baro.map(col => (
                                <SelectItem key={col} value={col}>{getDisplayColumn(col)}</SelectItem>
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
                    <SelectValue placeholder="Valeur" />
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
                    <span className="font-semibold">{getDisplayColumn(key)}:</span> {getDisplayValue(key, val)}
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
                    Filtrer par tranche d'âge, ancienneté ou dimension...
                </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
