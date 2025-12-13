import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
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

  constructor(
    private chatbotService: ChatbotService,
    private sanitizer: DomSanitizer
  ) {}

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

  formatMessage(content: string): SafeHtml {
    // Convert markdown-like formatting to HTML for better readability
    let formatted = content;

    // Step 1: Process lists first (before escaping)
    const lines = formatted.split('\n');
    const processedLines: string[] = [];
    let inList = false;
    let currentParagraph: string[] = [];

    const flushParagraph = () => {
      if (currentParagraph.length > 0) {
        const paraText = currentParagraph.join(' ').trim();
        if (paraText) {
          processedLines.push(paraText);
        }
        currentParagraph = [];
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (!line) {
        flushParagraph();
        if (inList) {
          processedLines.push('</ul>');
          inList = false;
        }
        continue;
      }

      const bulletMatch = line.match(/^[-•]\s+(.+)$/);
      const numberedMatch = line.match(/^\d+\.\s+(.+)$/);

      if (bulletMatch || numberedMatch) {
        flushParagraph();
        if (!inList) {
          processedLines.push('<ul>');
          inList = true;
        }
        const content = bulletMatch ? bulletMatch[1] : numberedMatch![1];
        processedLines.push(`<li>${content}</li>`);
      } else {
        if (inList) {
          processedLines.push('</ul>');
          inList = false;
        }
        currentParagraph.push(line);
      }
    }

    flushParagraph();
    if (inList) {
      processedLines.push('</ul>');
    }

    formatted = processedLines.join('\n');

    // Step 2: Save HTML tags we want to keep
    const htmlTagPlaceholder = '___HTMLTAG___';
    const htmlTags: string[] = [];
    formatted = formatted.replace(/<(ul|li|p|strong|em|a|br)([^>]*)>/gi, (match) => {
      const index = htmlTags.length;
      htmlTags.push(match);
      return `${htmlTagPlaceholder}${index}${htmlTagPlaceholder}`;
    });
    formatted = formatted.replace(/<\/(ul|li|p|strong|em|a|br)>/gi, (match) => {
      const index = htmlTags.length;
      htmlTags.push(match);
      return `${htmlTagPlaceholder}${index}${htmlTagPlaceholder}`;
    });

    // Step 3: Convert **bold** to placeholders
    const boldPlaceholder = '___BOLD___';
    const boldMatches: string[] = [];
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, (match, text) => {
      const index = boldMatches.length;
      boldMatches.push(text);
      return `${boldPlaceholder}${index}${boldPlaceholder}`;
    });

    // Step 4: Escape HTML
    formatted = formatted
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Step 5: Restore HTML tags
    htmlTags.forEach((tag, index) => {
      formatted = formatted.replace(`${htmlTagPlaceholder}${index}${htmlTagPlaceholder}`, tag);
    });

    // Step 6: Restore bold tags
    boldMatches.forEach((text, index) => {
      const escapedText = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      formatted = formatted.replace(
        `${boldPlaceholder}${index}${boldPlaceholder}`,
        `<strong>${escapedText}</strong>`
      );
    });

    // Step 7: Wrap non-list content in paragraphs
    const finalLines = formatted.split('\n');
    const finalOutput: string[] = [];
    let currentPara: string[] = [];

    for (const line of finalLines) {
      if (line.includes('<ul>') || line.includes('<li>') || line.includes('</ul>')) {
        if (currentPara.length > 0) {
          finalOutput.push(`<p>${currentPara.join(' ')}</p>`);
          currentPara = [];
        }
        finalOutput.push(line);
      } else if (line.trim()) {
        currentPara.push(line);
      } else {
        if (currentPara.length > 0) {
          finalOutput.push(`<p>${currentPara.join(' ')}</p>`);
          currentPara = [];
        }
      }
    }
    if (currentPara.length > 0) {
      finalOutput.push(`<p>${currentPara.join(' ')}</p>`);
    }

    formatted = finalOutput.join('\n');

    // Step 8: Convert URLs to links
    const urlRegex = /(https?:\/\/[^\s<>"']+)/g;
    formatted = formatted.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer" style="color: inherit; text-decoration: underline; opacity: 0.9;">$1</a>');

    // Clean up
    formatted = formatted.replace(/<p>\s*<\/p>/g, '');
    formatted = formatted.replace(/\n{3,}/g, '\n\n');

    return this.sanitizer.bypassSecurityTrustHtml(formatted);
  }
}
