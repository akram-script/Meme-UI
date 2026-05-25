import { Routes } from '@angular/router';
import { Editor } from './pages/editor/editor';
import { Gallery } from './pages/gallery/gallery';

export const routes: Routes = [
  { path: '', component: Editor },
  { path: 'gallery', component: Gallery }
];