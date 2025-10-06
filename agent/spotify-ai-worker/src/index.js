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

		const corsHeaders = {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type',
		};

		if (request.method === 'OPTIONS') {
			return new Response(null, { headers: corsHeaders });
		}

		if (path === '/health') {
			return new Response(JSON.stringify({ status: 'ok' }), {
				headers: { ...corsHeaders, 'Content-Type': 'application/json' }
			});
		}

		if (path === '/chat' && request.method === 'POST') {
			try {
				const { userId, message, userData } = await request.json();

				if (!userId || !message) {
					return new Response(JSON.stringify({ error: 'userId and message required' }), {
						status: 400,
						headers: { ...corsHeaders, 'Content-Type': 'application/json' }
					});
				}

				// Get conversation history
				const memoryId = env.CHAT_MEMORY.idFromName(userId);
				const memoryStub = env.CHAT_MEMORY.get(memoryId);
				const historyResponse = await memoryStub.fetch(
					`https://memory/?userId=${userId}`
				);
				const { history } = await historyResponse.json();

				// Analyze what data we need based on the message
				const dataNeeds = analyzeMessageForData(message);
				
				// Fetch required data
				let musicData = {};
				if (dataNeeds.length > 0) {
					console.log('Fetching data:', dataNeeds);
					
					try {
						// Fetch complete data and extract what we need
						const response = await fetch(`${env.RAILWAY_API_URL}/api/user/${userId}/complete-data`);
						if (response.ok) {
							const completeData = await response.json();
							
							if (dataNeeds.includes('recent_tracks')) {
								musicData.recent_tracks = completeData.recent_tracks?.slice(0, 20) || [];
							}
							if (dataNeeds.includes('top_artists')) {
								musicData.top_artists = completeData.top_artists?.slice(0, 10) || [];
							}
							if (dataNeeds.includes('top_albums')) {
								musicData.top_albums = completeData.top_albums?.slice(0, 8) || [];
							}
							if (dataNeeds.includes('listening_stats')) {
								musicData.listening_stats = completeData.listening_stats || {};
							}
						}
					} catch (error) {
						console.error('Failed to fetch music data:', error);
					}
				}

				// Build context and messages
				const userName = userData?.display_name || 'user';
				const context = buildContextWithData(userName, musicData);
				
				const messages = [
					{ role: 'system', content: context },
					...history.map(h => ({ role: h.role, content: h.content || '' })),
					{ role: 'user', content: message }
				];

				// Call AI
				const response = await callAIWithTools(env, messages, userId);
				const finalMessage = response.response || response.content || "I'm here to help with your music insights! What would you like to know?";

				// Save to memory
				await memoryStub.fetch(`https://memory/?userId=${userId}`, {
					method: 'POST',
					body: JSON.stringify({ role: 'user', content: message })
				});

				await memoryStub.fetch(`https://memory/?userId=${userId}`, {
					method: 'POST',
					body: JSON.stringify({ role: 'assistant', content: finalMessage })
				});

				return new Response(JSON.stringify({
					response: finalMessage,
					context: { 
						userId,
						dataFetched: Object.keys(musicData),
						tracksAnalyzed: musicData.recent_tracks?.length || 0
					}
				}), {
					headers: { ...corsHeaders, 'Content-Type': 'application/json' }
				});

			} catch (error) {
				console.error('Chat error:', error);
				return new Response(JSON.stringify({
					error: error.message
				}), {
					status: 500,
					headers: { ...corsHeaders, 'Content-Type': 'application/json' }
				});
			}
		}

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

function buildContextWithData(userName, musicData) {
	let dataSection = '';
	
	// Add available data to context
	if (musicData.recent_tracks?.length > 0) {
		const tracks = musicData.recent_tracks.slice(0, 15);
		const tracksList = tracks
			.map((t, i) => `${i + 1}. *"${t.track}"* by **${t.artist}** (${t.played_at})`)
			.join('\n');
		dataSection += `\n🎵 **Recent Tracks**:\n${tracksList}\n`;
	}
	
	if (musicData.top_artists?.length > 0) {
		const artists = musicData.top_artists.slice(0, 10);
		const artistsList = artists
			.map((a, i) => `${i + 1}. **${a.name}** (${a.play_count} plays)`)
			.join('\n');
		dataSection += `\n🎤 **Top Artists**:\n${artistsList}\n`;
	}
	
	if (musicData.top_albums?.length > 0) {
		const albums = musicData.top_albums.slice(0, 8);
		const albumsList = albums
			.map((a, i) => `${i + 1}. ${a.album_artist} (${a.play_count} plays)`)
			.join('\n');
		dataSection += `\n💿 **Top Albums**:\n${albumsList}\n`;
	}
	
	if (musicData.listening_stats) {
		const stats = musicData.listening_stats;
		dataSection += `\n📊 **Listening Statistics**:\n`;
		
		if (stats.week) {
			dataSection += `**This Week:** ${stats.week.total_minutes} minutes, ${stats.week.total_tracks} tracks\n`;
		}
		if (stats.month) {
			dataSection += `**This Month:** ${stats.month.total_minutes} minutes, ${stats.month.total_tracks} tracks\n`;
		}
		if (stats.all_time) {
			dataSection += `**All Time:** ${stats.all_time.total_minutes} minutes, ${stats.all_time.unique_artists} unique artists\n`;
		}
	}

	return `You are a personalized music insight assistant chatting with **${userName}**.

${dataSection}

**Guidelines**:
- Be conversational and engaging (under 150 words)
- Use **bold** for artists/albums, *italic* for tracks
- Add relevant music emojis naturally
- Reference the specific data above when relevant
- Provide insights and patterns from their listening habits

**Boundaries**:
- ONLY discuss music topics
- If asked non-music questions: "I'm here for your music insights! Ask me about your listening habits."

Be helpful and insightful about their music taste!`;
}

function analyzeMessageForData(message) {
	const lowerMessage = message.toLowerCase();
	const dataNeeds = [];

	// Check what data to fetch based on keywords
	if (lowerMessage.includes('recent') || lowerMessage.includes('lately') || 
		lowerMessage.includes('listened to') || lowerMessage.includes('what') ||
		lowerMessage.includes('last') || lowerMessage.includes('current')) {
		dataNeeds.push('recent_tracks');
	}

	if (lowerMessage.includes('top artist') || lowerMessage.includes('favorite artist') || 
		lowerMessage.includes('most played') || lowerMessage.includes('artist')) {
		dataNeeds.push('top_artists');
	}

	if (lowerMessage.includes('album') || lowerMessage.includes('top album')) {
		dataNeeds.push('top_albums');
	}

	if (lowerMessage.includes('how much') || lowerMessage.includes('minutes') || 
		lowerMessage.includes('hours') || lowerMessage.includes('stats') || 
		lowerMessage.includes('time') || lowerMessage.includes('listening')) {
		dataNeeds.push('listening_stats');
	}

	// For greetings or general questions, don't fetch data
	if (lowerMessage.match(/^(hi|hello|hey|sup|what's up|how are you)$/)) {
		return [];
	}

	// Default: if we're not sure, get recent tracks
	if (dataNeeds.length === 0 && lowerMessage.length > 10) {
		dataNeeds.push('recent_tracks');
	}

	return [...new Set(dataNeeds)]; // Remove duplicates
}

async function callAIWithTools(env, messages, userId) {
	// Clean messages to ensure no null content
	const cleanMessages = messages.map(msg => ({
		...msg,
		content: msg.content || ''
	}));

	try {
		// For Cloudflare Workers AI, use the chat format without tools first
		return await env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
			messages: cleanMessages,
			max_tokens: 512,
			temperature: 0.7
		});
	} catch (error) {
		console.error('AI call failed:', error);
		// If that fails, try with a simple prompt format
		const lastMessage = cleanMessages[cleanMessages.length - 1];
		const systemMessage = cleanMessages.find(m => m.role === 'system');
		
		const prompt = `${systemMessage?.content || ''}\n\nUser: ${lastMessage?.content || ''}\nAssistant:`;
		
		return await env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
			prompt: prompt,
			max_tokens: 512,
			temperature: 0.7
		});
	}
}

async function executeToolCall(toolCall, railwayApiUrl, userId) {
	const { name, arguments: args } = toolCall;
	const params = typeof args === 'string' ? JSON.parse(args) : args;

	try {
		switch (name) {
			case 'get_recent_tracks': {
				const limit = Math.min(params.limit || 50, 200);
				const response = await fetch(
					`${railwayApiUrl}/api/user/${userId}/history?limit=${limit}`
				);
				const data = await response.json();
				return {
					tracks: data.tracks.map(t => ({
						track: t.track_name,
						artist: t.artist_name,
						album: t.album_name,
						played_at: t.played_at
					}))
				};
			}

			case 'get_top_artists': {
				const limit = params.limit || 20;
				const response = await fetch(
					`${railwayApiUrl}/api/user/${userId}/complete-data`
				);
				const data = await response.json();
				return {
					artists: data.top_artists.slice(0, limit)
				};
			}

			case 'get_top_albums': {
				const limit = params.limit || 15;
				const response = await fetch(
					`${railwayApiUrl}/api/user/${userId}/complete-data`
				);
				const data = await response.json();
				return {
					albums: data.top_albums.slice(0, limit)
				};
			}

			case 'get_listening_stats': {
				const response = await fetch(
					`${railwayApiUrl}/api/user/${userId}/complete-data`
				);
				const data = await response.json();
				
				if (params.timeframe === 'all') {
					return { stats: data.listening_stats };
				} else {
					return { 
						stats: { 
							[params.timeframe]: data.listening_stats[params.timeframe] 
						}
					};
				}
			}

			case 'search_listening_history': {
				const limit = params.limit || 20;
				const query = params.query.toLowerCase();
				
				// Get more data for searching
				const response = await fetch(
					`${railwayApiUrl}/api/user/${userId}/history?limit=500`
				);
				const data = await response.json();
				
				// Search in tracks
				const matches = data.tracks.filter(t => 
					t.track_name.toLowerCase().includes(query) ||
					t.artist_name.toLowerCase().includes(query)
				).slice(0, limit);

				return {
					query: params.query,
					matches: matches.map(t => ({
						track: t.track_name,
						artist: t.artist_name,
						album: t.album_name,
						played_at: t.played_at
					})),
					count: matches.length
				};
			}

			default:
				return { error: 'Unknown tool' };
		}
	} catch (error) {
		console.error(`Tool ${name} error:`, error);
		return { error: error.message };
	}
}