import { NextResponse } from 'next/server';

interface BattleLook {
  lookId: string;
  imageUrl: string;
  votes: number;
  percentage: number;
}

interface BattleDetails {
  battleId: string;
  createdAt: string;
  endsAt: string | null;
  status: 'active' | 'completed' | 'cancelled';
  lookA: BattleLook;
  lookB: BattleLook;
  totalVotes: number;
  winningLookId: string | null;
}

// Mock battle data (would come from a database in a real application)
const mockBattles: Record<string, { 
  lookIdA: string; 
  lookIdB: string;
  createdAt: Date;
  endDate: Date | null;
  status: 'active' | 'completed' | 'cancelled';
}> = {
  'battle1': { 
    lookIdA: 'look1', 
    lookIdB: 'look2',
    createdAt: new Date('2023-11-01'),
    endDate: new Date('2023-11-08'),
    status: 'completed'
  },
  'battle2': { 
    lookIdA: 'look3', 
    lookIdB: 'look4',
    createdAt: new Date('2023-12-05'),
    endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    status: 'active'
  },
  'battle3': { 
    lookIdA: 'look5', 
    lookIdB: 'look1',
    createdAt: new Date('2023-12-10'),
    endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    status: 'active'
  },
  'battle4': { 
    lookIdA: 'look2', 
    lookIdB: 'look3',
    createdAt: new Date('2023-12-15'),
    endDate: null,
    status: 'cancelled'
  },
};

// Mock look data
const mockLooks: Record<string, { 
  imageUrl: string;
}> = {
  'look1': { imageUrl: 'https://example.com/images/look1.jpg' },
  'look2': { imageUrl: 'https://example.com/images/look2.jpg' },
  'look3': { imageUrl: 'https://example.com/images/look3.jpg' },
  'look4': { imageUrl: 'https://example.com/images/look4.jpg' },
  'look5': { imageUrl: 'https://example.com/images/look5.jpg' },
};

// Mock vote data
const mockVotes: Record<string, Array<{ lookId: string; userId: string }>> = {
  'battle1': [
    { lookId: 'look1', userId: 'user1' },
    { lookId: 'look2', userId: 'user2' },
    { lookId: 'look1', userId: 'user3' },
    { lookId: 'look1', userId: 'user4' },
    { lookId: 'look2', userId: 'user5' },
  ],
  'battle2': [
    { lookId: 'look3', userId: 'user1' },
    { lookId: 'look4', userId: 'user2' },
    { lookId: 'look4', userId: 'user3' },
    { lookId: 'look4', userId: 'user4' },
  ],
  'battle3': [
    { lookId: 'look5', userId: 'user1' },
    { lookId: 'look5', userId: 'user2' },
    { lookId: 'look1', userId: 'user3' },
  ],
  'battle4': [
    { lookId: 'look2', userId: 'user1' },
    { lookId: 'look3', userId: 'user2' },
  ],
};

export async function GET(request: Request) {
  try {
    // Parse the URL to get the battleId from the query parameters
    const { searchParams } = new URL(request.url);
    const battleId = searchParams.get('battleId');
    
    if (!battleId) {
      return NextResponse.json(
        { error: "Battle ID is required" },
        { status: 400 }
      );
    }
    
    // Get battle data
    const battle = mockBattles[battleId];
    
    if (!battle) {
      return NextResponse.json(
        { error: "Battle not found" },
        { status: 404 }
      );
    }
    
    // Get votes for this battle
    const votes = mockVotes[battleId] || [];
    const totalVotes = votes.length;
    
    // Count votes for each look
    const lookAVotes = votes.filter(vote => vote.lookId === battle.lookIdA).length;
    const lookBVotes = votes.filter(vote => vote.lookId === battle.lookIdB).length;
    
    // Calculate percentages
    const lookAPercentage = totalVotes > 0 ? Math.round((lookAVotes / totalVotes) * 100) : 0;
    const lookBPercentage = totalVotes > 0 ? Math.round((lookBVotes / totalVotes) * 100) : 0;
    
    // Determine winner (only for completed battles)
    let winningLookId: string | null = null;
    if (battle.status === 'completed') {
      if (lookAVotes > lookBVotes) {
        winningLookId = battle.lookIdA;
      } else if (lookBVotes > lookAVotes) {
        winningLookId = battle.lookIdB;
      }
      // If equal votes, winningLookId remains null (tie)
    }
    
    // Construct battle details
    const battleDetails: BattleDetails = {
      battleId,
      createdAt: battle.createdAt.toISOString(),
      endsAt: battle.endDate?.toISOString() || null,
      status: battle.status,
      lookA: {
        lookId: battle.lookIdA,
        imageUrl: mockLooks[battle.lookIdA]?.imageUrl || '',
        votes: lookAVotes,
        percentage: lookAPercentage
      },
      lookB: {
        lookId: battle.lookIdB,
        imageUrl: mockLooks[battle.lookIdB]?.imageUrl || '',
        votes: lookBVotes,
        percentage: lookBPercentage
      },
      totalVotes,
      winningLookId
    };
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return NextResponse.json({
      success: true,
      battleDetails
    });
    
  } catch (error) {
    console.error("Error retrieving battle details:", error);
    return NextResponse.json(
      { error: "Failed to retrieve battle details" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // Parse the request body to get the battleId
    const { battleId } = await request.json();
    
    if (!battleId) {
      return NextResponse.json(
        { error: "Battle ID is required" },
        { status: 400 }
      );
    }
    
    // Get battle data
    const battle = mockBattles[battleId];
    
    if (!battle) {
      return NextResponse.json(
        { error: "Battle not found" },
        { status: 404 }
      );
    }
    
    // Get votes for this battle
    const votes = mockVotes[battleId] || [];
    const totalVotes = votes.length;
    
    // Count votes for each look
    const lookAVotes = votes.filter(vote => vote.lookId === battle.lookIdA).length;
    const lookBVotes = votes.filter(vote => vote.lookId === battle.lookIdB).length;
    
    // Calculate percentages
    const lookAPercentage = totalVotes > 0 ? Math.round((lookAVotes / totalVotes) * 100) : 0;
    const lookBPercentage = totalVotes > 0 ? Math.round((lookBVotes / totalVotes) * 100) : 0;
    
    // Determine winner (only for completed battles)
    let winningLookId: string | null = null;
    if (battle.status === 'completed') {
      if (lookAVotes > lookBVotes) {
        winningLookId = battle.lookIdA;
      } else if (lookBVotes > lookAVotes) {
        winningLookId = battle.lookIdB;
      }
      // If equal votes, winningLookId remains null (tie)
    }
    
    // Construct battle details
    const battleDetails: BattleDetails = {
      battleId,
      createdAt: battle.createdAt.toISOString(),
      endsAt: battle.endDate?.toISOString() || null,
      status: battle.status,
      lookA: {
        lookId: battle.lookIdA,
        imageUrl: mockLooks[battle.lookIdA]?.imageUrl || '',
        votes: lookAVotes,
        percentage: lookAPercentage
      },
      lookB: {
        lookId: battle.lookIdB,
        imageUrl: mockLooks[battle.lookIdB]?.imageUrl || '',
        votes: lookBVotes,
        percentage: lookBPercentage
      },
      totalVotes,
      winningLookId
    };
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return NextResponse.json({
      success: true,
      battleDetails
    });
    
  } catch (error) {
    console.error("Error retrieving battle details:", error);
    return NextResponse.json(
      { error: "Failed to retrieve battle details" },
      { status: 500 }
    );
  }
} 