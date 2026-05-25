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
  private readonly IMGBB_API_KEY = 'e30099d6cb1c4341c5917714ba08c495'; 
  private readonly IMGBB_UPLOAD_URL = 'https://api.imgbb.com/1/upload';

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

  async save() {
    if (!this.image.src) {
      this.notificationMessage = 'Please choose an image before saving.';
      this.showNotification = true;
      this.cdr.detectChanges();
      setTimeout(() => {
        this.showNotification = false;
        this.cdr.detectChanges();
      }, 3000);
      return;
    }

    this.loading = true;
    const canvasUrl = this.canvas.nativeElement.toDataURL('image/png');
    let imageUrl = canvasUrl;

    if (this.IMGBB_API_KEY) {
      try {
        imageUrl = await this.uploadToImgBB(canvasUrl);
      } catch (uploadError) {
        console.error('ImgBB upload error:', uploadError);
        this.loading = false;
        this.notificationMessage = 'Image upload failed. Check your Imgbb API key and network.';
        this.showNotification = true;
        this.cdr.detectChanges();
        setTimeout(() => {
          this.showNotification = false;
          this.cdr.detectChanges();
        }, 5000);
        return;
      }
    }

    const data = {
      imageUrl,
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
        
        this.cacheService.invalidateGalleryCache();
        
        this.notificationMessage = this.IMGBB_API_KEY
          ? 'Image uploaded and saved successfully!'
          : 'Image saved locally as data URL.';
        this.showNotification = true;
        this.cdr.detectChanges();
        setTimeout(() => {
          this.showNotification = false;
          this.cdr.detectChanges();
        }, 3000);
      },
      error: (err) => { 
        console.error('Save error:', err);
        this.loading = false;
        
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

  private async uploadToImgBB(dataUrl: string): Promise<string> {
    const base64 = dataUrl.split(',')[1];
    const formData = new FormData();
    formData.append('key', this.IMGBB_API_KEY);
    formData.append('image', base64);

    const response = await fetch(this.IMGBB_UPLOAD_URL, {
      method: 'POST',
      body: formData
    });

    const body = await response.json();
    if (!response.ok || !body.data || !body.data.url) {
      throw new Error(body?.error?.message || 'ImgBB upload failed');
    }

    return body.data.url;
  }
}