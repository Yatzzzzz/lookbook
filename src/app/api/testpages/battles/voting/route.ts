import { NextResponse } from 'next/server';

type VoteType = 'battle' | 'rating' | 'yay_nay';

interface VoteRequest {
  lookId: string;
  battleId: string;
  userId?: string;  // Optional if anonymous voting is allowed
  voteType: VoteType;
  value: number | boolean; // number for rating (1-5), boolean for yay/nay
}

interface VoteStats {
  totalVotes: number;
  averageRating?: number;
  yayPercentage?: number;
  winningLookId?: string;
}

// Mock database of votes
const mockVotes: Record<string, any[]> = {
  'battle1': [],
  'battle2': [],
  'battle3': [],
  'battle4': [],
}

// Mock battle data 
const mockBattles: Record<string, { lookIdA: string; lookIdB: string }> = {
  'battle1': { lookIdA: 'look1', lookIdB: 'look2' },
  'battle2': { lookIdA: 'look3', lookIdB: 'look4' },
  'battle3': { lookIdA: 'look5', lookIdB: 'look1' },
  'battle4': { lookIdA: 'look2', lookIdB: 'look3' },
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { lookId, battleId, userId = 'anonymous', voteType, value } = body as VoteRequest;
    
    // Validate required fields
    if (!lookId || !battleId || !voteType) {
      return NextResponse.json(
        { error: "lookId, battleId, and voteType are required" },
        { status: 400 }
      );
    }
    
    // Validate voteType
    if (!['battle', 'rating', 'yay_nay'].includes(voteType)) {
      return NextResponse.json(
        { error: "voteType must be one of: battle, rating, yay_nay" },
        { status: 400 }
      );
    }
    
    // Validate value based on voteType
    if (voteType === 'rating' && (typeof value !== 'number' || value < 1 || value > 5)) {
      return NextResponse.json(
        { error: "For rating votes, value must be a number between 1 and 5" },
        { status: 400 }
      );
    } else if (voteType === 'yay_nay' && typeof value !== 'boolean') {
      return NextResponse.json(
        { error: "For yay_nay votes, value must be a boolean" },
        { status: 400 }
      );
    }
    
    // Check if battle exists
    if (!mockBattles[battleId]) {
      return NextResponse.json(
        { error: "Battle not found" },
        { status: 404 }
      );
    }
    
    // Check if lookId is part of the battle
    const battle = mockBattles[battleId];
    if (battle.lookIdA !== lookId && battle.lookIdB !== lookId) {
      return NextResponse.json(
        { error: "Look is not part of this battle" },
        { status: 400 }
      );
    }
    
    // Initialize votes array for this battle if it doesn't exist
    if (!mockVotes[battleId]) {
      mockVotes[battleId] = [];
    }
    
    // Create vote object
    const vote = {
      lookId,
      battleId,
      userId,
      voteType,
      value,
      timestamp: new Date().toISOString()
    };
    
    // Check if user has already voted in this battle
    const existingVoteIndex = mockVotes[battleId].findIndex(
      v => v.userId === userId && v.voteType === voteType
    );
    
    if (existingVoteIndex >= 0) {
      // Update existing vote
      mockVotes[battleId][existingVoteIndex] = vote;
    } else {
      // Add new vote
      mockVotes[battleId].push(vote);
    }
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Calculate vote statistics based on voteType
    const stats: VoteStats = {
      totalVotes: mockVotes[battleId].length
    };
    
    if (voteType === 'rating') {
      // Calculate average rating for this look
      const lookVotes = mockVotes[battleId].filter(
        v => v.lookId === lookId && v.voteType === 'rating'
      );
      const sum = lookVotes.reduce((acc, vote) => acc + (vote.value as number), 0);
      stats.averageRating = lookVotes.length > 0 ? Number((sum / lookVotes.length).toFixed(1)) : 0;
    } else if (voteType === 'yay_nay') {
      // Calculate yay percentage
      const lookVotes = mockVotes[battleId].filter(
        v => v.lookId === lookId && v.voteType === 'yay_nay'
      );
      const yayCount = lookVotes.filter(vote => vote.value === true).length;
      stats.yayPercentage = lookVotes.length > 0 ? Number(((yayCount / lookVotes.length) * 100).toFixed(1)) : 0;
    } else if (voteType === 'battle') {
      // Determine winning look
      const votesForA = mockVotes[battleId].filter(
        v => v.lookId === battle.lookIdA && v.voteType === 'battle'
      ).length;
      
      const votesForB = mockVotes[battleId].filter(
        v => v.lookId === battle.lookIdB && v.voteType === 'battle'
      ).length;
      
      stats.winningLookId = votesForA > votesForB ? battle.lookIdA : 
                           votesForB > votesForA ? battle.lookIdB : 
                           'tie';
    }
    
    return NextResponse.json({
      success: true,
      vote,
      stats
    });
    
  } catch (error) {
    console.error("Error processing vote:", error);
    return NextResponse.json(
      { error: "Failed to process vote" },
      { status: 500 }
    );
  }
} 