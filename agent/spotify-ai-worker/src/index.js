/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import { ChatMemory } from './memory';

export { ChatMemory };

export default {
	async fetch(request, env) {
		const url = new URL(request.url);
		const path = url.pathname;

		// CORS headers
		const corsHeaders = {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type',
		};

		if (request.method === 'OPTIONS') {
			return new Response(null, { headers: corsHeaders });
		}

		// Health check
		if (path === '/health') {
			return new Response(JSON.stringify({ status: 'ok' }), {
				headers: { ...corsHeaders, 'Content-Type': 'application/json' }
			});
		}

		// Chat endpoint
		if (path === '/chat' && request.method === 'POST') {
			try {
				const { userId, message } = await request.json();

				if (!userId || !message) {
					return new Response(JSON.stringify({ error: 'userId and message required' }), {
						status: 400,
						headers: { ...corsHeaders, 'Content-Type': 'application/json' }
					});
				}

				// Fetch user's listening data from Railway
				const listeningDataUrl = `${env.RAILWAY_API_URL}/api/user/${userId}/recent-tracks?limit=20`;
				const listeningResponse = await fetch(listeningDataUrl);

				if (!listeningResponse.ok) {
					throw new Error('Failed to fetch listening data');
				}

				const listeningData = await listeningResponse.json();

				// Get conversation history from Durable Object
				const memoryId = env.CHAT_MEMORY.idFromName(userId);
				const memoryStub = env.CHAT_MEMORY.get(memoryId);
				const historyResponse = await memoryStub.fetch(
					`https://memory/?userId=${userId}`
				);
				const { history } = await historyResponse.json();

				// Build context for AI
				const context = buildContext(listeningData, history);

				// Call Llama via Workers AI
				const aiResponse = await env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
					messages: [
						{
							role: 'system',
							content: context.systemPrompt
						},
						...context.conversationHistory,
						{
							role: 'user',
							content: message
						}
					],
					max_tokens: 512,
					temperature: 0.7
				});

				const assistantMessage = aiResponse.response;

				// Save conversation to memory
				await memoryStub.fetch(`https://memory/?userId=${userId}`, {
					method: 'POST',
					body: JSON.stringify({ role: 'user', content: message })
				});

				await memoryStub.fetch(`https://memory/?userId=${userId}`, {
					method: 'POST',
					body: JSON.stringify({ role: 'assistant', content: assistantMessage })
				});

				return new Response(JSON.stringify({
					response: assistantMessage,
					context: {
						tracksAnalyzed: listeningData.track_count,
						userName: listeningData.user.name
					}
				}), {
					headers: { ...corsHeaders, 'Content-Type': 'application/json' }
				});

			} catch (error) {
				return new Response(JSON.stringify({
					error: error.message
				}), {
					status: 500,
					headers: { ...corsHeaders, 'Content-Type': 'application/json' }
				});
			}
		}

		// Clear conversation history
		if (path === '/clear' && request.method === 'POST') {
			const { userId } = await request.json();
			const memoryId = env.CHAT_MEMORY.idFromName(userId);
			const memoryStub = env.CHAT_MEMORY.get(memoryId);

			await memoryStub.fetch(`https://memory/?userId=${userId}`, {
				method: 'DELETE'
			});

			return new Response(JSON.stringify({ success: true }), {
				headers: { ...corsHeaders, 'Content-Type': 'application/json' }
			});
		}

		return new Response('Not found', { status: 404, headers: corsHeaders });
	}
};

function buildContext(listeningData, conversationHistory) {
	// Format listening data
	const tracksList = listeningData.recent_tracks
		.map((t, i) => `${i + 1}. "${t.track}" by ${t.artist} (${t.played_at})`)
		.join('\n');

	const systemPrompt = `You are a music insight assistant for ${listeningData.user.name}. 
	Here are their ${listeningData.track_count} most recently played tracks:
	${tracksList}
	Provide personalized insights about their listening habits, music taste, and recommendations. Be conversational, insightful, and reference specific tracks they've listened to. Keep responses concise (2-3 paragraphs max).`;

	// Format conversation history for AI
	const formattedHistory = conversationHistory.map(msg => ({
		role: msg.role,
		content: msg.content
	}));

	return {
		systemPrompt,
		conversationHistory: formattedHistory
	};
}
