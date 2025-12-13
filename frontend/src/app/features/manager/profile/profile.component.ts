import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { EmployeeService } from '../../../core/services/employee.service';
import { AuthService } from '../../../core/services/auth.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { UserRole } from '../../../shared/models';

interface Document {
  type: string;
  name: string;
  icon: string;
  iconClass: string;
  uploaded: boolean;
  url?: string;
  data?: string; // Base64 data URL
  mimeType?: string;
  fileName?: string;
  uploadedAt?: Date;
}

@Component({
  selector: 'app-manager-profile',
  standalone: true,
  imports: [
    CommonModule, 
    MatCardModule, 
    MatButtonModule, 
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatSnackBarModule
  ],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ManagerProfileComponent implements OnInit {
  userName: string = '';
  userEmail: string = '';
  userUuid: string | null = null;
  userRole: UserRole | null = null;
  roleDisplay: string = '';
  isLoading: boolean = false;
  isLoadingDocuments: boolean = false;

  documents: Document[] = [
    { type: 'aadhaar', name: 'Aadhaar', icon: 'badge', iconClass: 'aadhaar-icon', uploaded: false },
    { type: 'pan', name: 'PAN Card', icon: 'credit_card', iconClass: 'pan-icon', uploaded: false },
    { type: 'passport', name: 'Passport', icon: 'flight', iconClass: 'passport-icon', uploaded: false }
  ];

  get uploadedDocumentsCount(): number {
    return this.documents.filter(d => d.uploaded).length;
  }

  constructor(
    private employeeService: EmployeeService,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadUserDetails();
    this.loadDocuments();
  }

  loadUserDetails(): void {
    this.userName = this.authService.getUserName() || 'User';
    this.userEmail = this.authService.getUserEmail() || 'N/A';
    this.userUuid = this.authService.getUserUuid();
    this.userRole = this.authService.getRole();
    this.roleDisplay = this.userRole ? this.userRole.replace('_', ' ') : 'N/A';
  }

  loadDocuments(): void {
    this.isLoadingDocuments = true;
    this.employeeService.getProfile().subscribe({
      next: (profile: any) => {
        this.isLoadingDocuments = false;
        
        // Update document status based on profile data
        if (profile.documents && Array.isArray(profile.documents) && profile.documents.length > 0) {
          this.documents.forEach(doc => {
            const uploadedDoc = profile.documents.find((d: any) => d.type === doc.type);
            if (uploadedDoc && (uploadedDoc.data || uploadedDoc.url)) {
              doc.uploaded = true;
              doc.url = uploadedDoc.url;
              doc.data = uploadedDoc.data;
              doc.mimeType = uploadedDoc.mimeType;
              doc.fileName = uploadedDoc.fileName;
              doc.uploadedAt = uploadedDoc.uploadedAt;
            } else {
              doc.uploaded = false;
              doc.url = undefined;
              doc.data = undefined;
              doc.mimeType = undefined;
              doc.fileName = undefined;
            }
          });
        } else {
          this.documents.forEach(doc => {
            doc.uploaded = false;
            doc.url = undefined;
            doc.data = undefined;
            doc.mimeType = undefined;
            doc.fileName = undefined;
          });
        }
      },
      error: (error) => {
        this.isLoadingDocuments = false;
        console.error('Error loading profile:', error);
        this.documents.forEach(doc => {
          doc.uploaded = false;
          doc.url = undefined;
          doc.data = undefined;
          doc.mimeType = undefined;
          doc.fileName = undefined;
        });
        this.snackBar.open('Failed to load documents', 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  uploadDocument(type: string): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,.pdf';
    input.onchange = (event: any) => {
      const file = event.target.files[0];
      if (file) {
        const doc = this.documents.find(d => d.type === type);
        if (!doc) return;
        
        if (file.size > 10 * 1024 * 1024) {
          this.snackBar.open('File size must be less than 10MB', 'Close', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
          return;
        }
        
        this.isLoading = true;
        
        this.employeeService.uploadDocument(type, file).subscribe({
          next: (response: any) => {
            this.isLoading = false;
            doc.uploaded = true;
            doc.url = response.url;
            doc.data = response.data;
            doc.mimeType = response.mimeType;
            doc.fileName = response.fileName;
            
            this.snackBar.open(`${doc.name} uploaded successfully!`, 'Close', {
              duration: 4000,
              panelClass: ['success-snackbar']
            });
            
            setTimeout(() => {
              this.loadDocuments();
            }, 1500);
          },
          error: (error) => {
            this.isLoading = false;
            const errorMessage = error?.error?.message || error?.message || 'Failed to upload document. Please try again.';
            this.snackBar.open(errorMessage, 'Close', {
              duration: 5000,
              panelClass: ['error-snackbar']
            });
          }
        });
      }
    };
    input.click();
  }

  viewDocument(doc: Document): void {
    if (doc.data) {
      const newWindow = window.open();
      if (newWindow) {
        if (doc.mimeType?.startsWith('image/')) {
          newWindow.document.write(`
            <html>
              <head><title>${doc.fileName || doc.name}</title></head>
              <body style="margin:0; padding:20px; background:#f5f5f5; display:flex; justify-content:center; align-items:center; min-height:100vh;">
                <img src="${doc.data}" style="max-width:100%; max-height:100vh; border-radius:8px; box-shadow:0 4px 12px rgba(0,0,0,0.15);" alt="${doc.name}" />
              </body>
            </html>
          `);
        } else if (doc.mimeType === 'application/pdf') {
          newWindow.document.write(`
            <html>
              <head><title>${doc.fileName || doc.name}</title></head>
              <body style="margin:0; padding:0;">
                <embed src="${doc.data}" type="application/pdf" style="width:100%; height:100vh;" />
              </body>
            </html>
          `);
        } else {
          const link = document.createElement('a');
          link.href = doc.data;
          link.download = doc.fileName || doc.name;
          link.target = '_blank';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      }
    } else if (doc.url) {
      window.open(doc.url, '_blank', 'noopener,noreferrer');
    } else {
      this.snackBar.open('Document data not available', 'Close', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
    }
  }

  downloadDocument(doc: Document): void {
    if (doc.data) {
      try {
        const base64Data = doc.data.split(',')[1] || doc.data;
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: doc.mimeType || 'application/octet-stream' });
        
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = doc.fileName || doc.name + '_' + new Date().getTime();
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Error downloading document:', error);
        this.snackBar.open('Failed to download document', 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    } else if (doc.url) {
      const link = document.createElement('a');
      link.href = doc.url;
      link.download = doc.fileName || doc.name + '_' + new Date().getTime();
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      this.snackBar.open('Document data not available', 'Close', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
    }
  }
}

