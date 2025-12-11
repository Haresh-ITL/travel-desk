import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { AdminService } from '../../../core/services/admin.service';
import { User } from '../../../shared/models';

@Component({
  selector: 'app-assign-managers-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatCheckboxModule,
    MatButtonModule,
    MatListModule
  ],
  template: `
    <h2 mat-dialog-title>Assign Managers to {{ data.user.name }}</h2>
    <mat-dialog-content>
      <mat-selection-list [(ngModel)]="selectedManagers">
        <mat-list-option *ngFor="let manager of managers" [value]="manager.uuid">
          {{ manager.name }} ({{ manager.email }})
        </mat-list-option>
      </mat-selection-list>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="cancel()">Cancel</button>
      <button mat-raised-button color="primary" (click)="save()">Assign</button>
    </mat-dialog-actions>
  `,
  styles: [`
    mat-dialog-content {
      min-height: 300px;
      max-height: 500px;
    }
  `]
})
export class AssignManagersDialogComponent implements OnInit {
  managers: User[] = [];
  selectedManagers: string[] = [];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { user: User },
    private dialogRef: MatDialogRef<AssignManagersDialogComponent>,
    private adminService: AdminService
  ) {}

  ngOnInit(): void {
    this.adminService.getManagers().subscribe(managers => {
      this.managers = managers;
    });
  }

  save(): void {
    this.dialogRef.close(this.selectedManagers);
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
