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
				const { userId, message, userData } = await request.json();

				if (!userId || !message) {
					return new Response(JSON.stringify({ error: 'userId and message required' }), {
						status: 400,
						headers: { ...corsHeaders, 'Content-Type': 'application/json' }
					});
				}

				// Fetch all user's music data from Railway
				const completeDataUrl = `${env.RAILWAY_API_URL}/api/user/${userId}/complete-data`;
				const musicDataResponse = await fetch(completeDataUrl);

				if (!musicDataResponse.ok) {
					throw new Error('Failed to fetch user music data');
				}

				const musicData = await musicDataResponse.json();

				// Get conversation history from Durable Object
				const memoryId = env.CHAT_MEMORY.idFromName(userId);
				const memoryStub = env.CHAT_MEMORY.get(memoryId);
				const historyResponse = await memoryStub.fetch(
					`https://memory/?userId=${userId}`
				);
				const { history } = await historyResponse.json();

				// Build context for AI
				const context = buildContext(musicData, history, userData, message);

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
						tracksAnalyzed: musicData.recent_tracks?.length || 0,
						userId: userId,
						totalTracksInHistory: musicData.user?.total_tracks_in_history || 0
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

function buildContext(musicData, conversationHistory, userData = {}, userMessage = '') {
	const userName = userData.display_name || musicData.user?.name || 'user';
	
	// Build comprehensive data sections
	let dataSection = '';
	
	// Recent tracks
	if (musicData.recent_tracks?.length > 0) {
		const tracks = musicData.recent_tracks.slice(0, 20); // Show top 20 for context
		const tracksList = tracks
			.map((t, i) => `${i + 1}. *"${t.track}"* by **${t.artist}** (${t.played_at})`)
			.join('\n');
		dataSection += `\n🎵 **Recent Tracks** (${musicData.recent_tracks.length} total):\n${tracksList}\n`;
	}
	
	// Top artists
	if (musicData.top_artists?.length > 0) {
		const artists = musicData.top_artists.slice(0, 10);
		const artistsList = artists
			.map((a, i) => `${i + 1}. **${a.name}** (${a.play_count} plays)`)
			.join('\n');
		dataSection += `\n🎤 **Top Artists**:\n${artistsList}\n`;
	}
	
	// Top albums
	if (musicData.top_albums?.length > 0) {
		const albums = musicData.top_albums.slice(0, 8);
		const albumsList = albums
			.map((a, i) => `${i + 1}. ${a.album_artist} (${a.play_count} plays)`)
			.join('\n');
		dataSection += `\n💿 **Top Albums**:\n${albumsList}\n`;
	}
	
	// Listening statistics
	if (musicData.listening_stats) {
		const stats = musicData.listening_stats;
		dataSection += `\n📊 **Listening Statistics**:\n`;
		
		if (stats.week) {
			dataSection += `**This Week:**\n`;
			dataSection += `- ${stats.week.total_minutes} minutes (${stats.week.avg_daily_minutes}/day)\n`;
			dataSection += `- ${stats.week.total_tracks} tracks, ${stats.week.unique_artists} unique artists\n`;
		}
		
		if (stats.month) {
			dataSection += `**This Month:**\n`;
			dataSection += `- ${stats.month.total_minutes} minutes (${stats.month.avg_daily_minutes}/day)\n`;
			dataSection += `- ${stats.month.total_tracks} tracks, ${stats.month.unique_artists} unique artists\n`;
		}
		
		if (stats.all_time) {
			dataSection += `**All Time:**\n`;
			dataSection += `- ${stats.all_time.total_minutes} total minutes\n`;
			dataSection += `- ${stats.all_time.total_tracks} tracks, ${stats.all_time.unique_artists} unique artists\n`;
			dataSection += `- Artist variety score: ${stats.all_time.artist_variety_score} (0-1 scale)\n`;
		}
	}

	const systemPrompt = `You are a personalized music insight assistant chatting with **${userName}**. You have access to their complete music listening data and should use it to provide deep, personalized insights.
		${dataSection}
		
		🎯 **Your Role**: Provide insightful, engaging analysis of their listening habits. Look for patterns, trends, and unique preferences. Address them by name to make it personal. Reference specific tracks and artists naturally to illustrate insights.
		
		✨ **Guidelines**:
		- **Keep responses concise** (under 150 words) - like texting a music-savvy friend
		- **Use markdown formatting**: **Bold** for artists/albums, *Italic* for tracks, bullet points for lists
		- **Add relevant music emojis** but don't overuse them (🎵🎤💿📊🎸🎹🥁🎺)
		- **Be conversational and insightful** - reveal patterns they might not have noticed
		- **Offer personalized recommendations** based on their actual listening data
		- **Reference specific data** - mention play counts, time periods, or trends you see
		
		🚫 **Important Boundaries**:
		- ONLY discuss music, artists, songs, albums, genres, listening habits, and music recommendations
		- If asked about non-music topics, politely redirect: "I'm here for your music insights! Ask me about your listening habits or let me recommend tracks based on your taste."
		
		Remember: You have their complete listening history, so use specific data points to make your insights meaningful and personal!`;

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
