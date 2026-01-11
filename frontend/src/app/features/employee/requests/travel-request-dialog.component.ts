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
import { MatNativeDateModule, provideNativeDateAdapter } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { TravelType, TransportMode, User } from '../../../shared/models';
import { EmployeeService } from '../../../core/services/employee.service';
import { ManagerService } from '../../../core/services/manager.service';
import { AuthService } from '../../../core/services/auth.service';
import { UserRole } from '../../../shared/models';

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
    MatProgressSpinnerModule,
    MatCheckboxModule,
    MatRadioModule
  ],
  providers: [provideNativeDateAdapter()],
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
  minEndDate: Date | null = null;
  isManager = false;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<TravelRequestDialogComponent>,
    private employeeService: EmployeeService,
    private managerService: ManagerService,
    private authService: AuthService
  ) {
    this.requestForm = this.fb.group({
      from: ['', Validators.required],
      to: ['', Validators.required],
      travelType: ['', Validators.required],
      modeOfTransport: ['', Validators.required],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      purpose: ['', [Validators.required, Validators.minLength(10)]],
      managerId: [''], // Will be conditionally required based on managers availability
      isDisabled: [false],
      disabilityDescription: [''],
      foodPreference: [''],
      specificFoodPreferences: [''],
      localTransportRequired: [false],
      numberOfSeats: [1, [Validators.min(1)]],
      hotelStarRating: [''],
      numberOfRooms: [1, [Validators.required, Validators.min(1)]]
    });
  }

  ngOnInit(): void {
    // Check if user is a manager
    const userRole = this.authService.getRole();
    this.isManager = userRole === UserRole.MANAGER;
    
    // Only load managers if user is not a manager (managers don't need to select a manager)
    if (!this.isManager) {
      this.loadManagers();
    } else {
      // For managers, managerId field is not required
      this.requestForm.get('managerId')?.clearValidators();
      this.requestForm.get('managerId')?.updateValueAndValidity();
    }
    
    // Add custom validator for end date
    this.requestForm.get('endDate')?.setValidators([
      Validators.required,
      this.endDateAfterStartDate.bind(this)
    ]);

    // Update min end date when start date changes
    this.requestForm.get('startDate')?.valueChanges.subscribe((startDate) => {
      if (startDate) {
        this.minEndDate = new Date(startDate);
        this.minEndDate.setDate(this.minEndDate.getDate() + 1);
        this.requestForm.get('endDate')?.updateValueAndValidity();
      } else {
        this.minEndDate = null;
      }
    });

    // Update end date validation when start date changes
    this.requestForm.get('startDate')?.valueChanges.subscribe(() => {
      this.requestForm.get('endDate')?.updateValueAndValidity();
    });
    
    // Make disability description required if isDisabled is true
    this.requestForm.get('isDisabled')?.valueChanges.subscribe((isDisabled) => {
      const disabilityDescControl = this.requestForm.get('disabilityDescription');
      if (isDisabled) {
        disabilityDescControl?.setValidators([Validators.required]);
      } else {
        disabilityDescControl?.clearValidators();
        disabilityDescControl?.setValue('');
      }
      disabilityDescControl?.updateValueAndValidity();
    });
    
    // Make number of seats required if localTransportRequired is true
    this.requestForm.get('localTransportRequired')?.valueChanges.subscribe((required) => {
      const numberOfSeatsControl = this.requestForm.get('numberOfSeats');
      if (required) {
        numberOfSeatsControl?.setValidators([Validators.required, Validators.min(1)]);
      } else {
        numberOfSeatsControl?.clearValidators();
        numberOfSeatsControl?.setValue(1);
      }
      numberOfSeatsControl?.updateValueAndValidity();
    });
    
  }

  loadManagers(): void {
    this.employeeService.getMappedManagers().subscribe({
      next: (managers) => {
        this.managers = managers;
        // If managers exist, make managerId required
        if (managers.length > 0) {
          this.requestForm.get('managerId')?.setValidators([Validators.required]);
        } else {
          // If no managers, make managerId optional
          this.requestForm.get('managerId')?.clearValidators();
        }
        this.requestForm.get('managerId')?.updateValueAndValidity();
        // Force form to re-check validity
        this.requestForm.updateValueAndValidity();
      },
      error: () => {
        // If error loading managers, make managerId optional
        this.requestForm.get('managerId')?.clearValidators();
        this.requestForm.get('managerId')?.updateValueAndValidity();
        // Force form to re-check validity
        this.requestForm.updateValueAndValidity();
      }
    });
  }

  endDateAfterStartDate(control: any): { [key: string]: boolean } | null {
    const startDate = this.requestForm?.get('startDate')?.value;
    const endDate = control.value;
    
    if (!startDate || !endDate) {
      return null; // Let required validator handle empty values
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Reset time to compare dates only
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    
    if (end < start) {
      return { endDateBeforeStart: true };
    }
    return null;
  }

  onTravelTypeChange(): void {
    // Travel type changed - no action needed as documents come from profile
  }

  save(): void {
    // Mark all fields as touched to show validation errors
    Object.keys(this.requestForm.controls).forEach(key => {
      this.requestForm.get(key)?.markAsTouched();
    });

    if (this.requestForm.invalid) {
      console.log('Form is invalid:', this.getFormValidationErrors());
      return;
    }

    this.isLoading = true;

    // Create FormData (backend expects multipart/form-data, but no files needed - documents come from profile)
    const formData = new FormData();
    formData.append('from', this.requestForm.get('from')?.value || '');
    formData.append('to', this.requestForm.get('to')?.value || '');
    formData.append('travelType', this.requestForm.get('travelType')?.value || '');
    formData.append('modeOfTransport', this.requestForm.get('modeOfTransport')?.value || '');
    
    const startDate = this.requestForm.get('startDate')?.value;
    const endDate = this.requestForm.get('endDate')?.value;
    
    if (startDate) {
      formData.append('startDate', new Date(startDate).toISOString());
    }
    if (endDate) {
      formData.append('endDate', new Date(endDate).toISOString());
    }
    
    formData.append('purpose', this.requestForm.get('purpose')?.value || '');
    formData.append('managerId', this.requestForm.get('managerId')?.value || '');
    formData.append('isDisabled', this.requestForm.get('isDisabled')?.value ? 'true' : 'false');
    formData.append('disabilityDescription', this.requestForm.get('disabilityDescription')?.value || '');
    formData.append('foodPreference', this.requestForm.get('foodPreference')?.value || '');
    formData.append('specificFoodPreferences', this.requestForm.get('specificFoodPreferences')?.value || '');
    formData.append('localTransportRequired', this.requestForm.get('localTransportRequired')?.value ? 'true' : 'false');
    formData.append('numberOfSeats', this.requestForm.get('numberOfSeats')?.value?.toString() || '1');
    formData.append('hotelStarRating', this.requestForm.get('hotelStarRating')?.value || '');
    formData.append('numberOfRooms', this.requestForm.get('numberOfRooms')?.value?.toString() || '1');
    // No files appended - documents will be automatically retrieved from profile

    // Use appropriate service based on user role
    const userRole = this.authService.getRole();
    const service = userRole === UserRole.MANAGER 
      ? this.managerService.createRequest(formData)
      : this.employeeService.createTravelRequest(formData);

    service.subscribe({
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

  getFormValidationErrors(): any {
    const errors: any = {};
    Object.keys(this.requestForm.controls).forEach(key => {
      const controlErrors = this.requestForm.get(key)?.errors;
      if (controlErrors) {
        errors[key] = controlErrors;
      }
    });
    return errors;
  }

  isFormValid(): boolean {
    // Force validation update
    this.requestForm.updateValueAndValidity();
    
    // Check if form is valid
    return this.requestForm.valid;
  }

  cancel(): void {
    this.dialogRef.close();
  }
}

