// Copied from musetop SearchBar.tsx — simplified (no filters, no CustomSelect)
import { useState } from "react";
import { Icon } from "./DemoIcon";

export default function SearchBar({
  onSearch,
  disabled,
}: {
  onSearch: (query: string) => void;
  disabled: boolean;
}) {
  const [query, setQuery] = useState("");

  const submit = () => {
    const q = query.trim();
    if (q) onSearch(q);
  };

  return (
    <div className="search-bar-wrap">
      <div className="search-bar">
        <div className="search-input-wrap">
          <input
            type="text"
            placeholder="Search music..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            disabled={disabled}
          />
          <button
            className="search-input-btn"
            onClick={submit}
            disabled={disabled || !query.trim()}
            title="Search"
          >
            <Icon name="search" size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
