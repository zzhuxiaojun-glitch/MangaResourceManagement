'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';

interface ImageCarouselProps {
  coverImage?: string;
  previewImages?: string[];
  title: string;
}

export function ImageCarousel({ coverImage, previewImages = [], title }: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const allImages = [coverImage, ...previewImages].filter(Boolean) as string[];

  if (allImages.length === 0) {
    return (
      <div className="relative w-full aspect-[3/4] bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center text-gray-400">
          <div className="text-4xl mb-2">📖</div>
          <div className="text-sm">暂无封面</div>
        </div>
      </div>
    );
  }

  const handlePrevious = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setCurrentIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setCurrentIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="relative w-full aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden group">
      <Image
        src={allImages[currentIndex]}
        alt={`${title} - ${currentIndex === 0 ? '封面' : `预览 ${currentIndex}`}`}
        fill
        className="object-cover"
        unoptimized
      />

      {allImages.length > 1 && (
        <>
          <Button
            variant="secondary"
            size="icon"
            className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handlePrevious}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Button
            variant="secondary"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleNext}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
            {currentIndex + 1} / {allImages.length}
            {currentIndex === 0 ? ' (封面)' : ' (内页)'}
          </div>

          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-1">
            {allImages.map((_, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setCurrentIndex(index);
                }}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex
                    ? 'bg-white w-4'
                    : 'bg-white bg-opacity-50 hover:bg-opacity-75'
                }`}
              />
            ))}
          </div>
        </>
      )}

      {allImages.length === 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
          封面
        </div>
      )}
    </div>
  );
}
