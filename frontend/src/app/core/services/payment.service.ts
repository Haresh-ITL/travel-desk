import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { loadStripe, Stripe, StripeElements, StripeCardElement } from '@stripe/stripe-js';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private apiUrl = `${environment.apiUrl}/payments`;
  private stripePromise: Promise<Stripe | null>;
  private readonly stripePublishableKey = 'pk_test_51234567890'; // Replace with actual test key

  constructor(private http: HttpClient) {
    this.stripePromise = loadStripe(this.stripePublishableKey);
  }

  createPaymentIntent(amount: number): Observable<{ clientSecret: string }> {
    return this.http.post<{ clientSecret: string }>(`${this.apiUrl}/create-intent`, { amount });
  }

  async getStripe(): Promise<Stripe | null> {
    return this.stripePromise;
  }
}
