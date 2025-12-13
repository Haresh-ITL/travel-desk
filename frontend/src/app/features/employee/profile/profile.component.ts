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
  selector: 'app-profile',
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
export class ProfileComponent implements OnInit {
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
    console.log('=== Loading Documents ===');
    // Load user profile to check which documents are uploaded
    this.employeeService.getProfile().subscribe({
      next: (profile: any) => {
        this.isLoadingDocuments = false;
        console.log('=== Profile Response ===');
        console.log('Full profile:', profile);
        console.log('Documents array:', profile.documents);
        console.log('Documents type:', typeof profile.documents);
        console.log('Is array:', Array.isArray(profile.documents));
        console.log('Documents length:', profile.documents?.length || 0);
        
        // Update document status based on profile data
        if (profile.documents && Array.isArray(profile.documents) && profile.documents.length > 0) {
          console.log('Processing', profile.documents.length, 'documents from database');
          this.documents.forEach(doc => {
            const uploadedDoc = profile.documents.find((d: any) => d.type === doc.type);
            if (uploadedDoc && (uploadedDoc.data || uploadedDoc.url)) {
              doc.uploaded = true;
              doc.url = uploadedDoc.url;
              doc.data = uploadedDoc.data; // Base64 data
              doc.mimeType = uploadedDoc.mimeType;
              doc.fileName = uploadedDoc.fileName;
              doc.uploadedAt = uploadedDoc.uploadedAt;
              console.log(`✓ Document ${doc.type} (${doc.name}) is uploaded`);
              console.log(`  Has Base64 Data: ${!!uploadedDoc.data}`);
              console.log(`  MIME Type: ${uploadedDoc.mimeType || 'N/A'}`);
              console.log(`  File Name: ${uploadedDoc.fileName || 'N/A'}`);
              console.log(`  Uploaded At: ${uploadedDoc.uploadedAt || 'N/A'}`);
            } else {
              doc.uploaded = false;
              doc.url = undefined;
              doc.data = undefined;
              doc.mimeType = undefined;
              doc.fileName = undefined;
              console.log(`✗ Document ${doc.type} (${doc.name}) is NOT uploaded`);
            }
          });
        } else {
          // Reset all documents if no documents in profile
          console.log('⚠ No documents found in profile. Resetting all documents.');
          this.documents.forEach(doc => {
            doc.uploaded = false;
            doc.url = undefined;
            doc.data = undefined;
            doc.mimeType = undefined;
            doc.fileName = undefined;
          });
        }
        console.log('=== Documents Loading Complete ===');
      },
      error: (error) => {
        this.isLoadingDocuments = false;
        console.error('=== Error Loading Profile ===');
        console.error('Error:', error);
        console.error('Error message:', error?.message);
        console.error('Error status:', error?.status);
        // Reset documents on error
        this.documents.forEach(doc => {
          doc.uploaded = false;
          doc.url = undefined;
          doc.data = undefined;
          doc.mimeType = undefined;
          doc.fileName = undefined;
        });
        this.snackBar.open('Failed to load documents from database', 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  uploadDocument(type: string): void {
    // Create file input element
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,.pdf';
    input.onchange = (event: any) => {
      const file = event.target.files[0];
      if (file) {
        const doc = this.documents.find(d => d.type === type);
        if (!doc) return;
        
        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          this.snackBar.open('File size must be less than 10MB', 'Close', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
          return;
        }
        
        this.isLoading = true;
        
        console.log('=== Starting Document Upload ===');
        console.log('Document type:', type);
        console.log('File name:', file.name);
        console.log('File size:', file.size, 'bytes');
        console.log('File type:', file.type);
        
        this.employeeService.uploadDocument(type, file).subscribe({
          next: (response: any) => {
            console.log('=== Upload Response ===');
            console.log('Full response:', response);
            console.log('Response keys:', Object.keys(response || {}));
            console.log('Response URL:', response?.url);
            console.log('Response data exists:', !!response?.data);
            console.log('Response data length:', response?.data?.length || 0);
            console.log('Response type:', response?.type);
            console.log('Response mimeType:', response?.mimeType);
            console.log('Response fileName:', response?.fileName);
            
            if (!response) {
              console.error('ERROR: Response is null or undefined!');
              this.snackBar.open('Upload failed: No response from server', 'Close', {
                duration: 5000,
                panelClass: ['error-snackbar']
              });
              this.isLoading = false;
              return;
            }

            if (!response.data) {
              console.warn('WARNING: Response does not contain base64 data!');
              console.warn('Response object:', JSON.stringify(response, null, 2));
              console.warn('This might mean the backend needs to be restarted or there was an error.');
            }

            this.isLoading = false;
            doc.uploaded = true;
            doc.url = response.url;
            doc.data = response.data; // Base64 data
            doc.mimeType = response.mimeType;
            doc.fileName = response.fileName;
            
            console.log('Document state updated. Has data:', !!doc.data);
            console.log('Document state updated with base64 data. Reloading from database...');
            
            this.snackBar.open(`${doc.name} uploaded and saved to database successfully!`, 'Close', {
              duration: 4000,
              panelClass: ['success-snackbar']
            });
            
            // Reload documents from database to ensure persistence
            setTimeout(() => {
              console.log('Reloading documents from database...');
              this.loadDocuments();
            }, 1500);
          },
          error: (error) => {
            this.isLoading = false;
            console.error('=== Upload Error ===');
            console.error('Full error:', error);
            console.error('Error message:', error?.message);
            console.error('Error status:', error?.status);
            console.error('Error body:', error?.error);
            
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
    // Prefer base64 data over URL
    if (doc.data) {
      // Use base64 data to display/view document
      const newWindow = window.open();
      if (newWindow) {
        if (doc.mimeType?.startsWith('image/')) {
          // For images, display directly
          newWindow.document.write(`
            <html>
              <head><title>${doc.fileName || doc.name}</title></head>
              <body style="margin:0; padding:20px; background:#f5f5f5; display:flex; justify-content:center; align-items:center; min-height:100vh;">
                <img src="${doc.data}" style="max-width:100%; max-height:100vh; border-radius:8px; box-shadow:0 4px 12px rgba(0,0,0,0.15);" alt="${doc.name}" />
              </body>
            </html>
          `);
        } else if (doc.mimeType === 'application/pdf') {
          // For PDFs, use embed
          newWindow.document.write(`
            <html>
              <head><title>${doc.fileName || doc.name}</title></head>
              <body style="margin:0; padding:0;">
                <embed src="${doc.data}" type="application/pdf" style="width:100%; height:100vh;" />
              </body>
            </html>
          `);
        } else {
          // For other files, try to open or download
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
      // Fallback to URL if base64 not available
      window.open(doc.url, '_blank', 'noopener,noreferrer');
    } else {
      this.snackBar.open('Document data not available', 'Close', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
    }
  }

  downloadDocument(doc: Document): void {
    // Prefer base64 data over URL
    if (doc.data) {
      // Convert base64 data URL to blob and download
      try {
        // Extract base64 data from data URL
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
      // Fallback to URL download
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
