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
  private hasLoadedOnce = false;
  private cacheLastUpdate = 0;
  private cacheDuration = 24 * 60 * 60 * 1000; // 24 hours

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
        this.checkCacheAndLoad();
      }
    });
  }

  ngOnInit() { 
    this.checkCacheAndLoad();
  }

  private checkCacheAndLoad() {
    // Check if cache was invalidated (e.g., meme was added or deleted)
    if (this.cacheService.isGalleryCacheDirty()) {
      console.log('Cache is dirty, reloading...');
      this.cacheService.clearDirtyFlag();
      this.load();
      return;
    }

    // Check if cache is still valid
    const now = Date.now();
    if (this.hasLoadedOnce && (now - this.cacheLastUpdate < this.cacheDuration) && this.memes.length > 0) {
      console.log('Using cached memes');
      this.isLoading = false;
      return;
    }

    // First time load
    if (!this.hasLoadedOnce) {
      this.load();
    }
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
        this.isLoading = false;
        this.hasLoadedOnce = true;
        this.cacheLastUpdate = Date.now();
        this.cdr.detectChanges();
      },
      error: (err) => { 
        console.error('Gallery load error:', err);
        this.isLoading = false;
        this.error = 'Failed to load gallery. Is the backend running at http://localhost:5070?';
        this.cdr.detectChanges();
      }
    });
  }

  forceRefresh() {
    console.log('Force refreshing gallery...');
    this.hasLoadedOnce = false;
    this.cacheLastUpdate = 0;
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

  delete(id: number) {
    this.deletingId = id;
    this.memeService.delete(id).subscribe({
      next: () => {
        this.memes = this.memes.filter(m => m.id !== id);
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