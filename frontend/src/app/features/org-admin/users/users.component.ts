import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AdminService } from '../../../core/services/admin.service';
import { User, UserRole } from '../../../shared/models';
import { AddUserDialogComponent } from './add-user-dialog.component';
import { AssignManagersDialogComponent } from './assign-managers-dialog.component';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatSidenavModule,
    MatDialogModule,
    MatSnackBarModule
  ],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss']
})
export class UsersComponent implements OnInit {
  users: User[] = [];
  filteredUsers: User[] = [];
  displayedColumns: string[] = ['name', 'email', 'roleName', 'actions'];
  searchText = '';
  selectedUser: User | null = null;
  loading = false;

  constructor(
    private adminService: AdminService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.adminService.getUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.filteredUsers = users;
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.snackBar.open('Failed to load users', 'Close', { duration: 3000 });
      }
    });
  }

  applyFilter(): void {
    const search = this.searchText.toLowerCase();
    this.filteredUsers = this.users.filter(user =>
      user.name.toLowerCase().includes(search) ||
      user.email.toLowerCase().includes(search) ||
      user.roleName.toLowerCase().includes(search)
    );
  }

  selectUser(user: User): void {
    this.selectedUser = user;
  }

  closeDrawer(): void {
    this.selectedUser = null;
  }

  openAddUserDialog(): void {
    const dialogRef = this.dialog.open(AddUserDialogComponent, {
      width: '500px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.adminService.createUser(result).subscribe({
          next: () => {
            this.snackBar.open('User created successfully', 'Close', { duration: 3000 });
            this.loadUsers();
          },
          error: () => {
            this.snackBar.open('Failed to create user', 'Close', { duration: 3000 });
          }
        });
      }
    });
  }

  openAssignManagersDialog(user: User): void {
    const dialogRef = this.dialog.open(AssignManagersDialogComponent, {
      width: '600px',
      data: { user }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.adminService.assignManagers(user.uuid, result).subscribe({
          next: () => {
            this.snackBar.open('Managers assigned successfully', 'Close', { duration: 3000 });
            this.loadUsers();
          },
          error: () => {
            this.snackBar.open('Failed to assign managers', 'Close', { duration: 3000 });
          }
        });
      }
    });
  }

  getRoleColor(role: UserRole): string {
    switch (role) {
      case UserRole.ORG_ADMIN:
        return 'primary';
      case UserRole.EMPLOYEE:
        return 'accent';
      case UserRole.MANAGER:
        return 'warn';
      case UserRole.TRAVEL_DESK_ADMIN:
        return 'primary';
      default:
        return '';
    }
  }

  getRoleDisplay(role: UserRole): string {
    return role.replace('_', ' ');
  }
}
