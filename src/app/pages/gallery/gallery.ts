import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MemeService } from '../../services/meme';
import { CacheService } from '../../services/cache';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-gallery',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './gallery.html'
})
export class Gallery implements OnInit {
  memes: any[] = [];
  deletingId: number | null = null;
  isLoading = true;
  error: string | null = null;
  selectedMeme: any = null;

  constructor(
    private memeService: MemeService, 
    private cacheService: CacheService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe((event: any) => {
      if (event.urlAfterRedirects.includes('gallery')) {
        this.loadCachedOrFetch();
      }
    });
  }

  ngOnInit() { 
    this.loadCachedOrFetch();
  }

  private loadCachedOrFetch() {
    if (this.cacheService.isGalleryCacheDirty()) {
      console.log('Cache is dirty, reloading...');
      this.cacheService.clearDirtyFlag();
      this.cacheService.clearGalleryCache();
    }

    const cachedMemes = this.cacheService.getGalleryCache();
    if (cachedMemes && cachedMemes.length > 0) {
      console.log('Using cached gallery memes');
      this.memes = cachedMemes;
      this.isLoading = false;
      return;
    }

    this.load();
  }

  load() {
    this.isLoading = true;
    this.error = null;
    this.selectedMeme = null;
    console.log('Loading gallery...');
    this.memeService.getAll().subscribe({
      next: (data: any[]) => {
        console.log('Gallery loaded:', data);
        this.memes = data;
        this.cacheService.setGalleryCache(data);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => { 
        console.error('Gallery load error:', err);
        this.isLoading = false;
        this.error = 'Failed to load gallery';
        this.cdr.detectChanges();
      }
    });
  }

  forceRefresh() {
    console.log('Force refreshing gallery...');
    this.cacheService.clearGalleryCache();
    this.load();
  }

  viewImage(meme: any) {
    this.selectedMeme = meme;
    this.cdr.detectChanges();
  }

  closeModal() {
    this.selectedMeme = null;
    this.cdr.detectChanges();
  }

  share(meme: any) {
    const isRemoteUrl = meme.imageUrl && !meme.imageUrl.startsWith('data:');
    const text = `Regarde ce mème que j'ai créé !`;
    const shareData: any = {
      title: 'Meme Generator',
      text
    };

    if (isRemoteUrl) {
      shareData.url = meme.imageUrl;
    }

    if (navigator.share) {
      navigator.share(shareData).catch(() => {
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}${isRemoteUrl ? `&url=${encodeURIComponent(meme.imageUrl)}` : ''}`;
        window.open(twitterUrl, '_blank', 'noopener');
      });
      return;
    }

    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}${isRemoteUrl ? `&url=${encodeURIComponent(meme.imageUrl)}` : ''}`;
    window.open(twitterUrl, '_blank', 'noopener');
  }

  delete(id: number) {
    this.deletingId = id;
    this.memeService.delete(id).subscribe({
      next: () => {
        this.memes = this.memes.filter(m => m.id !== id);
        this.cacheService.setGalleryCache(this.memes);
        this.deletingId = null;
        if (this.selectedMeme?.id === id) {
          this.selectedMeme = null;
        }
        this.cdr.detectChanges();
      },
      error: () => { 
        this.deletingId = null;
        this.cdr.detectChanges();
      }
    });
  }
}