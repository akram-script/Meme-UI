import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CacheService {
  private galleryCacheDirty = false;
  private galleryCache: any[] | null = null;
  private galleryCacheUpdatedAt = 0;

  invalidateGalleryCache() {
    this.galleryCacheDirty = true;
  }

  isGalleryCacheDirty(): boolean {
    return this.galleryCacheDirty;
  }

  clearDirtyFlag() {
    this.galleryCacheDirty = false;
  }

  setGalleryCache(memes: any[]) {
    this.galleryCache = memes;
    this.galleryCacheUpdatedAt = Date.now();
  }

  getGalleryCache(): any[] | null {
    return this.galleryCache;
  }

  clearGalleryCache() {
    this.galleryCache = null;
    this.galleryCacheUpdatedAt = 0;
  }
}
