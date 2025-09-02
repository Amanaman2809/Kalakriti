"use client"
import { useState, useEffect } from "react";

export default function Filters({ 
  filters, 
  onFilterChange 
}: {
  filters: any;
  onFilterChange: (filters: any) => void;
}) {
  const [localFilters, setLocalFilters] = useState(filters);
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleApplyFilters = () => {
    onFilterChange(localFilters);
  };

  const handleReset = () => {
    const newFilters = { minPrice: "", maxPrice: "" };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <div className="bg-accent p-4 rounded-lg">
      <h3 className="font-medium mb-4">Filters</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm mb-1">Min Price</label>
          <input
            type="number"
            value={localFilters.minPrice}
            onChange={(e) => 
              setLocalFilters({...localFilters, minPrice: e.target.value})
            }
            className="w-full px-3 py-2 border rounded"
            placeholder="$0"
          />
        </div>
        
        <div>
          <label className="block text-sm mb-1">Max Price</label>
          <input
            type="number"
            value={localFilters.maxPrice}
            onChange={(e) => 
              setLocalFilters({...localFilters, maxPrice: e.target.value})
            }
            className="w-full px-3 py-2 border rounded"
            placeholder="$1000"
          />
        </div>
        
        <div className="flex gap-2 pt-2">
          <button
            onClick={handleApplyFilters}
            className="flex-1 bg-primary text-white py-2 rounded hover:bg-opacity-90"
          >
            Apply
          </button>
          <button
            onClick={handleReset}
            className="flex-1 bg-gray-200 py-2 rounded hover:bg-gray-300"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}