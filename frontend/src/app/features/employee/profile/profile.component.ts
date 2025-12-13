import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
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
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule, 
    MatCardModule, 
    MatButtonModule, 
    MatIconModule,
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

  documents: Document[] = [
    { type: 'aadhaar', name: 'Aadhaar', icon: 'badge', iconClass: 'aadhaar-icon', uploaded: false },
    { type: 'pan', name: 'PAN Card', icon: 'credit_card', iconClass: 'pan-icon', uploaded: false },
    { type: 'passport', name: 'Passport', icon: 'flight', iconClass: 'passport-icon', uploaded: false }
  ];

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
    // Load user profile to check which documents are uploaded
    this.employeeService.getProfile().subscribe({
      next: (profile: any) => {
        // Update document status based on profile data
        // Assuming profile has document URLs or status
        if (profile.documents) {
          this.documents.forEach(doc => {
            const uploadedDoc = profile.documents.find((d: any) => d.type === doc.type);
            if (uploadedDoc) {
              doc.uploaded = true;
              doc.url = uploadedDoc.url;
            }
          });
        }
      },
      error: (error) => {
        console.error('Error loading profile:', error);
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
        this.employeeService.uploadDocument(type, file).subscribe({
          next: (response) => {
            const doc = this.documents.find(d => d.type === type);
            if (doc) {
              doc.uploaded = true;
              doc.url = response.url;
            }
            this.snackBar.open(`${doc?.name} uploaded successfully`, 'Close', {
              duration: 3000,
              panelClass: ['success-snackbar']
            });
          },
          error: (error) => {
            this.snackBar.open('Failed to upload document', 'Close', {
              duration: 3000,
              panelClass: ['error-snackbar']
            });
          }
        });
      }
    };
    input.click();
  }

  viewDocument(doc: Document): void {
    if (doc.url) {
      // Open document in new window
      window.open(doc.url, '_blank');
    } else {
      this.snackBar.open('Document URL not available', 'Close', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
    }
  }
}
