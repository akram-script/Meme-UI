import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CacheService {
  private galleryCacheDirty = false;

  invalidateGalleryCache() {
    this.galleryCacheDirty = true;
  }

  isGalleryCacheDirty(): boolean {
    return this.galleryCacheDirty;
  }

  clearDirtyFlag() {
    this.galleryCacheDirty = false;
  }
}
