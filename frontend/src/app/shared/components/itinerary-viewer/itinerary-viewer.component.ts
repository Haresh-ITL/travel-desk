import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ItineraryData } from '../../models';
import { environment } from '../../../../environments/environment';

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
    private dialogRef: MatDialogRef<ItineraryViewerComponent>,
    private sanitizer: DomSanitizer
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

  getFileIcon(mimeType?: string): string {
    if (!mimeType) return 'description';
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType === 'application/pdf') return 'picture_as_pdf';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'description';
    return 'attach_file';
  }

  getFileUrl(file: any): SafeResourceUrl | string {
    if (file.url && typeof file.url === 'string') {
      return file.url.startsWith('http') ? file.url : `${environment.apiUrl}/${file.url}`;
    }
    if (file.base64 && typeof file.base64 === 'string') {
      const mimeType = file.mimeType || 'application/octet-stream';
      return this.sanitizer.sanitize(1, `data:${mimeType};base64,${file.base64}`) || '';
    }
    return '';
  }

  openFile(file: any): void {
    if (file.url) {
      const url = file.url.startsWith('http') ? file.url : `${environment.apiUrl}/${file.url}`;
      window.open(url, '_blank');
    } else if (file.base64) {
      const mimeType = file.mimeType || 'application/octet-stream';
      const blob = this.base64ToBlob(file.base64, mimeType);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    }
  }

  private base64ToBlob(base64: string, mimeType: string): Blob {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  }

  get allFiles(): Array<{ fileName: string; url?: string; base64?: string; mimeType?: string }> {
    const files: Array<{ fileName: string; url?: string; base64?: string; mimeType?: string }> = [];
    
    // Add confirmation files
    if (this.data.confirmationFiles && Array.isArray(this.data.confirmationFiles)) {
      this.data.confirmationFiles.forEach((file: string | { fileName: string; base64?: string; mimeType?: string; url?: string }) => {
        if (typeof file === 'string') {
          const fileName = file.split('/').pop() || 'file';
          files.push({ fileName, url: file });
        } else if (file && typeof file === 'object' && 'fileName' in file) {
          files.push(file);
        }
      });
    }
    
    // Add file paths
    if (this.data.filePaths && Array.isArray(this.data.filePaths)) {
      this.data.filePaths.forEach((path: string) => {
        if (typeof path === 'string') {
          const fileName = path.split('/').pop() || 'file';
          files.push({ fileName, url: path });
        }
      });
    }
    
    return files;
  }
}
