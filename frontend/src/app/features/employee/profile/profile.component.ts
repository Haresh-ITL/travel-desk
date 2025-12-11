import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule],
  template: `
    <div class="profile-container">
      <h1>My Profile</h1>
      <mat-card>
        <h3><mat-icon>description</mat-icon> Documents & KYC</h3>
        <div class="documents-grid">
          <mat-card class="document-card">
            <mat-icon>badge</mat-icon>
            <h4>Aadhaar</h4>
            <p>Not uploaded</p>
            <button mat-raised-button color="primary">Upload</button>
          </mat-card>
          <mat-card class="document-card">
            <mat-icon>credit_card</mat-icon>
            <h4>PAN Card</h4>
            <p>Not uploaded</p>
            <button mat-raised-button color="primary">Upload</button>
          </mat-card>
          <mat-card class="document-card">
            <mat-icon>flight</mat-icon>
            <h4>Passport</h4>
            <p>Not uploaded</p>
            <button mat-raised-button color="primary">Upload</button>
          </mat-card>
        </div>
      </mat-card>
    </div>
  `,
  styles: [`
    .profile-container {
      max-width: 1200px;
      margin: 0 auto;
      h1 { margin: 0 0 24px; font-size: 28px; font-weight: 600; }
      h3 { display: flex; align-items: center; gap: 8px; margin: 0 0 20px; }
    }
    .documents-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
    }
    .document-card {
      text-align: center;
      padding: 24px;
      mat-icon { font-size: 48px; width: 48px; height: 48px; color: #667eea; margin-bottom: 12px; }
      h4 { margin: 0 0 8px; font-size: 18px; }
      p { margin: 0 0 16px; color: #718096; }
    }
  `]
})
export class ProfileComponent {}
