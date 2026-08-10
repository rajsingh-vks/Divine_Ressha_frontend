'use client';

import { useState } from 'react';

type ProductImageGalleryProps = { images: string[]; alt: string };

export default function ProductImageGallery({ images, alt }: ProductImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const safeIndex = Math.min(activeIndex, Math.max(images.length - 1, 0));

  if (!images.length) return null;

  const selectImage = (index: number) => setActiveIndex((index + images.length) % images.length);

  return (
    <div className="product-image-gallery">
      <div className="product-gallery-stage">
        <img src={images[safeIndex]} alt={`${alt} — image ${safeIndex + 1}`} />
        {images.length > 1 ? <>
          <button type="button" className="product-gallery-arrow previous" onClick={() => selectImage(safeIndex - 1)} aria-label="Previous product image">‹</button>
          <button type="button" className="product-gallery-arrow next" onClick={() => selectImage(safeIndex + 1)} aria-label="Next product image">›</button>
        </> : null}
      </div>
      {images.length > 1 ? <div className="product-gallery-thumbnails" aria-label="Product image gallery">
        {images.map((image, index) => (
          <button key={`${image}-${index}`} type="button" className={index === safeIndex ? 'active' : ''} onClick={() => selectImage(index)} aria-label={`View product image ${index + 1}`}><img src={image} alt="" /></button>
        ))}
      </div> : null}
    </div>
  );
}
