import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ManagerService } from '../../../core/services/manager.service';
import { TravelRequest, RequestStatus, ManagerDecision, TransportMode } from '../../../shared/models';

@Component({
  selector: 'app-approvals',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatTableModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSidenavModule,
    MatSnackBarModule,
    MatTooltipModule
  ],
  templateUrl: './approvals.component.html',
  styleUrls: ['./approvals.component.scss']
})
export class ApprovalsComponent implements OnInit, AfterViewInit {
  @ViewChild(MatSort) sort!: MatSort;
  
  requests: TravelRequest[] = [];
  dataSource = new MatTableDataSource<TravelRequest>([]);
  displayedColumns: string[] = ['employeeName', 'from', 'to', 'modeOfTransport', 'travelType', 'startDate', 'endDate', 'status', 'actions'];
  selectedRequest: TravelRequest | null = null;
  comment = '';
  searchText = '';
  selectedStatus: RequestStatus | 'ALL' = 'ALL';
  RequestStatus = RequestStatus;
  TransportMode = TransportMode;
  
  // Status counts
  statusCounts = {
    PENDING: 0,
    APPROVED: 0,
    BOOKED: 0,
    REJECTED: 0,
    TOTAL: 0
  };

  constructor(
    private managerService: ManagerService,
    private snackBar: MatSnackBar,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Check for filter query parameter
    this.route.queryParams.subscribe(params => {
      if (params['filter'] === 'pending') {
        this.selectedStatus = RequestStatus.PENDING;
      }
      this.loadRequests();
    });
  }

  ngAfterViewInit(): void {
    if (this.sort) {
      this.dataSource.sort = this.sort;
      // Custom sort for date columns
      this.dataSource.sortingDataAccessor = (item, property) => {
        switch (property) {
          case 'startDate':
          case 'endDate':
            return new Date(item[property as keyof TravelRequest] as Date).getTime();
          default:
            return item[property as keyof TravelRequest] as string;
        }
      };
    }
  }

  loadRequests(): void {
    // Get employee requests (where manager is the primary manager)
    this.managerService.getTeamRequests().subscribe({
      next: (requests) => {
        this.requests = requests || [];
        this.calculateStatusCounts();
        this.applyFilters();
      },
      error: (error) => {
        console.error('Error loading team requests:', error);
        this.requests = [];
        this.calculateStatusCounts();
        this.applyFilters();
        this.snackBar.open('Failed to load requests', 'Close', { duration: 3000 });
      }
    });
  }

  calculateStatusCounts(): void {
    this.statusCounts = {
      PENDING: this.requests.filter(r => r.status === RequestStatus.PENDING).length,
      APPROVED: this.requests.filter(r => r.status === RequestStatus.APPROVED).length,
      BOOKED: this.requests.filter(r => r.status === RequestStatus.BOOKED).length,
      REJECTED: this.requests.filter(r => r.status === RequestStatus.REJECTED).length,
      TOTAL: this.requests.length
    };
  }

  applyFilter(): void {
    this.applyFilters();
  }

  applyFilters(): void {
    let filtered = [...this.requests];
    
    // Apply status filter
    if (this.selectedStatus !== 'ALL') {
      filtered = filtered.filter(req => req.status === this.selectedStatus);
    }
    
    // Apply search filter
    if (this.searchText) {
      const search = this.searchText.toLowerCase();
      filtered = filtered.filter(req =>
        req.employeeName?.toLowerCase().includes(search) ||
        req.from.toLowerCase().includes(search) ||
        req.to.toLowerCase().includes(search) ||
        req.status.toLowerCase().includes(search)
      );
    }
    
    this.dataSource.data = filtered;
  }

  filterByStatus(status: RequestStatus | 'ALL'): void {
    this.selectedStatus = status;
    // Update URL query params
    const queryParams: any = {};
    if (status === RequestStatus.PENDING) {
      queryParams.filter = 'pending';
    } else if (status !== 'ALL') {
      queryParams.filter = status.toLowerCase();
    }
    // Remove filter param if ALL is selected
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: status === 'ALL' ? {} : queryParams,
      queryParamsHandling: 'merge'
    });
    this.applyFilters();
  }

  selectRequest(request: TravelRequest): void {
    this.selectedRequest = request;
    this.comment = '';
  }

  closeDrawer(): void {
    this.selectedRequest = null;
    this.comment = '';
  }

  approve(): void {
    if (!this.selectedRequest) return;

    const decision: ManagerDecision = {
      status: RequestStatus.APPROVED,
      comment: this.comment
    };

    this.managerService.makeDecision(this.selectedRequest.uuid, decision).subscribe({
      next: (updatedRequest) => {
        // Update the request in the local array
        const index = this.requests.findIndex(r => r.uuid === this.selectedRequest!.uuid);
        if (index !== -1) {
          this.requests[index].status = RequestStatus.APPROVED;
          this.requests[index].managerComment = this.comment;
        }
        this.snackBar.open('Request approved successfully', 'Close', { duration: 3000 });
        this.calculateStatusCounts();
        this.applyFilters();
        this.closeDrawer();
      },
      error: (error) => {
        console.error('Error approving request:', error);
        this.snackBar.open('Failed to approve request', 'Close', { duration: 3000 });
      }
    });
  }

  reject(): void {
    if (!this.selectedRequest) return;

    const decision: ManagerDecision = {
      status: RequestStatus.REJECTED,
      comment: this.comment
    };

    this.managerService.makeDecision(this.selectedRequest.uuid, decision).subscribe({
      next: (updatedRequest) => {
        // Update the request in the local array
        const index = this.requests.findIndex(r => r.uuid === this.selectedRequest!.uuid);
        if (index !== -1) {
          this.requests[index].status = RequestStatus.REJECTED;
          this.requests[index].managerComment = this.comment;
        }
        this.snackBar.open('Request rejected', 'Close', { duration: 3000 });
        this.calculateStatusCounts();
        this.applyFilters();
        this.closeDrawer();
      },
      error: (error) => {
        console.error('Error rejecting request:', error);
        this.snackBar.open('Failed to reject request', 'Close', { duration: 3000 });
      }
    });
  }

  getStatusChipClass(status: RequestStatus): string {
    switch (status) {
      case RequestStatus.PENDING:
        return 'status-chip-pending';
      case RequestStatus.APPROVED:
        return 'status-chip-approved';
      case RequestStatus.BOOKED:
        return 'status-chip-booked';
      case RequestStatus.REJECTED:
        return 'status-chip-rejected';
      default:
        return '';
    }
  }

  getTransportIcon(mode?: TransportMode): string {
    if (!mode) return 'flight';
    switch (mode) {
      case TransportMode.FLIGHT:
        return 'flight';
      case TransportMode.TRAIN:
        return 'train';
      case TransportMode.BUS:
        return 'directions_bus';
      default:
        return 'flight';
    }
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString();
  }

  isTrue(value: any): boolean {
    return value === true || String(value) === 'true';
  }

  hasPreferences(request: TravelRequest): boolean {
    if (!request) return false;
    // Check if any preference field is defined (more lenient check)
    const hasAnyPreference = 
      request.isDisabled !== undefined ||
      request.disabilityDescription !== undefined ||
      request.foodPreference !== undefined ||
      request.specificFoodPreferences !== undefined ||
      request.localTransportRequired !== undefined ||
      request.driverPhoneNumber !== undefined ||
      request.carModel !== undefined ||
      request.carColor !== undefined ||
      request.numberPlate !== undefined ||
      request.hotelStarRating !== undefined ||
      request.numberOfRooms !== undefined;
    
    if (!hasAnyPreference) return false;
    
    // Now check if any has a meaningful value
    const hasHotelPref = request.hotelStarRating && 
                         String(request.hotelStarRating).trim() && 
                         String(request.hotelStarRating).trim() !== 'No Preference';
    const isDisabled = request.isDisabled === true || String(request.isDisabled) === 'true';
    const localTransportReq = request.localTransportRequired === true || String(request.localTransportRequired) === 'true';
    return !!(
      isDisabled ||
      (request.disabilityDescription && String(request.disabilityDescription).trim()) ||
      request.foodPreference ||
      (request.specificFoodPreferences && String(request.specificFoodPreferences).trim()) ||
      localTransportReq ||
      (request.driverPhoneNumber && String(request.driverPhoneNumber).trim()) ||
      (request.carModel && String(request.carModel).trim()) ||
      (request.carColor && String(request.carColor).trim()) ||
      (request.numberPlate && String(request.numberPlate).trim()) ||
      hasHotelPref ||
      (request.numberOfRooms !== undefined && request.numberOfRooms !== null && Number(request.numberOfRooms) > 0)
    );
  }
}
