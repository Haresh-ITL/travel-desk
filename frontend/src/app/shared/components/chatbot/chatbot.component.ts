import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ChatbotService, ChatMessage } from '../../../core/services/chatbot.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatCardModule,
    MatTooltipModule
  ],
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.scss']
})
export class ChatbotComponent implements OnInit, OnDestroy {
  @ViewChild('messagesContainer', { static: false }) messagesContainer!: ElementRef;
  @ViewChild('messageInput', { static: false }) messageInput!: ElementRef;

  isOpen = false;
  messages: ChatMessage[] = [];
  currentMessage = '';
  isLoading = false;
  private destroy$ = new Subject<void>();

  constructor(private chatbotService: ChatbotService) {}

  ngOnInit(): void {
    // Add welcome message
    this.messages.push({
      role: 'assistant',
      content: 'Hello! I\'m your Travel Desk assistant. I can help you with questions about travel requests, approvals, bookings, documents, and more. How can I assist you today?',
      timestamp: new Date().toISOString()
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleChat(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      // Focus input after animation
      setTimeout(() => {
        this.messageInput?.nativeElement?.focus();
      }, 300);
    }
  }

  sendMessage(): void {
    if (!this.currentMessage.trim() || this.isLoading) {
      return;
    }

    const userMessage = this.currentMessage.trim();
    this.currentMessage = '';

    // Add user message
    this.messages.push({
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString()
    });

    this.isLoading = true;
    this.scrollToBottom();

    // Get conversation history (last 10 messages for context)
    const conversationHistory = this.messages.slice(-10);

    this.chatbotService.sendMessage(userMessage, conversationHistory)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.messages.push({
            role: 'assistant',
            content: response.response,
            timestamp: response.timestamp
          });
          this.isLoading = false;
          this.scrollToBottom();
        },
        error: (error) => {
          console.error('Chatbot error:', error);
          this.messages.push({
            role: 'assistant',
            content: 'Sorry, I encountered an error. Please try again later.',
            timestamp: new Date().toISOString()
          });
          this.isLoading = false;
          this.scrollToBottom();
        }
      });
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      if (this.messagesContainer) {
        const element = this.messagesContainer.nativeElement;
        element.scrollTop = element.scrollHeight;
      }
    }, 100);
  }

  formatTimestamp(timestamp?: string): string {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}

