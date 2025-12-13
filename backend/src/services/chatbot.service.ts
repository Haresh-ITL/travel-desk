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
    // Build messages array with proper alternation
    // Perplexity format: [system?, user, assistant, user, assistant, ...]
    const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
      {
        role: "system",
        content: APPLICATION_CONTEXT,
      },
    ];

    // Filter and clean conversation history
    const validHistory = conversationHistory
      .filter(msg => msg.role === "user" || msg.role === "assistant")
      .map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      }));

    // Build alternating sequence starting with user
    // After system, first message MUST be user, then alternate
    let expectedRole: "user" | "assistant" = "user";
    
    for (const msg of validHistory) {
      // Skip if role doesn't match expected alternation
      if (msg.role !== expectedRole) {
        // If we expected user but got assistant, skip it (we'll add user next)
        // If we expected assistant but got user, we can use it but need to adjust
        if (expectedRole === "assistant" && msg.role === "user") {
          // This breaks alternation - skip this message
          continue;
        }
        // If we expected user but got assistant, skip and keep expecting user
        continue;
      }
      
      // Add message and switch expected role
      messages.push(msg);
      expectedRole = expectedRole === "user" ? "assistant" : "user";
    }

    // Ensure we end with user message (the current one)
    // If last message in history was assistant, we can add user
    // If last message was user, we'll replace it with current user message
    if (messages.length > 1) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === "user") {
        // Replace last user message with current one
        messages[messages.length - 1] = {
          role: "user",
          content: userMessage,
        };
      } else {
        // Last was assistant, add current user message
        messages.push({
          role: "user",
          content: userMessage,
        });
      }
    } else {
      // Only system message, add user message
      messages.push({
        role: "user",
        content: userMessage,
      });
    }

    // Debug: log message structure
    const roles = messages.map(m => m.role);
    console.log("Final message roles:", roles.join(" -> "));

    return messages;
  }

  // Valid Perplexity API models (as of 2024)
  private readonly VALID_PERPLEXITY_MODELS = [
    "sonar-pro", // Recommended for Pro accounts - verified working
    "sonar",
    "sonar-reasoning",
    "llama-3.1-sonar-large-128k-online",
    "llama-3.1-sonar-huge-128k-online",
    "llama-3.1-sonar-small-128k-online",
    "sonar-small-online",
    "sonar-medium-online",
    "sonar-large-online",
    "llama-3.1-sonar-large-32k-online",
    "llama-3.1-sonar-small-32k-online"
  ];

  private async getPerplexityResponse(messages: Array<{ role: string; content: string }>): Promise<string> {
    if (!env.perplexityApiKey) {
      throw new Error("Perplexity API key not configured");
    }

    // Perplexity API endpoint
    const url = "https://api.perplexity.ai/chat/completions";

    // Messages are already properly formatted by buildMessages
    // Just convert to the format Perplexity expects
    const perplexityMessages = messages.map(msg => ({
      role: msg.role,
      content: msg.content,
    })) as Array<{ role: "system" | "user" | "assistant"; content: string }>;
    
    // Debug logging - show message structure
    const roles = perplexityMessages.map(m => m.role);
    console.log("Sending to Perplexity - Message roles:", roles.join(" -> "));
    
    // Final validation before sending
    const rolesAfterSystem = roles.filter(r => r !== "system");
    if (rolesAfterSystem.length === 0) {
      throw new Error("No messages after system message");
    }
    
    // Ensure first message after system is user
    if (rolesAfterSystem[0] !== "user") {
      console.error(`ERROR: First message after system is '${rolesAfterSystem[0]}', must be 'user'`);
      throw new Error(`Invalid message format: first message after system must be 'user'`);
    }
    
    // Ensure proper alternation
    for (let i = 1; i < rolesAfterSystem.length; i++) {
      if (rolesAfterSystem[i] === rolesAfterSystem[i - 1]) {
        console.error(`ERROR: Found consecutive '${rolesAfterSystem[i]}' messages`);
        throw new Error(`Invalid message alternation: consecutive '${rolesAfterSystem[i]}' messages`);
      }
    }

    // Get model name and validate it's a valid Perplexity model
    let modelName = (env.perplexityModel || "sonar-pro").trim();
    
    // Validate model name is in the list of valid models
    if (!this.VALID_PERPLEXITY_MODELS.includes(modelName)) {
      console.warn(`Invalid Perplexity model name: "${modelName}"`);
      console.warn(`Valid models are: ${this.VALID_PERPLEXITY_MODELS.join(", ")}`);
      console.warn(`Using default model: sonar-pro`);
      modelName = "sonar-pro";
    }
    
    console.log(`Using Perplexity model: ${modelName}`);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.perplexityApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelName,
        messages: perplexityMessages,
        temperature: 0.2, // Match working example
        max_tokens: 512, // Match working example
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `Perplexity API error: ${response.status} - ${errorText}`;
      
      // Provide helpful error message for invalid model
      if (response.status === 400 && errorText.includes("Invalid model")) {
        errorMessage += `\nValid Perplexity models: ${this.VALID_PERPLEXITY_MODELS.join(", ")}`;
        errorMessage += `\nPlease update PERPLEXITY_MODEL in your .env file with a valid model name.`;
      }
      
      throw new Error(errorMessage);
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
