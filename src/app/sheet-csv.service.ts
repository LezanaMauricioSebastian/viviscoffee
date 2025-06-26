// sheets-csv.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as Papa from 'papaparse';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class SheetsCsvService {
  private csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQxYY98Jyk6zGzMfndXIMxpIxwGrTb4zhMmEbx6CZwB9QPhg-7xc8a33zjwkg4CKYhBDSa_cbnLClJB/pub?output=csv';

  constructor(private http: HttpClient) {}

  getProductos(): Observable<any[]> {
    return this.http.get(this.csvUrl, { responseType: 'text' }).pipe(
      map(csvData => {
        const parsed = Papa.parse(csvData, { header: true });
        return parsed.data;
      })
    );
  }
}
