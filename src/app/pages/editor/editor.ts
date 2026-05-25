import { Component, ElementRef, ViewChild, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MemeService } from '../../services/meme';
import { CacheService } from '../../services/cache';

@Component({
  selector: 'app-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './editor.html'
})
export class Editor {
  @ViewChild('canvas') canvas!: ElementRef<HTMLCanvasElement>;
  topText = '';
  bottomText = '';
  image = new Image();
  loading = false;
  showNotification = false;
  notificationMessage = '';

  constructor(
    private memeService: MemeService,
    private cacheService: CacheService,
    private cdr: ChangeDetectorRef
  ) {}

  upload(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      this.image.src = reader.result as string;
      this.image.onload = () => this.draw();
    };
    reader.readAsDataURL(file);
  }

  draw() {
    const canvas = this.canvas.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = 600; canvas.height = 600;
    ctx.clearRect(0, 0, 600, 600);
    ctx.drawImage(this.image, 0, 0, 600, 600);
    ctx.font = 'bold 40px Arial';
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 3;
    ctx.textAlign = 'center';
    ctx.strokeText(this.topText, 300, 50);
    ctx.fillText(this.topText, 300, 50);
    ctx.strokeText(this.bottomText, 300, 560);
    ctx.fillText(this.bottomText, 300, 560);
  }

  download() {
    const link = document.createElement('a');
    link.download = 'meme.png';
    link.href = this.canvas.nativeElement.toDataURL();
    link.click();
  }

  save() {
    this.loading = true;
    const data = {
      imageUrl: this.canvas.nativeElement.toDataURL(),
      topText: this.topText,
      bottomText: this.bottomText
    };
    this.memeService.create(data).subscribe({
      next: (response) => {
        console.log('Save successful:', response);
        this.loading = false;
        this.topText = '';
        this.bottomText = '';
        this.image = new Image();
        const canvas = this.canvas.nativeElement;
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Invalidate gallery cache since a new meme was added
        this.cacheService.invalidateGalleryCache();
        
        // Show success notification
        this.notificationMessage = 'Image saved successfully!';
        this.showNotification = true;
        this.cdr.detectChanges();
        console.log('Notification shown:', this.showNotification);
        setTimeout(() => {
          this.showNotification = false;
          this.cdr.detectChanges();
          console.log('Notification hidden');
        }, 3000);
      },
      error: (err) => { 
        console.error('Save error:', err);
        this.loading = false;
        // Show error notification
        this.notificationMessage = 'Error saving image. Check if backend is running.';
        this.showNotification = true;
        this.cdr.detectChanges();
        setTimeout(() => {
          this.showNotification = false;
          this.cdr.detectChanges();
        }, 5000);
      }
    });
  }
}