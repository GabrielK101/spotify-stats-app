export class ChatMemory {
  constructor(state, env) {
    this.state = state;
    this.conversations = {};
  }

  async fetch(request) {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    if (request.method === 'POST') {
      // Add message to conversation history
      const { role, content } = await request.json();
      
      if (!this.conversations[userId]) {
        this.conversations[userId] = [];
      }
      
      this.conversations[userId].push({ role, content, timestamp: Date.now() });
      
      // Keep only last 10 messages
      if (this.conversations[userId].length > 10) {
        this.conversations[userId] = this.conversations[userId].slice(-10);
      }
      
      await this.state.storage.put(`conversation:${userId}`, this.conversations[userId]);
      
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (request.method === 'GET') {
      // Get conversation history
      let history = this.conversations[userId];
      
      if (!history) {
        history = await this.state.storage.get(`conversation:${userId}`) || [];
        this.conversations[userId] = history;
      }
      
      return new Response(JSON.stringify({ history }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (request.method === 'DELETE') {
      // Clear conversation history
      delete this.conversations[userId];
      await this.state.storage.delete(`conversation:${userId}`);
      
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response('Method not allowed', { status: 405 });
  }
}