import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TravelType, TransportMode, User } from '../../../shared/models';
import { EmployeeService } from '../../../core/services/employee.service';

@Component({
  selector: 'app-travel-request-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './travel-request-dialog.component.html',
  styleUrls: ['./travel-request-dialog.component.scss']
})
export class TravelRequestDialogComponent implements OnInit {
  requestForm: FormGroup;
  managers: User[] = [];
  TravelType = TravelType;
  TransportMode = TransportMode;
  isLoading = false;
  minDate = new Date();

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<TravelRequestDialogComponent>,
    private employeeService: EmployeeService
  ) {
    this.requestForm = this.fb.group({
      from: ['', Validators.required],
      to: ['', Validators.required],
      travelType: ['', Validators.required],
      modeOfTransport: ['', Validators.required],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      purpose: ['', [Validators.required, Validators.minLength(10)]],
      managerId: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadManagers();
    
    // Add custom validator for end date
    this.requestForm.get('endDate')?.setValidators([
      Validators.required,
      this.endDateAfterStartDate.bind(this)
    ]);
  }

  loadManagers(): void {
    this.employeeService.getMappedManagers().subscribe({
      next: (managers) => {
        this.managers = managers;
      },
      error: () => {
        // If no managers, make managerId optional
        this.requestForm.get('managerId')?.clearValidators();
        this.requestForm.get('managerId')?.updateValueAndValidity();
      }
    });
  }

  endDateAfterStartDate(control: any): { [key: string]: boolean } | null {
    const startDate = this.requestForm?.get('startDate')?.value;
    const endDate = control.value;
    
    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      return { endDateBeforeStart: true };
    }
    return null;
  }

  onTravelTypeChange(): void {
    // Travel type changed - no action needed as documents come from profile
  }

  save(): void {
    if (this.requestForm.invalid) {
      this.requestForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;

    // Create FormData (backend expects multipart/form-data, but no files needed - documents come from profile)
    const formData = new FormData();
    formData.append('from', this.requestForm.get('from')?.value);
    formData.append('to', this.requestForm.get('to')?.value);
    formData.append('travelType', this.requestForm.get('travelType')?.value);
    formData.append('modeOfTransport', this.requestForm.get('modeOfTransport')?.value);
    formData.append('startDate', new Date(this.requestForm.get('startDate')?.value).toISOString());
    formData.append('endDate', new Date(this.requestForm.get('endDate')?.value).toISOString());
    formData.append('purpose', this.requestForm.get('purpose')?.value);
    formData.append('managerId', this.requestForm.get('managerId')?.value || '');
    // No files appended - documents will be automatically retrieved from profile

    this.employeeService.createTravelRequest(formData).subscribe({
      next: (request) => {
        this.isLoading = false;
        this.dialogRef.close(request);
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error creating request:', error);
        alert('Failed to create travel request. Please try again.');
      }
    });
  }

  cancel(): void {
    this.dialogRef.close();
  }
}

