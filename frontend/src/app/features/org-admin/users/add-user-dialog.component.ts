import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { UserRole } from '../../../shared/models';

@Component({
  selector: 'app-add-user-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule
  ],
  template: `
    <h2 mat-dialog-title>Add New User</h2>
    <mat-dialog-content>
      <form [formGroup]="userForm">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Name</mat-label>
          <input matInput formControlName="name" placeholder="Enter name">
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Email</mat-label>
          <input matInput type="email" formControlName="email" placeholder="Enter email">
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Role</mat-label>
          <mat-select formControlName="roleName">
            <mat-option [value]="UserRole.ORG_ADMIN">Org Admin</mat-option>
            <mat-option [value]="UserRole.EMPLOYEE">Employee</mat-option>
            <mat-option [value]="UserRole.MANAGER">Manager</mat-option>
            <mat-option [value]="UserRole.TRAVEL_DESK_ADMIN">Travel Desk Admin</mat-option>
          </mat-select>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="cancel()">Cancel</button>
      <button mat-raised-button color="primary" (click)="save()" [disabled]="userForm.invalid">Create</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }
  `]
})
export class AddUserDialogComponent {
  userForm: FormGroup;
  UserRole = UserRole;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AddUserDialogComponent>
  ) {
    this.userForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      roleName: ['', Validators.required]
    });
  }

  save(): void {
    if (this.userForm.valid) {
      this.dialogRef.close(this.userForm.value);
    }
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
