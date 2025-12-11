import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-itinerary-viewer',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule],
  template: `
    <mat-card class="itinerary-card">
      <mat-card-header>
        <mat-card-title>{{ employeeName }} - {{ from }} to {{ to }}</mat-card-title>
        <mat-card-subtitle>{{ startDate | date }} - {{ endDate | date }}</mat-card-subtitle>
      </mat-card-header>
      <mat-card-content>
        <div [innerHTML]="itineraryHtml" class="itinerary-content"></div>
      </mat-card-content>
      <mat-card-actions>
        <button mat-button color="primary" (click)="printItinerary()">
          <mat-icon>print</mat-icon>
          Print
        </button>
      </mat-card-actions>
    </mat-card>
  `,
  styles: [`
    .itinerary-card {
      max-width: 800px;
      margin: 20px auto;
    }
    .itinerary-content {
      margin-top: 16px;
    }
  `]
})
export class ItineraryViewerComponent {
  @Input() employeeName = '';
  @Input() from = '';
  @Input() to = '';
  @Input() startDate = '';
  @Input() endDate = '';
  @Input() itineraryHtml = '';

  printItinerary(): void {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Itinerary</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              h1 { color: #1976d2; }
            </style>
          </head>
          <body>
            <h1>${this.employeeName} - ${this.from} to ${this.to}</h1>
            <p>${this.startDate} - ${this.endDate}</p>
            ${this.itineraryHtml}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  }
}
