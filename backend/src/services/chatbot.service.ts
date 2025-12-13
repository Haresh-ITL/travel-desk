import { env } from "../config/env";

// Application context for the chatbot
const APPLICATION_CONTEXT = `
You are a helpful assistant for a Corporate Travel Desk Management System. This application helps organizations manage employee travel requests, approvals, and bookings.

## Application Features:

### User Roles:
1. **ORG_ADMIN**: Organization administrator who can manage users, assign roles, and map managers to employees
2. **EMPLOYEE**: Can create travel requests, manage profile, upload documents (Aadhaar, PAN, Passport), and view request status
3. **MANAGER**: Can review and approve/reject employee travel requests with comments
4. **TRAVEL_DESK_ADMIN**: Can process approved requests, create bookings (flights, hotels, cabs), process payments via Stripe, and generate itineraries

### Key Features:
- **Travel Requests**: Employees can create travel requests with details like destination, dates, purpose, etc.
- **Approvals**: Managers review and approve/reject requests with comments
- **Bookings**: Travel desk admins create bookings for approved requests including flight, hotel, and cab details
- **Payments**: Integrated with Stripe for payment processing
- **Documents**: Employees can upload travel documents (Aadhaar, PAN, Passport)
- **Itineraries**: Travel desk admins can create and preview travel itineraries
- **Dashboard**: Role-specific dashboards showing relevant statistics

### Common Questions You Can Answer:
- How to create a travel request
- How to approve/reject requests
- How to upload documents
- How to process bookings
- How to view itineraries
- Role-specific features and permissions
- Payment processing
- Navigation and UI features

Always provide helpful, accurate information about the application. If asked about something outside the application scope, politely redirect to application-related topics.
`;

export class ChatbotService {
  async getResponse(userMessage: string, conversationHistory: Array<{ role: string; content: string }> = []): Promise<string> {
    // Build messages array with system context
    const messages = this.buildMessages(userMessage, conversationHistory);

    try {
      // Use Perplexity if API key is configured, otherwise fallback
      if (env.perplexityApiKey) {
        return await this.getPerplexityResponse(messages);
      } else {
        return this.getFallbackResponse(userMessage);
      }
    } catch (error: any) {
      console.error("Perplexity API error:", error);
      return this.getFallbackResponse(userMessage);
    }
  }

  private buildMessages(userMessage: string, conversationHistory: Array<{ role: string; content: string }>) {
    return [
      {
        role: "system" as const,
        content: APPLICATION_CONTEXT,
      },
      ...conversationHistory.map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })),
      {
        role: "user" as const,
        content: userMessage,
      },
    ];
  }

  private async getPerplexityResponse(messages: Array<{ role: string; content: string }>): Promise<string> {
    if (!env.perplexityApiKey) {
      throw new Error("Perplexity API key not configured");
    }

    // Perplexity API endpoint
    const url = "https://api.perplexity.ai/chat/completions";

    // Convert messages to Perplexity format (they use OpenAI-compatible format)
    const perplexityMessages = messages.map(msg => ({
      role: msg.role === "system" ? "system" : msg.role,
      content: msg.content,
    }));

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.perplexityApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: env.perplexityModel || "llama-3.1-sonar-large-128k-online",
        messages: perplexityMessages,
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Perplexity API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "I'm sorry, I couldn't generate a response. Please try again.";
  }

  private getFallbackResponse(userMessage: string): string {
    const lowerMessage = userMessage.toLowerCase();

    // Simple keyword-based responses as fallback
    if (lowerMessage.includes("travel request") || lowerMessage.includes("create request")) {
      return "To create a travel request, go to the 'Requests' section in the employee menu. Fill in the travel details including destination, dates, purpose, and submit the request. Your manager will review and approve it.";
    }

    if (lowerMessage.includes("approve") || lowerMessage.includes("approval")) {
      return "Managers can approve or reject travel requests in the 'Approvals' section. You'll see all pending requests from your employees. Click on a request to review details and add your decision with comments.";
    }

    if (lowerMessage.includes("booking") || lowerMessage.includes("book")) {
      return "Travel Desk Admins can create bookings for approved requests. Go to the 'Bookings' section, select an approved request, and enter flight, hotel, and cab details. You can also process payments and generate itineraries.";
    }

    if (lowerMessage.includes("document") || lowerMessage.includes("upload")) {
      return "Employees can upload travel documents (Aadhaar, PAN, Passport) in the 'Profile' section. Click on the document type you want to upload and select the file.";
    }

    if (lowerMessage.includes("role") || lowerMessage.includes("permission")) {
      return "The application has four roles: Org Admin (user management), Employee (create requests), Manager (approve requests), and Travel Desk Admin (create bookings). Each role has specific permissions and features.";
    }

    if (lowerMessage.includes("payment") || lowerMessage.includes("stripe")) {
      return "Payments are processed through Stripe integration. Travel Desk Admins can process payments when creating bookings. The system uses Stripe's secure payment processing.";
    }

    if (lowerMessage.includes("dashboard")) {
      return "Each role has a customized dashboard showing relevant statistics. Employees see their travel statistics, managers see approval statistics, and travel desk admins see booking statistics.";
    }

    if (lowerMessage.includes("help") || lowerMessage.includes("how")) {
      return "I can help you with questions about the Travel Desk application! Ask me about creating requests, approvals, bookings, uploading documents, roles, payments, or any other feature. What would you like to know?";
    }

    return "I'm here to help with questions about the Travel Desk application. You can ask me about travel requests, approvals, bookings, documents, roles, payments, or any other feature. How can I assist you?";
  }
}
