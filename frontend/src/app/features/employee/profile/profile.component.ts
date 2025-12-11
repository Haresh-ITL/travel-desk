import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';

interface Document {
  type: string;
  name: string;
  uploaded: boolean;
  lastUpdated?: string;
  url?: string;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule
  ],
  template: `
    <div class="profile-container">
      <h1>My Profile</h1>

      <mat-card class="profile-card">
        <mat-card-header>
          <mat-card-title>Profile Information</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <p><strong>Name:</strong> {{ profile?.name }}</p>
          <p><strong>Email:</strong> {{ profile?.email }}</p>
          <p><strong>Role:</strong> {{ profile?.role }}</p>
        </mat-card-content>
      </mat-card>

      <h2>Documents & KYC</h2>
      <div class="documents-grid">
        <mat-card *ngFor="let doc of documents" class="document-card">
          <mat-card-header>
            <mat-icon mat-card-avatar [style.color]="doc.uploaded ? 'green' : 'gray'">{{ getDocIcon(doc.type) }}</mat-icon>
            <mat-card-title>{{ doc.type }}</mat-card-title>
            <mat-card-subtitle *ngIf="doc.uploaded">Last updated: {{ doc.lastUpdated | date }}</mat-card-subtitle>
            <mat-card-subtitle *ngIf="!doc.uploaded">Not uploaded</mat-card-subtitle>
          </mat-card-header>
          <mat-card-actions>
            <button mat-button (click)="uploadDocument(doc)" [disabled]="uploading">
              <mat-icon>upload</mat-icon>
              {{ doc.uploaded ? 'Replace' : 'Upload' }}
            </button>
            <button mat-button *ngIf="doc.uploaded" (click)="viewDocument(doc)">
              <mat-icon>visibility</mat-icon>
              View
            </button>
          </mat-card-actions>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .profile-container {
      padding: 20px;
    }
    .profile-card {
      margin-bottom: 30px;
    }
    .documents-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
      margin-top: 20px;
    }
    .document-card {
      display: flex;
      flex-direction: column;
    }
  `]
})
export class ProfileComponent implements OnInit {
  profile: any = null;
  documents: Document[] = [
    { type: 'Aadhaar', name: 'Aadhaar Card', uploaded: false },
    { type: 'PAN', name: 'PAN Card', uploaded: false },
    { type: 'Passport', name: 'Passport', uploaded: false }
  ];
  uploading = false;

  constructor(
    private http: HttpClient,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadProfile();
    this.loadDocuments();
  }

  loadProfile(): void {
    // Assuming endpoint to get current user profile
    this.http.get('/api/employee/profile').subscribe({
      next: (profile) => {
        this.profile = profile;
      },
      error: (error) => {
        this.snackBar.open('Failed to load profile', 'Close', { duration: 3000 });
        console.error('Load profile error:', error);
      }
    });
  }

  loadDocuments(): void {
    this.http.get<Document[]>('/api/employee/profile/documents').subscribe({
      next: (documents) => {
        this.documents = documents;
      },
      error: (error) => {
        console.error('Load documents error:', error);
      }
    });
  }

  uploadDocument(doc: Document): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,.pdf';
    input.onchange = (event: any) => {
      const file = event.target.files[0];
      if (file) {
        this.uploadFile(file, doc.type);
      }
    };
    input.click();
  }

  uploadFile(file: File, type: string): void {
    this.uploading = true;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    this.http.post('/api/employee/profile/documents', formData).subscribe({
      next: () => {
        this.uploading = false;
        this.snackBar.open('Document uploaded successfully', 'Close', { duration: 3000 });
        this.loadDocuments();
      },
      error: (error) => {
        this.uploading = false;
        this.snackBar.open('Failed to upload document', 'Close', { duration: 3000 });
        console.error('Upload document error:', error);
      }
    });
  }

  viewDocument(doc: Document): void {
    if (doc.url) {
      window.open(doc.url, '_blank');
    }
  }

  getDocIcon(type: string): string {
    switch (type) {
      case 'Aadhaar': return 'credit_card';
      case 'PAN': return 'account_balance_wallet';
      case 'Passport': return 'flight';
      default: return 'description';
    }
  }
}
