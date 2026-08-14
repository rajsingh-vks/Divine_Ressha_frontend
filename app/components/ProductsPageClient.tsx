'use client';

import { useMemo, useState } from 'react';
import ProductGrid from './ProductGrid';
import type { Product } from '@/lib/data/products';

type SortOption = 'featured' | 'low-high' | 'high-low' | 'name';

const normalizeProduct = (product: Product, index: number) => {
  const fragrance = product.fragrance || `Fragrance ${index + 1}`;
  const mood = product.category || product.subcategory || 'Signature';
  const size = product.packSize || 'Standard';

  return {
    ...product,
    fragrance,
    mood,
    size,
    title: product.title || `Product ${index + 1}`,
    tag: `${fragrance} · ${mood} · ${size}`,
    notes: product.notes || `${fragrance} notes with a smooth botanical finish`,
    description: product.description || `${mood} fragrance for everyday ritual`,
  };
};

const toggleValue = (value: string, list: string[]) =>
  list.includes(value) ? list.filter((item) => item !== value) : [...list, value];

export default function ProductsPageClient({ products }: { products: Product[] }) {
  const [search, setSearch] = useState('');
  const [selectedFragrance, setSelectedFragrance] = useState<string[]>([]);
  const [selectedMood, setSelectedMood] = useState<string[]>([]);
  const [selectedSize, setSelectedSize] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('featured');

  const normalizedProducts = useMemo(
    () => products.map((product, index) => normalizeProduct(product, index)),
    [products]
  );

  const fragranceOptions = useMemo(
    () => Array.from(new Set(normalizedProducts.map((product) => product.fragrance).filter(Boolean))) as string[],
    [normalizedProducts]
  );

  const moodOptions = useMemo(
    () => Array.from(new Set(normalizedProducts.map((product) => product.mood).filter(Boolean))) as string[],
    [normalizedProducts]
  );

  const sizeOptions = useMemo(
    () => Array.from(new Set(normalizedProducts.map((product) => product.size).filter(Boolean))) as string[],
    [normalizedProducts]
  );

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    let nextProducts = normalizedProducts.filter((product) => {
      const haystack = [product.title, product.tag, product.notes, product.description]
        .join(' ')
        .toLowerCase();

      const matchesSearch = !query || haystack.includes(query);
      const matchesFragrance = !selectedFragrance.length || selectedFragrance.includes(product.fragrance || '');
      const matchesMood = !selectedMood.length || selectedMood.includes(product.mood || '');
      const matchesSize = !selectedSize.length || selectedSize.includes(product.size || '');

      return matchesSearch && matchesFragrance && matchesMood && matchesSize;
    });

    switch (sortBy) {
      case 'low-high':
        nextProducts = [...nextProducts].sort((a, b) => a.price - b.price);
        break;
      case 'high-low':
        nextProducts = [...nextProducts].sort((a, b) => b.price - a.price);
        break;
      case 'name':
        nextProducts = [...nextProducts].sort((a, b) => a.title.localeCompare(b.title));
        break;
      default:
        break;
    }

    return nextProducts;
  }, [normalizedProducts, search, selectedFragrance, selectedMood, selectedSize, sortBy]);

  return (
    <main className="products-page-shell">
      <section className="page-shell-wrapper products-collection-wrapper">
        <div className="products-toolbar">
          <div className="products-search-box">
            <input
              type="text"
              value={search}
              aria-label="Search fragrances"
              placeholder="Search fragrances..."
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <div className="products-sort-box">
            <label htmlFor="products-sort">Sort</label>
            <select
              id="products-sort"
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as SortOption)}
            >
              <option value="featured">Featured</option>
              <option value="low-high">Price: low to high</option>
              <option value="high-low">Price: high to low</option>
              <option value="name">A–Z</option>
            </select>
          </div>

          <div className="products-count-box">{filteredProducts.length} products</div>
        </div>

        <div className="products-layout">
          <aside className="products-filter-panel" aria-label="Product filters">
            <div className="products-filter-section">
              <h3>Fragrance</h3>
              {fragranceOptions.map((option) => (
                <label key={option} className="custom-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedFragrance.includes(option)}
                    onChange={() => setSelectedFragrance((current) => toggleValue(option, current))}
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>

            <div className="products-filter-section">
              <h3>Mood</h3>
              {moodOptions.map((option) => (
                <label key={option} className="custom-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedMood.includes(option)}
                    onChange={() => setSelectedMood((current) => toggleValue(option, current))}
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>

            <div className="products-filter-section">
              <h3>Size</h3>
              {sizeOptions.map((option) => (
                <label key={option} className="custom-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedSize.includes(option)}
                    onChange={() => setSelectedSize((current) => toggleValue(option, current))}
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          </aside>

          <div className="products-results-panel">
            <ProductGrid products={filteredProducts} />
          </div>
        </div>
      </section>
    </main>
  );
}
