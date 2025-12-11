import { Component, OnInit, ViewChild, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatChipListbox, MatChipsModule } from '@angular/material/chips';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDrawer, MatSidenavModule } from '@angular/material/sidenav';
import { HttpClient } from '@angular/common/http';
import { User, CreateUserRequest, AssignManagersRequest } from '../../../shared/models/user';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSelectModule,
    MatChipsModule,
    ReactiveFormsModule,
    MatSnackBarModule,
    MatSidenavModule
  ],
  template: `
    <div class="users-container">
      <div class="header">
        <h1>Users</h1>
        <div class="filters">
          <mat-form-field>
            <mat-label>Search</mat-label>
            <input matInput (keyup)="applyFilter($event)" placeholder="Name or email">
          </mat-form-field>
          <mat-form-field>
            <mat-label>Role</mat-label>
            <mat-select (selectionChange)="applyRoleFilter($event)">
              <mat-option value="">All</mat-option>
              <mat-option value="EMPLOYEE">Employee</mat-option>
              <mat-option value="MANAGER">Manager</mat-option>
              <mat-option value="TRAVEL_DESK_ADMIN">Travel Desk Admin</mat-option>
            </mat-select>
          </mat-form-field>
          <button mat-raised-button color="primary" (click)="openCreateUserDialog()">
            <mat-icon>add</mat-icon>
            Add User
          </button>
        </div>
      </div>

      <mat-table [dataSource]="dataSource" matSort>
        <ng-container matColumnDef="name">
          <mat-header-cell *matHeaderCellDef mat-sort-header>Name</mat-header-cell>
          <mat-cell *matCellDef="let user">{{ user.name }}</mat-cell>
        </ng-container>

        <ng-container matColumnDef="email">
          <mat-header-cell *matHeaderCellDef mat-sort-header>Email</mat-header-cell>
          <mat-cell *matCellDef="let user">{{ user.email }}</mat-cell>
        </ng-container>

        <ng-container matColumnDef="role">
          <mat-header-cell *matHeaderCellDef mat-sort-header>Role</mat-header-cell>
          <mat-cell *matCellDef="let user">
            <mat-chip [color]="getRoleColor(user.role)" selected>{{ getRoleDisplay(user.role) }}</mat-chip>
          </mat-cell>
        </ng-container>

        <ng-container matColumnDef="managers">
          <mat-header-cell *matHeaderCellDef>Manager Count</mat-header-cell>
          <mat-cell *matCellDef="let user">{{ user.managers?.length || 0 }}</mat-cell>
        </ng-container>

        <ng-container matColumnDef="status">
          <mat-header-cell *matHeaderCellDef>Status</mat-header-cell>
          <mat-cell *matCellDef="let user">
            <mat-chip [color]="user.status === 'ACTIVE' ? 'primary' : 'warn'" selected>{{ user.status }}</mat-chip>
          </mat-cell>
        </ng-container>

        <ng-container matColumnDef="actions">
          <mat-header-cell *matHeaderCellDef>Actions</mat-header-cell>
          <mat-cell *matCellDef="let user">
            <button mat-icon-button (click)="openUserDetails(user)">
              <mat-icon>edit</mat-icon>
            </button>
            <button mat-icon-button *ngIf="user.role === 'EMPLOYEE'" (click)="openAssignManagersDialog(user)">
              <mat-icon>group_add</mat-icon>
            </button>
          </mat-cell>
        </ng-container>

        <mat-header-row *matHeaderRowDef="displayedColumns"></mat-header-row>
        <mat-row *matRowDef="let row; columns: displayedColumns;" (click)="openUserDetails(row)"></mat-row>
      </mat-table>

      <mat-paginator [pageSizeOptions]="[5, 10, 20]" showFirstLastButtons></mat-paginator>

      <mat-drawer #drawer mode="side" position="end" [opened]="drawerOpened">
        <div class="drawer-content" *ngIf="selectedUser">
          <h2>{{ selectedUser.name }}</h2>
          <p><strong>Email:</strong> {{ selectedUser.email }}</p>
          <p><strong>Role:</strong> {{ getRoleDisplay(selectedUser.role) }}</p>
          <p><strong>Status:</strong> {{ selectedUser.status }}</p>
          <div *ngIf="selectedUser.role === 'EMPLOYEE' && selectedUser.managers">
            <h3>Managers</h3>
            <mat-chip-listbox>
              <mat-chip *ngFor="let manager of selectedUser.managers">{{ manager }}</mat-chip>
            </mat-chip-listbox>
          </div>
          <div class="drawer-actions">
            <button mat-button (click)="editUser(selectedUser)">Edit User</button>
            <button mat-button *ngIf="selectedUser.role === 'EMPLOYEE'" (click)="openAssignManagersDialog(selectedUser)">Assign Managers</button>
          </div>
        </div>
      </mat-drawer>
    </div>
  `,
  styles: [`
    .users-container {
      padding: 20px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    .filters {
      display: flex;
      gap: 16px;
      align-items: center;
    }
    .drawer-content {
      padding: 20px;
      width: 300px;
    }
    .drawer-actions {
      margin-top: 20px;
      display: flex;
      gap: 10px;
    }
  `]
})
export class UsersComponent implements OnInit {
  displayedColumns: string[] = ['name', 'email', 'role', 'managers', 'status', 'actions'];
  dataSource = new MatTableDataSource<User>();
  drawerOpened = false;
  selectedUser: User | null = null;
  users: User[] = [];
  managers: User[] = [];

  createUserForm: FormGroup;
  assignManagersForm: FormGroup;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('drawer') drawer!: MatDrawer;

  constructor(
    private http: HttpClient,
    private dialog: MatDialog,
    private fb: FormBuilder,
    private snackBar: MatSnackBar
  ) {
    this.createUserForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      role: ['', Validators.required]
    });

    this.assignManagersForm = this.fb.group({
      managerUuids: [[]]
    });
  }

  ngOnInit(): void {
    this.loadUsers();
    this.loadManagers();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadUsers(): void {
    this.http.get<User[]>('/api/admin/users').subscribe({
      next: (users) => {
        this.users = users;
        this.dataSource.data = users;
      },
      error: (error) => {
        this.snackBar.open('Failed to load users', 'Close', { duration: 3000 });
        console.error('Load users error:', error);
      }
    });
  }

  loadManagers(): void {
    this.http.get<User[]>('/api/admin/users?role=MANAGER').subscribe({
      next: (managers) => {
        this.managers = managers;
      },
      error: (error) => {
        console.error('Load managers error:', error);
      }
    });
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  applyRoleFilter(event: any): void {
    const role = event.value;
    if (role) {
      this.dataSource.filter = role;
    } else {
      this.dataSource.filter = '';
    }
  }

  openCreateUserDialog(): void {
    // Implementation for create user dialog
    const dialogRef = this.dialog.open(CreateUserDialogComponent, {
      width: '400px',
      data: { form: this.createUserForm }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.createUser(result);
      }
    });
  }

  createUser(userData: CreateUserRequest): void {
    this.http.post('/api/admin/users', userData).subscribe({
      next: () => {
        this.snackBar.open('User created successfully', 'Close', { duration: 3000 });
        this.loadUsers();
      },
      error: (error) => {
        this.snackBar.open('Failed to create user', 'Close', { duration: 3000 });
        console.error('Create user error:', error);
      }
    });
  }

  openUserDetails(user: User): void {
    this.selectedUser = user;
    this.drawerOpened = true;
  }

  editUser(user: User): void {
    // Implementation for edit user
    this.snackBar.open('Edit user functionality not implemented yet', 'Close', { duration: 3000 });
  }

  openAssignManagersDialog(user: User): void {
    const dialogRef = this.dialog.open(AssignManagersDialogComponent, {
      width: '400px',
      data: { user, managers: this.managers, form: this.assignManagersForm }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.assignManagers(user.uuid, result.managerUuids);
      }
    });
  }

  assignManagers(userUuid: string, managerUuids: string[]): void {
    this.http.put(`/api/admin/users/${userUuid}/managers`, { managerUuids }).subscribe({
      next: () => {
        this.snackBar.open('Managers assigned successfully', 'Close', { duration: 3000 });
        this.loadUsers();
      },
      error: (error) => {
        this.snackBar.open('Failed to assign managers', 'Close', { duration: 3000 });
        console.error('Assign managers error:', error);
      }
    });
  }

  getRoleDisplay(role: string): string {
    switch (role) {
      case 'ORG_ADMIN': return 'Org Admin';
      case 'EMPLOYEE': return 'Employee';
      case 'MANAGER': return 'Manager';
      case 'TRAVEL_DESK_ADMIN': return 'Travel Desk Admin';
      default: return role;
    }
  }

  getRoleColor(role: string): string {
    switch (role) {
      case 'ORG_ADMIN': return 'accent';
      case 'EMPLOYEE': return 'primary';
      case 'MANAGER': return 'warn';
      case 'TRAVEL_DESK_ADMIN': return 'primary';
      default: return 'basic';
    }
  }
}

// Dialog components would be separate files, but for brevity, I'll define them here
@Component({
  selector: 'app-create-user-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatSelectModule, ReactiveFormsModule],
  template: `
    <h2 mat-dialog-title>Create New User</h2>
    <mat-dialog-content>
      <form [formGroup]="data.form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Name</mat-label>
          <input matInput formControlName="name" required>
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Email</mat-label>
          <input matInput formControlName="email" type="email" required>
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Role</mat-label>
          <mat-select formControlName="role" required>
            <mat-option value="EMPLOYEE">Employee</mat-option>
            <mat-option value="MANAGER">Manager</mat-option>
            <mat-option value="TRAVEL_DESK_ADMIN">Travel Desk Admin</mat-option>
          </mat-select>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" [mat-dialog-close]="data.form.value" [disabled]="data.form.invalid">Create</button>
    </mat-dialog-actions>
  `,
  styles: [`.full-width { width: 100%; margin-bottom: 16px; }`]
})
export class CreateUserDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {}
}

@Component({
  selector: 'app-assign-managers-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatFormFieldModule, MatSelectModule, MatButtonModule, MatChipsModule, ReactiveFormsModule],
  template: `
    <h2 mat-dialog-title>Assign Managers to {{ data.user.name }}</h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Managers</mat-label>
        <mat-select formControlName="managerUuids" multiple>
          <mat-option *ngFor="let manager of data.managers" [value]="manager.uuid">{{ manager.name }}</mat-option>
        </mat-select>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" [mat-dialog-close]="data.form.value">Assign</button>
    </mat-dialog-actions>
  `,
  styles: [`.full-width { width: 100%; }`]
})
export class AssignManagersDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {}
}
