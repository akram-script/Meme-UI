import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class MemeService {
  private api = 'http://localhost:5070/api/Meme';

  constructor(private http: HttpClient) {}

  getAll(): Observable<any> { return this.http.get<any>(this.api); }
  create(data: any): Observable<any> { return this.http.post<any>(this.api, data); }
  delete(id: number): Observable<any> {
    return this.http.delete<any>(`${this.api}/${id}`);
  }
}