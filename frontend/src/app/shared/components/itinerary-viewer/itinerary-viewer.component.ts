import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { ItineraryData } from '../../models';

@Component({
  selector: 'app-itinerary-viewer',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatDividerModule
  ],
  templateUrl: './itinerary-viewer.component.html',
  styleUrls: ['./itinerary-viewer.component.scss']
})
export class ItineraryViewerComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ItineraryData,
    private dialogRef: MatDialogRef<ItineraryViewerComponent>
  ) {}

  close(): void {
    this.dialogRef.close();
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }

  formatTime(date: Date): string {
    return new Date(date).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  formatDateTime(date: Date): string {
    return new Date(date).toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getTransportIcon(transportType: 'FLIGHT' | 'TRAIN' | 'BUS'): string {
    switch (transportType) {
      case 'FLIGHT':
        return 'flight';
      case 'TRAIN':
        return 'train';
      case 'BUS':
        return 'directions_bus';
      default:
        return 'commute';
    }
  }
}
