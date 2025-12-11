import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TravelDeskService } from '../../../core/services/travel-desk.service';
import { PaymentService } from '../../../core/services/payment.service';
import { TravelRequest, BookingDetails } from '../../../shared/models';

@Component({
  selector: 'app-bookings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatTabsModule,
    MatSnackBarModule
  ],
  templateUrl: './bookings.component.html',
  styleUrls: ['./bookings.component.scss']
})
export class BookingsComponent implements OnInit {
  approvedRequests: TravelRequest[] = [];
  selectedRequest: TravelRequest | null = null;
  displayedColumns: string[] = ['employeeName', 'from', 'to', 'startDate', 'endDate'];

  // Booking form data
  booking: BookingDetails = {
    requestUuid: ''
  };

  constructor(
    private travelDeskService: TravelDeskService,
    private paymentService: PaymentService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadApprovedRequests();
  }

  loadApprovedRequests(): void {
    this.travelDeskService.getApprovedRequests().subscribe({
      next: (requests) => {
        this.approvedRequests = requests;
        if (requests.length > 0) {
          this.selectRequest(requests[0]);
        }
      },
      error: () => {
        this.snackBar.open('Failed to load approved requests', 'Close', { duration: 3000 });
      }
    });
  }

  selectRequest(request: TravelRequest): void {
    this.selectedRequest = request;
    this.booking = {
      requestUuid: request.uuid
    };
  }

  async processPayment(): Promise<void> {
    if (!this.booking.hotelAmount) {
      this.snackBar.open('Please enter hotel amount', 'Close', { duration: 3000 });
      return;
    }

    try {
      const stripe = await this.paymentService.getStripe();
      if (!stripe) {
        this.snackBar.open('Stripe not loaded', 'Close', { duration: 3000 });
        return;
      }

      // Create payment intent
      this.paymentService.createPaymentIntent(this.booking.hotelAmount * 100).subscribe({
        next: async (response) => {
          // In a real app, you would use Stripe Elements here
          // For now, just simulate success
          this.snackBar.open('Payment processed successfully (Test Mode)', 'Close', { duration: 3000 });
        },
        error: () => {
          this.snackBar.open('Payment failed', 'Close', { duration: 3000 });
        }
      });
    } catch (error) {
      this.snackBar.open('Payment error', 'Close', { duration: 3000 });
    }
  }

  saveBooking(): void {
    if (!this.selectedRequest) return;

    this.travelDeskService.createBooking(this.booking).subscribe({
      next: () => {
        this.snackBar.open('Booking saved successfully', 'Close', { duration: 3000 });
        this.loadApprovedRequests();
      },
      error: () => {
        this.snackBar.open('Failed to save booking', 'Close', { duration: 3000 });
      }
    });
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString();
  }
}
